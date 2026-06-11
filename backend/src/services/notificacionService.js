// ============================================================
// notificacionService.js — Cola de Notificaciones Asíncrona
//
// Ejecuta tareas pesadas (PDF + Email) en segundo plano
// sin bloquear la respuesta HTTP al webhook de Stripe.
// ============================================================

import { generarInvoicePDF } from "./pdfService.js";
import { enviarEmailConfirmacion } from "./emailService.js";

/**
 * Dispara en segundo plano la generación del PDF y el envío
 * del email de confirmación al titular de la reserva.
 *
 * @param {Object} reserva - Objeto reserva completo (incluye tour y pasajeros).
 */
export const dispararNotificaciones = (reserva) => {
  setImmediate(async () => {
    let rutaPDF = null;

    // ── Módulo 2: Generación de PDF ───────────────────────
    try {
      rutaPDF = await generarInvoicePDF(reserva);
      console.log(`[NotificacionService] ✅ PDF generado: ${rutaPDF}`);
    } catch (err) {
      console.error(
        `[NotificacionService] ❌ Error al generar PDF para reserva #${reserva.id}:`,
        err.message
      );
    }

    // ── Módulo 3: Email de confirmación ───────────────────
    try {
      await enviarEmailConfirmacion(reserva, rutaPDF);
    } catch (err) {
      console.error(
        `[NotificacionService] ❌ Error al enviar email para reserva #${reserva.id}:`,
        err.message
      );
    }
  });
};


