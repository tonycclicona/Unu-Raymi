// ============================================================
// emailService.js — Servicio de Email con Nodemailer
//
// Envía el correo de confirmación de pago al titular de la
// reserva con una plantilla HTML de marca Unu-Raymi.
//
// Compatible con:
//   - Hostinger SMTP (smtp.hostinger.com)
//   - Gmail (con App Password)
//   - SendGrid / cualquier SMTP estándar
// ============================================================

import { Resend } from "resend";
import fs from "fs";

// ── Singleton de Resend ──────────────────────────────────────
let _resendClient = null;

const getResendClient = () => {
  if (_resendClient) return _resendClient;
  _resendClient = new Resend(process.env.RESEND_API_KEY || "re_UnuRaymiFakeKey_12345");
  return _resendClient;
};

// ── Función principal de envío ────────────────────────────────
/**
 * Envía el email de confirmación de pago al titular usando Resend SDK.
 * @param {Object} reserva - Objeto completo de la reserva (con tour y pasajeros).
 * @param {string} [rutaPDF] - Ruta opcional del archivo PDF generado.
 * @returns {Promise<void>}
 */
export const enviarEmailConfirmacion = async (reserva, rutaPDF) => {
  const resend = getResendClient();

  const urlInvoice = `${process.env.API_BASE_URL}/api/reservas/${reserva.id}/invoice?token=${reserva.tokenSeguridad}`;

  const htmlBody = generarPlantillaHTML(reserva, urlInvoice);

  const attachments = [];
  if (rutaPDF && fs.existsSync(rutaPDF)) {
    const pdfBuffer = fs.readFileSync(rutaPDF);
    attachments.push({
      filename: `invoice-reserva-${String(reserva.id).padStart(6, "0")}.pdf`,
      content: pdfBuffer,
    });
  }

  const payload = {
    from: "Unu-Raymi Tours <onboarding@resend.dev>",
    to: [reserva.titularEmail],
    subject: `✅ Reserva Confirmada #${String(reserva.id).padStart(6, "0")} — ${reserva.tour?.nombre}`,
    html: htmlBody,
    attachments,
  };

  const response = await resend.emails.send(payload);

  if (response.error) {
    throw new Error(`Resend Error: ${response.error.message}`);
  }

  console.log(
    `[Resend Email] ✅ Confirmación enviada a ${reserva.titularEmail} — MessageId: ${response.data?.id}`
  );
};

