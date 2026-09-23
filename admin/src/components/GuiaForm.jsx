'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mutateApi, uploadApi, API_ASSETS_URL } from '@/lib/api';
import { Save, ArrowLeft, Upload, Loader, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function GuiaForm({ initialData, id }) {
  const router = useRouter();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    nombre: '',
    rol: '',
    experiencia: '',
    idiomas: '',
    foto: '',
    descripcion: '',
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

  const [enRol, setEnRol] = useState(() => getInitialEn('rol'));
  const [enExperiencia, setEnExperiencia] = useState(() => getInitialEn('experiencia'));
  const [enDescripcion, setEnDescripcion] = useState(() => getInitialEn('descripcion'));
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        rol: initialData.rol || '',
        experiencia: initialData.experiencia || '',
        idiomas: initialData.idiomas || '',
        foto: initialData.foto || '',
        descripcion: initialData.descripcion || '',
        activo: initialData.activo !== undefined ? initialData.activo : true,
        orden: initialData.orden || 0,
      });

      if (initialData.traducciones) {
        setEnRol(getInitialEn('rol'));
        setEnExperiencia(getInitialEn('experiencia'));
        setEnDescripcion(getInitialEn('descripcion'));
      }
    }
  }, [initialData]);

  const handleAutoTranslate = async () => {
    if (!formData.rol && !formData.descripcion && !formData.experiencia) {
      setError('Por favor completa al menos el rol, experiencia o descripción en español antes de auto-traducir.');
      return;
    }

    setIsTranslating(true);
    setError(null);
    try {
      const textsToTranslate = [
        formData.rol || '',
        formData.experiencia || '',
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
        if (res.data[0]) setEnRol(res.data[0]);
        if (res.data[1]) setEnExperiencia(res.data[1]);
        if (res.data[2]) setEnDescripcion(res.data[2]);
        setLangTab('en');
      }
    } catch (err) {
      console.error('Error auto-traduciendo guía:', err);
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
        foto: res.data.url,
      }));
    } catch (err) {
      setError(err.message || 'Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEdit ? `/guias/${id}` : '/guias';
      const method = isEdit ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        traducciones: {
          es: {
            rol: formData.rol,
            descripcion: formData.descripcion,
            experiencia: formData.experiencia,
            idiomas: formData.idiomas,
          },
          en: {
            rol: enRol?.trim() || formData.rol,
            descripcion: enDescripcion?.trim() || formData.descripcion,
            experiencia: enExperiencia?.trim() || formData.experiencia,
            idiomas: formData.idiomas,
          },
        },
      };
      await mutateApi(url, { method, body: payload });
      window.location.href = '/guias/';
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar el guía.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between border-b border-[#b0c4b1]/40 pb-4">
        <a
          href="/guias/"
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
          Guardar Guía
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
            {enRol || enDescripcion ? (
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
          title="Traduce automáticamente rol, experiencia y descripción al inglés respetando términos quechua y nombres propios"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
          <span>{isTranslating ? 'Traduciendo...' : '⚡ Auto-traducir a Inglés'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#ffffff]/60 border border-[#b0c4b1]/30 p-6 rounded-2xl">
        {/* Nombre */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Nombre Completo</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
            placeholder="Edgar Quispe"
          />
        </div>

        {/* Idiomas */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Idiomas que Domina</label>
          <input
            type="text"
            name="idiomas"
            value={formData.idiomas}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
            placeholder="Español, Inglés, Quechua"
          />
        </div>

        {/* Campos condicionales según idioma */}
        {langTab === 'es' ? (
          <>
            {/* Rol ES */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Rol o Cargo (Español)</label>
              <input
                type="text"
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
                placeholder="Guía de Alta Montaña"
              />
            </div>

            {/* Experiencia ES */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Experiencia (Español)</label>
              <input
                type="text"
                name="experiencia"
                value={formData.experiencia}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
                placeholder="12 años de experiencia"
              />
            </div>

            {/* Descripcion ES */}
            <div className="md:col-span-2 space-y-1.5 border-t border-[#b0c4b1]/30 pt-4">
              <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Biografía / Descripción (Español)</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
                placeholder="Describe la experiencia y especialidad del guía..."
              />
            </div>
          </>
        ) : (
          <>
            {/* Rol EN */}
            <div className="space-y-1.5 bg-emerald-500/[0.03] border border-emerald-500/20 p-3 rounded-xl">
              <label className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">Role / Title (English)</label>
              <input
                type="text"
                value={enRol}
                onChange={(e) => setEnRol(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
                placeholder="e.g. High Mountain Trekking Guide"
              />
            </div>

            {/* Experiencia EN */}
            <div className="space-y-1.5 bg-emerald-500/[0.03] border border-emerald-500/20 p-3 rounded-xl">
              <label className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">Experience (English)</label>
              <input
                type="text"
                value={enExperiencia}
                onChange={(e) => setEnExperiencia(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
                placeholder="e.g. 12 years of experience"
              />
            </div>

            {/* Descripcion EN */}
            <div className="md:col-span-2 space-y-1.5 bg-emerald-500/[0.03] border border-emerald-500/20 p-3 rounded-xl">
              <label className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">Biography / Description (English)</label>
              <textarea
                value={enDescripcion}
                onChange={(e) => setEnDescripcion(e.target.value)}
                rows="4"
                className="w-full px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
                placeholder="Describe the guide's background and expertise in English..."
              />
            </div>
          </>
        )}

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

        {/* Foto de perfil */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-t border-[#b0c4b1]/30 pt-6 mt-2">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Foto de Perfil</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="foto"
                value={formData.foto}
                onChange={handleChange}
                required
                className="flex-1 px-4 py-2.5 bg-white border border-[#b0c4b1] rounded-xl text-sm focus:outline-none focus:border-[#4a5759]"
                placeholder="/uploads/nombre-de-archivo.webp"
              />
              <label className="flex items-center gap-1.5 bg-[#b0c4b1]/40 hover:bg-[#4a5759]/10 border border-[#b0c4b1] px-4 py-2.5 rounded-xl cursor-pointer text-xs font-bold transition-all text-[#4a5759]">
                <Upload className="w-4 h-4" />
                Subir
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[10px] text-[#6c7a7c]">Sube un archivo WebP optimizado o introduce una URL absoluta de imagen.</p>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[#b0c4b1] bg-gray-100 flex items-center justify-center relative shadow-inner">
              {uploading ? (
                <Loader className="w-6 h-6 animate-spin text-[#6c7a7c]" />
              ) : formData.foto ? (
                <img
                  src={formData.foto.startsWith('http') ? formData.foto : `${API_ASSETS_URL}${formData.foto.startsWith('/') ? '' : '/'}${formData.foto}`}
                  alt="Previsualización"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (!e.target.dataset.triedFallback) {
                      e.target.dataset.triedFallback = '1';
                      const cleanPath = formData.foto.startsWith('/') ? formData.foto : `/${formData.foto}`;
                      e.target.src = `https://unu-raymi.com${cleanPath}`;
                    }
                  }}
                />
              ) : (
                <span className="text-[10px] text-[#6c7a7c]/65 text-center px-2">Sin Foto</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
