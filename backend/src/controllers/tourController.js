// ============================================================
// tourController.js — CRUD completo de Tours
// Los arrays de servicios se serializan/deserializan como JSON
// antes de guardar/recuperar de MySQL.
// ============================================================

import prisma from "../lib/prismaClient.js";

// ── Helpers de serialización ─────────────────────────────────
const serializarArray = (arr) => JSON.stringify(arr ?? []);
const deserializarArray = (str) => {
  try {
    return JSON.parse(str ?? "[]");
  } catch {
    return [];
  }
};

/**
 * Formatea un objeto Tour crudo de la BD para la respuesta API:
 * deserializa los campos JSON de arrays de servicios.
 */
const formatearTour = (tour) => ({
  ...tour,
  precio_adulto: parseFloat(tour.precio_adulto),
  precio_nino: parseFloat(tour.precio_nino),
  servicios_incluidos: deserializarArray(tour.servicios_incluidos),
  servicios_excluidos: deserializarArray(tour.servicios_excluidos),
  que_llevar: deserializarArray(tour.que_llevar),
  fechas_disponibles: deserializarArray(tour.fechas_disponibles),
  variantes: tour.variantes?.map(v => ({
    ...v,
    precio_adulto: parseFloat(v.precio_adulto),
    precio_nino: parseFloat(v.precio_nino),
    servicios_incluidos: deserializarArray(v.servicios_incluidos),
    servicios_excluidos: deserializarArray(v.servicios_excluidos),
    fechas_disponibles: deserializarArray(v.fechas_disponibles),
  })) || [],
});

