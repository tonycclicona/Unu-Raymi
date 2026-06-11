// ============================================================
// pdfService.js — Generación de PDF Invoice con PDFKit
//
// Genera un PDF profesional del comprobante de pago de la
// reserva y lo guarda en /storage/invoices/{tokenSeguridad}.pdf
//
// El tokenSeguridad (UUID v4) actúa como nombre de archivo:
// - Imposible de adivinar → no se necesita login para descargar
// - Único por reserva → evita colisiones
// ============================================================

import PDFDocument from "pdfkit";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INVOICES_DIR = join(__dirname, "..", "..", "storage", "invoices");

// Asegurar que el directorio existe al inicializar el módulo
if (!existsSync(INVOICES_DIR)) {
  mkdirSync(INVOICES_DIR, { recursive: true });
}

// ── Paleta de colores del invoice ────────────────────────────
const COLORS = {
  primary: "#1a1a2e",      // Azul noche profundo
  accent: "#e94560",       // Rojo coral (acento)
  secondary: "#16213e",    // Azul marino
  muted: "#6b7280",        // Gris medio
  light: "#f3f4f6",        // Fondo gris claro
  white: "#ffffff",
  success: "#10b981",      // Verde éxito (PAGADO)
  border: "#e5e7eb",       // Borde sutil
};

/**
 * Genera el PDF del invoice y lo guarda en disco.
 * @param {Object} reserva - Objeto completo de la reserva (con tour y pasajeros).
 * @returns {Promise<string>} Ruta absoluta del archivo PDF generado.
 */
export const generarInvoicePDF = (reserva) => {
  return new Promise((resolve, reject) => {
    const outputPath = join(INVOICES_DIR, `${reserva.tokenSeguridad}.pdf`);

    // Si ya existe el PDF (por un reintento del webhook), no regenerar
    if (existsSync(outputPath)) {
      console.log(`[PDF] ♻️  Invoice ya existe: ${reserva.tokenSeguridad}.pdf`);
      return resolve(outputPath);
    }

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Invoice Reserva #${reserva.id} — Unu-Raymi`,
        Author: "Unu-Raymi Tours",
        Subject: `Comprobante de pago — ${reserva.tour?.nombre ?? "Tour"}`,
        Creator: "Unu-Raymi Backend API",
      },
    });

    const writeStream = createWriteStream(outputPath);
    doc.pipe(writeStream);

    writeStream.on("finish", () => resolve(outputPath));
    writeStream.on("error", reject);

    // ── Contenido del PDF ──────────────────────────────────

    dibujarEncabezado(doc, reserva);
    dibujarBadgePagado(doc);
    dibujarDatosReserva(doc, reserva);
    dibujarTitular(doc, reserva);
    dibujarTablaPasajeros(doc, reserva);
    dibujarResumenFinanciero(doc, reserva);
    dibujarPie(doc, reserva);

    doc.end();
  });
};

// ── Sección: Encabezado ──────────────────────────────────────
const dibujarEncabezado = (doc, reserva) => {
  // Fondo del header
  doc
    .rect(0, 0, doc.page.width, 130)
    .fill(COLORS.primary);

  // Nombre de la empresa
  doc
    .fillColor(COLORS.white)
    .fontSize(26)
    .font("Helvetica-Bold")
    .text("UNU-RAYMI", 50, 35, { continued: false });

  // Subtítulo empresa
  doc
    .fillColor(COLORS.accent)
    .fontSize(10)
    .font("Helvetica")
    .text("TOURS & EXPERIENCIAS ANDINAS", 50, 65);

  // Número de Invoice (derecha)
  doc
    .fillColor(COLORS.white)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(`INVOICE #${String(reserva.id).padStart(6, "0")}`, 0, 40, {
      align: "right",
      width: doc.page.width - 50,
    });

  doc
    .fillColor(COLORS.light)
    .fontSize(9)
    .font("Helvetica")
    .text(
      `Emitido: ${new Date(reserva.pagadoEn ?? reserva.updatedAt).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`,
      0, 62,
      { align: "right", width: doc.page.width - 50 }
    );

  // Nombre del tour
  doc
    .fillColor(COLORS.light)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text(reserva.tour?.nombre ?? "Tour", 50, 90, { width: 400 });

  doc.moveDown(3);
};

// ── Sección: Badge PAGADO ────────────────────────────────────
const dibujarBadgePagado = (doc) => {
  const badgeX = doc.page.width - 130;
  const badgeY = 145;

  doc
    .roundedRect(badgeX, badgeY, 90, 24, 4)
    .fill(COLORS.success);

  doc
    .fillColor(COLORS.white)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("✓  PAGADO", badgeX, badgeY + 7, { width: 90, align: "center" });
};

// ── Sección: Datos de la Reserva ─────────────────────────────
const dibujarDatosReserva = (doc, reserva) => {
  const y = 150;
  doc.y = y;

  doc
    .fillColor(COLORS.primary)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("Detalles de la Reserva", 50, y);

  doc.moveDown(0.5);
  dibujarLineaSeparadora(doc);
  doc.moveDown(0.5);

  const fechaViaje = new Date(reserva.fechaViaje).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const campos = [
    ["Nº de Reserva",   `#${String(reserva.id).padStart(6, "0")}`],
    ["Tour",            reserva.tour?.nombre ?? "—"],
    ["Fecha del Viaje", fechaViaje],
    ["Duración",        `${reserva.tour?.duracion_dias ?? "—"} día(s)`],
    ["Adultos",         String(reserva.cantAdultos)],
    ["Niños",           String(reserva.cantNinos)],
    ["Referencia Pago", reserva.referenciaPago ?? "—"],
  ];

  campos.forEach(([label, valor]) => {
    doc
      .fillColor(COLORS.muted)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(label.toUpperCase(), 50, doc.y, { continued: true, width: 140 });

    doc
      .fillColor(COLORS.primary)
      .font("Helvetica")
      .text(valor, { align: "left" });

    doc.moveDown(0.3);
  });
};

