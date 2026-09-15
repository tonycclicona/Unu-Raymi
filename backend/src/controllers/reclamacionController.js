// ============================================================
// reclamacionController.js — Libro de Reclamaciones
// Endpoints para crear, listar y responder reclamos.
// ============================================================

import prisma from '../lib/prismaClient.js';
import { enviarEmailAcuseReclamacion, enviarEmailRespuestaReclamo } from '../services/emailService.js';

/**
 * POST /api/reclamaciones
 * Crea un nuevo reclamo (público, sin autenticación).
 */
export const crearReclamo = async (req, res) => {
  try {
    const {
      nombre, apellido, email, telefono,
      tipo_reclamo, fecha_ocurrencia,
      descripcion, pedido,
    } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !email || !tipo_reclamo || !fecha_ocurrencia || !descripcion || !pedido) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben completarse.' });
    }

    if (!['QUEJA', 'RECLAMO', 'CONSULTA'].includes(tipo_reclamo)) {
      return res.status(400).json({ error: 'Tipo de reclamo inválido.' });
    }

    const reclamo = await prisma.$queryRawUnsafe(`
      INSERT INTO \`reclamaciones\`
        (nombre, apellido, email, telefono, tipo_reclamo, fecha_ocurrencia, descripcion, pedido, estado, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', NOW())
    `, nombre, apellido, email, telefono || null, tipo_reclamo, new Date(fecha_ocurrencia), descripcion, pedido);

    const newId = reclamo?.insertId || null;

    // Enviar email de acuse al reclamante (no bloquear si falla)
    try {
      await enviarEmailAcuseReclamacion({ id: newId, nombre, email, tipo_reclamo });
    } catch (emailErr) {
      console.warn('[reclamacionController] Error enviando email de acuse:', emailErr.message);
    }

    return res.status(201).json({ id: newId, message: 'Reclamo registrado exitosamente.' });
  } catch (err) {
    console.error('[reclamacionController] Error creando reclamo:', err.message);
    return res.status(500).json({ error: 'Error interno al registrar el reclamo.' });
  }
};

/**
 * GET /api/reclamaciones
 * Lista todos los reclamos (protegido - solo admin).
 */
export const listarReclamos = async (req, res) => {
  try {
    const { estado, tipo } = req.query;

    let query = 'SELECT * FROM `reclamaciones`';
    const conditions = [];
    const params = [];

    if (estado && ['PENDIENTE', 'RESPONDIDO'].includes(estado)) {
      conditions.push('estado = ?');
      params.push(estado);
    }
    if (tipo && ['QUEJA', 'RECLAMO', 'CONSULTA'].includes(tipo)) {
      conditions.push('tipo_reclamo = ?');
      params.push(tipo);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const reclamos = await prisma.$queryRawUnsafe(query, ...params);
    return res.json({ data: reclamos });
  } catch (err) {
    console.error('[reclamacionController] Error listando reclamos:', err.message);
    return res.status(500).json({ error: 'Error interno al obtener reclamos.' });
  }
};

/**
 * GET /api/reclamaciones/:id
 * Obtiene detalle de un reclamo (protegido - solo admin).
 */
export const obtenerReclamo = async (req, res) => {
  try {
    const { id } = req.params;
    const [reclamo] = await prisma.$queryRawUnsafe(
      'SELECT * FROM `reclamaciones` WHERE id = ?',
      parseInt(id)
    );
    if (!reclamo) return res.status(404).json({ error: 'Reclamo no encontrado.' });
    return res.json(reclamo);
  } catch (err) {
    console.error('[reclamacionController] Error obteniendo reclamo:', err.message);
    return res.status(500).json({ error: 'Error interno.' });
  }
};

/**
 * POST /api/reclamaciones/:id/responder
 * Responde a un reclamo y envía email al reclamante (protegido - solo admin).
 */
export const responderReclamo = async (req, res) => {
  try {
    const { id } = req.params;
    const { respuesta } = req.body;

    if (!respuesta || respuesta.trim().length < 10) {
      return res.status(400).json({ error: 'La respuesta debe tener al menos 10 caracteres.' });
    }

    await prisma.$executeRawUnsafe(
      `UPDATE \`reclamaciones\` SET estado = 'RESPONDIDO', respuesta_admin = ?, fecha_respuesta = NOW() WHERE id = ?`,
      respuesta, parseInt(id)
    );

    // Obtener datos del reclamo para el email
    const [reclamo] = await prisma.$queryRawUnsafe(
      'SELECT * FROM `reclamaciones` WHERE id = ?',
      parseInt(id)
    );

    if (reclamo) {
      try {
        await enviarEmailRespuestaReclamo(reclamo, respuesta);
      } catch (emailErr) {
        console.warn('[reclamacionController] Error enviando email de respuesta:', emailErr.message);
      }
    }

    return res.json({ message: 'Reclamo respondido y email enviado.' });
  } catch (err) {
    console.error('[reclamacionController] Error respondiendo reclamo:', err.message);
    return res.status(500).json({ error: 'Error interno al responder el reclamo.' });
  }
};
