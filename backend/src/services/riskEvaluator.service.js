/**
 * Risk Engine Evaluator Service - Unuraymi Adventure & Trekking
 * Evalúa las respuestas del formulario adaptativo de salud y calcula el dictamen final del pasajero.
 */

export const DICTAMEN = {
  APTO: 'APTO',
  OBSERVACION: 'OBSERVACION',
  REQUIERE_REVISION_MANUAL: 'REQUIERE_REVISION_MANUAL',
};

/**
 * Procesa las respuestas de un pasajero contra las reglas activas y las características del tour.
 * 
 * @param {Object} respuestas Map { codigoPregunta: valor }
 * @param {Array} riskRules Lista de reglas cargadas desde Prisma (RiskRule)
 * @param {Object} tourContext Datos del tour (duracion_dias, categoria, altitud, etc.)
 * @returns {Object} { scoreTotal, dictamenCalculado, alertasGeneradas, tagsRespuesta }
 */
export function evaluatePassengerHealth(respuestas, riskRules = [], tourContext = {}) {
  let scoreTotal = 0;
  let dictamenCalculado = DICTAMEN.APTO;
  const alertasGeneradas = [];
  const tagsRespuesta = new Set();

  // 1. Evaluación de reglas dinámicas del administrador
  for (const rule of riskRules) {
    if (!rule.activo) continue;

    let ruleTriggered = false;
    try {
      const conditionObj = typeof rule.condicion === 'string' ? JSON.parse(rule.condicion) : rule.condicion;
      ruleTriggered = evaluateCondition(conditionObj, respuestas, tourContext);
    } catch (e) {
      console.error(`Error evaluando la regla ID ${rule.id}:`, e);
    }

    if (ruleTriggered) {
      scoreTotal += rule.ponderacion || 0;
      alertasGeneradas.push({
        ruleId: rule.id,
        nombre: rule.nombre,
        mensaje: rule.mensajeAlerta,
        ponderacion: rule.ponderacion,
        dictamenResult: rule.dictamenResult,
      });

      // Si la regla indica un dictamen crítico, elevar el dictamen
      if (rule.dictamenResult === DICTAMEN.REQUIERE_REVISION_MANUAL) {
        dictamenCalculado = DICTAMEN.REQUIERE_REVISION_MANUAL;
      } else if (rule.dictamenResult === DICTAMEN.OBSERVACION && dictamenCalculado !== DICTAMEN.REQUIERE_REVISION_MANUAL) {
        dictamenCalculado = DICTAMEN.OBSERVACION;
      }

      // Añadir tags
      try {
        const tags = typeof rule.tagsRespuesta === 'string' ? JSON.parse(rule.tagsRespuesta) : rule.tagsRespuesta;
        if (Array.isArray(tags)) {
          tags.forEach((t) => tagsRespuesta.add(t));
        }
      } catch (err) {
        // Ignore tag parse error
      }
    }
  }

  // 2. Umbrales de Score por defecto (si no se forzó revisión manual por regla crítica)
  if (dictamenCalculado !== DICTAMEN.REQUIERE_REVISION_MANUAL) {
    if (scoreTotal > 35) {
      dictamenCalculado = DICTAMEN.REQUIERE_REVISION_MANUAL;
    } else if (scoreTotal >= 15) {
      dictamenCalculado = DICTAMEN.OBSERVACION;
    }
  }

  return {
    scoreTotal,
    dictamenCalculado,
    alertasGeneradas,
    tagsRespuesta: Array.from(tagsRespuesta),
  };
}

/**
 * Evaluador recursivo de condiciones JSON para el motor de reglas
 */
function evaluateCondition(condition, respuestas, tourContext) {
  if (!condition || typeof condition !== 'object') return false;

  // Operadores Lógicos: AND, OR, NOT
  if (condition.AND && Array.isArray(condition.AND)) {
    return condition.AND.every((sub) => evaluateCondition(sub, respuestas, tourContext));
  }

  if (condition.OR && Array.isArray(condition.OR)) {
    return condition.OR.some((sub) => evaluateCondition(sub, respuestas, tourContext));
  }

  if (condition.NOT) {
    return !evaluateCondition(condition.NOT, respuestas, tourContext);
  }

  // Evaluación de Atributo Individual
  const { field, op, val } = condition;
  if (!field) return false;

  // Obtener valor (puede venir de las respuestas o del contexto del tour)
  let actualVal = respuestas[field];
  if (actualVal === undefined && tourContext[field] !== undefined) {
    actualVal = tourContext[field];
  }

  if (actualVal === undefined || actualVal === null) return false;

  switch (op) {
    case '=':
    case '==':
    case 'EQUALS':
      return String(actualVal).toLowerCase() === String(val).toLowerCase();

    case '!=':
    case 'NOT_EQUALS':
      return String(actualVal).toLowerCase() !== String(val).toLowerCase();

    case '>':
      return Number(actualVal) > Number(val);

    case '>=':
      return Number(actualVal) >= Number(val);

    case '<':
      return Number(actualVal) < Number(val);

    case '<=':
      return Number(actualVal) <= Number(val);

    case 'IN':
      if (Array.isArray(val)) {
        return val.map((v) => String(v).toLowerCase()).includes(String(actualVal).toLowerCase());
      }
      return false;

    case 'CONTAINS':
      if (Array.isArray(actualVal)) {
        return actualVal.some((item) => String(item).toLowerCase() === String(val).toLowerCase());
      }
      return String(actualVal).toLowerCase().includes(String(val).toLowerCase());

    default:
      return false;
  }
}
