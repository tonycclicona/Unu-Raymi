// ============================================================
// reclamacionController.js — Libro de Reclamaciones (Ley N° 29571)
// Endpoints seguros y tipados para registrar, consultar y responder reclamos.
// ============================================================

import prisma from "../lib/prismaClient.js";
import { enviarEmailAcuseReclamacion, enviarEmailRespuestaReclamo } from "../services/emailService.js";

/**
 * POST /api/reclamaciones
 * Crea un nuevo reclamo en el libro de reclamaciones (público con rate limiting).
 */
export const crearReclamo = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      telefono,
      tipo_reclamo,
      fecha_ocurrencia,
      descripcion,
      pedido,
    } = req.body;

    // 1. Validaciones de presencia y formato
    if (!nombre || !apellido || !email || !tipo_reclamo || !fecha_ocurrencia || !descripcion || !pedido) {
      return res.status(400).json({ success: false, error: "Todos los campos obligatorios deben completarse." });
    }

    const tipoNormalizado = String(tipo_reclamo).trim().toUpperCase();
    if (!["QUEJA", "RECLAMO", "CONSULTA"].includes(tipoNormalizado)) {
      return res.status(400).json({ success: false, error: "Tipo de reclamo inválido." });
    }

    const fechaParsed = new Date(fecha_ocurrencia);
    if (isNaN(fechaParsed.getTime())) {
      return res.status(400).json({ success: false, error: "Fecha de ocurrencia inválida." });
    }

    // 2. Persistencia tipada con Prisma ORM (elimina consultas raw)
    const nuevoReclamo = await prisma.reclamacion.create({
      data: {
        nombre: String(nombre).trim().substring(0, 100),
        apellido: String(apellido).trim().substring(0, 100),
        email: String(email).trim().toLowerCase().substring(0, 200),
        telefono: telefono ? String(telefono).trim().substring(0, 30) : null,
        tipo_reclamo: tipoNormalizado,
        fecha_ocurrencia: fechaParsed,
        descripcion: String(descripcion).trim().substring(0, 5000),
        pedido: String(pedido).trim().substring(0, 5000),
        estado: "PENDIENTE",
      },
    });

    const newId = nuevoReclamo.id;

    // 3. Notificación de acuse por correo electrónico (no bloquea respuesta si falla)
    try {
      await enviarEmailAcuseReclamacion({
        id: newId,
        nombre: nuevoReclamo.nombre,
        email: nuevoReclamo.email,
        tipo_reclamo: nuevoReclamo.tipo_reclamo,
      });
    } catch (emailErr) {
      console.warn("[reclamacionController] Aviso: no se pudo enviar email de acuse:", emailErr.message);
    }

    return res.status(201).json({
      success: true,
      id: newId,
      message: "Reclamo registrado exitosamente en el Libro de Reclamaciones.",
    });
  } catch (err) {
    console.error("[reclamacionController] Error creando reclamo:", err.message);
    return res.status(500).json({ success: false, error: "Error interno al registrar el reclamo." });
  }
};

/**
 * GET /api/reclamaciones
 * Lista todos los reclamos registrados (protegido - solo admin autenticado).
 */
export const listarReclamos = async (req, res) => {
  try {
    const { estado, tipo } = req.query;

    const where = {};
    if (estado && ["PENDIENTE", "RESPONDIDO"].includes(estado)) {
      where.estado = estado;
    }
    if (tipo && ["QUEJA", "RECLAMO", "CONSULTA"].includes(tipo)) {
      where.tipo_reclamo = tipo;
    }

    const reclamos = await prisma.reclamacion.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    return res.status(200).json({ success: true, data: reclamos });
  } catch (err) {
    console.error("[reclamacionController] Error listando reclamos:", err.message);
    return res.status(500).json({ success: false, error: "Error interno al obtener reclamos." });
  }
};

/**
 * GET /api/reclamaciones/:id
 * Obtiene el detalle de un reclamo por su ID (protegido - solo admin autenticado).
 */
export const obtenerReclamo = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return res.status(400).json({ success: false, error: "ID de reclamo inválido." });
    }

    const reclamo = await prisma.reclamacion.findUnique({
      where: { id: numId },
    });

    if (!reclamo) {
      return res.status(404).json({ success: false, error: "Reclamo no encontrado." });
    }

    return res.status(200).json({ success: true, data: reclamo });
  } catch (err) {
    console.error("[reclamacionController] Error obteniendo reclamo:", err.message);
    return res.status(500).json({ success: false, error: "Error interno al consultar el reclamo." });
  }
};

/**
 * POST /api/reclamaciones/:id/responder
 * Responde a un reclamo y envía email al reclamante (protegido - solo admin autenticado).
 */
export const responderReclamo = async (req, res) => {
  try {
    const { id } = req.params;
    const { respuesta } = req.body;

    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return res.status(400).json({ success: false, error: "ID de reclamo inválido." });
    }

    if (!respuesta || typeof respuesta !== "string" || respuesta.trim().length < 10) {
      return res.status(400).json({ success: false, error: "La respuesta debe tener al menos 10 caracteres." });
    }

    const reclamoActualizado = await prisma.reclamacion.update({
      where: { id: numId },
      data: {
        estado: "RESPONDIDO",
        respuesta_admin: respuesta.trim(),
        fecha_respuesta: new Date(),
      },
    });

    // Enviar notificación por correo con la respuesta oficial
    try {
      await enviarEmailRespuestaReclamo(reclamoActualizado, respuesta.trim());
    } catch (emailErr) {
      console.warn("[reclamacionController] Aviso: no se pudo enviar email de respuesta:", emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Reclamo respondido y notificación enviada exitosamente.",
      data: reclamoActualizado,
    });
  } catch (err) {
    console.error("[reclamacionController] Error respondiendo reclamo:", err.message);
    return res.status(500).json({ success: false, error: "Error interno al responder el reclamo." });
  }
};
