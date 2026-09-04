import prisma from '../lib/prismaClient.js';

/**
 * Endpoint Admin: Crear una nueva Attraction
 * POST /api/admin/attractions
 */
export async function createAttractionAdmin(req, res) {
  try {
    const { name, category, latitude, longitude, altitude, description, tourId, imageUrl, orden } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Nombre, latitud y longitud son campos obligatorios.' });
    }

    const attraction = await prisma.attraction.create({
      data: {
        name,
        category: category || 'ATRACTIVO',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        altitude: altitude ? parseInt(altitude, 10) : null,
        description: description || null,
        imageUrl: imageUrl || null,
        orden: orden !== undefined && orden !== '' ? parseInt(orden, 10) : 0,
        tourId: tourId ? parseInt(tourId, 10) : null,
      },
      include: {
        tour: {
          select: { id: true, nombre: true },
        },
      },
    });

    return res.status(201).json({ success: true, data: attraction });
  } catch (error) {
    console.error('Error al crear atracción admin:', error);
    return res.status(500).json({ error: 'Error al registrar el punto en el servidor.' });
  }
}

/**
 * Endpoint Admin: Actualizar una Attraction existente
 * PUT /api/admin/attractions/:id
 */
export async function updateAttractionAdmin(req, res) {
  try {
    const { id } = req.params;
    const { name, category, latitude, longitude, altitude, description, tourId, imageUrl, orden } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Nombre, latitud y longitud son obligatorios.' });
    }

    const attraction = await prisma.attraction.update({
      where: { id },
      data: {
        name,
        category: category || 'ATRACTIVO',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        altitude: altitude ? parseInt(altitude, 10) : null,
        description: description || null,
        imageUrl: imageUrl !== undefined ? (imageUrl || null) : undefined,
        orden: orden !== undefined && orden !== '' ? parseInt(orden, 10) : 0,
        tourId: tourId ? parseInt(tourId, 10) : null,
      },
      include: {
        tour: {
          select: { id: true, nombre: true },
        },
      },
    });

    return res.json({ success: true, data: attraction });
  } catch (error) {
    console.error('Error al actualizar atracción admin:', error);
    return res.status(500).json({ error: 'Error al actualizar el punto en el servidor.' });
  }
}

/**
 * Endpoint Admin: Obtener una Attraction por ID
 * GET /api/admin/attractions/:id
 */
export async function getAttractionByIdAdmin(req, res) {
  try {
    const { id } = req.params;
    const attraction = await prisma.attraction.findUnique({
      where: { id },
      include: {
        tour: {
          select: { id: true, nombre: true, pais: true },
        },
      },
    });

    if (!attraction) {
      return res.status(404).json({ error: 'Punto no encontrado.' });
    }

    return res.json({ success: true, data: attraction });
  } catch (error) {
    console.error('Error al obtener atracción por id:', error);
    return res.status(500).json({ error: 'Error al consultar el punto.' });
  }
}

/**
 * Endpoint Admin: Listar todas las Attractions
 * GET /api/admin/attractions
 */
export async function getAttractionsAdmin(req, res) {
  try {
    const attractions = await prisma.attraction.findMany({
      include: {
        tour: {
          select: { id: true, nombre: true, pais: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: attractions });
  } catch (error) {
    console.error('Error al listar atracciones admin:', error);
    return res.status(500).json({ error: 'Error al consultar puntos geográficos.' });
  }
}

/**
 * Endpoint Admin: Eliminar un punto Attraction
 * DELETE /api/admin/attractions/:id
 */
export async function deleteAttractionAdmin(req, res) {
  try {
    const { id } = req.params;

    await prisma.attraction.delete({
      where: { id },
    });

    return res.json({ success: true, message: 'Punto geográfico eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar atracción admin:', error);
    return res.status(500).json({ error: 'Error al eliminar el punto del servidor.' });
  }
}

/**
 * Endpoint Público v1: Obtener lista de Attractions para el Frontend
 * GET /api/v1/attractions
 * Query params: tourId, category
 */
export async function getAttractionsPublic(req, res) {
  try {
    const { tourId, category } = req.query;

    const where = {};
    if (tourId) {
      where.tourId = parseInt(tourId, 10);
    }
    if (category) {
      where.category = category;
    }

    const attractions = await prisma.attraction.findMany({
      where,
      include: {
        tour: {
          select: { id: true, nombre: true, slug: true, pais: true, nivel_dificultad: true },
        },
      },
      orderBy: [
        { orden: 'asc' },
        { name: 'asc' },
      ],
    });

    return res.json({ success: true, data: attractions });
  } catch (error) {
    console.error('Error al listar atracciones públicas v1:', error);
    return res.status(500).json({ error: 'Error al consultar la capa de atracciones públicas.' });
  }
}
