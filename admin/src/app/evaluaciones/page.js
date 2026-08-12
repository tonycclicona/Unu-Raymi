'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, FileText, Settings, Plus, Trash2, Edit3, UserCheck, RefreshCw, X, Save, CheckSquare, Square, Compass, Mountain, HeartPulse, Stethoscope, Utensils, Activity, ArrowUp, ArrowDown, ChevronRight, Layers } from 'lucide-react';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '') + '/api';

// CATÁLOGO TAXONÓMICO PREDETERMINADO DE PREGUNTAS MÉRICO-TÉCNICAS UNURAYMI
const TAXONOMY_CATALOG = [
  {
    categoriaId: 'DATOS_BASICOS',
    categoriaNombre: 'Altitud y Origen Habitual',
    icono: Compass,
    descripcion: 'Evaluación de procedencia y aclimatación previa al inicio del tour.',
    preguntas: [
      {
        codigo: 'ALT_RESIDENCIA',
        preguntaText: '¿A qué altitud se encuentra la ciudad donde reside habitualmente?',
        tipoControl: 'SELECT',
        orden: 1,
        obligatorio: true,
        ayudaText: 'Requerido para estimar la necesidad de días de aclimatación.',
        opciones: [
          { label: 'Nivel del mar / 0 - 500 msnm (Costa, Lima, etc.)', value: 'COSTAL_0_500', score: 10, tags: ['RESIDENCIA_COSTAL'] },
          { label: 'Valles / 500 - 2,000 msnm (Arequipa media, etc.)', value: 'MEDIA_500_2000', score: 5, tags: ['RESIDENCIA_MEDIA'] },
          { label: 'Alta montaña / > 2,000 msnm (Cusco, Huaraz, Puno)', value: 'ALTA_ABOVE_2000', score: 0, tags: ['RESIDENCIA_ALTA'] },
        ],
      },
      {
        codigo: 'DIAS_ACLIMATACION',
        preguntaText: '¿Cuántos días de aclimatación previa tendrá en Cusco antes de la caminata?',
        tipoControl: 'SELECT',
        orden: 2,
        obligatorio: true,
        ayudaText: 'Recomendado un mínimo de 48 horas en altitud > 3300m.',
        opciones: [
          { label: 'Llego el mismo día / Menos de 24 horas', value: 'LESS_24H', score: 15, tags: ['SIN_ACLIMATACION'] },
          { label: '1 a 2 días de aclimatación', value: '1_2_DAYS', score: 5, tags: ['ACLIMATACION_PARCIAL'] },
          { label: '3 o más días de aclimatación previo', value: 'MORE_3_DAYS', score: 0, tags: ['ACLIMATADO'] },
        ],
      },
    ],
  },
  {
    categoriaId: 'EXPERIENCIA',
    categoriaNombre: 'Experiencia Técnica y Montaña',
    icono: Mountain,
    descripcion: 'Nivel de expediciones previas y uso de equipo de progresión.',
    preguntas: [
      {
        codigo: 'EXP_TREKKING',
        preguntaText: '¿Cuál es su experiencia previa en caminatas o trekkings de montaña?',
        tipoControl: 'SELECT',
        orden: 3,
        obligatorio: true,
        ayudaText: 'Seleccione su máximo nivel alcanzado.',
        opciones: [
          { label: 'Sin experiencia previa / Principiante', value: 'PRINCIPIANTE', score: 15, tags: ['PRINCIPIANTE'] },
          { label: 'Caminatas ocasionales de 1 día (Dificultad moderada)', value: 'MODERADO', score: 5, tags: ['EXP_MODERADA'] },
          { label: 'Trek de varios días en altura > 3,500m (Salkantay, Camino Inca)', value: 'AVANZADO', score: 0, tags: ['EXP_AVANZADA'] },
          { label: 'Alta montaña / Expediciones en nevados con crampones', value: 'EXPERTO', score: 0, tags: ['EXP_EXPERTO'] },
        ],
      },
      {
        codigo: 'USO_CRAMPONES',
        preguntaText: '¿Tiene experiencia previa en uso de crampones, piolet y arnés en glaciar/nevados?',
        tipoControl: 'RADIO',
        orden: 4,
        obligatorio: false,
        ayudaText: 'Requerido solo para expediciones nevadas de alta dificultad.',
        opciones: [
          { label: 'No, sería mi primera experiencia en glaciar', value: 'NO_EXP', score: 10, tags: ['REQUIERE_TALLER_TECNICO'] },
          { label: 'Sí, he realizado ascensiones o talleres de alta montaña previos', value: 'SI_EXP', score: 0, tags: ['TECNICO_AUTONOMO'] },
        ],
      },
    ],
  },
  {
    categoriaId: 'SALUD_ALTITUD',
    categoriaNombre: 'Historial de Soroche y Altitud',
    icono: HeartPulse,
    descripcion: 'Antecedentes de mal de altura y uso de medicamentos profilácticos.',
    preguntas: [
      {
        codigo: 'HISTORIAL_SOROCHE',
        preguntaText: '¿Ha tenido anteriormente antecedentes severos de Mal de Altura (Soroche)?',
        tipoControl: 'RADIO',
        orden: 5,
        obligatorio: true,
        ayudaText: 'Síntomas como vómitos continuos, mareo incapacitante o desmayos en altura.',
        opciones: [
          { label: 'No, o muy leve (dolor de cabeza leve)', value: 'NO_LEVE', score: 0, tags: [] },
          { label: 'Sí, síntomas moderados (requirió oxígeno o medicación)', value: 'MODERADO', score: 15, tags: ['RIESGO_SOROCHE'] },
          { label: 'Sí, severo (requirió evacuación o atención hospitalaria)', value: 'SEVERO', score: 35, tags: ['SOROCHE_SEVERO'] },
        ],
      },
    ],
  },
  {
    categoriaId: 'SALUD_GENERAL',
    categoriaNombre: 'Condiciones Médicas y Cirugías',
    icono: Stethoscope,
    descripcion: 'Prescripciones de salud, afecciones cardiorrespiratorias y cirugías.',
    preguntas: [
      {
        codigo: 'CONDICIONES_MEDICAS',
        preguntaText: 'Marque si padece o ha sido diagnosticado con alguna de las siguientes condiciones:',
        tipoControl: 'CHECKBOX',
        orden: 6,
        obligatorio: false,
        ayudaText: 'Información confidencial para uso de los guías de auxilio.',
        opciones: [
          { label: 'Hipertensión / Presión arterial alta', value: 'HIPERTENSION', score: 10, tags: ['PRESC_CARDIO'] },
          { label: 'Asma o enfermedad respiratoria', value: 'ASMA', score: 10, tags: ['PRESC_RESPIRATORIA'] },
          { label: 'Diabetes', value: 'DIABETES', score: 5, tags: ['PRESC_METABOLICA'] },
          { label: 'Lesiones recientes en rodillas, tobillos o columna', value: 'LESION_ARTICULAR', score: 15, tags: ['PRESC_MOTRIZ'] },
          { label: 'Problemas cardíacos o arritmias', value: 'CARDIACO', score: 30, tags: ['RIESGO_CARDIACO_ALTO'] },
          { label: 'Cirugía mayor en los últimos 6 meses', value: 'CIRUGIA_RECIENTE', score: 40, tags: ['RIESGO_CIRUGIA'] },
        ],
      },
    ],
  },
  {
    categoriaId: 'ALIMENTACION',
    categoriaNombre: 'Restricciones Alimentarias y Alergias',
    icono: Utensils,
    descripcion: 'Dietas especiales, alergias a alimentos o fármacos.',
    preguntas: [
      {
        codigo: 'ALERGIAS_DIETA',
        preguntaText: '¿Posee alergias graves, intolerancias o restricciones alimentarias?',
        tipoControl: 'TEXT',
        orden: 7,
        obligatorio: false,
        ayudaText: 'Ej: Alergia a la penicilina, frutos secos, dieta vegetariana/vegana, celíaco.',
      },
    ],
  },
  {
    categoriaId: 'APTITUD_FISICA',
    categoriaNombre: 'Nivel Físico y Declaración',
    icono: Activity,
    descripcion: 'Condición aeróbica y aceptación de términos de responsabilidad.',
    preguntas: [
      {
        codigo: 'NIVEL_FISICO',
        preguntaText: '¿Cómo evalúa su nivel de condición física actual?',
        tipoControl: 'SELECT',
        orden: 8,
        obligatorio: true,
        ayudaText: 'Frecuencia de ejercicio cardiovascular semanal.',
        opciones: [
          { label: 'Sedentario (Poco o ningún ejercicio)', value: 'SEDENTARIO', score: 20, tags: ['FISICO_BAJO'] },
          { label: 'Moderado (Ejercicio 1 a 2 veces por semana)', value: 'MODERADO', score: 5, tags: ['FISICO_MEDIO'] },
          { label: 'Activo (Ejercicio 3 a 5 veces por semana)', value: 'ACTIVO', score: 0, tags: ['FISICO_ALTO'] },
          { label: 'Atleta de alta resistencia', value: 'ATLETA', score: 0, tags: ['FISICO_ALTO'] },
        ],
      },
      {
        codigo: 'CONSENTIMIENTO_DECLARACION',
        preguntaText: 'Declaro bajo juramento que los datos de salud ingresados son verídicos y acepto los términos de responsabilidad de alta montaña.',
        tipoControl: 'CHECKBOX',
        orden: 9,
        obligatorio: true,
        ayudaText: 'Requerido para la emisión del pase de abordar del tour.',
      },
    ],
  },
];

