import prisma from "../lib/prismaClient.js";

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
      data: garantias,
    });
  } catch (error) {
    next(error);
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
      data: garantia,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/garantias ───────────────────────────────────────
export const crearGarantia = async (req, res, next) => {
  try {
    const { titulo, descripcion, icono, color, imagenUrl, activo, orden } = req.body;

    const nuevaGarantia = await prisma.garantia.create({
      data: {
        titulo,
        descripcion,
        icono,
        color,
        imagenUrl,
        activo: activo ?? true,
        orden: orden ?? 0,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Garantía creada exitosamente.",
      data: nuevaGarantia,
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

    const garantiaActualizada = await prisma.garantia.update({
      where: { id: garantiaId },
      data: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Garantía actualizada exitosamente.",
      data: garantiaActualizada,
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
