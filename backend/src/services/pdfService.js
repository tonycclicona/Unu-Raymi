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
// ── Paleta de colores del boleto de reserva (Sobria y Profesional) ────────────────────────────
const COLORS = {
  // Un azul noche profundo pero suavizado con gris, ideal para títulos principales
  primary: "#2C3E50",

  // Cambiamos el Rojo Coral intenso (#e94560) por un terracota/ladrillo apagado y elegante para acentos importantes
  accent: "#B85C5C",

  // Un azul marino/pizarra deslavado para subtítulos, etiquetas y textos secundarios
  secondary: "#4A6572",

  // Gris neutro frío para textos descriptivos largos (términos y condiciones, notas)
  muted: "#7F8C8D",

  // Un fondo hueso/gris cálido muy suave que reduce la fatiga visual a diferencia del blanco puro
  light: "#F8F9FA",

  white: "#FFFFFF",

  // Verde salvia/oliva para el estado "PAGADO", eliminando el verde chillón de alerta
  success: "#4E876A",

  // Un gris sutil para las líneas de puntos o divisiones de los troqueles del boleto
  border: "#E2E8F0",
};
/**
 * Genera el PDF del boleto de reserva y lo guarda en disco.
 * @param {Object} reserva - Objeto completo de la reserva (con tour y pasajeros).
 * @returns {Promise<string>} Ruta absoluta del archivo PDF generado.
 */
export const generarInvoicePDF = (reserva) => {
  return new Promise((resolve, reject) => {
    const outputPath = join(INVOICES_DIR, `${reserva.tokenSeguridad}.pdf`);

    // Si ya existe el PDF (por un reintento del webhook), no regenerar
    if (existsSync(outputPath)) {
      console.log(`[PDF] ♻️  Boleto de reserva ya existe: ${reserva.tokenSeguridad}.pdf`);
      return resolve(outputPath);
    }

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 10, left: 50, right: 50 },
      autoPageBreak: false,
      bufferPages: true,
      info: {
        Title: `Boleto de Reserva #${reserva.id} — Unu-Raymi`,
        Author: "Unu-Raymi Tours",
        Subject: `Boleto de reserva — ${reserva.tour?.nombre ?? "Tour"}`,
        Creator: "Unu-Raymi Backend API",
      },
    });

    const writeStream = createWriteStream(outputPath);
    doc.pipe(writeStream);

    writeStream.on("finish", () => resolve(outputPath));
    writeStream.on("error", reject);

    // ── Contenido del PDF (Fijado a una sola página) ──────────────────────────────────
    dibujarEncabezado(doc, reserva);
    dibujarBadgePagado(doc);
    dibujarDatosReserva(doc, reserva);
    dibujarTitular(doc, reserva);
    dibujarTablaPasajeros(doc, reserva);
    dibujarResumenYNota(doc, reserva);
    dibujarPie(doc, reserva);

    doc.end();
  });
};

// ── Sección: Encabezado ──────────────────────────────────────
const dibujarEncabezado = (doc, reserva) => {
  // Fondo del header
  doc
    .rect(0, 0, doc.page.width, 110)
    .fill(COLORS.primary);

  // Logo a la izquierda
  const logoPath = join(__dirname, "..", "..", "storage", "logo.png");
  let textX = 50;
  if (existsSync(logoPath)) {
    doc.image(logoPath, 50, 15, { height: 45 });
    textX = 120; // Desplazar texto para no sobreponerse al logo
  }

  // Nombre de la empresa
  doc
    .fillColor(COLORS.white)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("UNU-RAYMI", textX, 20);

  // Subtítulo empresa
  doc
    .fillColor(COLORS.accent)
    .fontSize(8)
    .font("Helvetica")
    .text("EXPEDITIONS", textX, 45);

  // Número de Boleto (derecha)
  doc
    .fillColor(COLORS.white)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(`BOLETO DE RESERVA #${String(reserva.id).padStart(6, "0")}`, 0, 22, {
      align: "right",
      width: doc.page.width - 50,
    });

  doc
    .fillColor(COLORS.light)
    .fontSize(8.5)
    .font("Helvetica")
    .text(
      `Emitido: ${new Date(reserva.pagadoEn ?? reserva.updatedAt).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`,
      0, 42,
      { align: "right", width: doc.page.width - 50 }
    );

  // Nombre del tour
  doc
    .fillColor(COLORS.light)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(reserva.tour?.nombre ?? "Tour", 50, 78, { width: 400 });
};

