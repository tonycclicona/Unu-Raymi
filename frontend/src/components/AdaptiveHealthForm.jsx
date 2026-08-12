import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, AlertTriangle, CheckCircle2, User, FileText, Activity } from 'lucide-react';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '') + '/api';

export default function AdaptiveHealthForm({ tour, pasajeros = [], onEvaluationsComplete }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePassengerIndex, setActivePassengerIndex] = useState(0);
  const [formsData, setFormsData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Cargar la estructura del formulario activo
  useEffect(() => {
    async function fetchSchema() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/form-engine/schema`);
        if (!res.ok) throw new Error('No se pudo obtener el formulario de evaluación.');
        const data = await res.json();
        setSchema(data);

        // Inicializar un objeto de respuesta por cada pasajero
        const totalPasajeros = pasajeros.length > 0 ? pasajeros.length : 1;
        const initialForms = Array.from({ length: totalPasajeros }).map((_, idx) => ({
          pasajeroId: pasajeros[idx]?.id || null,
          nombre: pasajeros[idx]?.nombre || `Pasajero ${idx + 1}`,
          apellido: pasajeros[idx]?.apellido || '',
          dni: pasajeros[idx]?.dni || '',
          email: idx === 0 ? (pasajeros[idx]?.email || '') : '',
          respuestas: {},
          consentimientoFirmado: false,
        }));

        setFormsData(initialForms);
      } catch (err) {
        console.error('Error cargando esquema de salud:', err);
        setErrorMsg('No se pudo cargar la evaluación médica adaptativa.');
      } finally {
        setLoading(false);
      }
    }

    fetchSchema();
  }, [pasajeros]);

  // 2. Duplicar respuestas del Pasajero 1 a los demás acompañantes
  const handleDuplicateFromPassengerOne = (targetIndex) => {
    if (targetIndex <= 0 || !formsData[0]) return;

    const sourceRespuestas = { ...formsData[0].respuestas };
    setFormsData((prev) => {
      const updated = [...prev];
      updated[targetIndex] = {
        ...updated[targetIndex],
        respuestas: sourceRespuestas,
      };
      return updated;
    });
  };

  // 3. Manejar cambio en un campo de respuesta
  const handleFieldChange = (passengerIdx, codigo, value) => {
    setFormsData((prev) => {
      const updated = [...prev];
      const passengerForm = { ...updated[passengerIdx] };
      passengerForm.respuestas = {
        ...passengerForm.respuestas,
        [codigo]: value,
      };
      updated[passengerIdx] = passengerForm;
      return updated;
    });
  };

  // 4. Manejar cambios de metadatos (Nombre, DNI)
  const handleMetaChange = (passengerIdx, field, value) => {
    setFormsData((prev) => {
      const updated = [...prev];
      updated[passengerIdx] = {
        ...updated[passengerIdx],
        [field]: value,
      };
      return updated;
    });
  };

  // 5. Evaluar visibilidad dinámica de una pregunta
  const shouldShowQuestion = (question, respuestas) => {
    if (!question.condicionMostrar) return true;
    const cond = question.condicionMostrar;

    // Evaluación directa de dependencia
    if (cond.dependsOn) {
      const parentVal = respuestas[cond.dependsOn];
      if (!parentVal) return false;
      if (cond.operator === 'IN' && Array.isArray(cond.value)) {
        return cond.value.includes(parentVal);
      }
      if (cond.operator === '=') {
        return parentVal === cond.value;
      }
    }

    return true;
  };

  // 6. Enviar todas las evaluaciones
  const handleSubmitAll = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');

      // Validar consentimientos
      const sinFirma = formsData.findIndex((f) => !f.consentimientoFirmado);
      if (sinFirma !== -1) {
        setActivePassengerIndex(sinFirma);
        setErrorMsg(`Por favor acepte la declaración de responsabilidad para el Pasajero ${sinFirma + 1}.`);
        setSubmitting(false);
        return;
      }

      const payload = {
        tourContext: {
          tourId: tour?.id,
          nombreTour: tour?.nombre,
          duracion_dias: tour?.duracion_dias,
          categoria: tour?.categoria,
        },
        evaluaciones: formsData,
      };

      const res = await fetch(`${API_BASE_URL}/form-engine/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al enviar evaluación de salud.');
      const data = await res.json();

      if (onEvaluationsComplete) {
        onEvaluationsComplete(data);
      }
    } catch (err) {
      console.error('Error al enviar formulario:', err);
      setErrorMsg(err.message || 'Error procesando la evaluación.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-emerald-300 animate-pulse">
        <Activity className="w-8 h-8 mx-auto mb-2 animate-spin" />
        <p className="text-sm font-medium">Cargando evaluación médica adaptativa...</p>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm">
        {errorMsg || 'No se pudo cargar el formulario médico.'}
      </div>
    );
  }

  const currentPassengerData = formsData[activePassengerIndex] || formsData[0];

  return (
    <div className="space-y-6 text-[var(--foreground)]">
      {/* Encabezado */}
      <div className="bg-[var(--card)] border border-[var(--accent)]/40 rounded-2xl p-5 shadow-sm transition-colors duration-300">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-[var(--accent)]/20 text-[var(--accent)] rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[var(--foreground)]">{schema.titulo}</h3>
            <p className="text-xs text-[var(--muted-foreground)]">{schema.descripcion}</p>
          </div>
        </div>
      </div>

      {/* Tabs de Selección de Pasajeros */}
      {formsData.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-[var(--border)]">
          {formsData.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActivePassengerIndex(idx)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activePassengerIndex === idx
                  ? 'bg-[var(--accent)] text-slate-950 font-extrabold shadow-md'
                  : 'bg-[var(--sidebar)] text-[var(--muted-foreground)] hover:bg-[var(--border)]/40'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{p.nombre ? `${p.nombre}` : `Pasajero ${idx + 1}`}</span>
              {p.consentimientoFirmado && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 ml-1" />}
            </button>
          ))}
        </div>
      )}

      {/* Botón de Acceso Rápido: Duplicar datos de Pasajero 1 */}
      {activePassengerIndex > 0 && (
        <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/40 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-[var(--foreground)] font-medium">
            <Copy className="w-4 h-4 text-[var(--accent)]" />
            <span>¿Comparten la misma altitud y condición básica?</span>
          </div>
          <button
            type="button"
            onClick={() => handleDuplicateFromPassengerOne(activePassengerIndex)}
            className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-slate-950 text-xs font-extrabold rounded-lg transition-all flex items-center space-x-1 shadow-sm"
          >
            <span>Copiar respuestas del Pasajero 1</span>
          </button>
        </div>
      )}

      {/* Formulario de Pasajero Activo */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 space-y-6 shadow-sm transition-colors duration-300">
        {/* Banner Único de Identidad del Pasajero */}
        <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[var(--accent)]/20 border border-[var(--accent)]/40 rounded-full flex items-center justify-center text-[var(--foreground)] font-black">
              #{activePassengerIndex + 1}
            </div>
            <div>
              <span className="text-[10px] text-[var(--accent)] font-extrabold uppercase tracking-wider block">Mi Perfil y Aptitud de Montaña</span>
              <h4 className="text-sm font-extrabold text-[var(--foreground)]">
                {currentPassengerData.nombre ? `${currentPassengerData.nombre} ${currentPassengerData.apellido || ''}` : `Pasajero ${activePassengerIndex + 1}`}
              </h4>
            </div>
          </div>
          {currentPassengerData.dni && (
            <span className="text-xs font-mono font-bold bg-[var(--card)] px-3 py-1 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)]">
              Doc: {currentPassengerData.dni}
            </span>
          )}
        </div>

        {/* Preguntas Renderizadas Dinámicamente */}
        <div className="space-y-6">
          {schema.preguntas.map((q) => {
            if (!shouldShowQuestion(q, currentPassengerData.respuestas)) return null;

            const val = currentPassengerData.respuestas[q.codigo] || '';

            return (
              <div key={q.id} className="space-y-2">
                <label className="block text-sm font-bold text-[var(--foreground)]">
                  {q.preguntaText} {q.obligatorio && <span className="text-rose-500">*</span>}
                </label>
                {q.ayudaText && <p className="text-xs text-[var(--muted-foreground)] mb-2">{q.ayudaText}</p>}

                {/* Control SELECT */}
                {q.tipoControl === 'SELECT' && (
                  <select
                    value={val}
                    onChange={(e) => handleFieldChange(activePassengerIndex, q.codigo, e.target.value)}
                    className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] font-medium focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="">Seleccione una opción...</option>
                    {q.opciones?.map((opt, idx) => (
                      <option key={idx} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* Control RADIO */}
                {q.tipoControl === 'RADIO' && (
                  <div className="space-y-2">
                    {q.opciones?.map((opt, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          val === opt.value
                            ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--foreground)] font-bold'
                            : 'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.codigo}_p${activePassengerIndex}`}
                          value={opt.value}
                          checked={val === opt.value}
                          onChange={(e) => handleFieldChange(activePassengerIndex, q.codigo, e.target.value)}
                          className="accent-[var(--accent)]"
                        />
                        <span className="text-xs font-semibold">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Control CHECKBOX */}
                {q.tipoControl === 'CHECKBOX' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.opciones?.map((opt, idx) => {
                      const selectedArray = Array.isArray(val) ? val : [];
                      const isChecked = selectedArray.includes(opt.value);

                      const toggleOption = () => {
                        const newArray = isChecked
                          ? selectedArray.filter((item) => item !== opt.value)
                          : [...selectedArray, opt.value];
                        handleFieldChange(activePassengerIndex, q.codigo, newArray);
                      };

                      return (
                        <label
                          key={idx}
                          className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--foreground)] font-bold'
                              : 'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={toggleOption}
                            className="accent-[var(--accent)]"
                          />
                          <span className="text-xs font-semibold">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Control TEXT */}
                {q.tipoControl === 'TEXT' && (
                  <textarea
                    rows={2}
                    value={val}
                    onChange={(e) => handleFieldChange(activePassengerIndex, q.codigo, e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                    placeholder="Escriba aquí los detalles..."
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Declaración Jurada & Consentimiento */}
        <div className="pt-4 border-t border-[var(--border)] space-y-3">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={currentPassengerData.consentimientoFirmado}
              onChange={(e) => handleMetaChange(activePassengerIndex, 'consentimientoFirmado', e.target.checked)}
              className="mt-1 accent-[var(--accent)] w-4 h-4"
            />
            <span className="text-xs text-[var(--muted-foreground)] leading-relaxed font-medium">
              Declaro que la información proporcionada es verídica y acepto las condiciones de seguridad en montaña y altitud especificadas para la expedición.
            </span>
          </label>
        </div>
      </div>

      {/* Alerta de Error */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-500 text-xs flex items-center space-x-2 font-bold">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Acciones del Formulario */}
      <div className="flex items-center justify-between pt-2">
        {formsData.length > 1 && (
          <div className="text-xs text-[var(--muted-foreground)] font-bold">
            Pasajero {activePassengerIndex + 1} de {formsData.length}
          </div>
        )}
        <div className="flex items-center space-x-3 ml-auto">
          {activePassengerIndex < formsData.length - 1 ? (
            <button
              type="button"
              onClick={() => setActivePassengerIndex((prev) => prev + 1)}
              className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md"
            >
              Siguiente Pasajero →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={submitting}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-black rounded-xl text-sm transition-all shadow-lg flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirmar y Guardar Evaluaciones</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