export default function EvaluationsAdminPage() {
  const [activeTab, setActiveTab] = useState('preguntas'); // 'evaluaciones' | 'preguntas' | 'reglas'
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para modal de evaluación
  const [selectedEval, setSelectedEval] = useState(null);
  const [dictamenOverride, setDictamenOverride] = useState('');
  const [observacionNotes, setObservacionNotes] = useState('');

  // Estado VISUAL para el modal de edición de pregunta (SIN CÓDIGO NI JSON MANUAL)
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qFormData, setQFormData] = useState({
    id: null,
    codigo: '',
    seccion: 'SALUD_GENERAL',
    preguntaText: '',
    tipoControl: 'SELECT',
    ayudaText: '',
    orden: 1,
    obligatorio: true,
    opcionesList: [], // Array de objetos visuales: [{ label: '', value: '', score: 0, tag: '' }]
  });

  // Estado VISUAL para el modal de regla (SIN CÓDIGO NI JSON MANUAL)
  const [editingRule, setEditingRule] = useState(null);
  const [rFormData, setRFormData] = useState({
    id: null,
    nombre: '',
    descripcion: '',
    ponderacion: 10,
    dictamenResult: 'OBSERVACION',
    mensajeAlerta: '',
    condicionField: 'HISTORIAL_SOROCHE',
    condicionOp: '=',
    condicionVal: 'MODERADO',
    activo: true,
  });

  // 1. Cargar datos desde la API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resEval, resPreg, resReglas] = await Promise.all([
        fetch(`${API_BASE_URL}/form-engine/admin/evaluaciones`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/form-engine/admin/questions`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/form-engine/admin/rules`).then((r) => r.json()),
      ]);

      setEvaluaciones(Array.isArray(resEval) ? resEval : []);
      setPreguntas(Array.isArray(resPreg) ? resPreg : []);
      setReglas(Array.isArray(resReglas) ? resReglas : []);
    } catch (err) {
      console.error('Error cargando datos del administrador:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Comprobar si una pregunta del catálogo taxonómico está activa en BD
  const isQuestionActive = (codigo) => {
    return preguntas.some((q) => q.codigo === codigo);
  };

  // Alternar (Toggle) pregunta del Plan Taxonómico en la BD
  const handleToggleTaxonomyQuestion = async (presetQuestion, seccionId) => {
    const existing = preguntas.find((q) => q.codigo === presetQuestion.codigo);

    if (existing) {
      if (confirm(`¿Deseas quitar la pregunta "${presetQuestion.preguntaText}" del formulario activo?`)) {
        await fetch(`${API_BASE_URL}/form-engine/admin/questions/${existing.id}`, { method: 'DELETE' });
        fetchData();
      }
    } else {
      const payload = {
        codigo: presetQuestion.codigo,
        seccion: seccionId,
        preguntaText: presetQuestion.preguntaText,
        tipoControl: presetQuestion.tipoControl,
        ayudaText: presetQuestion.ayudaText || '',
        orden: presetQuestion.orden || preguntas.length + 1,
        obligatorio: presetQuestion.obligatorio !== false,
        opciones: presetQuestion.opciones || null,
      };

      const res = await fetch(`${API_BASE_URL}/form-engine/admin/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) fetchData();
    }
  };

  // Abrir modal visual para crear / editar pregunta (100% Sin Código)
  const handleOpenQuestionModal = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      let parsedOpciones = [];
      if (Array.isArray(question.opciones)) {
        parsedOpciones = question.opciones.map((op) => ({
          label: op.label || '',
          value: op.value || op.label || '',
          score: op.score !== undefined ? op.score : 0,
          tag: op.tags && op.tags[0] ? op.tags[0] : '',
        }));
      }

      setQFormData({
        id: question.id,
        codigo: question.codigo,
        seccion: question.seccion || 'SALUD_GENERAL',
        preguntaText: question.preguntaText || '',
        tipoControl: question.tipoControl || 'SELECT',
        ayudaText: question.ayudaText || '',
        orden: question.orden || 1,
        obligatorio: question.obligatorio !== false,
        opcionesList: parsedOpciones,
      });
    } else {
      setEditingQuestion('NEW');
      setQFormData({
        id: null,
        codigo: `PREGUNTA_${Date.now().toString().slice(-4)}`,
        seccion: 'SALUD_GENERAL',
        preguntaText: '',
        tipoControl: 'SELECT',
        ayudaText: '',
        orden: preguntas.length + 1,
        obligatorio: true,
        opcionesList: [
          { label: 'Sin antecedentes / Normal', value: 'NO', score: 0, tag: '' },
          { label: 'Sí, síntomas moderados', value: 'SI_MODERADO', score: 10, tag: 'ALERTA_SALUD' },
        ],
      });
    }
  };

  // Manejadores visuales de opciones
  const handleAddOptionItem = () => {
    setQFormData((prev) => ({
      ...prev,
      opcionesList: [
        ...prev.opcionesList,
        { label: '', value: '', score: 0, tag: '' },
      ],
    }));
  };

  const handleUpdateOptionItem = (index, field, value) => {
    setQFormData((prev) => {
      const copy = [...prev.opcionesList];
      copy[index] = { ...copy[index], [field]: value };
      // Auto-generar valor slug si se cambia label y el value está vacío
      if (field === 'label' && !copy[index].value) {
        copy[index].value = value.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
      }
      return { ...prev, opcionesList: copy };
    });
  };

  const handleRemoveOptionItem = (index) => {
    setQFormData((prev) => ({
      ...prev,
      opcionesList: prev.opcionesList.filter((_, idx) => idx !== index),
    }));
  };

  // Guardar pregunta en Backend (Convierte el formulario visual a JSON transparente para el servidor)
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      let opcionesFormatted = null;
      if (['SELECT', 'RADIO', 'CHECKBOX'].includes(qFormData.tipoControl)) {
        opcionesFormatted = qFormData.opcionesList.map((op, idx) => ({
          label: op.label.trim() || `Opción ${idx + 1}`,
          value: op.value.trim() || (op.label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_')) || `OPC_${idx + 1}`,
          score: Number(op.score) || 0,
          tags: op.tag.trim() ? [op.tag.trim()] : [],
        }));
      }

      const payload = {
        id: qFormData.id,
        codigo: qFormData.codigo,
        seccion: qFormData.seccion,
        preguntaText: qFormData.preguntaText,
        tipoControl: qFormData.tipoControl,
        ayudaText: qFormData.ayudaText,
        orden: Number(qFormData.orden) || 1,
        obligatorio: Boolean(qFormData.obligatorio),
        opciones: opcionesFormatted,
      };

      const res = await fetch(`${API_BASE_URL}/form-engine/admin/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingQuestion(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error guardando pregunta:', err);
    }
  };

  // Eliminar pregunta
  const handleDeleteQuestion = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta configurada?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/form-engine/admin/questions/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error eliminando pregunta:', err);
    }
  };

  // Abrir modal visual para crear / editar regla de riesgo (100% Sin Código)
  const handleOpenRuleModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      const cond = rule.condicion || {};
      setRFormData({
        id: rule.id,
        nombre: rule.nombre,
        descripcion: rule.descripcion || '',
        ponderacion: rule.ponderacion || 10,
        dictamenResult: rule.dictamenResult || 'OBSERVACION',
        mensajeAlerta: rule.mensajeAlerta || '',
        condicionField: cond.field || 'HISTORIAL_SOROCHE',
        condicionOp: cond.op || '=',
        condicionVal: cond.val || 'MODERADO',
        activo: rule.activo !== false,
      });
    } else {
      setEditingRule('NEW');
      setRFormData({
        id: null,
        nombre: 'Nueva Regla de Alerta Médica',
        descripcion: 'Asigna alerta de auxilio según la respuesta recibida',
        ponderacion: 15,
        dictamenResult: 'OBSERVACION',
        mensajeAlerta: 'Atención: Pasajero requiere atención especial.',
        condicionField: 'HISTORIAL_SOROCHE',
        condicionOp: '=',
        condicionVal: 'MODERADO',
        activo: true,
      });
    }
  };

  // Guardar regla de riesgo en Backend
  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      const condicionFormatted = {
        field: rFormData.condicionField,
        op: rFormData.condicionOp,
        val: rFormData.condicionVal,
      };

      const payload = {
        id: rFormData.id,
        nombre: rFormData.nombre,
        descripcion: rFormData.descripcion,
        ponderacion: Number(rFormData.ponderacion) || 0,
        dictamenResult: rFormData.dictamenResult,
        mensajeAlerta: rFormData.mensajeAlerta,
        condicion: condicionFormatted,
        tagsRespuesta: [rFormData.condicionVal],
        activo: Boolean(rFormData.activo),
      };

      const res = await fetch(`${API_BASE_URL}/form-engine/admin/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingRule(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error guardando regla:', err);
    }
  };

  // Actualizar dictamen médico desde modal de revisión
  const handleUpdateDictamen = async () => {
    if (!selectedEval) return;
    try {
      const res = await fetch(`${API_BASE_URL}/form-engine/admin/evaluaciones/${selectedEval.id}/dictamen`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dictamenFinal: dictamenOverride || selectedEval.dictamenFinal,
          observacionesAdmin: observacionNotes,
        }),
      });
      if (res.ok) {
        setSelectedEval(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error guardando dictamen:', err);
    }
  };

  const getDictamenBadge = (dictamen) => {
    switch (dictamen) {
      case 'APTO':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> Apto
          </span>
        );
      case 'OBSERVACION':
        return (
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3.5 h-3.5" /> Apto con Observación
          </span>
        );
      case 'REQUIERE_REVISION_MANUAL':
        return (
          <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" /> Requiere Revisión Médica
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{dictamen}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7" /> Gestor 100% Visual de Aptitud Médica & Requisitos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Administración intuitiva sin código. Modifica, activa o elimina preguntas de salud y reglas de riesgo en tiempo real.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-all flex items-center gap-1 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Recargar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('preguntas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'preguntas'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" /> Plan Taxonómico (Preguntas de Salud)
        </button>
        <button
          onClick={() => setActiveTab('evaluaciones')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'evaluaciones'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Fichas Médicas de Pasajeros ({evaluaciones.length})
        </button>
        <button
          onClick={() => setActiveTab('reglas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'reglas'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Matriz de Reglas de Alerta ({reglas.length})
        </button>
      </div>

      {/* TAB 1: PLAN TAXONÓMICO DE PREGUNTAS (Visual & Sin Código) */}
      {activeTab === 'preguntas' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900/80 p-5 rounded-2xl border border-emerald-500/30 gap-4">
            <div>
              <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                <Compass className="w-5 h-5" /> Catálogo Taxonómico de Requisitos Médicos
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Haz clic en la casilla para activar o desactivar preguntas en el formulario de reserva de tus clientes.
              </p>
            </div>
            <button
              onClick={() => handleOpenQuestionModal(null)}
              className="px-4 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <Plus className="w-4 h-4" /> Crear Pregunta Personalizada
            </button>
          </div>

          {/* Categorías del Plan Taxonómico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TAXONOMY_CATALOG.map((cat) => {
              const IconComp = cat.icono;

              return (
                <div key={cat.categoriaId} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100">{cat.categoriaNombre}</h4>
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold rounded-full uppercase">
                            Guiado para Operaciones
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{cat.descripcion}</p>
                      </div>
                    </div>
                  </div>

                  {/* Preguntas de la Categoría */}
                  <div className="space-y-3">
                    {cat.preguntas.map((presetQ) => {
                      const activeInDb = isQuestionActive(presetQ.codigo);
                      const dbQuestion = preguntas.find((q) => q.codigo === presetQ.codigo);

                      return (
                        <div
                          key={presetQ.codigo}
                          className={`p-4 rounded-xl border transition-all ${
                            activeInDb
                              ? 'bg-emerald-950/30 border-emerald-500/50 text-slate-100 shadow-md shadow-emerald-500/5'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-3">
                              <button
                                type="button"
                                onClick={() => handleToggleTaxonomyQuestion(presetQ, cat.categoriaId)}
                                className="mt-0.5 text-emerald-400 hover:scale-110 transition-transform"
                              >
                                {activeInDb ? (
                                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-600" />
                                )}
                              </button>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded">
                                    {presetQ.codigo}
                                  </span>
                                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-semibold">
                                    {presetQ.tipoControl}
                                  </span>
                                </div>
                                <p className="text-xs font-bold mt-1 text-slate-200">{presetQ.preguntaText}</p>
                                {presetQ.ayudaText && <p className="text-[11px] text-slate-400">{presetQ.ayudaText}</p>}
                              </div>
                            </div>

                            {dbQuestion ? (
                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuestionModal(dbQuestion)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(dbQuestion.id)}
                                  className="p-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleTaxonomyQuestion(presetQ, cat.categoriaId)}
                                className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" /> Activar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FICHAS MÉDICAS DE PASAJEROS */}
      {activeTab === 'evaluaciones' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Pasajero / Titular</th>
                  <th className="p-4">Tour / Fecha</th>
                  <th className="p-4">Score Riesgo</th>
                  <th className="p-4">Dictamen Sistema</th>
                  <th className="p-4">Dictamen Final</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {evaluaciones.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">
                      No hay evaluaciones médicas registradas aún.
                    </td>
                  </tr>
                ) : (
                  evaluaciones.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-200">
                          {ev.profile ? `${ev.profile.nombre} ${ev.profile.apellido}` : `Evaluación #${ev.id}`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ev.profile?.documentoIdentidad ? `Doc: ${ev.profile.documentoIdentidad}` : ev.reserva?.titularEmail}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-300">{ev.reserva?.tour?.nombre || 'Reserva Directa'}</div>
                        <div className="text-[11px] text-slate-500">
                          {ev.reserva?.fechaViaje ? new Date(ev.reserva.fechaViaje).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`font-mono font-bold ${ev.scoreRiesgoTotal > 30 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {ev.scoreRiesgoTotal} pts
                        </span>
                      </td>
                      <td className="p-4">{getDictamenBadge(ev.dictamenCalculado)}</td>
                      <td className="p-4">{getDictamenBadge(ev.dictamenFinal)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedEval(ev);
                            setDictamenOverride(ev.dictamenFinal);
                            setObservacionNotes(ev.observacionesAdmin || '');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold rounded-lg transition-all"
                        >
                          Revisar Ficha
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REGLAS DE RIESGO */}
      {activeTab === 'reglas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Matriz de Reglas y Ponderación de Riesgo</h3>
              <p className="text-xs text-slate-400">Define las reglas lógicas que calculan el score y generan alertas médicas automáticas.</p>
            </div>
            <button
              onClick={() => handleOpenRuleModal(null)}
              className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> Nueva Regla de Riesgo
            </button>
          </div>

          <div className="space-y-3">
            {reglas.map((r) => (
              <div key={r.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100 text-sm">{r.nombre}</span>
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full">
                      Dictamen: {r.dictamenResult}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-500/30">
                    +{r.ponderacion} Pts de Riesgo
                  </span>
                </div>
                <p className="text-xs text-slate-400">{r.mensajeAlerta}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">Si responde {r.condicion?.val || 'SI'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    <span>Emite Alerta Médica</span>
                  </div>
                  <button
                    onClick={() => handleOpenRuleModal(r)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE PREGUNTA 100% VISUAL SIN CÓDIGO */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSaveQuestion} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-5 my-8 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                <Settings className="w-5 h-5" /> {editingQuestion === 'NEW' ? 'Crear Nueva Pregunta' : `Editar Pregunta`}
              </h3>
              <button type="button" onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Texto de la Pregunta *</label>
                <input
                  type="text"
                  required
                  value={qFormData.preguntaText}
                  onChange={(e) => setQFormData({ ...qFormData, preguntaText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium"
                  placeholder="Ej: ¿Tiene alguna condición médica o tratamiento activo?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo de Control Visual *</label>
                  <select
                    value={qFormData.tipoControl}
                    onChange={(e) => setQFormData({ ...qFormData, tipoControl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold"
                  >
                    <option value="SELECT">Menú Desplegable (Opción única)</option>
                    <option value="RADIO">Botón de Radio (Opción única)</option>
                    <option value="CHECKBOX">Casillas de Verificación (Múltiple)</option>
                    <option value="TEXT">Campo de Texto Libre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sección en el Formulario</label>
                  <select
                    value={qFormData.seccion}
                    onChange={(e) => setQFormData({ ...qFormData, seccion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="DATOS_BASICOS">Altitud y Origen</option>
                    <option value="EXPERIENCIA">Experiencia en Montaña</option>
                    <option value="SALUD_ALTITUD">Soroche y Altitud</option>
                    <option value="SALUD_GENERAL">Salud General y Cirugías</option>
                    <option value="ALIMENTACION">Alimentación y Alergias</option>
                    <option value="APTITUD_FISICA">Nivel Físico y Firma</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Indicación o Ayuda (Subtítulo explicativo)</label>
                <input
                  type="text"
                  value={qFormData.ayudaText}
                  onChange={(e) => setQFormData({ ...qFormData, ayudaText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300"
                  placeholder="Ej: Indique sus afecciones o detalles relevantes."
                />
              </div>

              {/* CONSTRUCTOR VISUAL DE OPCIONES (SIN CÓDIGO NI JSON) */}
              {['SELECT', 'RADIO', 'CHECKBOX'].includes(qFormData.tipoControl) && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Opciones de Respuesta Visuales
                    </label>
                    <button
                      type="button"
                      onClick={handleAddOptionItem}
                      className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Añadir Opción
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {qFormData.opcionesList.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No hay opciones agregadas. Haz clic en "Añadir Opción".</p>
                    ) : (
                      qFormData.opcionesList.map((op, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <input
                            type="text"
                            required
                            placeholder={`Texto Opción ${idx + 1}`}
                            value={op.label}
                            onChange={(e) => handleUpdateOptionItem(idx, 'label', e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                          />
                          <select
                            value={op.score}
                            onChange={(e) => handleUpdateOptionItem(idx, 'score', Number(e.target.value))}
                            className="w-36 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-semibold"
                          >
                            <option value={0}>🟢 Sin Riesgo (0 pts)</option>
                            <option value={10}>🟡 Riesgo Moderado (10 pts)</option>
                            <option value={20}>🔴 Riesgo Alto (20 pts)</option>
                            <option value={35}>🚨 Crítico (35 pts)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionItem(idx)}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 flex items-center gap-1 shadow-lg shadow-emerald-500/20"
              >
                <Save className="w-4 h-4" /> Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL VISUAL DE EDICIÓN DE REGLA */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSaveRule} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> {editingRule === 'NEW' ? 'Crear Regla de Alerta' : `Editar Regla`}
              </h3>
              <button type="button" onClick={() => setEditingRule(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Regla *</label>
              <input
                type="text"
                required
                value={rFormData.nombre}
                onChange={(e) => setRFormData({ ...rFormData, nombre: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200"
                placeholder="Ej: Antecedente de Soroche Severo"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Dictamen Resultante *</label>
              <select
                value={rFormData.dictamenResult}
                onChange={(e) => setRFormData({ ...rFormData, dictamenResult: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold"
              >
                <option value="APTO">APTO</option>
                <option value="OBSERVACION">APTO CON OBSERVACIÓN</option>
                <option value="REQUIERE_REVISION_MANUAL">REQUIERE REVISIÓN MÉRICA MANUAL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mensaje de Alerta Médica para el Guía *</label>
              <input
                type="text"
                required
                value={rFormData.mensajeAlerta}
                onChange={(e) => setRFormData({ ...rFormData, mensajeAlerta: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200"
                placeholder="Ej: Atención: El pasajero reportó historial severo de mal de altura."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 flex items-center gap-1 shadow-lg shadow-emerald-500/20"
              >
                <Save className="w-4 h-4" /> Guardar Regla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE REVISIÓN MÉDICA */}
      {selectedEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4">
            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <UserCheck className="w-5 h-5" /> Revisión Médica de Pasajero #{selectedEval.id}
            </h3>

            <div className="bg-slate-950 p-4 rounded-xl space-y-2 text-xs">
              <p><strong>Pasajero:</strong> {selectedEval.profile?.nombre} {selectedEval.profile?.apellido}</p>
              <p><strong>DNI/Pasaporte:</strong> {selectedEval.profile?.documentoIdentidad || 'N/A'}</p>
              <p><strong>Score Riesgo:</strong> {selectedEval.scoreRiesgoTotal} Pts</p>
              <p><strong>Alertas Generadas:</strong></p>
              <ul className="list-disc pl-5 text-amber-400">
                {selectedEval.alertasGeneradas.map((a, idx) => (
                  <li key={idx}>{a.mensaje}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Dictamen Final Confirmado</label>
              <select
                value={dictamenOverride}
                onChange={(e) => setDictamenOverride(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="APTO">APTO</option>
                <option value="OBSERVACION">APTO CON OBSERVACIÓN</option>
                <option value="REQUIERE_REVISION_MANUAL">REQUIERE REVISIÓN MANUAL</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Observaciones / Notas Médicas</label>
              <textarea
                rows={3}
                value={observacionNotes}
                onChange={(e) => setObservacionNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                placeholder="Escriba notas para el guía o la agencia..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedEval(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateDictamen}
                className="px-5 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
              >
                Guardar Dictamen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