// ── Sección: Datos del Titular ───────────────────────────────
const dibujarTitular = (doc, reserva) => {
  doc.moveDown(0.8);

  doc
    .fillColor(COLORS.primary)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("Titular de la Reserva");

  doc.moveDown(0.5);
  dibujarLineaSeparadora(doc);
  doc.moveDown(0.5);

  const campos = [
    ["Nombre completo", reserva.titularNombre],
    ["Correo electrónico", reserva.titularEmail],
    ["Teléfono", reserva.titularTelefono ?? "No proporcionado"],
  ];

  campos.forEach(([label, valor]) => {
    doc
      .fillColor(COLORS.muted)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(label.toUpperCase(), 50, doc.y, { continued: true, width: 140 });

    doc
      .fillColor(COLORS.primary)
      .font("Helvetica")
      .text(valor);

    doc.moveDown(0.3);
  });
};

// ── Sección: Tabla de Pasajeros ──────────────────────────────
const dibujarTablaPasajeros = (doc, reserva) => {
  doc.moveDown(0.8);

  doc
    .fillColor(COLORS.primary)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("Pasajeros");

  doc.moveDown(0.5);
  dibujarLineaSeparadora(doc);
  doc.moveDown(0.3);

  // Cabecera de tabla
  const colX = { num: 50, nombre: 80, apellido: 220, dni: 360, tipo: 460 };
  const headerY = doc.y;

  doc
    .rect(50, headerY, doc.page.width - 100, 20)
    .fill(COLORS.secondary);

  doc
    .fillColor(COLORS.white)
    .fontSize(8)
    .font("Helvetica-Bold");

  doc.text("#",          colX.num,      headerY + 6, { width: 25 });
  doc.text("NOMBRE",     colX.nombre,   headerY + 6, { width: 135, continued: false });
  doc.text("APELLIDO",   colX.apellido, headerY + 6, { width: 135 });
  doc.text("DNI",        colX.dni,      headerY + 6, { width: 95 });
  doc.text("TIPO",       colX.tipo,     headerY + 6, { width: 60 });

  doc.moveDown(0.2);

  // Filas de pasajeros
  reserva.pasajeros?.forEach((pasajero, i) => {
    const rowY = doc.y;
    const bgColor = i % 2 === 0 ? COLORS.white : COLORS.light;

    doc
      .rect(50, rowY, doc.page.width - 100, 18)
      .fill(bgColor);

    doc
      .fillColor(COLORS.primary)
      .fontSize(8)
      .font("Helvetica");

    doc.text(String(i + 1),             colX.num,      rowY + 5, { width: 25 });
    doc.text(pasajero.nombre,           colX.nombre,   rowY + 5, { width: 135 });
    doc.text(pasajero.apellido,         colX.apellido, rowY + 5, { width: 135 });
    doc.text(pasajero.dni ?? "—",       colX.dni,      rowY + 5, { width: 95 });
    doc.text(
      pasajero.tipo === "adulto" ? "Adulto" : "Niño",
      colX.tipo, rowY + 5, { width: 60 }
    );

    doc.moveDown(0.15);
  });
};

// ── Sección: Resumen Financiero ──────────────────────────────
const dibujarResumenFinanciero = (doc, reserva) => {
  doc.moveDown(1);

  // Caja del total
  const boxY = doc.y;
  const boxW = 220;
  const boxX = doc.page.width - 50 - boxW;

  doc
    .rect(boxX, boxY, boxW, 70)
    .fill(COLORS.primary);

  doc
    .fillColor(COLORS.light)
    .fontSize(9)
    .font("Helvetica")
    .text("TOTAL PAGADO", boxX + 15, boxY + 12, { width: boxW - 30, align: "center" });

  doc
    .fillColor(COLORS.white)
    .fontSize(24)
    .font("Helvetica-Bold")
    .text(
      `S/ ${Number(reserva.precioTotal).toFixed(2)}`,
      boxX + 15, boxY + 28,
      { width: boxW - 30, align: "center" }
    );

  doc.moveDown(4.5);
};

// ── Sección: Pie de Página ───────────────────────────────────
const dibujarPie = (doc, reserva) => {
  const pieY = doc.page.height - 80;

  doc
    .rect(0, pieY, doc.page.width, 80)
    .fill(COLORS.light);

  doc
    .fillColor(COLORS.muted)
    .fontSize(7.5)
    .font("Helvetica")
    .text(
      `Token de verificación: ${reserva.tokenSeguridad}`,
      50, pieY + 12,
      { width: doc.page.width - 100, align: "center" }
    );

  doc
    .fillColor(COLORS.muted)
    .fontSize(8)
    .text(
      "Este documento es tu comprobante oficial de pago. Preséntalo el día del tour.",
      50, pieY + 28,
      { width: doc.page.width - 100, align: "center" }
    );

  doc
    .fillColor(COLORS.primary)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text(
      "Unu-Raymi Tours | info@unu-raymi.com | www.unu-raymi.com",
      50, pieY + 46,
      { width: doc.page.width - 100, align: "center" }
    );
};

// ── Utilidad: Línea separadora ───────────────────────────────
const dibujarLineaSeparadora = (doc) => {
  doc
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke();
};
