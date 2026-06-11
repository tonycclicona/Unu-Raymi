// ============================================================
// webhookController.js — Procesador de Webhooks de Stripe
//
// SEGURIDAD: Verifica la firma HMAC-SHA256 de Stripe usando
// únicamente el módulo nativo 'crypto' de Node.js.
// No se requiere el SDK de Stripe.
//
// Algoritmo de verificación Stripe:
//   1. Extraer timestamp (t) y firma (v1) del header 'stripe-signature'
//   2. Construir el payload firmado: `${t}.${rawBodyString}`
//   3. Calcular HMAC-SHA256 con STRIPE_WEBHOOK_SECRET
//   4. Comparar con timingSafeEqual para evitar timing attacks
//   5. Verificar que el timestamp no sea demasiado antiguo (tolerancia 5 min)
// ============================================================

import { createHmac, timingSafeEqual } from "crypto";
import prisma from "../lib/prismaClient.js";
import { dispararNotificaciones } from "../services/notificacionService.js";

// Tolerancia máxima de antigüedad del evento (5 minutos en segundos)
const STRIPE_TOLERANCE_SECONDS = 300;

// ── Verificación de firma Stripe (sin SDK) ───────────────────
/**
 * Verifica la firma HMAC-SHA256 del webhook de Stripe.
 * @param {Buffer} rawBody - Body crudo de la petición.
 * @param {string} signatureHeader - Valor del header 'stripe-signature'.
 * @param {string} secret - STRIPE_WEBHOOK_SECRET del .env
 * @returns {{ valid: boolean, event: object | null, error: string | null }}
 */
const verificarFirmaStripe = (rawBody, signatureHeader, secret) => {
  if (!signatureHeader) {
    return { valid: false, event: null, error: "Header 'stripe-signature' ausente." };
  }

  // Parsear el header: t=TIMESTAMP,v1=HASH[,v0=HASH_LEGADO]
  const partes = Object.fromEntries(
    signatureHeader.split(",").map((part) => part.split("="))
  );

  const timestamp = partes["t"];
  const firmaRecibida = partes["v1"];

  if (!timestamp || !firmaRecibida) {
    return { valid: false, event: null, error: "Header 'stripe-signature' malformado." };
  }

  // Verificar antigüedad del evento (previene ataques de replay)
  const ahora = Math.floor(Date.now() / 1000);
  if (ahora - parseInt(timestamp, 10) > STRIPE_TOLERANCE_SECONDS) {
    return {
      valid: false,
      event: null,
      error: `Webhook demasiado antiguo (${ahora - parseInt(timestamp, 10)}s). Tolerancia máxima: ${STRIPE_TOLERANCE_SECONDS}s.`,
    };
  }

  // Construir el payload firmado
  const rawBodyString = rawBody.toString("utf8");
  const payloadFirmado = `${timestamp}.${rawBodyString}`;

  // Calcular HMAC-SHA256
  const firmaEsperada = createHmac("sha256", secret)
    .update(payloadFirmado, "utf8")
    .digest("hex");

  // Comparación en tiempo constante (evita timing attacks)
  const firmaRecibidaBuffer = Buffer.from(firmaRecibida, "hex");
  const firmaEsperadaBuffer = Buffer.from(firmaEsperada, "hex");

  if (
    firmaRecibidaBuffer.length !== firmaEsperadaBuffer.length ||
    !timingSafeEqual(firmaRecibidaBuffer, firmaEsperadaBuffer)
  ) {
    return { valid: false, event: null, error: "Firma HMAC-SHA256 inválida." };
  }

  // Parsear el evento JSON
  try {
    const event = JSON.parse(rawBodyString);
    return { valid: true, event, error: null };
  } catch {
    return { valid: false, event: null, error: "Body del webhook no es JSON válido." };
  }
};