// ── Plantilla HTML ────────────────────────────────────────────
const generarPlantillaHTML = (reserva, urlInvoice) => {
  const numeroReserva = String(reserva.id).padStart(6, "0");
  const fechaViaje = new Date(reserva.fechaViaje).toLocaleDateString("es-PE", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
  const fechaEmision = new Date(reserva.pagadoEn ?? reserva.updatedAt).toLocaleDateString("es-PE", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const precioFormateado = `S/ ${Number(reserva.precioTotal).toFixed(2)}`;

  const filasPasajeros = reserva.pasajeros
    ?.map(
      (p, i) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f9fafb"}">
        <td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb">${i + 1}</td>
        <td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb">${p.nombre} ${p.apellido}</td>
        <td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb">${p.dni ?? "—"}</td>
        <td style="padding:10px 14px;font-size:13px;border-bottom:1px solid #e5e7eb">
          <span style="background:${p.tipo === "adulto" ? "#dbeafe" : "#fce7f3"};color:${p.tipo === "adulto" ? "#1d4ed8" : "#be185d"};padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600">
            ${p.tipo === "adulto" ? "Adulto" : "Niño"}
          </span>
        </td>
      </tr>`
    )
    .join("") ?? "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de Reserva — Unu-Raymi</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- ENCABEZADO -->
        <tr>
          <td style="background:#1a1a2e;border-radius:12px 12px 0 0;padding:36px 40px 28px">
            <table width="100%">
              <tr>
                <td>
                  <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:2px">UNU-RAYMI</div>
                  <div style="font-size:10px;color:#e94560;letter-spacing:3px;margin-top:3px">TOURS &amp; EXPERIENCIAS ANDINAS</div>
                </td>
                <td align="right">
                  <div style="background:#10b981;color:#fff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;display:inline-block">
                    ✓ &nbsp;PAGADO
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- HÉROE -->
        <tr>
          <td style="background:#16213e;padding:28px 40px 32px">
            <div style="font-size:22px;font-weight:700;color:#ffffff;margin-bottom:6px">
              ¡Tu reserva está confirmada, ${reserva.titularNombre.split(" ")[0]}! 🎉
            </div>
            <div style="font-size:14px;color:#9ca3af;line-height:1.6">
              Hemos recibido tu pago correctamente. Aquí tienes todos los detalles de tu aventura.
            </div>
          </td>
        </tr>

        <!-- CUERPO BLANCO -->
        <tr>
          <td style="background:#ffffff;padding:32px 40px">

            <!-- Datos del tour -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td style="padding-bottom:12px;border-bottom:2px solid #1a1a2e">
                  <span style="font-size:13px;font-weight:700;color:#1a1a2e;letter-spacing:1px;text-transform:uppercase">Detalles de la Reserva</span>
                </td>
              </tr>
              <tr><td style="height:14px"></td></tr>
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${filaDetalle("Nº de Reserva",   `<strong>#${numeroReserva}</strong>`)}
                    ${filaDetalle("Tour",             `<strong>${reserva.tour?.nombre ?? "—"}</strong>`)}
                    ${filaDetalle("Fecha del Viaje",  fechaViaje)}
                    ${filaDetalle("Duración",         `${reserva.tour?.duracion_dias ?? "—"} día(s)`)}
                    ${filaDetalle("Pasajeros",        `${reserva.cantAdultos} adulto(s) · ${reserva.cantNinos} niño(s)`)}
                    ${filaDetalle("Fecha de Pago",    fechaEmision)}
                    ${filaDetalle("Ref. de Pago",     reserva.referenciaPago ?? "—")}
                  </table>
                </td>
              </tr>
            </table>

            <!-- Tabla de pasajeros -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td style="padding-bottom:12px;border-bottom:2px solid #1a1a2e">
                  <span style="font-size:13px;font-weight:700;color:#1a1a2e;letter-spacing:1px;text-transform:uppercase">Pasajeros</span>
                </td>
              </tr>
              <tr><td style="height:14px"></td></tr>
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
                    <thead>
                      <tr style="background:#1a1a2e">
                        <th style="padding:10px 14px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:1px">#</th>
                        <th style="padding:10px 14px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:1px">NOMBRE COMPLETO</th>
                        <th style="padding:10px 14px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:1px">DNI</th>
                        <th style="padding:10px 14px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:1px">TIPO</th>
                      </tr>
                    </thead>
                    <tbody>${filasPasajeros}</tbody>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Total pagado -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td align="right">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#1a1a2e;border-radius:10px;padding:18px 32px;text-align:center">
                        <div style="font-size:11px;color:#9ca3af;letter-spacing:2px;margin-bottom:6px">TOTAL PAGADO</div>
                        <div style="font-size:28px;font-weight:800;color:#ffffff">${precioFormateado}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Botón de descarga -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 4px">
                  <a href="${urlInvoice}"
                     style="display:inline-block;background:#e94560;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:0.5px">
                    📄 &nbsp; Descargar Invoice PDF
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:12px 0 0">
                  <span style="font-size:11px;color:#9ca3af">Este enlace es exclusivo para ti y no requiere inicio de sesión.</span>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- PIE -->
        <tr>
          <td style="background:#f9fafb;border-radius:0 0 12px 12px;padding:24px 40px;border-top:1px solid #e5e7eb">
            <table width="100%">
              <tr>
                <td style="font-size:11px;color:#9ca3af;line-height:1.8">
                  <strong style="color:#6b7280">Unu-Raymi Tours</strong><br/>
                  info@unu-raymi.com &nbsp;|&nbsp; www.unu-raymi.com<br/>
                  <span style="font-size:10px">Token de verificación: ${reserva.tokenSeguridad}</span>
                </td>
                <td align="right" style="font-size:11px;color:#d1d5db">
                  Unu-Raymi © ${new Date().getFullYear()}
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
};

// ── Helpers de plantilla ──────────────────────────────────────
const filaDetalle = (label, valor) => `
  <tr>
    <td style="padding:7px 0;font-size:12px;color:#6b7280;width:140px;vertical-align:top;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${label}</td>
    <td style="padding:7px 0;font-size:13px;color:#111827">${valor}</td>
  </tr>`;

// ── Fallback texto plano ──────────────────────────────────────
const generarTextoPlano = (reserva, urlInvoice) => {
  const numeroReserva = String(reserva.id).padStart(6, "0");
  const fechaViaje = new Date(reserva.fechaViaje).toLocaleDateString("es-PE");

  return `
¡Hola ${reserva.titularNombre}!

Tu reserva #${numeroReserva} ha sido confirmada y pagada.

DETALLES:
- Tour: ${reserva.tour?.nombre}
- Fecha del viaje: ${fechaViaje}
- Duración: ${reserva.tour?.duracion_dias} día(s)
- Adultos: ${reserva.cantAdultos} | Niños: ${reserva.cantNinos}
- Total pagado: S/ ${Number(reserva.precioTotal).toFixed(2)}
- Referencia de pago: ${reserva.referenciaPago ?? "—"}

DESCARGA TU INVOICE:
${urlInvoice}

Este enlace es exclusivo para ti. Preséntalo el día del tour.

----
Unu-Raymi Tours
info@unu-raymi.com | www.unu-raymi.com
`.trim();
};
