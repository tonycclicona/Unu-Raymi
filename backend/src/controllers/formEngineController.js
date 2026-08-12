import prisma from '../lib/prismaClient.js';
import { evaluatePassengerHealth } from '../services/riskEvaluator.service.js';

/**
 * Obtener la plantilla activa del formulario y sus preguntas para el Checkout/Frontend
 */
export async function getActiveFormSchema(req, res) {
  try {
    const form = await prisma.dynamicForm.findFirst({
      where: { activo: true },
      include: {
        preguntas: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (!form) {
      return res.status(404).json({ error: 'No hay un formulario activo configurado.' });
    }

    // Parsear campos JSON en preguntas
    const preguntasFormatted = form.preguntas.map((q) => ({
      ...q,
      opciones: q.opciones ? JSON.parse(q.opciones) : [],
      condicionMostrar: q.condicionMostrar ? JSON.parse(q.condicionMostrar) : null,
    }));

    return res.json({
      formId: form.id,
      titulo: form.titulo,
      descripcion: form.descripcion,
      version: form.version,
      preguntas: preguntasFormatted,
    });
  } catch (error) {
    console.error('Error al obtener formulario activo:', error);
    return res.status(500).json({ error: 'Error al cargar la plantilla del formulario.' });
  }
}

/**
 * Procesar y guardar la evaluación médica de uno o múltiples pasajeros de una reserva
 */
export async function submitPassengerEvaluations(req, res) {
  try {
    const { reservaId, evaluaciones, tourContext } = req.body;

    if (!Array.isArray(evaluaciones) || evaluaciones.length === 0) {
      return res.status(400).json({ error: 'Debe enviar al menos una evaluación de pasajero.' });
    }

    // Cargar el formulario activo y las reglas de riesgo
    const form = await prisma.dynamicForm.findFirst({ where: { activo: true } });
    const riskRules = await prisma.riskRule.findMany({ where: { activo: true } });

    const resultadosEvaluaciones = [];

    for (const evalData of evaluaciones) {
      const { pasajeroId, documentoIdentidad, nombre, apellido, email, respuestas, consentimientoFirmado } = evalData;

      // Evaluador de motor de riesgo
      const resultado = evaluatePassengerHealth(respuestas || {}, riskRules, tourContext || {});

      // Buscar o crear PasajeroProfile por documento de identidad (si fue provisto)
      let profileId = null;
      if (documentoIdentidad) {
        const profile = await prisma.pasajeroProfile.upsert({
          where: { documentoIdentidad },
          update: {
            nombre: nombre || 'Pasajero',
            apellido: apellido || '',
            email: email || '',
            altitudResidencia: respuestas.ALT_RESIDENCIA_NUM ? Number(respuestas.ALT_RESIDENCIA_NUM) : undefined,
          },
          create: {
            documentoIdentidad,
            nombre: nombre || 'Pasajero',
            apellido: apellido || '',
            email: email || '',
            altitudResidencia: respuestas.ALT_RESIDENCIA_NUM ? Number(respuestas.ALT_RESIDENCIA_NUM) : null,
          },
        });
        profileId = profile.id;
      }

      // Guardar Evaluación
      const savedEval = await prisma.passengerEvaluation.create({
        data: {
          reservaId: reservaId ? Number(reservaId) : null,
          pasajeroId: pasajeroId ? Number(pasajeroId) : null,
          profileId,
          formId: form ? form.id : 1,
          respuestasJSON: JSON.stringify(respuestas || {}),
          scoreRiesgoTotal: resultado.scoreTotal,
          dictamenCalculado: resultado.dictamenCalculado,
          dictamenFinal: resultado.dictamenCalculado,
          alertasGeneradas: JSON.stringify(resultado.alertasGeneradas),
          consentimientoFirmado: Boolean(consentimientoFirmado),
          ipOrigen: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
          fechaFirma: consentimientoFirmado ? new Date() : null,
        },
      });

      resultadosEvaluaciones.push({
        id: savedEval.id,
        nombre: `${nombre} ${apellido}`,
        dictamen: resultado.dictamenCalculado,
        scoreRiesgo: resultado.scoreTotal,
        alertas: resultado.alertasGeneradas,
        tags: resultado.tagsRespuesta,
      });
    }

    // Calcular dictamen global consolidado
    const requiereRevision = resultadosEvaluaciones.some((e) => e.dictamen === 'REQUIERE_REVISION_MANUAL');
    const requiereObservacion = resultadosEvaluaciones.some((e) => e.dictamen === 'OBSERVACION');
    const dictamenGlobal = requiereRevision ? 'REQUIERE_REVISION_MANUAL' : requiereObservacion ? 'OBSERVACION' : 'APTO';

    return res.status(201).json({
      mensaje: 'Evaluaciones procesadas correctamente.',
      dictamenGlobal,
      evaluaciones: resultadosEvaluaciones,
    });
  } catch (error) {
    console.error('Error al procesar evaluaciones:', error);
    return res.status(500).json({ error: 'Error interno al guardar evaluaciones médicas.' });
  }
}

// ─────────────────────────────────────────────
// ENDPOINTS PARA EL PANEL DE ADMINISTRACIÓN
// ─────────────────────────────────────────────

/**
 * Listar preguntas y su configuración (Admin)
 */
export async function getQuestionsAdmin(req, res) {
  try {
    const preguntas = await prisma.dynamicQuestion.findMany({
      orderBy: { orden: 'asc' },
    });

    const formatted = preguntas.map((q) => ({
      ...q,
      opciones: q.opciones ? JSON.parse(q.opciones) : [],
      condicionMostrar: q.condicionMostrar ? JSON.parse(q.condicionMostrar) : null,
    }));

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Error al listar preguntas.' });
  }
}

/**
 * Crear o editar una pregunta dinámicamente (Admin)
 */
export async function upsertQuestionAdmin(req, res) {
  try {
    const { id, codigo, seccion, preguntaText, tipoControl, opciones, orden, obligatorio, ayudaText, condicionMostrar } = req.body;

    const form = await prisma.dynamicForm.findFirst({ where: { activo: true } });
    if (!form) return res.status(400).json({ error: 'No existe un formulario activo.' });

    const payload = {
      formId: form.id,
      codigo,
      seccion,
      preguntaText,
      tipoControl,
      opciones: opciones ? JSON.stringify(opciones) : null,
      orden: Number(orden) || 0,
      obligatorio: Boolean(obligatorio),
      ayudaText,
      condicionMostrar: condicionMostrar ? JSON.stringify(condicionMostrar) : null,
    };

    let result;
    if (id) {
      result = await prisma.dynamicQuestion.update({
        where: { id: Number(id) },
        data: payload,
      });
    } else {
      result = await prisma.dynamicQuestion.create({
        data: payload,
      });
    }

    return res.json({ mensaje: 'Pregunta guardada correctamente', pregunta: result });
  } catch (error) {
    console.error('Error al guardar pregunta:', error);
    return res.status(500).json({ error: 'Error al guardar pregunta en el administrador.' });
  }
}

/**
 * Eliminar pregunta (Admin)
 */
export async function deleteQuestionAdmin(req, res) {
  try {
    const { id } = req.params;
    await prisma.dynamicQuestion.delete({ where: { id: Number(id) } });
    return res.json({ mensaje: 'Pregunta eliminada' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar pregunta' });
  }
}

/**
 * Listar reglas de riesgo (Admin)
 */
export async function getRiskRulesAdmin(req, res) {
  try {
    const rules = await prisma.riskRule.findMany({ orderBy: { createdAt: 'desc' } });
    const formatted = rules.map((r) => ({
      ...r,
      condicion: r.condicion ? JSON.parse(r.condicion) : {},
      tagsRespuesta: r.tagsRespuesta ? JSON.parse(r.tagsRespuesta) : [],
    }));
    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Error al listar reglas de riesgo.' });
  }
}

/**
 * Crear / Editar regla de riesgo (Admin)
 */
export async function upsertRiskRuleAdmin(req, res) {
  try {
    const { id, nombre, descripcion, ponderacion, condicion, dictamenResult, mensajeAlerta, tagsRespuesta, activo } = req.body;

    const payload = {
      nombre,
      descripcion,
      ponderacion: Number(ponderacion) || 0,
      condicion: typeof condicion === 'object' ? JSON.stringify(condicion) : condicion,
      dictamenResult,
      mensajeAlerta,
      tagsRespuesta: Array.isArray(tagsRespuesta) ? JSON.stringify(tagsRespuesta) : '[]',
      activo: Boolean(activo),
    };

    let result;
    if (id) {
      result = await prisma.riskRule.update({
        where: { id: Number(id) },
        data: payload,
      });
    } else {
      result = await prisma.riskRule.create({
        data: payload,
      });
    }

    return res.json({ mensaje: 'Regla de riesgo guardada', rule: result });
  } catch (error) {
    console.error('Error al guardar regla:', error);
    return res.status(500).json({ error: 'Error al guardar regla de riesgo.' });
  }
}

/**
 * Listar evaluaciones enviadas para revisión médica (Admin)
 */
export async function getEvaluationsAdmin(req, res) {
  try {
    const evaluaciones = await prisma.passengerEvaluation.findMany({
      include: {
        reserva: {
          select: {
            id: true,
            titularNombre: true,
            titularEmail: true,
            fechaViaje: true,
            tour: { select: { nombre: true, duracion_dias: true } },
          },
        },
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = evaluaciones.map((ev) => ({
      ...ev,
      respuestasJSON: ev.respuestasJSON ? JSON.parse(ev.respuestasJSON) : {},
      alertasGeneradas: ev.alertasGeneradas ? JSON.parse(ev.alertasGeneradas) : [],
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Error al listar evaluaciones:', error);
    return res.status(500).json({ error: 'Error al listar evaluaciones de pasajeros.' });
  }
}

/**
 * Actualizar dictamen final / observaciones médicas (Admin)
 */
export async function updateEvaluationDictamenAdmin(req, res) {
  try {
    const { id } = req.params;
    const { dictamenFinal, observacionesAdmin } = req.body;

    const updated = await prisma.passengerEvaluation.update({
      where: { id: Number(id) },
      data: {
        dictamenFinal,
        observacionesAdmin,
      },
    });

    return res.json({ mensaje: 'Dictamen médico actualizado', evaluacion: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar dictamen médico.' });
  }
}