// ── POST /api/webhooks/pago ──────────────────────────────────
export const procesarWebhookStripe = async (req, res) => {
  const signatureHeader = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET no está configurado en .env");
    return res.status(500).json({ success: false, error: "Configuración del servidor incompleta." });
  }

  // ── 1. Verificar la firma digital de Stripe ───────────────
  const { valid, event, error } = verificarFirmaStripe(req.body, signatureHeader, secret);

  if (!valid) {
    console.warn(`[Webhook] ⚠️  Firma inválida: ${error}`);
    return res.status(400).json({ success: false, error });
  }

  console.log(`[Webhook] ✅ Evento verificado: ${event.type} (id: ${event.id})`);

  // ── 2. Identificar eventos de pago completado ─────────────
  // Solo procesamos 'payment_intent.succeeded'
  // Otros eventos relevantes: 'checkout.session.completed'
  if (event.type !== "payment_intent.succeeded") {
    // Ignorar otros eventos silenciosamente (responder 200 siempre)
    console.log(`[Webhook] ℹ️  Evento '${event.type}' ignorado.`);
    return res.status(200).json({ received: true });
  }

  const paymentIntent = event.data.object;

  // ── 3. Extraer reservaId del metadata del PaymentIntent ───
  // Al crear el PaymentIntent en el frontend, se debe pasar:
  // metadata: { reservaId: "123" }
  const reservaIdStr = paymentIntent?.metadata?.reservaId;

  if (!reservaIdStr) {
    console.error(
      `[Webhook] ❌ PaymentIntent ${paymentIntent.id} sin metadata.reservaId.`
    );
    // Responder 200 para que Stripe no reintente (es un error de configuración nuestro)
    return res.status(200).json({ received: true });
  }

  const reservaId = parseInt(reservaIdStr, 10);

  // ── 4. Buscar la reserva en la BD ─────────────────────────
  let reserva;
  try {
    reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: {
        tour: { select: { nombre: true, slug: true, duracion_dias: true } },
        pasajeros: true,
      },
    });
  } catch (dbError) {
    console.error(`[Webhook] ❌ Error de BD buscando reserva #${reservaId}:`, dbError.message);
    // Responder 500 para que Stripe reintente el webhook
    return res.status(500).json({ success: false, error: "Error interno de base de datos." });
  }

  if (!reserva) {
    console.error(`[Webhook] ❌ Reserva #${reservaId} no encontrada en BD.`);
    return res.status(200).json({ received: true }); // 200 para no reintentar
  }

  // ── 5. Idempotencia — evitar re-procesar pagos duplicados ─
  if (reserva.estado === "PAID") {
    console.log(`[Webhook] ℹ️  Reserva #${reservaId} ya está PAID. Ignorando duplicado.`);
    return res.status(200).json({ received: true });
  }

  // ── 6. Actualizar estado → PAID ───────────────────────────
  try {
    const reservaActualizada = await prisma.reserva.update({
      where: { id: reservaId },
      data: {
        estado: "PAID",
        referenciaPago: paymentIntent.id,
        pagadoEn: new Date(),
      },
      include: {
        tour: { select: { nombre: true, slug: true, duracion_dias: true } },
        pasajeros: true,
      },
    });

    console.log(
      `[Webhook] 💰 Reserva #${reservaId} marcada como PAID. PaymentIntent: ${paymentIntent.id}`
    );

    // ── 7. Disparar notificaciones en segundo plano ─────────
    // setImmediate en notificacionService garantiza que la respuesta
    // HTTP a Stripe ya fue enviada antes de ejecutar estas tareas.
    dispararNotificaciones(reservaActualizada);

  } catch (updateError) {
    console.error(
      `[Webhook] ❌ Error actualizando reserva #${reservaId} a PAID:`,
      updateError.message
    );
    // Responder 500 para que Stripe reintente
    return res.status(500).json({ success: false, error: "Error al actualizar la reserva." });
  }

  // ── 8. Responder a Stripe — SIEMPRE HTTP 200 ─────────────
  // Stripe reintentará el webhook si recibe cualquier otro código.
  return res.status(200).json({ received: true });
};
