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
import fs from "fs";
import path from "path";
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

// ============================================================
// OPENPAY PERÚ WEBHOOK ENGINE
// ============================================================

// Almacén temporal en memoria y archivo del último código de verificación OpenPay
let ultimoCodigoOpenpay = null;
const openpayVerificationFilePath = path.resolve(process.cwd(), "storage/openpay_verification.json");

// Cargar código persistido si existe
try {
  if (fs.existsSync(openpayVerificationFilePath)) {
    ultimoCodigoOpenpay = JSON.parse(fs.readFileSync(openpayVerificationFilePath, "utf8"));
  }
} catch (e) {}

/**
 * GET /api/webhooks/openpay
 * Permite verificar que el endpoint esté activo, devuelve el último código recibido
 * y realiza un chequeo de autenticación en vivo contra OpenPay para verificar que la Private Key sea válida.
 */
export const verificarEstadoOpenpay = async (req, res) => {
  let authCheck = null;
  try {
    const { checkOpenpayAuth } = await import("../services/openpayService.js");
    authCheck = await checkOpenpayAuth();
  } catch (err) {
    authCheck = { error: err.message };
  }

  return res.status(200).json({
    success: true,
    status: "active",
    gateway: "OpenPay Perú (BBVA)",
    message: "Endpoint de Webhook OpenPay Perú activo y listo para recibir notificaciones.",
    endpoint_url: "https://unu-raymi.com/api/webhooks/openpay",
    instrucciones: "Para verificar este webhook en OpenPay, ve a Dashboard > Desarrolladores > Webhooks, pulsa en los tres puntos (...) junto al webhook y selecciona 'Verificar' o 'Reenviar código de verificación'.",
    ultimo_evento_verificacion: ultimoCodigoOpenpay || "Aún no se ha recibido ningún evento de verificación desde OpenPay.",
    openpay_api_auth_test: authCheck,
    timestamp: new Date().toISOString()
  });
};

/**
 * POST /api/webhooks/openpay
 * Procesa notificaciones de OpenPay Perú:
 * 1. Evento de verificación: Openpay envía verification_code para validar el endpoint.
 * 2. Eventos de cobro completado: charge.succeeded / charge.completed para actualizar reservas a PAID.
 */
