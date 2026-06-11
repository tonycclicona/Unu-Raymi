import prisma from "./lib/prismaClient.js";
import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Función para mapear países según el título o región
const obtenerPais = (title, region) => {
  const t = title.toLowerCase();
  const r = region.toLowerCase();
  
  if (t.includes("machu") || t.includes("cusco") || t.includes("salkantay") || t.includes("ausangate") || t.includes("blanca") || t.includes("choquequirao") || r.includes("peru")) {
    return "Perú";
  }
  if (t.includes("cartagena") || t.includes("bogota") || t.includes("bogotá") || t.includes("medellin") || t.includes("medellín") || t.includes("lost city") || t.includes("amazon") || r.includes("colombia")) {
    return "Colombia";
  }
  if (t.includes("paine") || t.includes("easter") || t.includes("atacama") || t.includes("patagonia") || r.includes("chile") || r.includes("patagonia")) {
    return "Chile";
  }
  
  // Por defecto distribuir en los 3 principales de forma equitativa si es internacional/otros
  const hash = title.length % 3;
  if (hash === 0) return "Perú";
  if (hash === 1) return "Colombia";
  return "Chile";
};

// Obtener imagen adecuada
const obtenerImagen = (pais) => {
  if (pais === "Perú") return "/uploads/machu_picchu.webp";
  if (pais === "Colombia") return "/uploads/parque_tayrona.webp";
  return "/uploads/torres_del_paine.webp";
};

// Fechas aleatorias
const getFutureDates = (seed) => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + seed + i * 4);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
};

async function main() {
  console.log("🌱 Iniciando migración masiva de tours desde HTML...");

  const contentMdPath = "C:\\Users\\Tony\\.gemini\\antigravity-ide\\brain\\65d3c9ad-af56-4e15-96fa-9d6ae3f5e661\\.system_generated\\steps\\1248\\content.md";
  let htmlContent = "";

  if (fs.existsSync(contentMdPath)) {
    htmlContent = fs.readFileSync(contentMdPath, "utf8");
    console.log("📖 Leyendo desde content.md...");
  } else {
    console.error("❌ No se encontró el archivo HTML de destinos.");
    process.exit(1);
  }

  // Parsear enlaces
  const regex = /<a href="([^"]+\/tours\/[^"]+)"([^>]*)>([\s\S]*?)<\/a>/g;
  let match;
  const parsedTours = [];

  while ((match = regex.exec(htmlContent)) !== null) {
    const url = match[1];
    const attributes = match[2];
    const innerHtml = match[3];

    // Extraer slug del URL (ej: https://unuraymi.com/tours/salkantay-trek/ -> salkantay-trek)
    const urlParts = url.split("/");
    const slug = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1];

    let title = "";
    let region = "";
    let meta = "7 días · Expedición personalizada";
    let pill = "Aventura";

    if (attributes.includes("nr-gcard")) {
      const regionMatch = innerHtml.match(/class="nr-gcard-region">([^<]+)</);
      const titleMatch = innerHtml.match(/class="nr-gcard-title">([^<]+)</);
      const metaMatch = innerHtml.match(/class="nr-gcard-meta">([^<]+)</);
      const pillMatch = innerHtml.match(/class="nr-gcard-pill">([^<]+)</);

      region = regionMatch ? regionMatch[1].trim() : "Sudamérica";
      title = titleMatch ? titleMatch[1].trim() : "Expedición Especial";
      meta = metaMatch ? metaMatch[1].trim() : meta;
      pill = pillMatch ? pillMatch[1].trim() : pill;
    } else {
      title = innerHtml.replace(/<[^>]*>/g, "").trim().replace(/&amp;/g, "&");
      region = "Sudamérica";
    }

    if (!title || title.includes("${")) continue; // Ignorar templates dinámicos de JS

    parsedTours.push({
      title,
      slug,
      region,
      meta,
      pill
    });
  }

  // Eliminar duplicados por slug
  const uniqueTours = [];
  const slugsSeen = new Set();
  for (const tour of parsedTours) {
    if (!slugsSeen.has(tour.slug)) {
      slugsSeen.add(tour.slug);
      uniqueTours.push(tour);
    }
  }

  console.log(`🔍 Total de tours únicos extraídos: ${uniqueTours.length}`);

  // Limpiar base de datos
  console.log("🧹 Limpiando base de datos...");
  await prisma.pasajero.deleteMany({});
  await prisma.reserva.deleteMany({});
  await prisma.imagen.deleteMany({});
  await prisma.tour.deleteMany({});

  // Guardar en bloque
  console.log("💾 Insertando tours en la base de datos...");
  let count = 0;
  for (const t of uniqueTours) {
    const pais = obtenerPais(t.title, t.region);
    const imagen = obtenerImagen(pais);
    const precio = 150 + (count * 15) % 650;
    const nino = Math.round(precio * 0.7);
    const duracion = 3 + (count * 2) % 8;
    const cupos = 8 + (count * 3) % 20;

    await prisma.tour.create({
      data: {
        nombre: t.title,
        slug: t.slug,
        descripcion: `Una increíble expedición a ${t.title}. Descubre los paisajes más hermosos y vive una experiencia inolvidable con la garantía de Unu Raymi. Categorizado como viaje ${t.pill}.`,
        itinerario: `Día 1: Bienvenida e inicio del tour a ${t.title}.\nDía 2: Caminata guiada y exploración de los puntos destacados.\nDía 3: Actividades de aventura y retorno de la delegación.`,
        precio_adulto: precio,
        precio_nino: nino,
        duracion_dias: duracion,
        cupos_disponibles: cupos,
        servicios_incluidos: JSON.stringify([
          "Guía profesional certificado en la zona",
          "Seguro de viaje y asistencia en ruta",
          "Alimentación completa tipo campamento de lujo",
          "Transporte privado ida y vuelta"
        ]),
        servicios_excluidos: JSON.stringify([
          "Propinas",
          "Equipo de caminata personal"
        ]),
        que_llevar: JSON.stringify([
          "Calzado de caminata de alta montaña",
          "Ropa impermeable y abrigo ligero",
          "Cámara fotográfica y protector solar"
        ]),
        fechas_disponibles: JSON.stringify(getFutureDates(count)),
        pais: pais,
        activo: true,
        destacado: count % 5 === 0,
        imagenes: {
          create: [
            { url: imagen, altText: t.title, orden: 0 }
          ]
        }
      }
    });
    count++;
  }

  console.log(`🎉 Migración completada. Se sembraron ${count} tours exitosamente.`);
}

main()
  .catch((e) => {
    console.error("❌ Error en la migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
