import prisma from "../lib/prismaClient.js";
import { generateBilingualGuia } from "../services/translationService.js";

const formatearGuia = (g) => {
  if (!g) return g;
  let traducciones = null;
  try {
    traducciones = typeof g.traducciones === 'string' ? JSON.parse(g.traducciones) : g.traducciones;
  } catch {}
  return {
    ...g,
    traducciones: traducciones || {
      es: { rol: g.rol, descripcion: g.descripcion, experiencia: g.experiencia, idiomas: g.idiomas },
      en: { rol: g.rol, descripcion: g.descripcion, experiencia: g.experiencia, idiomas: g.idiomas },
    }
  };
};

// ── GET /api/guias ───────────────────────────────────────────
export const obtenerGuias = async (req, res, next) => {
  try {
    const { activo } = req.query;
    const filtros = {};
    if (activo !== undefined) {
      filtros.activo = activo === "true";
    }

    const guias = await prisma.guia.findMany({
      where: filtros,
      orderBy: [
        { orden: "asc" },
        { createdAt: "desc" }
      ],
    });

    return res.status(200).json({
      success: true,
      data: guias.map(formatearGuia),
    });
  } catch (error) {
    console.error("Error al consultar guías en base de datos:", error.message);
    return res.status(200).json({
      success: true,
      data: [],
      warning: "Base de datos en inicialización o sin registros de guías.",
    });
  }
};

// ── GET /api/guias/:id ───────────────────────────────────────
export const obtenerGuiaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const guia = await prisma.guia.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!guia) {
      return res.status(404).json({
        success: false,
        error: `Guía con ID ${id} no encontrado.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: formatearGuia(guia),
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/guias ──────────────────────────────────────────
export const crearGuia = async (req, res, next) => {
  try {
    const { nombre, rol, experiencia, idiomas, foto, descripcion, activo, orden, traducciones } = req.body;

    let finalTraducciones = null;
    if (traducciones && typeof traducciones === 'object') {
      finalTraducciones = JSON.stringify(traducciones);
    } else if (typeof traducciones === 'string' && traducciones.trim().startsWith('{')) {
      finalTraducciones = traducciones;
    } else {
      try {
        const generated = await generateBilingualGuia({ rol, descripcion, experiencia, idiomas });
        finalTraducciones = JSON.stringify(generated);
      } catch (err) {
        console.warn('[GuiaController] Error autotraduciendo guía:', err.message);
      }
    }

    const nuevaGuia = await prisma.guia.create({
      data: {
        nombre,
        rol,
        experiencia,
        idiomas,
        foto,
        descripcion,
        activo: activo ?? true,
        orden: orden ?? 0,
        traducciones: finalTraducciones,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Guía creado exitosamente.",
      data: formatearGuia(nuevaGuia),
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/guias/:id ───────────────────────────────────────
export const actualizarGuia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const guiaId = parseInt(id, 10);

    const guiaExistente = await prisma.guia.findUnique({ where: { id: guiaId } });
    if (!guiaExistente) {
      return res.status(404).json({
        success: false,
        error: `Guía con ID ${id} no encontrado.`,
      });
    }

    const updateData = { ...req.body };
    if (updateData.traducciones && typeof updateData.traducciones === 'object') {
      updateData.traducciones = JSON.stringify(updateData.traducciones);
    } else if (!updateData.traducciones && (updateData.rol || updateData.descripcion)) {
      try {
        const generated = await generateBilingualGuia({
          rol: updateData.rol || guiaExistente.rol,
          descripcion: updateData.descripcion || guiaExistente.descripcion,
          experiencia: updateData.experiencia || guiaExistente.experiencia,
          idiomas: updateData.idiomas || guiaExistente.idiomas,
        });
        updateData.traducciones = JSON.stringify(generated);
      } catch (err) {
        console.warn('[GuiaController] Error autotraduciendo en update:', err.message);
      }
    }

    const guiaActualizado = await prisma.guia.update({
      where: { id: guiaId },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Guía actualizado exitosamente.",
      data: formatearGuia(guiaActualizado),
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/guias/:id ────────────────────────────────────
export const eliminarGuia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const guiaId = parseInt(id, 10);

    const guiaExistente = await prisma.guia.findUnique({ where: { id: guiaId } });
    if (!guiaExistente) {
      return res.status(404).json({
        success: false,
        error: `Guía con ID ${id} no encontrado.`,
      });
    }

    await prisma.guia.delete({ where: { id: guiaId } });

    return res.status(200).json({
      success: true,
      message: `Guía '${guiaExistente.nombre}' eliminado exitosamente.`,
    });
  } catch (error) {
    next(error);
  }
};