export const procesarWebhookOpenpay = async (req, res) => {
  try {
    const payload = req.body || {};
    const eventType = payload.type || payload.event_type;

    console.log(`[OpenPay Webhook] 🔔 Evento recibido: "${eventType || 'desconocido'}"`);

    // ── 1. Evento de verificación de OpenPay ───────────────────────
    if (eventType === "verification" || payload.verification_code) {
      const verificationCode = payload.verification_code;
      const webhookId = payload.id || payload.webhook_id || "wxl9rz5bnsber14ipion";

      console.log("==========================================================");
      console.log("🔑 [OpenPay Webhook] CÓDIGO DE VERIFICACIÓN RECIBIDO:");
      console.log(`   Código:     ${verificationCode}`);
      console.log(`   Webhook ID: ${webhookId}`);
      console.log("==========================================================");

      ultimoCodigoOpenpay = {
        verification_code: verificationCode,
        webhook_id: webhookId,
        fecha: new Date().toISOString()
      };

      try {
        const storageDir = path.dirname(openpayVerificationFilePath);
        if (!fs.existsSync(storageDir)) {
          fs.mkdirSync(storageDir, { recursive: true });
        }
        fs.writeFileSync(openpayVerificationFilePath, JSON.stringify(ultimoCodigoOpenpay, null, 2));
      } catch (err) {
        console.warn("[OpenPay Webhook] No se pudo persistir el código en disco:", err.message);
      }

      // Intentar auto-verificación mediante API de OpenPay si las credenciales están presentes
      const merchantId = process.env.OPENPAY_MERCHANT_ID;
      const privateKey = process.env.OPENPAY_PRIVATE_KEY;
      const baseUrl = process.env.OPENPAY_BASE_URL || "https://sandbox-api.openpay.pe/v1";

      if (merchantId && privateKey && webhookId && verificationCode) {
        try {
          const auth = Buffer.from(`${privateKey}:`).toString("base64");
          const verifyUrl = `${baseUrl}/${merchantId}/webhooks/${webhookId}/verify/${verificationCode}`;
          const verifyRes = await fetch(verifyUrl, {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json"
            }
          });
          if (verifyRes.ok) {
            console.log("✅ [OpenPay Webhook] Webhook verificado automáticamente vía API de OpenPay.");
          } else {
            console.log(`ℹ️ [OpenPay Webhook] Respuesta de auto-verificación API: ${verifyRes.status}`);
          }
        } catch (apiErr) {
          console.warn("[OpenPay Webhook] Error en intento de auto-verificación:", apiErr.message);
        }
      }

      // OpenPay requiere SIEMPRE responder HTTP 200
      return res.status(200).json({
        success: true,
        message: "Código de verificación procesado exitosamente.",
        verification_code: verificationCode,
        webhook_id: webhookId
      });
    }

    // ── 2. Evento de cargo completado (Pago exitoso) ───────────────
    if (
      eventType === "charge.succeeded" ||
      eventType === "charge.completed" ||
      eventType === "pago.completado"
    ) {
      const transaction = payload.transaction || payload;
      const orderId = transaction.order_id || payload.order_id || "";
      const chargeId = transaction.id || payload.id;

      console.log(`[OpenPay Webhook] 💳 Pago confirmado para order_id: "${orderId}", charge_id: "${chargeId}"`);

      // Extraer el ID de la reserva (formato UNU-{id}-{timestamp})
      let reservaId = null;
      const match = String(orderId).match(/UNU-(\d+)/i);
      if (match) {
        reservaId = parseInt(match[1], 10);
      }

      if (!reservaId && transaction.id) {
        // Intentar buscar por referencia previa si ya se guardó
        const resPorRef = await prisma.reserva.findFirst({
          where: { referenciaPago: transaction.id }
        });
        if (resPorRef) reservaId = resPorRef.id;
      }

      if (reservaId) {
        const reserva = await prisma.reserva.findUnique({
          where: { id: reservaId },
          include: {
            tour: { select: { nombre: true, slug: true, duracion_dias: true } },
            pasajeros: true
          }
        });

        if (reserva) {
          if (reserva.estado === "PAID") {
            console.log(`[OpenPay Webhook] ℹ️  Reserva #${reservaId} ya estaba en estado PAID.`);
            return res.status(200).json({ received: true, alreadyPaid: true });
          }

          const reservaActualizada = await prisma.reserva.update({
            where: { id: reservaId },
            data: {
              estado: "PAID",
              referenciaPago: chargeId || `op_${Date.now()}`,
              pagadoEn: new Date()
            },
            include: {
              tour: { select: { nombre: true, slug: true, duracion_dias: true } },
              pasajeros: true
            }
          });

          console.log(`[OpenPay Webhook] ✅ Reserva #${reservaId} actualizada a PAID.`);
          try {
            dispararNotificaciones(reservaActualizada);
          } catch (notifErr) {
            console.error(`[OpenPay Webhook] Error disparando notificaciones:`, notifErr.message);
          }

          return res.status(200).json({
            success: true,
            message: "Reserva actualizada a PAID",
            reservaId
          });
        }
      }

      console.warn(`[OpenPay Webhook] No se encontró reserva para order_id: ${orderId}`);
      return res.status(200).json({ received: true, note: "Reserva no encontrada pero evento registrado" });
    }

    // ── 3. Otros eventos (creación, cancelación, etc.) ─────────────
    console.log(`[OpenPay Webhook] Evento "${eventType}" registrado correctamente.`);
    return res.status(200).json({ received: true, type: eventType });

  } catch (error) {
    console.error("[OpenPay Webhook] ❌ Error procesando webhook:", error.message);
    // Responder 200 para evitar que OpenPay desactive el webhook por reintentos fallidos
    return res.status(200).json({ success: false, error: error.message });
  }
};

