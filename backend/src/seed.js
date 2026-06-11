import prisma from "./lib/prismaClient.js";
import sharp from "sharp";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, "..", "storage", "uploads");

// Paths a las imágenes PNG generadas
const SOURCE_IMAGES = {
  machu_picchu: "C:\\Users\\Tony\\.gemini\\antigravity-ide\\brain\\65d3c9ad-af56-4e15-96fa-9d6ae3f5e661\\machu_picchu_1780098084244.png",
  parque_tayrona: "C:\\Users\\Tony\\.gemini\\antigravity-ide\\brain\\65d3c9ad-af56-4e15-96fa-9d6ae3f5e661\\parque_tayrona_1780098100447.png",
  torres_del_paine: "C:\\Users\\Tony\\.gemini\\antigravity-ide\\brain\\65d3c9ad-af56-4e15-96fa-9d6ae3f5e661\\torres_del_paine_1780098117694.png"
};

// Generar una lista de fechas futuras para reservar
const getFutureDates = (daysOffset) => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + daysOffset + i * 5);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
};

async function main() {
  console.log("🌱 Iniciando proceso de seeding...");

  // 1. Asegurar carpeta de subidas
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  // 2. Procesar imágenes a WebP
  console.log("🖼️  Optimizando y convirtiendo imágenes a WebP...");
  for (const [key, sourcePath] of Object.entries(SOURCE_IMAGES)) {
    const outputPath = join(UPLOADS_DIR, `${key}.webp`);
    try {
      await sharp(sourcePath)
        .webp({ quality: 80 })
        .toFile(outputPath);
      console.log(`✅ Convertida ${key}.webp`);
    } catch (err) {
      console.error(`❌ Error procesando ${key}:`, err.message);
    }
  }

  // 3. Limpiar base de datos
  console.log("🧹 Limpiando tablas de base de datos...");
  await prisma.pasajero.deleteMany({});
  await prisma.reserva.deleteMany({});
  await prisma.imagen.deleteMany({});
  await prisma.tour.deleteMany({});
  console.log("✅ Tablas limpias.");

  // 4. Crear Tours
  console.log("📝 Sembrando tours...");

  // Tour 1: Perú (Trekking, Cusco)
  const datesPeru = getFutureDates(2);
  const tourPeru = await prisma.tour.create({
    data: {
      nombre: "Camino Inca clásico a Machu Picchu",
      slug: "camino-inca-machu-picchu",
      descripcion: "Explora la ruta de senderismo más famosa de Sudamérica. Atraviesa pasos de montaña andinos, valles verdes y ruinas incas prehistóricas antes de llegar a la mítica ciudadela de Machu Picchu al amanecer del cuarto día.",
      itinerario: "Día 1: Cusco - Km 82 - Wayllabamba\nComenzamos la caminata cruzando el río Urubamba y disfrutando de vistas hermosas. Acampamos en Wayllabamba.\n\nDía 2: Wayllabamba - Paso de la Mujer Muerta - Pacaymayo\nEl día más desafiante. Subimos hasta los 4,215 metros en el paso Warmiwañusqa y luego descendemos al campamento en Pacaymayo.\n\nDía 3: Pacaymayo - Phuyupatamarca - Wiñay Wayna\nVisitamos sitios arqueológicos increíbles a lo largo del camino de piedra original incaico.\n\nDía 4: Wiñay Wayna - Inti Punku - Machu Picchu - Cusco\nLlegada al amanecer a la Puerta del Sol para contemplar Machu Picchu en todo su esplendor, seguido de un tour guiado.",
      precio_adulto: 500.00,
      precio_nino: 350.00,
      duracion_dias: 4,
      cupos_disponibles: 15,
      servicios_incluidos: JSON.stringify([
        "Guía local profesional bilingüe",
        "Seguro de viaje básico y asistencia médica",
        "Alimentación completa (3 desayunos, 3 almuerzos, 3 cenas)",
        "Transporte de recogida en hotel y tren de retorno Expedition",
        "Tickets de entrada a Machu Picchu y Camino Inca"
      ]),
      servicios_excluidos: JSON.stringify([
        "Propinas para porteadores y guías",
        "Bolsa de dormir (disponible para alquiler)"
      ]),
      que_llevar: JSON.stringify([
        "Pasaporte original obligatorio",
        "Mochila de senderismo de 30L a 40L",
        "Calzado de montaña con buen agarre",
        "Impermeable y casaca de abrigo"
      ]),
      fechas_disponibles: JSON.stringify(datesPeru),
      activo: true,
      destacado: true,
      pais: "Perú",
      categoria: "Trekking",
      ciudad: "Cusco",
      imagenes: {
        create: [
          { url: "/uploads/machu_picchu.webp", altText: "Machu Picchu Inca Trail", orden: 0 }
        ]
      },
      variantes: {
        create: [
          {
            duracion_dias: 4,
            precio_adulto: 500.00,
            precio_nino: 350.00,
            cupos_disponibles: 15,
            itinerario: "Día 1: Cusco - Km 82 - Wayllabamba\nComenzamos la caminata cruzando el río Urubamba y disfrutando de vistas hermosas. Acampamos en Wayllabamba.\n\nDía 2: Wayllabamba - Paso de la Mujer Muerta - Pacaymayo\nEl día más desafiante. Subimos hasta los 4,215 metros en el paso Warmiwañusqa y luego descendemos al campamento en Pacaymayo.\n\nDía 3: Pacaymayo - Phuyupatamarca - Wiñay Wayna\nVisitamos sitios arqueológicos increíbles a lo largo del camino de piedra original incaico.\n\nDía 4: Wiñay Wayna - Inti Punku - Machu Picchu - Cusco\nLlegada al amanecer a la Puerta del Sol para contemplar Machu Picchu en todo su esplendor, seguido de un tour guiado.",
          },
          {
            duracion_dias: 2,
            precio_adulto: 320.00,
            precio_nino: 220.00,
            cupos_disponibles: 10,
            itinerario: "Día 1: Cusco - Km 104 - Wiñay Wayna - Aguas Calientes\nComenzamos abordando el tren en Ollantaytambo hacia el Km 104, donde se inicia la caminata por el Camino Inca Corto. Pasamos por el increíble sitio de Wiñay Wayna y llegamos a la Puerta del Sol (Inti Punku) al atardecer para contemplar Machu Picchu. Descendemos al pueblo de Aguas Calientes para pasar la noche.\n\nDía 2: Aguas Calientes - Santuario de Machu Picchu - Cusco\nSubimos temprano en bus al santuario. Realizamos un recorrido guiado completo de 2 horas. Por la tarde regresamos en tren Expedition a Ollantaytambo y luego en transporte privado a Cusco.",
          }
        ]
      }
    }
  });
  console.log(`✅ Tour creado: ${tourPeru.nombre}`);

  // Tour 2: Perú (Full Days, Cusco)
  const tourHumantay = await prisma.tour.create({
    data: {
      nombre: "Full Day Laguna Humantay",
      slug: "full-day-laguna-humantay",
      descripcion: "Camina hacia la espectacular laguna turquesa Humantay, ubicada al pie del imponente nevado Salkantay. Una excursión de un día llena de paisajes de alta montaña y misticismo andino.",
      itinerario: "04:30 AM - Recojo del hotel en Cusco y viaje hacia Mollepata para el desayuno.\n09:00 AM - Inicio de la caminata cuesta arriba hacia la Laguna Humantay (aprox. 1.5 a 2 horas).\n11:00 AM - Tiempo libre para tomar fotos, explorar y participar en una ceremonia de ofrenda a la Pachamama.\n01:00 PM - Descenso a Soraypampa y almuerzo buffet.\n06:30 PM - Retorno a la ciudad del Cusco.",
      precio_adulto: 45.00,
      precio_nino: 35.00,
      duracion_dias: 1,
      cupos_disponibles: 20,
      servicios_incluidos: JSON.stringify([
        "Transporte turístico ida y vuelta desde Cusco",
        "Guía oficial de turismo bilingüe",
        "Desayuno y almuerzo buffet semi-vegetariano",
        "Bastones de trekking de madera y botiquín con oxígeno",
        "Boleto de ingreso a la comunidad de Mollepata"
      ]),
      servicios_excluidos: JSON.stringify([
        "Alquiler de caballos de subida (opcional, pago directo)",
        "Propinas y gastos personales"
      ]),
      que_llevar: JSON.stringify([
        "Ropa abrigadora para la mañana",
        "Zapatillas de trekking cómodas",
        "Protector solar, lentes de sol y gorra",
        "Cámara fotográfica y dinero en efectivo"
      ]),
      fechas_disponibles: JSON.stringify(getFutureDates(1)),
      activo: true,
      destacado: false,
      pais: "Perú",
      categoria: "Full Days",
      ciudad: "Cusco",
      imagenes: {
        create: [
          { url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80", altText: "Laguna Humantay Turquesa", orden: 0 }
        ]
      }
    }
  });
  console.log(`✅ Tour creado: ${tourHumantay.nombre}`);

  // Tour 3: Perú (Trek & Climb, Arequipa)
  const tourMisti = await prisma.tour.create({
    data: {
      nombre: "Ascenso al Volcán Misti",
      slug: "ascenso-volcan-misti-2-dias",
      descripcion: "Corona la cima del guardián de la Ciudad Blanca a 5,822 metros sobre el nivel del mar. Una desafiante expedición de caminata y escalada no técnica que ofrece las mejores vistas panorámicas de Arequipa.",
      itinerario: "Día 1: Arequipa - Campo Base (Nido de Águilas)\nViaje en 4x4 hasta la base del volcán a 3,300m e inicio del ascenso a pie de unas 5 horas cargando el equipo. Campamento en Nido de Águilas (4,800m).\n\nDía 2: Campo Base - Cima del Misti - Arequipa\nAtaque a la cumbre desde la madrugada (5-6 horas). Celebración en la cruz de la cima, vistas del cráter activo y descenso rápido por arenales hasta la camioneta.",
      precio_adulto: 190.00,
      precio_nino: 190.00,
      duracion_dias: 2,
      cupos_disponibles: 8,
      servicios_incluidos: JSON.stringify([
        "Transporte privado 4x4 desde Arequipa",
        "Guía de alta montaña certificado (UIAGM/AGMP)",
        "Equipo de campamento completo (carpa térmica, vajilla, colchoneta)",
        "Alimentación de montaña (1 cena, 1 desayuno, bebidas calientes)",
        "Botellas de oxígeno y botiquín de primeros auxilios"
      ]),
      servicios_excluidos: JSON.stringify([
        "Bolsa de dormir para temperaturas bajo cero",
        "Porteador personal para mochila"
      ]),
      que_llevar: JSON.stringify([
        "Mochila de expedición de 60L-70L",
        "Ropa de abrigo de tres capas (térmica, polar, cortavientos)",
        "Zapatos de alta montaña o trekking robusto",
        "Linterna frontal con baterías de repuesto",
        "Bastones de trekking ajustables"
      ]),
      fechas_disponibles: JSON.stringify(getFutureDates(4)),
      activo: true,
      destacado: false,
      pais: "Perú",
      categoria: "Trek & Climb",
      ciudad: "Arequipa",
      imagenes: {
        create: [
          { url: "https://images.unsplash.com/photo-1627914949581-2292f75a7c2e?auto=format&fit=crop&w=800&q=80", altText: "Volcán Misti Arequipa", orden: 0 }
        ]
      }
    }
  });
  console.log(`✅ Tour creado: ${tourMisti.nombre}`);

  // Tour 4: Colombia (Trekking, Santa Marta)
  const datesCol = getFutureDates(5);
  const tourColombia = await prisma.tour.create({
    data: {
      nombre: "Aventura Ecológica en Parque Tayrona",
      slug: "parque-nacional-tayrona",
      descripcion: "Disfruta de playas de arena blanca, palmeras gigantes y un bosque tropical denso rodeado por el mar Caribe. Una caminata de ensueño que combina naturaleza salvaje y relajación total en una de las reservas ecológicas más bellas del mundo.",
      itinerario: "Día 1: Santa Marta - Entrada Zaino - Cabo San Juan\nCaminata a través del bosque húmedo tropical, pasando por playas espectaculares como Arrecifes y La Piscina, hasta llegar a Cabo San Juan para pasar la noche.\n\nDía 2: Cabo San Juan - Pueblito Chairama - Retorno\nSenderismo de ascenso opcional hacia las antiguas ruinas indígenas de Pueblito o día de relajación en la playa y baño libre antes de retornar a Santa Marta.",
      precio_adulto: 180.00,
      precio_nino: 120.00,
      duracion_dias: 2,
      cupos_disponibles: 25,
      servicios_incluidos: JSON.stringify([
        "Guía de naturaleza experto local",
        "Entrada oficial al Parque Nacional Tayrona",
        "Traslados ida y vuelta en vehículo climatizado desde Santa Marta",
        "Almuerzo típico caribeño el primer día",
        "Botiquín de primeros auxilios y asistencia médica básica"
      ]),
      servicios_excluidos: JSON.stringify([
        "Alojamiento (camping o hamaca en Cabo San Juan)",
        "Cenas y desayuno de la mañana siguiente"
      ]),
      que_llevar: JSON.stringify([
        "Calzado cómodo para caminata (tenis o botas)",
        "Ropa ligera y traje de baño",
        "Repelente de mosquitos amigable con el ecosistema",
        "Protector solar y sombrero para el sol"
      ]),
      fechas_disponibles: JSON.stringify(datesCol),
      activo: true,
      destacado: true,
      pais: "Colombia",
      categoria: "Trekking",
      ciudad: "Santa Marta",
      imagenes: {
        create: [
          { url: "/uploads/parque_tayrona.webp", altText: "Cabo San Juan Tayrona", orden: 0 }
        ]
      },
      variantes: {
        create: [
          {
            duracion_dias: 2,
            precio_adulto: 180.00,
            precio_nino: 120.00,
            cupos_disponibles: 25,
            itinerario: "Día 1: Santa Marta - Entrada Zaino - Cabo San Juan\nCaminata a través del bosque húmedo tropical, pasando por playas espectaculares como Arrecifes y La Piscina, hasta llegar a Cabo San Juan para pasar la noche.\n\nDía 2: Cabo San Juan - Pueblito Chairama - Retorno\nSenderismo de ascenso opcional hacia las antiguas ruinas indígenas de Pueblito o día de relajación en la playa y baño libre antes de retornar a Santa Marta."
          },
          {
            duracion_dias: 1,
            precio_adulto: 100.00,
            precio_nino: 70.00,
            cupos_disponibles: 20,
            itinerario: "Día 1: Santa Marta - Entrada Zaino - Cabo San Juan\nCaminata rápida por el sendero tropical, disfrutando de las hermosas playas Arrecifes y La Piscina. Almuerzo y tiempo libre en la bahía de Cabo San Juan. Por la tarde, regreso a pie hacia la entrada y transporte de vuelta a Santa Marta."
          }
        ]
      }
    }
  });
  console.log(`✅ Tour creado: ${tourColombia.nombre}`);

  // Tour 5: Colombia (Full Days, Bogotá)
  const tourMonserrate = await prisma.tour.create({
    data: {
      nombre: "Full Day Bogotá Histórica y Monserrate",
      slug: "full-day-bogota-monserrate",
      descripcion: "Descubre el encanto colonial y la vibrante cultura de la capital colombiana. Sube al cerro de Monserrate en teleférico para obtener vistas panorámicas y recorre el centro histórico de La Candelaria y el famoso Museo del Oro.",
      itinerario: "09:00 AM - Recojo en el hotel y traslado a la estación del teleférico de Monserrate.\n10:00 AM - Recorrido por el santuario y mirador en la cima del cerro.\n12:00 PM - Descenso y almuerzo tradicional bogotano (Ajiaco) en La Candelaria.\n02:00 PM - Tour guiado a pie por la Plaza de Bolívar, Palacio de Justicia y calles coloniales.\n03:30 PM - Visita guiada al Museo del Oro.\n05:30 PM - Retorno al hotel.",
      precio_adulto: 65.00,
      precio_nino: 45.00,
      duracion_dias: 1,
      cupos_disponibles: 15,
      servicios_incluidos: JSON.stringify([
        "Transporte privado climatizado durante todo el día",
        "Guía local certificado experto en historia",
        "Boleto de ida y vuelta para el teleférico o funicular de Monserrate",
        "Ingreso al Museo del Oro y Casa de la Moneda",
        "Almuerzo típico gourmet completo"
      ]),
      servicios_excluidos: JSON.stringify([
        "Propinas para el guía y conductor",
        "Compras de souvenirs y refrigerios adicionales"
      ]),
      que_llevar: JSON.stringify([
        "Ropa cómoda adecuada para el clima cambiante de Bogotá",
        "Paraguas pequeño o impermeable",
        "Zapatos cómodos para caminar en calles empedradas",
        "Cámara o smartphone cargado"
      ]),
      fechas_disponibles: JSON.stringify(getFutureDates(3)),
      activo: true,
      destacado: false,
      pais: "Colombia",
      categoria: "Full Days",
      ciudad: "Bogotá",
      imagenes: {
        create: [
          { url: "https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?auto=format&fit=crop&w=800&q=80", altText: "Cerro Monserrate Bogotá", orden: 0 }
        ]
      }
    }
  });
  console.log(`✅ Tour creado: ${tourMonserrate.nombre}`);

  // Tour 6: Colombia (Trek & Climb, El Cocuy)
  const tourCocuy = await prisma.tour.create({
    data: {
      nombre: "Expedición Glaciar Nevado del Cocuy",
      slug: "nevado-del-cocuy-trek-climb",
      descripcion: "Adéntrate en una de las reservas de glaciares más hermosas de Sudamérica. Camina entre frailejones gigantes y escala senderos rocosos hasta tocar el borde del glaciar en los picos Ritacuba o Pan de Azúcar.",
      itinerario: "Día 1: Registro y caminata de aclimatación\nLlegada a El Cocuy, registro en Parques Nacionales y caminata suave por el valle de frailejones a 3,800m. Alojamiento en cabaña de montaña.\n\nDía 2: Ascenso al Borde del Glaciar (Púlpito del Diablo)\nInicio de ascenso desde las 05:00 AM. Caminata exigente de 8 horas subiendo pendientes empinadas de piedra laja hasta el imponente monolito Púlpito del Diablo y borde glaciar a 4,800m. Descenso y retorno.",
      precio_adulto: 240.00,
      precio_nino: 240.00,
      duracion_dias: 2,
      cupos_disponibles: 6,
      servicios_incluidos: JSON.stringify([
        "Guía de montaña local certificado por parques",
        "Entrada oficial y registro al Parque Nacional Natural El Cocuy",
        "Seguro obligatorio de rescate de montaña",
        "Traslados internos en campero 4x4",
        "Todos los desayunos, almuerzos de marcha y cenas en la montaña"
      ]),
      servicios_excluidos: JSON.stringify([
        "Alquiler de crampones o equipo técnico (no requerido para borde glaciar)",
        "Transporte de larga distancia hasta el pueblo de El Cocuy"
      ]),
      que_llevar: JSON.stringify([
        "Ropa impermeable y cortavientos de alta montaña",
        "Guantes térmicos y gorro de lana",
        "Botas de trekking impermeables con buena tracción",
        "Gafas con filtro UV de alta protección",
        "Bloqueador solar biodegradable"
      ]),
      fechas_disponibles: JSON.stringify(getFutureDates(7)),
      activo: true,
      destacado: false,
      pais: "Colombia",
      categoria: "Trek & Climb",
      ciudad: "El Cocuy",
      imagenes: {
        create: [
          { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80", altText: "Picos Nevados del Cocuy", orden: 0 }
        ]
      }
    }
  });
  console.log(`✅ Tour creado: ${tourCocuy.nombre}`);

  // Tour 7: Chile (Trekking, Puerto Natales)
  const datesChile = getFutureDates(8);
  const tourChile = await prisma.tour.create({
    data: {
      nombre: "Circuito W - Torres del Paine",
      slug: "torres-del-paine-w-trek",
      descripcion: "El circuito de senderismo por excelencia en la Patagonia chilena. Descubre los glaciares colosales, los picos de granito verticales que dan nombre al parque y los lagos de color turquesa lechoso que te quitarán el aliento.",
      itinerario: "Día 1: Puerto Natales - Entrada Laguna Amarga - Base Torres\nPrimera gran caminata hacia el mirador de la Base de las Torres de Paine, contemplando las tres agujas de granito y su laguna glaciar.\n\nDía 2: Refugio el Chileno - Refugio Los Cuernos\nBordeamos el espectacular lago Nordenskjöld con vistas al glaciar colgante del monte Almirante Nieto.\n\nDía 3: Valle del Francés - Refugio Paine Grande\nSenderismo de ascenso al corazón del circuito, rodeados de bosques nativos y glaciares con avalanchas sonoras.\n\nDía 4: Refugio Paine Grande - Glaciar Grey\nCaminamos al lado del lago Grey para contemplar el gigantesco glaciar Grey y los icebergs flotantes.\n\nDía 5: Retorno en catamarán y bus a Puerto Natales\nTiempo libre para fotos finales antes de abordar el catamarán en lago Pehoé y bus de regreso.",
      precio_adulto: 650.00,
      precio_nino: 450.00,
      duracion_dias: 5,
      cupos_disponibles: 10,
      servicios_incluidos: JSON.stringify([
        "Líder de expedición bilingüe certificado",
        "Entradas y permisos para Torres del Paine",
        "Boletos de catamarán en Lago Pehoé y bus regular",
        "Todos los desayunos, box lunches y cenas en los refugios",
        "Protocolos de rescate y seguridad satelital Garmin"
      ]),
      servicios_excluidos: JSON.stringify([
        "Saco de dormir de alta montaña",
        "Bebidas alcohólicas y extras en los refugios"
      ]),
      que_llevar: JSON.stringify([
        "Vestimenta en capas (sistema de 3 capas)",
        "Cortavientos e impermeable de alta calidad",
        "Botas de trekking caña alta impermeables",
        "Bastones de trekking telescópicos"
      ]),
      fechas_disponibles: JSON.stringify(datesChile),
      activo: true,
      destacado: true,
      pais: "Chile",
      categoria: "Trekking",
      ciudad: "Puerto Natales",
      imagenes: {
        create: [
          { url: "/uploads/torres_del_paine.webp", altText: "Torres del Paine granite peaks", orden: 0 }
        ]
      }
    }
  });
  console.log(`✅ Tour creado: ${tourChile.nombre}`);

  // Tour 8: Chile (Full Days, San Pedro de Atacama)
  const tourAtacama = await prisma.tour.create({
    data: {
      nombre: "Full Day Valle de la Luna y Salar de Atacama",
      slug: "full-day-valle-de-la-luna",
      descripcion: "Explora la geología surrealista del desierto más seco del mundo. Maravíllate con las dunas gigantes de arena, formaciones de sal talladas por el viento y culmina contemplando un atardecer de fuego sobre la cordillera de la sal.",
      itinerario: "02:30 PM - Salida desde San Pedro de Atacama hacia el Valle de la Luna.\n03:30 PM - Recorrido guiado por las Tres Marías y la Gran Duna.\n05:00 PM - Visita a las cavernas de sal y mirador del cañón del desierto.\n06:30 PM - Traslado al mirador del Coyote para el atardecer.\n07:30 PM - Disfrute de un cocktail de cortesía mientras el sol pinta de colores los volcanes andinos.\n08:30 PM - Retorno al pueblo.",
      precio_adulto: 55.00,
      precio_nino: 40.00,
      duracion_dias: 1,
      cupos_disponibles: 18,
      servicios_incluidos: JSON.stringify([
        "Transporte de turismo ida y vuelta",
        "Guía especializado bilingüe e historiador",
        "Boleto de entrada al parque nacional Valle de la Luna",
        "Pisco Sour o jugo natural y snacks al atardecer",
        "Asistencia de primeros auxilios"
      ]),
      servicios_excluidos: JSON.stringify([
        "Almuerzo (se realiza después del almuerzo en el pueblo)",
        "Propinas para el equipo de guiado"
      ]),
      que_llevar: JSON.stringify([
        "Ropa ligera para el día y abrigo grueso para el atardecer",
        "Zapatos de caminata estables",
        "Mucha agua personal (mínimo 1.5L)",
        "Protector solar y bálsamo labial"
      ]),
      fechas_disponibles: JSON.stringify(getFutureDates(2)),
      activo: true,
      destacado: false,
      pais: "Chile",
      categoria: "Full Days",
      ciudad: "San Pedro de Atacama",
      imagenes: {
        create: [
          { url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80", altText: "Atardecer Valle de la Luna Atacama", orden: 0 }
        ]
      }
    }
  });
  console.log(`✅ Tour creado: ${tourAtacama.nombre}`);

  // Tour 9: Chile (Trek & Climb, Pucón)
  const tourVillarrica = await prisma.tour.create({
    data: {
      nombre: "Ascenso al Volcán Villarrica Activo",
      slug: "ascenso-volcan-villarrica-climb",
      descripcion: "Vive la experiencia inigualable de subir a pie hasta el cráter de un volcán activo. Escucha el rugido del magma y observa las fumarolas de gases de azufre desde una de las cumbres más dinámicas y hermosas de la Patagonia norte.",
      itinerario: "06:00 AM - Equipamiento y traslado a la base del volcán Villarrica.\n07:30 AM - Inicio del ascenso en nieve y hielo usando grampones y piolet (aprox. 4 a 5 horas).\n12:30 PM - Llegada a la cumbre (2,847m). Observación del cráter y fumarolas.\n01:30 PM - Descenso seguro deslizándose en trineos plásticos especiales por las pistas de nieve.\n04:30 PM - Llegada a la base y traslado de retorno a Pucón.",
      precio_adulto: 160.00,
      precio_nino: 160.00,
      duracion_dias: 1,
      cupos_disponibles: 10,
      servicios_incluidos: JSON.stringify([
        "Guías de montaña certificados por Sernatur (proporción 1 cada 3 pasajeros)",
        "Equipo técnico de montaña completo (botas plásticas, grampones, piolet, casco, trineo)",
        "Ropa técnica (chaqueta y pantalón impermeable, mochila, guantes)",
        "Transporte de montaña ida y vuelta desde Pucón",
        "Seguro contra accidentes de montaña"
      ]),
      servicios_excluidos: JSON.stringify([
        "Ticket del andarivel (opcional, ahorra 1 hora de subida)",
        "Alimentación y agua (cada pasajero lleva su comida de marcha)"
      ]),
      que_llevar: JSON.stringify([
        "Primera capa térmica superior e inferior",
        "Gafas de sol deportivas con protección UV clase 3 o 4",
        "Bloqueador solar factor 50 y labial con protección solar",
        "Ración de marcha energética (frutos secos, chocolates, barras)",
        "Botella de agua o bebida isotónica de 2L"
      ]),
      fechas_disponibles: JSON.stringify(getFutureDates(6)),
      activo: true,
      destacado: false,
      pais: "Chile",
      categoria: "Trek & Climb",
      ciudad: "Pucón",
      imagenes: {
        create: [
          { url: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=800&q=80", altText: "Cráter Volcán Villarrica Nieve", orden: 0 }
        ]
      },
      variantes: {
        create: [
          {
            duracion_dias: 1,
            precio_adulto: 160.00,
            precio_nino: 160.00,
            cupos_disponibles: 10,
            itinerario: "06:00 AM - Equipamiento y traslado a la base del volcán Villarrica.\n07:30 AM - Inicio del ascenso en nieve y hielo usando grampones y piolet (aprox. 4 a 5 horas).\n12:30 PM - Llegada a la cumbre (2,847m). Observación del cráter y fumarolas.\n01:30 PM - Descenso seguro deslizándose en trineos plásticos especiales por las pistas de nieve.\n04:30 PM - Llegada a la base y traslado de retorno a Pucón."
          },
          {
            duracion_dias: 3,
            precio_adulto: 350.00,
            precio_nino: 350.00,
            cupos_disponibles: 6,
            itinerario: "Día 1: Pucón - Aclimatación y campamento base\nReunión técnica, ajuste de equipo de montaña. Traslado a los faldeos del volcán para acampar en zona de bosque nativo.\n\nDía 2: Campamento base - Ascenso intermedio y refugio de montaña\nAscenso gradual con mochilas de montaña hasta el refugio de alta montaña a 2,000m. Práctica de progresión en nieve y autodetención.\n\nDía 3: Ataque a la Cumbre y descenso a Pucón\nAscenso de madrugada al cráter activo (2,847m). Vista del lago de lava. Descenso completo en trineos plásticos y retorno a Pucón."
          }
        ]
      }
    }
  });
  console.log(`✅ Tour creado: ${tourVillarrica.nombre}`);

  console.log("🎉 Seeding completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error en el seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
