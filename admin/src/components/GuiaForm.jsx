'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mutateApi, uploadApi, API_ASSETS_URL } from '@/lib/api';
import { Save, ArrowLeft, Upload, Loader } from 'lucide-react';
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
    }
  }, [initialData]);

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
      await mutateApi(url, { method, body: formData });
      router.push('/guias');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar el guía.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between border-b border-[#b0c4b1]/40 pb-4">
        <Link
          href="/guias"
          className="flex items-center gap-1.5 text-xs font-bold text-[#6c7a7c] hover:text-[#4a5759] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la Lista
        </Link>
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

        {/* Rol */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Rol o Cargo</label>
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

        {/* Experiencia */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Experiencia</label>
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

        {/* Idiomas */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Idiomas</label>
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
        <div className="flex items-center gap-2 pt-8">
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
                  src={formData.foto.startsWith('http') ? formData.foto : `${API_ASSETS_URL}${formData.foto}`}
                  alt="Previsualización"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-[#6c7a7c]/65 text-center px-2">Sin Foto</span>
              )}
            </div>
          </div>
        </div>

        {/* Descripcion */}
        <div className="md:col-span-2 space-y-1.5 border-t border-[#b0c4b1]/30 pt-6 mt-2">
          <label className="text-xs font-extrabold text-[#4a5759] uppercase tracking-wider block">Biografía / Descripción</label>
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
      </div>
    </form>
  );
}
