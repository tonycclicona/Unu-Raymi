'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mutateApi, uploadApi, API_ASSETS_URL } from '@/lib/api';
import { Save, ArrowLeft, Upload, Loader, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function GarantiaForm({ initialData, id }) {
  const router = useRouter();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    icono: 'Award',
    color: 'emerald',
    imagenUrl: '',
    activo: true,
    orden: 0,
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // ── Pestañas Bilingües y Traducciones ──
  const [langTab, setLangTab] = useState('es'); // 'es' | 'en'

  const getInitialEn = (field) => {
    if (!initialData?.traducciones) return '';
    let tr = initialData.traducciones;
    if (typeof tr === 'string') {
      try { tr = JSON.parse(tr); } catch { return ''; }
    }
    return tr?.en?.[field] || '';
  };

  const [enTitulo, setEnTitulo] = useState(() => getInitialEn('titulo'));
  const [enDescripcion, setEnDescripcion] = useState(() => getInitialEn('descripcion'));
  const [isTranslating, setIsTranslating] = useState(false);

  const iconsList = ['Award', 'Lock', 'ShieldCheck', 'Star', 'Heart', 'Shield'];
  const colorsList = [
    { value: 'red', label: 'Rojo' },
    { value: 'emerald', label: 'Verde (Emerald)' },
    { value: 'blue', label: 'Azul' },
    { value: 'amber', label: 'Ámbar (Amarillo)' },
    { value: 'indigo', label: 'Índigo' },
    { value: 'teal', label: 'Teal (Cian)' },
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        titulo: initialData.titulo || '',
        descripcion: initialData.descripcion || '',
        icono: initialData.icono || 'Award',
        color: initialData.color || 'emerald',
        imagenUrl: initialData.imagenUrl || '',
        activo: initialData.activo !== undefined ? initialData.activo : true,
        orden: initialData.orden || 0,
      });

      if (initialData.traducciones) {
        setEnTitulo(getInitialEn('titulo'));
        setEnDescripcion(getInitialEn('descripcion'));
      }
    }
  }, [initialData]);

  const handleAutoTranslate = async () => {
    if (!formData.titulo && !formData.descripcion) {
      setError('Por favor completa al menos el título o la descripción en español antes de auto-traducir.');
      return;
    }

    setIsTranslating(true);
    setError(null);
    try {
      const textsToTranslate = [
        formData.titulo || '',
        formData.descripcion || '',
      ];
      const res = await mutateApi('/translate', {
        method: 'POST',
        body: {
          texts: textsToTranslate,
          targetLang: 'en'
        }
      });

      if (res && res.data && Array.isArray(res.data)) {
        if (res.data[0]) setEnTitulo(res.data[0]);
        if (res.data[1]) setEnDescripcion(res.data[1]);
        setLangTab('en');
      }
    } catch (err) {
      console.error('Error auto-traduciendo garantía:', err);
      setError('No se pudo auto-traducir: ' + (err.message || 'Error'));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const data = new FormData();
    data.append('file', file);

    try {
      const res = await uploadApi('/upload', data);
      setFormData((prev) => ({
        ...prev,
        imagenUrl: res.data.url,
      }));
    } catch (err) {
      setError(err.message || 'Error al subir el certificado.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEdit ? `/garantias/${id}` : '/garantias';
      const method = isEdit ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        traducciones: {
          es: {
            titulo: formData.titulo,
            descripcion: formData.descripcion,
          },
          en: {
            titulo: enTitulo?.trim() || formData.titulo,
            descripcion: enDescripcion?.trim() || formData.descripcion,
          },
        },
      };
      await mutateApi(url, { method, body: payload });
      window.location.href = '/garantias/';
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar la garantía.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between border-b border-[#b0c4b1]/40 pb-4">
        <a
          href="/garantias/"
          className="flex items-center gap-1.5 text-xs font-bold text-[#6c7a7c] hover:text-[#4a5759] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la Lista
        </a>
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex items-center gap-2 bg-[#4a5759] hover:bg-[#384244] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#4a5759]/20 hover:shadow-[#4a5759]/30 transition-all text-sm disabled:opacity-50"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Garantía
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Pestañas de Idioma y Auto-traducción */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#ffffff]/60 border border-[#b0c4b1]/30 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLangTab('es')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              langTab === 'es'
                ? 'bg-[#4a5759] text-white shadow-sm'
                : 'text-[#4a5759] hover:bg-[#b0c4b1]/20'
            }`}
          >
            <span>🇪🇸</span>
            <span>Español</span>
          </button>
          <button
            type="button"
            onClick={() => setLangTab('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              langTab === 'en'
                ? 'bg-[#4a5759] text-white shadow-sm'
                : 'text-[#4a5759] hover:bg-[#b0c4b1]/20'
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
            {enTitulo || enDescripcion ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Traducción lista" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" title="Sin traducción aún" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleAutoTranslate}
          disabled={isTranslating}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          title="Traduce automáticamente título y descripción al inglés respetando términos quechua y nombres propios"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
          <span>{isTranslating ? 'Traduciendo...' : '⚡ Auto-traducir a Inglés'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#ffffff]/60 border border-[#b0c4b1]/30 p-6 rounded-2xl">
        {/* Campos condicionales según idioma */}
        {langTab === 'es' ? (
          <>
            {/* Titulo ES */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Título de la Garantía (Español)</label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
                placeholder="MINCETUR"
              />
            </div>

            {/* Descripcion ES */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Descripción de Acreditación (Español)</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
                placeholder="Operador oficial autorizado de turismo de aventura..."
              />
            </div>
          </>
        ) : (
          <>
            {/* Titulo EN */}
            <div className="md:col-span-2 space-y-1.5 bg-emerald-500/[0.03] border border-emerald-500/20 p-3 rounded-xl">
              <label className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">Guarantee Title (English)</label>
              <input
                type="text"
                value={enTitulo}
                onChange={(e) => setEnTitulo(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
                placeholder="e.g. MINCETUR Certified"
              />
            </div>

            {/* Descripcion EN */}
            <div className="md:col-span-2 space-y-1.5 bg-emerald-500/[0.03] border border-emerald-500/20 p-3 rounded-xl">
              <label className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">Accreditation Description (English)</label>
              <textarea
                value={enDescripcion}
                onChange={(e) => setEnDescripcion(e.target.value)}
                rows="3"
                className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
                placeholder="Official authorized adventure tour operator in Peru..."
              />
            </div>
          </>
        )}

        {/* Icono */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Icono</label>
          <select
            name="icono"
            value={formData.icono}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
          >
            {iconsList.map((ic) => (
              <option key={ic} value={ic}>
                {ic}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Color del Sello</label>
          <select
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
          >
            {colorsList.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Orden */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Orden de Aparición</label>
          <input
            type="number"
            name="orden"
            value={formData.orden}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
          />
        </div>

        {/* Activo checkbox */}
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            name="activo"
            id="activo"
            checked={formData.activo}
            onChange={handleChange}
            className="w-4.5 h-4.5 accent-[#4a5759] border-[#b0c4b1]"
          />
          <label htmlFor="activo" className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider select-none cursor-pointer">
            Mostrar en la Landing Page (Activo)
          </label>
        </div>

        {/* Certificado Imagen */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-t border-[#b0c4b1]/30 pt-6 mt-2">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Imagen del Certificado</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="imagenUrl"
                value={formData.imagenUrl || ''}
                onChange={handleChange}
                className="flex-1 px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
                placeholder="/uploads/certificado.webp"
              />
              <label className="flex items-center gap-1.5 bg-[#b0c4b1]/40 hover:bg-[#4a5759]/10 border border-[#b0c4b1] px-4 py-2.5 rounded-xl cursor-pointer text-xs font-bold transition-all text-[#4a5759]">
                <Upload className="w-4 h-4" />
                Subir
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[10px] text-[#6c7a7c]">Sube la imagen del certificado oficial. Se mostrará en hover y en lightbox al hacer click.</p>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[#b0c4b1] bg-gray-100 flex items-center justify-center relative shadow-inner">
              {uploading ? (
                <Loader className="w-6 h-6 animate-spin text-[#6c7a7c]" />
              ) : formData.imagenUrl ? (
                <img
                  src={formData.imagenUrl.startsWith('http') ? formData.imagenUrl : `${API_ASSETS_URL}${formData.imagenUrl.startsWith('/') ? '' : '/'}${formData.imagenUrl}`}
                  alt="Previsualización"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    if (!e.target.dataset.triedFallback) {
                      e.target.dataset.triedFallback = '1';
                      const cleanPath = formData.imagenUrl.startsWith('/') ? formData.imagenUrl : `/${formData.imagenUrl}`;
                      e.target.src = `https://unu-raymi.com${cleanPath}`;
                    }
                  }}
                />
              ) : (
                <span className="text-[10px] text-[#6c7a7c]/65 text-center px-2">Sin Certificado</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
