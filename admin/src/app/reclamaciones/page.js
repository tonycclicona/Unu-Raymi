'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Eye, Send, RefreshCw, Filter, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '') + '/api';

const TIPO_LABELS = { QUEJA: 'Queja', RECLAMO: 'Reclamo', CONSULTA: 'Consulta' };
const TIPO_COLORS = {
  QUEJA: 'bg-red-100 text-red-700 border-red-200',
  RECLAMO: 'bg-amber-100 text-amber-700 border-amber-200',
  CONSULTA: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function ReclamacionesPage() {
  const [reclamos, setReclamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [selected, setSelected] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensajeOk, setMensajeOk] = useState('');
  const [error, setError] = useState('');

  const fetchReclamos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroEstado) params.set('estado', filtroEstado);
      if (filtroTipo) params.set('tipo', filtroTipo);
      const res = await fetch(`${API_BASE_URL}/reclamaciones?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      setReclamos(data.data || []);
    } catch (err) {
      setError('Error al cargar reclamaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReclamos(); }, [filtroEstado, filtroTipo]);

  const handleResponder = async () => {
    if (!respuesta.trim() || respuesta.trim().length < 10) {
      setError('La respuesta debe tener al menos 10 caracteres.');
      return;
    }
    try {
      setEnviando(true);
      setError('');
      const res = await fetch(`${API_BASE_URL}/reclamaciones/${selected.id}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ respuesta }),
      });
      if (!res.ok) throw new Error('Error al enviar respuesta.');
      setMensajeOk('Respuesta enviada correctamente. El reclamante ha sido notificado por email.');
      setRespuesta('');
      setSelected(null);
      fetchReclamos();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1a202c] flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-600" />
            Libro de Reclamaciones
          </h1>
          <p className="text-sm text-[#64748b] mt-1">Gestión de quejas, reclamos y consultas — Ley 29571</p>
        </div>
        <button
          onClick={fetchReclamos}
          className="flex items-center gap-2 px-4 py-2 bg-[#84dcc6] hover:bg-[#6dc9b1] text-[#0f372d] rounded-xl text-sm font-bold transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-[#64748b]" />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm text-[#1a202c] focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="RESPONDIDO">Respondido</option>
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm text-[#1a202c] focus:outline-none"
        >
          <option value="">Todos los tipos</option>
          <option value="QUEJA">Queja</option>
          <option value="RECLAMO">Reclamo</option>
          <option value="CONSULTA">Consulta</option>
        </select>
        <span className="text-xs text-[#64748b] ml-auto">{reclamos.length} resultado(s)</span>
      </div>

      {/* Mensaje de éxito */}
      {mensajeOk && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-medium">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{mensajeOk}</span>
          <button onClick={() => setMensajeOk('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#64748b]">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p>Cargando reclamaciones...</p>
          </div>
        ) : reclamos.length === 0 ? (
          <div className="p-12 text-center text-[#64748b]">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No hay reclamaciones registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">N°</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {reclamos.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#1a202c]">#{String(r.id).padStart(6, '0')}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1a202c]">{r.nombre} {r.apellido}</div>
                      <div className="text-xs text-[#64748b]">{r.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${TIPO_COLORS[r.tipo_reclamo] || 'bg-gray-100 text-gray-700'}`}>
                        {TIPO_LABELS[r.tipo_reclamo] || r.tipo_reclamo}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-[#475569] truncate">{r.descripcion}</p>
                    </td>
                    <td className="px-4 py-3">
                      {r.estado === 'RESPONDIDO' ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> Respondido
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748b]">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('es-PE') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelected(r); setRespuesta(''); setError(''); setMensajeOk(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#84dcc6]/20 hover:bg-[#84dcc6]/40 text-[#0f372d] rounded-lg text-xs font-bold transition-all border border-[#84dcc6]/30"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver & Responder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalle y respuesta */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between">
              <div>
                <h2 className="font-black text-[#1a202c]">Reclamo #{String(selected.id).padStart(6, '0')}</h2>
                <p className="text-xs text-[#64748b]">{selected.nombre} {selected.apellido} — {selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-[#f1f5f9] transition-all">
                <X className="w-5 h-5 text-[#64748b]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Detalles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider">Tipo</p>
                  <p className="font-bold text-[#1a202c]">{TIPO_LABELS[selected.tipo_reclamo]}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider">Fecha del Incidente</p>
                  <p className="font-bold text-[#1a202c]">{selected.fecha_ocurrencia ? new Date(selected.fecha_ocurrencia + 'T00:00:00').toLocaleDateString('es-PE') : '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider">Teléfono</p>
                  <p className="font-bold text-[#1a202c]">{selected.telefono || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider">Estado</p>
                  <p className={`font-bold ${selected.estado === 'RESPONDIDO' ? 'text-emerald-600' : 'text-amber-600'}`}>{selected.estado}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider mb-1">Descripción del Hecho</p>
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 text-sm text-[#1a202c] leading-relaxed whitespace-pre-line">{selected.descripcion}</div>
              </div>
              <div>
                <p className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider mb-1">Lo que Solicita</p>
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 text-sm text-[#1a202c] leading-relaxed whitespace-pre-line">{selected.pedido}</div>
              </div>

              {/* Respuesta previa si ya fue respondido */}
              {selected.respuesta_admin && (
                <div>
                  <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider mb-1">Respuesta Anterior</p>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800 leading-relaxed whitespace-pre-line">{selected.respuesta_admin}</div>
                </div>
              )}

              {/* Área de respuesta */}
              <div className="border-t border-[#e2e8f0] pt-4 space-y-3">
                <p className="text-xs font-bold text-[#1a202c]">
                  <Send className="w-4 h-4 inline mr-1 text-[#84dcc6]" />
                  {selected.estado === 'RESPONDIDO' ? 'Enviar nueva respuesta' : 'Responder al reclamante'}
                </p>
                <textarea
                  value={respuesta}
                  onChange={(e) => { setRespuesta(e.target.value); setError(''); }}
                  rows={5}
                  placeholder="Escribe tu respuesta oficial aquí. Esta respuesta se enviará por email al reclamante..."
                  className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm text-[#1a202c] focus:outline-none focus:border-[#84dcc6] resize-none"
                />
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
                <button
                  onClick={handleResponder}
                  disabled={enviando}
                  className="w-full py-3 bg-[#84dcc6] hover:bg-[#6dc9b1] disabled:opacity-60 text-[#0f372d] font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {enviando ? 'Enviando...' : 'Enviar Respuesta y Notificar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
