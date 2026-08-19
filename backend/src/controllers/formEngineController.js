import prisma from '../lib/prismaClient.js';
import { evaluatePassengerHealth } from '../services/riskEvaluator.service.js';

const DEFAULT_FALLBACK_SCHEMA = {
  formId: 'default-health-form',
  titulo: 'Evaluación Médica y Aptitud Física Unuraymi',
  descripcion: 'Formulario de seguridad y condición física antes de abordar tours de montaña y expediciones.',
  version: 1,
  preguntas: [
    {
      id: 'q-1',
      codigo: 'ALT_RESIDENCIA',
      seccion: 'DATOS_BASICOS',
      preguntaText: '¿A qué altitud se encuentra mi ciudad de residencia habitual?',
      tipoControl: 'SELECT',
      orden: 1,
      obligatorio: true,
      ayudaText: 'Nos ayuda a calcular si necesitaré días de aclimatación en montaña.',
      opciones: [
        { label: 'Nivel del mar / 0 a 500 msnm (Ej: Lima, Costa o ciudades costeras)', value: 'COSTAL_0_500', score: 10, tags: ['RESIDENCIA_COSTAL'] },
        { label: 'Valles y altura media / 500 a 2,000 msnm (Ej: Arequipa, valles interandinos)', value: 'MEDIA_500_2000', score: 5, tags: ['RESIDENCIA_MEDIA'] },
        { label: 'Alta montaña / Más de 2,000 msnm (Ej: Cusco, Huaraz, Puno o similares)', value: 'ALTA_ABOVE_2000', score: 0, tags: ['RESIDENCIA_ALTA'] }
      ],
      condicionMostrar: null
    },
    {
      id: 'q-2',
      codigo: 'EXP_TREKKING',
      seccion: 'EXPERIENCIA',
      preguntaText: '¿Cuál es mi experiencia previa en caminatas o trekkings de montaña?',
      tipoControl: 'SELECT',
      orden: 2,
      obligatorio: true,
      ayudaText: 'Selecciona la opción que mejor refleje tus rutas anteriores.',
      opciones: [
        { label: 'Principiante / Nivel Bajo (Sin experiencia previa o caminatas cortas)', value: 'PRINCIPIANTE', score: 15, tags: ['PRINCIPIANTE'] },
        { label: 'Moderado / Nivel Medio (Senderos con desniveles moderados y terreno irregular)', value: 'MODERADO', score: 5, tags: ['EXP_MODERADA'] },
        { label: 'Avanzado / Nivel Alto (Treks de varios días en altura > 3,500m)', value: 'AVANZADO', score: 0, tags: ['EXP_AVANZADA'] },
        { label: 'Experto / Alta Montaña (Nevados y terreno técnico)', value: 'EXPERTO', score: 0, tags: ['EXP_EXPERTO'] }
      ],
      condicionMostrar: null
    },
    {
      id: 'q-3',
      codigo: 'HISTORIAL_SOROCHE',
      seccion: 'SALUD_ALTITUD',
      preguntaText: '¿He tenido anteriormente antecedentes de Mal de Altura (Soroche)?',
      tipoControl: 'RADIO',
      orden: 3,
      obligatorio: true,
      ayudaText: 'Indícanos si has sentido molestias por la altura en viajes anteriores.',
      opciones: [
        { label: 'No he tenido síntomas, o solo un leve dolor de cabeza pasajero', value: 'NO_LEVE', score: 0, tags: [] },
        { label: 'Sí, he sentido síntomas moderados (mareo persistente o necesidad de medicación)', value: 'MODERADO', score: 15, tags: ['RIESGO_SOROCHE'] },
        { label: 'Sí, he tenido soroche severo (requerí atención médica u oxigenoterapia)', value: 'SEVERO', score: 35, tags: ['SOROCHE_SEVERO'] }
      ],
      condicionMostrar: null
    },
    {
      id: 'q-4',
      codigo: 'CONDICIONES_MEDICAS',
      seccion: 'SALUD_GENERAL',
      preguntaText: '¿Padezco o tengo diagnóstico de alguna de las siguientes condiciones de salud?',
      tipoControl: 'CHECKBOX',
      orden: 4,
      obligatorio: false,
      ayudaText: 'Tu información es totalmente confidencial para cuidar tu seguridad durante la ruta.',
      opciones: [
        { label: 'Hipertensión / Presión arterial alta', value: 'HIPERTENSION', score: 10, tags: ['PRESC_CARDIO'] },
        { label: 'Asma o alguna condición respiratoria', value: 'ASMA', score: 10, tags: ['PRESC_RESPIRATORIA'] },
        { label: 'Diabetes o control de glucosa', value: 'DIABETES', score: 5, tags: ['PRESC_METABOLICA'] },
        { label: 'Lesiones o dolores recientes en rodillas, tobillos o espalda', value: 'LESION_ARTICULAR', score: 15, tags: ['PRESC_MOTRIZ'] },
        { label: 'Condiciones cardíacas o arritmias', value: 'CARDIACO', score: 30, tags: ['RIESGO_CARDIACO_ALTO'] },
        { label: 'Cirugía mayor realizada en los últimos 6 meses', value: 'CIRUGIA_RECIENTE', score: 40, tags: ['RIESGO_CIRUGIA'] }
      ],
      condicionMostrar: null
    },
    {
      id: 'q-5',
      codigo: 'NIVEL_FISICO',
      seccion: 'APTITUD_FISICA',
      preguntaText: '¿Cómo considero mi condición física actual para la caminata?',
      tipoControl: 'SELECT',
      orden: 5,
      obligatorio: true,
      ayudaText: 'Basado en mi actividad o ejercicio semanal.',
      opciones: [
        { label: 'Sedentario (Realizo poco o ningún ejercicio físico semanal)', value: 'SEDENTARIO', score: 20, tags: ['FISICO_BAJO'] },
        { label: 'Moderado (Practico ejercicio o deportes 1 a 2 veces por semana)', value: 'MODERADO', score: 5, tags: ['FISICO_MEDIO'] },
        { label: 'Activo (Entreno o hago ejercicio regularmente 3 a 5 veces por semana)', value: 'ACTIVO', score: 0, tags: ['FISICO_ALTO'] },
        { label: 'Atleta / Alta Resistencia (Entrenamiento continuo de alta intensidad)', value: 'ATLETA', score: 0, tags: ['FISICO_ALTO'] }
      ],
      condicionMostrar: null
    },
    {
      id: 'q-6',
      codigo: 'CONSENTIMIENTO_DECLARACION',
      seccion: 'DECLARACION',
      preguntaText: 'Declaro en primera persona que mi información de salud brindada es correcta y acepto las pautas de seguridad para el tour.',
      tipoControl: 'CHECKBOX',
      orden: 6,
      obligatorio: true,
      ayudaText: 'Requerido para la confirmación de tu experiencia de aventura.'
    }
  ]
};

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

    if (!form || !form.preguntas || form.preguntas.length === 0) {
      return res.json(DEFAULT_FALLBACK_SCHEMA);
    }

    // Parsear campos JSON en preguntas
    const preguntasFormatted = form.preguntas.map((q) => ({
      ...q,
      opciones: q.opciones ? (typeof q.opciones === 'string' ? JSON.parse(q.opciones) : q.opciones) : [],
      condicionMostrar: q.condicionMostrar ? (typeof q.condicionMostrar === 'string' ? JSON.parse(q.condicionMostrar) : q.condicionMostrar) : null,
    }));

    return res.json({
      formId: form.id,
      titulo: form.titulo,
      descripcion: form.descripcion,
      version: form.version,
      preguntas: preguntasFormatted,
    });
  } catch (error) {
    console.error('Error al obtener formulario activo, entregando esquema por defecto:', error.message);
    return res.json(DEFAULT_FALLBACK_SCHEMA);
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

const safeJsonParse = (str, fallback = null) => {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

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
      opciones: safeJsonParse(q.opciones, []),
      condicionMostrar: safeJsonParse(q.condicionMostrar, null),
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Error al listar preguntas:', error.message);
    return res.status(500).json({ error: 'Error al listar preguntas.' });
  }
}

