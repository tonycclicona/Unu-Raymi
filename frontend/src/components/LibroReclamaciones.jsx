'use client';

import { useState } from 'react';
import { X, ClipboardList, AlertTriangle, CheckCircle, ShieldCheck, Send } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Book3D } from './illustrations/Neomorphic3DIcons';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.unu-raymi.com/api';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '') + '/api';

export default function LibroReclamaciones({ onClose }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    tipo_reclamo: '',
    fecha_ocurrencia: '',
    descripcion: '',
    pedido: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.apellido || !form.email || !form.tipo_reclamo || !form.fecha_ocurrencia || !form.descripcion || !form.pedido) {
      setError(t('reclamaciones.error_campos'));
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const res = await fetch(`${API_BASE_URL}/reclamaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('reclamaciones.error_envio'));
      setSuccess(data);
    } catch (err) {
      setError(err.message || t('reclamaciones.error_envio'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--background)] border border-[var(--border)] rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
              <Book3D className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[var(--foreground)]">{t('reclamaciones.titulo')}</h2>
              <p className="text-xs text-[var(--muted-foreground)] leading-tight">{t('reclamaciones.subtitulo')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-all" aria-label={t('reclamaciones.cerrar')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Aviso INDECOPI */}
          <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{t('reclamaciones.indecopi_aviso')}</p>
          </div>

          {success ? (
            <div className="flex flex-col items-center text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--foreground)]">{t('reclamaciones.exito_titulo')}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-2 leading-relaxed max-w-sm">{t('reclamaciones.exito_desc')}</p>
                {success.id && (
                  <div className="mt-3 px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-xl inline-flex items-center gap-2">
                    <span className="text-xs text-[var(--muted-foreground)]">{t('reclamaciones.exito_numero')}</span>
                    <span className="text-xs font-black text-[var(--foreground)] font-mono">#{String(success.id).padStart(6, '0')}</span>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="mt-4 px-8 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl text-sm transition-all">
                {t('reclamaciones.exito_cerrar')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{t('reclamaciones.nombre')}</label>
                  <input type="text" name="nombre" value={form.nombre} onChange={handleChange} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-amber-500 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{t('reclamaciones.apellido')}</label>
                  <input type="text" name="apellido" value={form.apellido} onChange={handleChange} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-amber-500 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{t('reclamaciones.email')}</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-amber-500 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{t('reclamaciones.telefono')}</label>
                  <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-amber-500 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{t('reclamaciones.tipo')}</label>
                  <select name="tipo_reclamo" value={form.tipo_reclamo} onChange={handleChange} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-amber-500 transition-colors">
                    <option value="">{t('reclamaciones.tipo_placeholder')}</option>
                    <option value="QUEJA">{t('reclamaciones.tipo_queja')}</option>
                    <option value="RECLAMO">{t('reclamaciones.tipo_reclamo')}</option>
                    <option value="CONSULTA">{t('reclamaciones.tipo_consulta')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{t('reclamaciones.fecha_ocurrencia')}</label>
                  <input type="date" name="fecha_ocurrencia" value={form.fecha_ocurrencia} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-amber-500 transition-colors" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{t('reclamaciones.descripcion')}</label>
                <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={4} placeholder={t('reclamaciones.descripcion_placeholder')} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-amber-500 transition-colors resize-none placeholder-[var(--muted-foreground)]/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{t('reclamaciones.pedido')}</label>
                <textarea name="pedido" value={form.pedido} onChange={handleChange} rows={3} placeholder={t('reclamaciones.pedido_placeholder')} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-amber-500 transition-colors resize-none placeholder-[var(--muted-foreground)]/50" />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <button type="submit" disabled={submitting} className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]">
                <Send className="w-4 h-4" />
                {submitting ? t('reclamaciones.boton_enviando') : t('reclamaciones.boton_enviar')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
