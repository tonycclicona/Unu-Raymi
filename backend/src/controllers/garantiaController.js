import prisma from "../lib/prismaClient.js";
import { generateBilingualGarantia } from "../services/translationService.js";

const formatearGarantia = (g) => {
  if (!g) return g;
  let traducciones = null;
  try {
    traducciones = typeof g.traducciones === 'string' ? JSON.parse(g.traducciones) : g.traducciones;
  } catch {}
  return {
    ...g,
    traducciones: traducciones || {
      es: { titulo: g.titulo, descripcion: g.descripcion },
      en: { titulo: g.titulo, descripcion: g.descripcion },
    }
  };
};

// ── GET /api/garantias ───────────────────────────────────────
export const obtenerGarantias = async (req, res, next) => {
  try {
    const { activo } = req.query;
    const filtros = {};
    if (activo !== undefined) {
      filtros.activo = activo === "true";
    }

    const garantias = await prisma.garantia.findMany({
      where: filtros,
      orderBy: [
        { orden: "asc" },
        { createdAt: "desc" }
      ],
    });

    return res.status(200).json({
      success: true,
      data: garantias.map(formatearGarantia),
    });
  } catch (error) {
    console.error("Error al consultar garantías en base de datos:", error.message);
    return res.status(200).json({
      success: true,
      data: [],
      warning: "Base de datos en inicialización o sin registros de garantías.",
    });
  }
};

// ── GET /api/garantias/:id ───────────────────────────────────
export const obtenerGarantiaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const garantia = await prisma.garantia.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!garantia) {
      return res.status(404).json({
        success: false,
        error: `Garantía con ID ${id} no encontrada.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: formatearGarantia(garantia),
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/garantias ───────────────────────────────────────
export const crearGarantia = async (req, res, next) => {
  try {
    const { titulo, descripcion, icono, color, imagenUrl, activo, orden, traducciones } = req.body;

    let finalTraducciones = null;
    if (traducciones && typeof traducciones === 'object') {
      finalTraducciones = JSON.stringify(traducciones);
    } else if (typeof traducciones === 'string' && traducciones.trim().startsWith('{')) {
      finalTraducciones = traducciones;
    } else {
      try {
        const generated = await generateBilingualGarantia({ titulo, descripcion });
        finalTraducciones = JSON.stringify(generated);
      } catch (err) {
        console.warn('[GarantiaController] Error autotraduciendo garantía:', err.message);
      }
    }

    const nuevaGarantia = await prisma.garantia.create({
      data: {
        titulo,
        descripcion,
        icono,
        color,
        imagenUrl,
        activo: activo ?? true,
        orden: orden ?? 0,
        traducciones: finalTraducciones,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Garantía creada exitosamente.",
      data: formatearGarantia(nuevaGarantia),
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/garantias/:id ───────────────────────────────────
export const actualizarGarantia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const garantiaId = parseInt(id, 10);

    const garantiaExistente = await prisma.garantia.findUnique({ where: { id: garantiaId } });
    if (!garantiaExistente) {
      return res.status(404).json({
        success: false,
        error: `Garantía con ID ${id} no encontrada.`,
      });
    }

    const updateData = { ...req.body };
    if (updateData.traducciones && typeof updateData.traducciones === 'object') {
      updateData.traducciones = JSON.stringify(updateData.traducciones);
    } else if (!updateData.traducciones && (updateData.titulo || updateData.descripcion)) {
      try {
        const generated = await generateBilingualGarantia({
          titulo: updateData.titulo || garantiaExistente.titulo,
          descripcion: updateData.descripcion || garantiaExistente.descripcion,
        });
        updateData.traducciones = JSON.stringify(generated);
      } catch (err) {
        console.warn('[GarantiaController] Error autotraduciendo en update:', err.message);
      }
    }

    const garantiaActualizada = await prisma.garantia.update({
      where: { id: garantiaId },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Garantía actualizada exitosamente.",
      data: formatearGarantia(garantiaActualizada),
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/garantias/:id ────────────────────────────────
export const eliminarGarantia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const garantiaId = parseInt(id, 10);

    const garantiaExistente = await prisma.garantia.findUnique({ where: { id: garantiaId } });
    if (!garantiaExistente) {
      return res.status(404).json({
        success: false,
        error: `Garantía con ID ${id} no encontrada.`,
      });
    }

    await prisma.garantia.delete({ where: { id: garantiaId } });

    return res.status(200).json({
      success: true,
      message: `Garantía '${garantiaExistente.titulo}' eliminada exitosamente.`,
    });
  } catch (error) {
    next(error);
  }
};