// ── Sección: Badge CONFIRMADO ────────────────────────────────────
const dibujarBadgePagado = (doc) => {
  const badgeX = doc.page.width - 140;
  const badgeY = 125;

  doc
    .roundedRect(badgeX, badgeY, 90, 20, 4)
    .fill(COLORS.success);

  doc
    .fillColor(COLORS.white)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("✓CONFIRMADO", badgeX, badgeY + 5, { width: 90, align: "center" });
};

// ── Sección: Datos de la Reserva ─────────────────────────────
const dibujarDatosReserva = (doc, reserva) => {
  const y = 130;
  doc.y = y;

  doc
    .fillColor(COLORS.primary)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Detalles de la Reserva", 50, y);

  doc.moveDown(0.4);
  dibujarLineaSeparadora(doc);
  doc.moveDown(0.4);

  const fechaViaje = new Date(reserva.fechaViaje).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const campos = [
    ["Nº de Reserva", `#${String(reserva.id).padStart(6, "0")}`],
    ["Tour", reserva.tour?.nombre ?? "—"],
    ["Fecha del Viaje", fechaViaje],
    ["Duración", `${reserva.tour?.duracion_dias ?? "—"} día(s)`],
    ["Adultos", String(reserva.cantAdultos)],
    ["Niños", String(reserva.cantNinos)],
    ["Referencia Pago", reserva.referenciaPago ?? "—"],
  ];

  campos.forEach(([label, valor]) => {
    const currentY = doc.y;
    const valueHeight = doc.heightOfString(valor, { width: 360 });
    const labelHeight = doc.heightOfString(label.toUpperCase(), { width: 120 });
    const rowHeight = Math.max(valueHeight, labelHeight) + 3;

    doc
      .fillColor(COLORS.muted)
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text(label.toUpperCase(), 50, currentY, { width: 120 });

    doc
      .fillColor(COLORS.primary)
      .fontSize(8.5)
      .font("Helvetica")
      .text(valor, 180, currentY, { width: 360 });

    doc.y = currentY + rowHeight;
  });
};

// ── Sección: Datos del Titular ───────────────────────────────
const dibujarTitular = (doc, reserva) => {
  doc.y = doc.y + 10;

  doc
    .fillColor(COLORS.primary)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Titular de la Reserva", 50, doc.y);

  doc.moveDown(0.4);
  dibujarLineaSeparadora(doc);
  doc.moveDown(0.4);

  const campos = [
    ["Nombre completo", reserva.titularNombre],
    ["Correo electrónico", reserva.titularEmail],
    ["Teléfono", reserva.titularTelefono ?? "No proporcionado"],
  ];

  campos.forEach(([label, valor]) => {
    const currentY = doc.y;
    const valueHeight = doc.heightOfString(valor, { width: 360 });
    const labelHeight = doc.heightOfString(label.toUpperCase(), { width: 120 });
    const rowHeight = Math.max(valueHeight, labelHeight) + 3;

    doc
      .fillColor(COLORS.muted)
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text(label.toUpperCase(), 50, currentY, { width: 120 });

    doc
      .fillColor(COLORS.primary)
      .fontSize(8.5)
      .font("Helvetica")
      .text(valor, 180, currentY, { width: 360 });

    doc.y = currentY + rowHeight;
  });
};

