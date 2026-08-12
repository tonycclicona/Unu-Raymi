import prisma from '../lib/prismaClient.js';

/**
 * Obtener países, atractivos y rutas para el mapa inicial
 */
export async function getGisSchemaData(req, res) {
  try {
    const countries = await prisma.gisCountry.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });

    const attractions = await prisma.touristAttraction.findMany({
      where: { estado: 'verified' },
      include: {
        country: true,
        administrativeArea: {
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        },
      },
    });

    const routes = await prisma.gisRoute.findMany({
      where: { estado: 'active' },
      include: {
        segmentos: { orderBy: { ordenIndex: 'asc' } },
        advertencias: { where: { activo: true } },
      },
    });

    return res.json({
      countries,
      attractions,
      routes,
    });
  } catch (error) {
    console.error('Error al obtener datos GIS del mapa:', error);
    return res.status(500).json({ error: 'Error al cargar datos geográficos del servidor.' });
  }
}

/**
 * Obtener el detalle completo de un atractivo por su Slug (ej: laguna-humantay)
 */
export async function getAttractionBySlug(req, res) {
  try {
    const { slug } = req.params;

    const attraction = await prisma.touristAttraction.findUnique({
      where: { slug },
      include: {
        country: true,
        administrativeArea: {
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        },
        rutasRelacionadas: {
          include: {
            route: {
              include: {
                segmentos: { orderBy: { ordenIndex: 'asc' } },
                puntosInteres: {
                  include: {
                    pointOfInterest: true,
                  },
                  orderBy: { ordenIndex: 'asc' },
                },
                advertencias: { where: { activo: true } },
              },
            },
          },
        },
      },
    });

    if (!attraction) {
      return res.status(404).json({ error: 'Atractivo turístico no encontrado.' });
    }

    // Armar jerarquía en texto didáctico (ej: "Perú > Cusco > Anta > Mollepata > Soraypampa")
    const area = attraction.administrativeArea;
    const prov = area?.parent;
    const region = prov?.parent;

    const jerarquiaText = [
      attraction.country.nombre,
      region?.nombre,
      prov?.nombre,
      area?.nombre,
      attraction.localidad,
    ]
      .filter(Boolean)
      .join(' > ');

    return res.json({
      attraction,
      jerarquiaText,
      region: region?.nombre || 'Cusco',
      provincia: prov?.nombre || 'Anta',
      distrito: area?.nombre || 'Mollepata',
      localidad: attraction.localidad || 'Soraypampa',
    });
  } catch (error) {
    console.error('Error al obtener detalle del atractivo GIS:', error);
    return res.status(500).json({ error: 'Error interno al consultar el atractivo.' });
  }
}

/**
 * Buscar atractivos o rutas por término
 */
export async function searchGisDestinations(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ result: [] });
    }

    const query = q.trim();

    const attractions = await prisma.touristAttraction.findMany({
      where: {
        OR: [
          { nombre: { contains: query } },
          { descripcion: { contains: query } },
          { localidad: { contains: query } },
          { categoria: { contains: query } },
        ],
      },
      include: {
        country: true,
      },
      take: 10,
    });

    return res.json({ attractions });
  } catch (error) {
    console.error('Error en búsqueda GIS:', error);
    return res.status(500).json({ error: 'Error al ejecutar búsqueda geográfica.' });
  }
}
