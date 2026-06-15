import prisma from "../lib/prismaClient.js";

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
      data: guias,
    });
  } catch (error) {
    next(error);
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
      data: guia,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/guias ──────────────────────────────────────────
export const crearGuia = async (req, res, next) => {
  try {
    const { nombre, rol, experiencia, idiomas, foto, descripcion, activo, orden } = req.body;

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
      },
    });

    return res.status(201).json({
      success: true,
      message: "Guía creado exitosamente.",
      data: nuevaGuia,
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

    const guiaActualizado = await prisma.guia.update({
      where: { id: guiaId },
      data: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Guía actualizado exitosamente.",
      data: guiaActualizado,
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