/**
 * Crear o editar una pregunta dinámicamente (Admin)
 */
export async function upsertQuestionAdmin(req, res) {
  try {
    const { id, codigo, seccion, preguntaText, tipoControl, opciones, orden, obligatorio, ayudaText, condicionMostrar } = req.body;

    let form = await prisma.dynamicForm.findFirst({ where: { activo: true } });
    if (!form) {
      form = await prisma.dynamicForm.create({
        data: {
          titulo: 'Evaluación Médica y Aptitud Física Unuraymi',
          descripcion: 'Formulario obligatorio de seguridad y condición física antes de abordar tours de montaña y expediciones.',
          activo: true,
          version: 1,
        },
      });
    }

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
      condicion: safeJsonParse(r.condicion, {}),
      tagsRespuesta: safeJsonParse(r.tagsRespuesta, []),
    }));
    return res.json(formatted);
  } catch (error) {
    console.error('Error al listar reglas de riesgo:', error.message);
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
      tagsRespuesta: Array.isArray(tagsRespuesta) ? JSON.stringify(tagsRespuesta) : (typeof tagsRespuesta === 'string' ? tagsRespuesta : '[]'),
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
      respuestasJSON: safeJsonParse(ev.respuestasJSON, {}),
      alertasGeneradas: safeJsonParse(ev.alertasGeneradas, []),
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Error al listar evaluaciones:', error.message);
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