// ── Sección: Tabla de Pasajeros ──────────────────────────────
const dibujarTablaPasajeros = (doc, reserva) => {
  doc.y = doc.y + 10;

  doc
    .fillColor(COLORS.primary)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Pasajeros", 50, doc.y);

  doc.moveDown(0.4);
  dibujarLineaSeparadora(doc);
  doc.moveDown(0.4);

  // Cabecera de tabla
  const colX = { num: 55, nombre: 80, apellido: 220, dni: 360, tipo: 460 };
  const headerY = doc.y;

  doc
    .rect(50, headerY, doc.page.width - 100, 18)
    .fill(COLORS.secondary);

  doc
    .fillColor(COLORS.white)
    .fontSize(8)
    .font("Helvetica-Bold");

  doc.text("#", colX.num, headerY + 5, { width: 25 });
  doc.text("NOMBRE", colX.nombre, headerY + 5, { width: 135 });
  doc.text("APELLIDO", colX.apellido, headerY + 5, { width: 135 });
  doc.text("DNI", colX.dni, headerY + 5, { width: 95 });
  doc.text("TIPO", colX.tipo, headerY + 5, { width: 60 });

  let currentRowY = headerY + 18;

  // Filas de pasajeros
  reserva.pasajeros?.forEach((pasajero, i) => {
    const bgColor = i % 2 === 0 ? COLORS.white : COLORS.light;

    doc
      .rect(50, currentRowY, doc.page.width - 100, 16)
      .fill(bgColor);

    doc
      .fillColor(COLORS.primary)
      .fontSize(8)
      .font("Helvetica");

    doc.text(String(i + 1), colX.num, currentRowY + 4, { width: 25 });
    doc.text(pasajero.nombre, colX.nombre, currentRowY + 4, { width: 135 });
    doc.text(pasajero.apellido, colX.apellido, currentRowY + 4, { width: 135 });
    doc.text(pasajero.dni ?? "—", colX.dni, currentRowY + 4, { width: 95 });
    doc.text(
      pasajero.tipo === "adulto" ? "Adulto" : "Niño",
      colX.tipo, currentRowY + 4, { width: 60 }
    );

    currentRowY += 16;
  });

  doc.y = currentRowY + 10;
};

// ── Sección: Resumen Financiero y Nota de Check-In ───────────
const dibujarResumenYNota = (doc, reserva) => {
  const boxY = doc.y + 10;
  const boxH = 55;
  const boxW = 200;
  const boxX = doc.page.width - 50 - boxW;

  // 1. Dibujar Nota de Check-In a la izquierda
  doc
    .roundedRect(50, boxY, 275, boxH, 4)
    .fill(COLORS.light);

  doc
    .fillColor(COLORS.secondary)
    .fontSize(7.5)
    .font("Helvetica-Bold")
    .text("INFORMACIÓN IMPORTANTE PARA EL VIAJE", 60, boxY + 8, { width: 255 });

  doc
    .fillColor(COLORS.primary)
    .fontSize(7)
    .font("Helvetica")
    .text(
      "• Realizar el Check-In final con al menos 24 horas de anticipación.\n" +
      "• Llevar documento de identidad original (DNI o Pasaporte obligatorio).\n" +
      "• Asegurar calzado de montaña y todo lo requerido para la ruta.",
      60, boxY + 20,
      { width: 255, lineGap: 1.5 }
    );

  // 2. Dibujar Caja del Total a la derecha
  doc
    .rect(boxX, boxY, boxW, boxH)
    .fill(COLORS.primary);

  doc
    .fillColor(COLORS.light)
    .fontSize(8)
    .font("Helvetica")
    .text("TOTAL PAGADO", boxX + 10, boxY + 10, { width: boxW - 20, align: "center" });

  doc
    .fillColor(COLORS.white)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text(
      `$ ${Number(reserva.precioTotal).toFixed(2)} USD`,
      boxX + 10, boxY + 24,
      { width: boxW - 20, align: "center" }
    );

  doc.y = boxY + boxH + 10;
};

// ── Sección: Pie de Página ───────────────────────────────────
const dibujarPie = (doc, reserva) => {
  const pieHeight = 70;
  const pieY = doc.page.height - pieHeight;

  doc
    .rect(0, pieY, doc.page.width, pieHeight)
    .fill(COLORS.light);

  doc
    .fillColor(COLORS.muted)
    .fontSize(7)
    .font("Helvetica")
    .text(
      `Token de seguridad: ${reserva.tokenSeguridad}`,
      50, pieY + 10,
      { width: doc.page.width - 100, align: "center" }
    );

  doc
    .fillColor(COLORS.muted)
    .fontSize(8)
    .text(
      "Este documento es tu boleto oficial de reserva. Preséntalo impreso o digital el día del tour.",
      50, pieY + 24,
      { width: doc.page.width - 100, align: "center" }
    );

  doc
    .fillColor(COLORS.primary)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text(
      "Unu-Raymi Tours | info@unu-raymi.com | www.unu-raymi.com",
      50, pieY + 40,
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
