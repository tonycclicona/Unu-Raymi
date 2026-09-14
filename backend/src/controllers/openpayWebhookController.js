// ============================================================
// openpayWebhookController.js — Procesador de Webhooks de Openpay Perú
//
// Maneja eventos enviados por Openpay:
// 1. Verificación inicial de endpoint (código de verificación)
// 2. Notificaciones de pago completado (charge.succeeded / pago.completado)
// ============================================================

import prisma from "../lib/prismaClient.js";
import { dispararNotificaciones } from "../services/notificacionService.js";

/**
 * Procesa notificaciones enviadas por Openpay Perú
 * POST /api/webhooks/openpay
 */
export const procesarWebhookOpenpay = async (req, res) => {
  try {
    // ── 1. Verificación opcional de autenticación Basic Auth ──
    const webhookUser = process.env.OPENPAY_WEBHOOK_USER;
    const webhookPass = process.env.OPENPAY_WEBHOOK_PASS;

    if (webhookUser && webhookPass) {
      const authHeader = req.headers["authorization"] || "";
      if (!authHeader.startsWith("Basic ")) {
        console.warn("[Openpay Webhook] ⚠️ Solicitud sin Basic Auth requerida.");
        return res.status(401).json({ error: "Unauthorized" });
      }

      const credentials = Buffer.from(authHeader.split(" ")[1], "base64").toString("ascii");
      const [user, pass] = credentials.split(":");
      if (user !== webhookUser || pass !== webhookPass) {
        console.warn("[Openpay Webhook] ⚠️ Credenciales Basic Auth inválidas.");
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }

    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      console.warn("[Openpay Webhook] ⚠️ Payload no es un objeto JSON válido.");
      return res.status(400).json({ error: "Invalid JSON payload" });
    }

    const eventType = payload.type || payload.event_type;
    console.log(`[Openpay Webhook] 🔔 Evento recibido: '${eventType}'`);

    // ── 2. Manejo de verificación inicial de Webhook ─────────
    if (eventType === "verification") {
      const verificationCode = payload.verification_code;
      console.log(`[Openpay Webhook] 🔑 Código de verificación de Openpay: ${verificationCode}`);
      return res.status(200).json({
        received: true,
        verification_code: verificationCode,
      });
    }

    // ── 3. Filtrar eventos de cargo completado ───────────────
    const isChargeSuccess =
      eventType === "charge.succeeded" ||
      eventType === "pago.completado" ||
      eventType === "charge.created";

    if (!isChargeSuccess) {
      console.log(`[Openpay Webhook] ℹ️ Evento '${eventType}' omitido.`);
      return res.status(200).json({ received: true, ignored: true });
    }

    const transaction = payload.transaction || payload.data?.object || payload;
    const chargeStatus = transaction.status;

    // Solo procesar si el estado es 'completed' (o no especificado pero evento es charge.succeeded)
    if (chargeStatus && chargeStatus !== "completed" && chargeStatus !== "in_progress") {
      console.log(`[Openpay Webhook] ℹ️ Transacción no completada aún. Estado: ${chargeStatus}`);
      return res.status(200).json({ received: true, status: chargeStatus });
    }

    // ── 4. Extraer el reservaId ──────────────────────────────
    let reservaId = null;

    // A) Desde metadata
    if (transaction.metadata?.reservaId) {
      reservaId = parseInt(transaction.metadata.reservaId, 10);
    }

    // B) Desde order_id (Formato: UNU-RES-15-XXXX o UNU-15-XXXX)
    if (!reservaId && transaction.order_id) {
      const match = transaction.order_id.match(/UNU-(?:RES-)?(\d+)/i);
      if (match && match[1]) {
        reservaId = parseInt(match[1], 10);
      }
    }

    if (!reservaId || isNaN(reservaId)) {
      console.error(
        `[Openpay Webhook] ❌ No se pudo determinar el reservaId para la transacción ${transaction.id}. OrderId: ${transaction.order_id}`
      );
      // Responder 200 para que Openpay no reintente continuamente en caso de formato no reconocido
      return res.status(200).json({ received: true, error: "No reservaId found" });
    }

    // ── 5. Buscar la reserva en BD ───────────────────────────
    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: {
        tour: { select: { nombre: true, slug: true, duracion_dias: true } },
        pasajeros: true,
      },
    });

    if (!reserva) {
      console.error(`[Openpay Webhook] ❌ Reserva #${reservaId} no encontrada en BD.`);
      return res.status(200).json({ received: true, error: "Reserva not found" });
    }

    // ── 6. Idempotencia — Evitar pagos duplicados ────────────
    if (reserva.estado === "PAID") {
      console.log(`[Openpay Webhook] ℹ️ Reserva #${reservaId} ya se encuentra como PAID. Omitiendo duplicado.`);
      return res.status(200).json({ received: true, alreadyPaid: true });
    }

    // ── 7. Actualizar reserva a PAID ─────────────────────────
    const reservaActualizada = await prisma.reserva.update({
      where: { id: reservaId },
      data: {
        estado: "PAID",
        referenciaPago: transaction.id || transaction.authorization || `openpay_${Date.now()}`,
        pagadoEn: new Date(),
      },
      include: {
        tour: { select: { nombre: true, slug: true, duracion_dias: true } },
        pasajeros: true,
      },
    });

    console.log(
      `[Openpay Webhook] 💰 Reserva #${reservaId} actualizada a PAID con referencia ${reservaActualizada.referenciaPago}`
    );

    // ── 8. Disparar generación de PDF Invoice y Email ────────
    dispararNotificaciones(reservaActualizada);

    return res.status(200).json({
      success: true,
      reservaId,
      estado: "PAID",
    });
  } catch (error) {
    console.error("[Openpay Webhook] 💥 Error procesando webhook de Openpay:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