// ── GET /api/tours ───────────────────────────────────────────
export const obtenerTours = async (req, res, next) => {
  try {
    const { activo, destacado, pais } = req.query;

    const filtros = {};
    if (activo !== undefined) filtros.activo = activo === "true";
    if (destacado !== undefined) filtros.destacado = destacado === "true";
    if (pais !== undefined) filtros.pais = pais;

    const tours = await prisma.tour.findMany({
      where: filtros,
      include: {
        imagenes: { orderBy: { orden: "asc" } },
        variantes: { orderBy: { duracion_dias: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: tours.map(formatearTour),
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/tours/:id ───────────────────────────────────────
export const obtenerTourPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tour = await prisma.tour.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        imagenes: { orderBy: { orden: "asc" } },
        variantes: { orderBy: { duracion_dias: "asc" } },
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        error: `Tour con ID ${id} no encontrado.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: formatearTour(tour),
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/tours/slug/:slug ────────────────────────────────
export const obtenerTourPorSlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const tour = await prisma.tour.findUnique({
      where: { slug },
      include: {
        imagenes: { orderBy: { orden: "asc" } },
        variantes: { orderBy: { duracion_dias: "asc" } },
      },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        error: `Tour con slug '${slug}' no encontrado.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: formatearTour(tour),
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/tours ──────────────────────────────────────────
export const crearTour = async (req, res, next) => {
  try {
    const {
      nombre,
      slug,
      descripcion,
      itinerario,
      precio_adulto,
      precio_nino,
      duracion_dias,
      cupos_disponibles,
      servicios_incluidos,
      servicios_excluidos,
      que_llevar,
      fechas_disponibles,
      imagenes,
      activo,
      destacado,
      pais,
      categoria,
      ciudad,
      variantes,
    } = req.body;

    // Si no se envían a nivel raíz, tomamos del primer variante (si existe) para no romper constraints de la BD
    const primerVariante = (variantes && variantes.length > 0) ? variantes[0] : null;
    const finalPrecioAdulto = precio_adulto ?? primerVariante?.precio_adulto ?? 0;
    const finalPrecioNino = precio_nino ?? primerVariante?.precio_nino ?? 0;
    const finalDuracionDias = duracion_dias ?? primerVariante?.duracion_dias ?? 1;
    const finalCuposDisponibles = cupos_disponibles ?? primerVariante?.cupos_disponibles ?? 0;
    const finalServiciosIncluidos = servicios_incluidos ?? primerVariante?.servicios_incluidos ?? [];

    // Verificar slug duplicado
    const slugExistente = await prisma.tour.findUnique({ where: { slug } });
    if (slugExistente) {
      return res.status(409).json({
        success: false,
        error: `Ya existe un tour con el slug '${slug}'. El slug debe ser único.`,
      });
    }

    const nuevoTour = await prisma.tour.create({
      data: {
        nombre,
        slug,
        descripcion,
        itinerario,
        precio_adulto: finalPrecioAdulto,
        precio_nino: finalPrecioNino,
        duracion_dias: finalDuracionDias,
        cupos_disponibles: finalCuposDisponibles,
        pais,
        categoria,
        ciudad,
        // Serializar arrays → JSON string para MySQL
        servicios_incluidos: serializarArray(finalServiciosIncluidos),
        servicios_excluidos: serializarArray(servicios_excluidos),
        que_llevar: serializarArray(que_llevar),
        fechas_disponibles: serializarArray(fechas_disponibles),
        activo,
        destacado,
        // Crear imágenes relacionadas si se enviaron
        imagenes: {
          create: imagenes?.map((img) => ({
            url: img.url,
            altText: img.altText ?? null,
            orden: img.orden ?? 0,
          })) ?? [],
        },
        // Crear variantes si se enviaron
        variantes: {
          create: variantes?.map((v) => ({
            duracion_dias: parseInt(v.duracion_dias, 10),
            precio_adulto: parseFloat(v.precio_adulto),
            precio_nino: parseFloat(v.precio_nino),
            cupos_disponibles: parseInt(v.cupos_disponibles, 10),
            itinerario: v.itinerario ?? null,
            servicios_incluidos: v.servicios_incluidos ? JSON.stringify(v.servicios_incluidos) : null,
            servicios_excluidos: v.servicios_excluidos ? JSON.stringify(v.servicios_excluidos) : null,
            fechas_disponibles: v.fechas_disponibles ? JSON.stringify(v.fechas_disponibles) : null,
          })) ?? [],
        },
      },
      include: { imagenes: true, variantes: true },
    });

    return res.status(201).json({
      success: true,
      message: "Tour creado exitosamente.",
      data: formatearTour(nuevoTour),
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/tours/:id ───────────────────────────────────────
export const actualizarTour = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tourId = parseInt(id, 10);
    const data = req.body;

    // Verificar que el tour existe
    const tourExistente = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tourExistente) {
      return res.status(404).json({
        success: false,
        error: `Tour con ID ${id} no encontrado.`,
      });
    }

    // Preparar datos de actualización
    const dataActualizar = { ...data };

    // Si se envían variantes, también sincronizamos los campos a nivel raíz para mantener la coherencia en la BD
    if (data.variantes !== undefined && data.variantes.length > 0) {
      const primerVariante = data.variantes[0];
      dataActualizar.precio_adulto = data.precio_adulto ?? parseFloat(primerVariante.precio_adulto) ?? 0;
      dataActualizar.precio_nino = data.precio_nino ?? parseFloat(primerVariante.precio_nino) ?? 0;
      dataActualizar.duracion_dias = data.duracion_dias ?? parseInt(primerVariante.duracion_dias, 10) ?? 1;
      dataActualizar.cupos_disponibles = data.cupos_disponibles ?? parseInt(primerVariante.cupos_disponibles, 10) ?? 0;
      
      if (data.servicios_incluidos === undefined) {
        dataActualizar.servicios_incluidos = serializarArray(primerVariante.servicios_incluidos);
      }
    }

    // Serializar arrays si están presentes
    if (data.servicios_incluidos !== undefined) {
      dataActualizar.servicios_incluidos = serializarArray(data.servicios_incluidos);
    }
    if (data.servicios_excluidos !== undefined) {
      dataActualizar.servicios_excluidos = serializarArray(data.servicios_excluidos);
    }
    if (data.que_llevar !== undefined) {
      dataActualizar.que_llevar = serializarArray(data.que_llevar);
    }
    if (data.fechas_disponibles !== undefined) {
      dataActualizar.fechas_disponibles = serializarArray(data.fechas_disponibles);
    }

    // Sincronizar imágenes si están presentes en la petición
    if (data.imagenes !== undefined) {
      await prisma.imagen.deleteMany({ where: { tourId } });
      if (data.imagenes.length > 0) {
        await prisma.imagen.createMany({
          data: data.imagenes.map((img) => ({
            url: img.url,
            altText: img.altText ?? null,
            orden: img.orden ?? 0,
            tourId,
          })),
        });
      }
    }

    // Sincronizar variantes si están presentes en la petición
    if (data.variantes !== undefined) {
      await prisma.tourVariante.deleteMany({ where: { tourId } });
      if (data.variantes.length > 0) {
        await prisma.tourVariante.createMany({
          data: data.variantes.map((v) => ({
            tourId,
            duracion_dias: parseInt(v.duracion_dias, 10),
            precio_adulto: parseFloat(v.precio_adulto),
            precio_nino: parseFloat(v.precio_nino),
            cupos_disponibles: parseInt(v.cupos_disponibles, 10),
            itinerario: v.itinerario ?? null,
            servicios_incluidos: v.servicios_incluidos ? JSON.stringify(v.servicios_incluidos) : null,
            servicios_excluidos: v.servicios_excluidos ? JSON.stringify(v.servicios_excluidos) : null,
            fechas_disponibles: v.fechas_disponibles ? JSON.stringify(v.fechas_disponibles) : null,
          })),
        });
      }
    }

    // Excluir 'imagenes' y 'variantes' del update directo del tour
    delete dataActualizar.imagenes;
    delete dataActualizar.variantes;

    const tourActualizado = await prisma.tour.update({
      where: { id: tourId },
      data: dataActualizar,
      include: {
        imagenes: { orderBy: { orden: "asc" } },
        variantes: { orderBy: { duracion_dias: "asc" } },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Tour actualizado exitosamente.",
      data: formatearTour(tourActualizado),
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/tours/:id ────────────────────────────────────
export const eliminarTour = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tourId = parseInt(id, 10);

    const tourExistente = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tourExistente) {
      return res.status(404).json({
        success: false,
        error: `Tour con ID ${id} no encontrado.`,
      });
    }

    await prisma.tour.delete({ where: { id: tourId } });

    return res.status(200).json({
      success: true,
      message: `Tour '${tourExistente.nombre}' eliminado exitosamente.`,
    });
  } catch (error) {
    next(error);
  }
};
