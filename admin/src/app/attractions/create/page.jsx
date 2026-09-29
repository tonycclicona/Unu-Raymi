'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { MapPin, Search, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Navigation, Edit2, Upload, X, ArrowUpDown, Image as ImageIcon, Sparkles } from 'lucide-react';
import { API_BASE_URL, API_ASSETS_URL, uploadApi, fetcher, mutateApi, getImageUrl, handleImageFallback } from '@/lib/api';

// Carga dinámica de Leaflet para evitar errores con window durante SSR
const AttractionMapPicker = dynamic(
  () => import('@/components/AttractionMapPicker'),
  { ssr: false, loading: () => <div className="w-full h-full min-h-[380px] bg-[#dedbd2]/50 animate-pulse rounded-2xl flex items-center justify-center text-xs text-[#6c7a7c]">Cargando Mapa Leaflet...</div> }
);

export default function CreateAttractionPage() {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ATRACTIVO');
  const [altitude, setAltitude] = useState('');
  const [description, setDescription] = useState('');
  const [tourId, setTourId] = useState('');
  const [orden, setOrden] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // ── Pestañas Bilingües y Traducción para Puntos GIS ──
  const [langTab, setLangTab] = useState('es'); // 'es' | 'en'
  const [enName, setEnName] = useState('');
  const [enDescription, setEnDescription] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Coordenadas iniciales (Cusco, Perú)
  const [position, setPosition] = useState([-13.5319, -71.9675]);

  // Buscador geográfico Nominatim
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Estado de envío del formulario
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Obtener la lista de tours para el desplegable
  const { data: toursResponse } = useSWR('/tours', fetcher);
  const tours = toursResponse?.data || [];

  // Obtener la lista de attractions existentes para la tabla admin
  const { data: attractionsResponse, mutate: mutateAttractions } = useSWR('/admin/attractions', fetcher);
  const attractionsList = attractionsResponse?.data || [];

  // Buscador con debounce de 500ms hacia la API pública de Nominatim
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
          {
            headers: {
              'Accept-Language': 'es',
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Error al buscar en Nominatim:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setPosition([lat, lon]);
    setSearchQuery(result.display_name);
    setShowDropdown(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await uploadApi('/upload', formData);
      const uploadedUrl = data?.data?.url || data?.url;
      if (data.success && uploadedUrl) {
        setImageUrl(uploadedUrl);
      } else {
        setMessage({ type: 'error', text: data?.error || data?.message || 'Error al subir la imagen' });
      }
    } catch (err) {
      console.error('Error en subida de imagen:', err);
      setMessage({ type: 'error', text: err.message || 'Error al conectar con el servidor de subida' });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAutoTranslate = async () => {
    if (!name && !description) {
      setMessage({ type: 'error', text: 'Por favor, ingresa el Nombre o la Descripción en Español antes de auto-traducir.' });
      return;
    }

    setIsTranslating(true);
    setMessage(null);
    try {
      const textsToTranslate = [name || '', description || ''];
      const res = await mutateApi('/translate', {
        method: 'POST',
        body: {
          texts: textsToTranslate,
          targetLang: 'en'
        }
      });

      if (res && res.data && Array.isArray(res.data)) {
        if (res.data[0]) setEnName(res.data[0]);
        if (res.data[1]) setEnDescription(res.data[1]);
        setLangTab('en');
      }
    } catch (err) {
      console.error('Error auto-traduciendo atracción:', err);
      setMessage({ type: 'error', text: 'No se pudo completar la traducción automática: ' + (err.message || 'Error') });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleStartEdit = (attr) => {
    setEditingId(attr.id);
    setName(attr.name || '');

    let tr = attr.traducciones;
    if (typeof tr === 'string') {
      try { tr = JSON.parse(tr); } catch { tr = null; }
    }
    setEnName(tr?.en?.name || '');
    setEnDescription(tr?.en?.description || '');
    setLangTab('es');

    setCategory(attr.category || 'ATRACTIVO');
    setAltitude(attr.altitude ? String(attr.altitude) : '');
    setDescription(attr.description || '');
    setTourId(attr.tourId ? String(attr.tourId) : '');
    setOrden(attr.orden !== undefined ? String(attr.orden) : '0');
    setImageUrl(attr.imageUrl || '');
    setPosition([attr.latitude, attr.longitude]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setEnName('');
    setEnDescription('');
    setLangTab('es');
    setCategory('ATRACTIVO');
    setAltitude('');
    setDescription('');
    setTourId('');
    setOrden('0');
    setImageUrl('');
    setPosition([-13.5319, -71.9675]);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        name,
        category,
        latitude: parseFloat(position[0]),
        longitude: parseFloat(position[1]),
        altitude: altitude ? parseInt(altitude, 10) : null,
        description,
        tourId: tourId ? parseInt(tourId, 10) : null,
        orden: orden ? parseInt(orden, 10) : 0,
        imageUrl: imageUrl || null,
        traducciones: {
          es: {
            name,
            description,
          },
          en: {
            name: enName?.trim() || name,
            description: enDescription?.trim() || description,
          },
        },
      };

      const url = editingId
        ? `/admin/attractions/${editingId}`
        : '/admin/attractions';

      const method = editingId ? 'PUT' : 'POST';

      const data = await mutateApi(url, {
        method,
        body: payload,
      });

      if (data && data.success) {
        setMessage({
          type: 'success',
          text: editingId
            ? `¡Punto "${name}" actualizado correctamente!`
            : `¡Punto "${name}" registrado correctamente!`
        });

        handleCancelEdit();
        mutateAttractions();
      } else {
        setMessage({ type: 'error', text: data?.error || 'No se pudo guardar el punto geográfico.' });
      }
    } catch (err) {
      console.error('Error al guardar punto GIS:', err);
      setMessage({ type: 'error', text: err.message || 'Error de conexión con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, attrName) => {
    if (!confirm(`¿Eliminar el punto "${attrName}"?`)) return;

    try {
      await mutateApi(`/admin/attractions/${id}`, {
        method: 'DELETE',
      });
      if (editingId === id) handleCancelEdit();
      mutateAttractions();
    } catch (err) {
      console.error('Error al eliminar atracción:', err);
      alert(err.message || 'Error al eliminar el punto geográfico');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="bg-[#dedbd2] border border-[#b0c4b1] p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-[#4a5759]" />
          <div>
            <h1 className="text-lg font-black text-[#4a5759]">Administrador de Puntos GIS (Attractions)</h1>
            <p className="text-xs text-[#6c7a7c]">Registra puntos turísticos y servicios con Map Picker interactivo</p>
          </div>
        </div>
      </div>

      {message && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-bold shadow-sm ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulario + Buscador Geográfico */}
            <div className="lg:col-span-5 bg-white border border-[#b0c4b1] rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-base font-extrabold text-[#4a5759] border-b border-[#dedbd2] pb-2 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#4a5759]" />
                  Crear Nuevo Punto
                </h2>

                {/* Buscador Geográfico Nominatim */}
                <div className="relative">
                  <label className="block text-xs font-bold text-[#6c7a7c] uppercase tracking-wider mb-1">
                    Buscador Geográfico (Nominatim OSM)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6c7a7c]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por lugar (ej: Laguna Humantay, Cusco)..."
                      className="w-full bg-[#f5f4f0] border border-[#b0c4b1] pl-9 pr-8 py-2 rounded-xl text-xs text-[#4a5759] focus:outline-none focus:border-[#4a5759]"
                    />
                    {isSearching && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5759] animate-spin" />}
                  </div>

                  {/* Dropdown Resultados */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-30 w-full mt-1 bg-white border border-[#b0c4b1] rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-[#dedbd2]">
                      {searchResults.map((res, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectLocation(res)}
                          className="w-full text-left p-2.5 text-xs text-[#4a5759] hover:bg-[#dedbd2]/40 transition-colors flex items-start gap-2"
                        >
                          <Navigation className="w-3.5 h-3.5 text-[#4a5759] shrink-0 mt-0.5" />
                          <span>{res.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selector Bilingüe y Auto-traducción */}
                <div className="bg-[#f5f4f0] p-2.5 rounded-2xl border border-[#b0c4b1]/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center bg-white p-1 rounded-xl border border-[#b0c4b1]/60">
                    <button
                      type="button"
                      onClick={() => setLangTab('es')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        langTab === 'es'
                          ? 'bg-[#4a5759] text-white shadow-xs'
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
                          ? 'bg-[#4a5759] text-white shadow-xs'
                          : 'text-[#4a5759] hover:bg-[#b0c4b1]/20'
                      }`}
                    >
                      <span>🇬🇧</span>
                      <span>English</span>
                      {enName ? (
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
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    title="Traduce automáticamente nombre y descripción al inglés respetando términos quechua y nombres propios"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                    <span>{isTranslating ? 'Traduciendo...' : '⚡ Auto-traducir a Inglés'}</span>
                  </button>
                </div>

                {/* Banner de modo inglés */}
                {langTab === 'en' && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-800">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>🇬🇧</span> Contenido en Inglés (Editable)
                    </span>
                    <span className="text-[11px] text-[#6c7a7c]">
                      Visible en mapa y rutas en versión inglés
                    </span>
                  </div>
                )}

                {/* Campo Nombre */}
                <div>
                  <label className="block text-xs font-bold text-[#6c7a7c] uppercase tracking-wider mb-1">
                    {langTab === 'es' ? (
                      <>Nombre del Punto (Español) <span className="text-red-500">*</span></>
                    ) : (
                      <>Point Name (English)</>
                    )}
                  </label>
                  {langTab === 'es' ? (
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Laguna Humantay"
                      className="w-full bg-[#f5f4f0] border border-[#b0c4b1] p-2.5 rounded-xl text-xs text-[#4a5759] font-semibold focus:outline-none focus:border-[#4a5759]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={enName}
                      onChange={(e) => setEnName(e.target.value)}
                      placeholder="e.g. Humantay Lake"
                      className="w-full bg-[#ffffff] border border-emerald-500/40 p-2.5 rounded-xl text-xs text-[#4a5759] font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  )}
                </div>

                {/* Categoría Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-[#6c7a7c] uppercase tracking-wider mb-1">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#f5f4f0] border border-[#b0c4b1] p-2.5 rounded-xl text-xs text-[#4a5759] font-bold focus:outline-none focus:border-[#4a5759]"
                  >
                    <option value="ATRACTIVO">🏔️ ATRACTIVO TURÍSTICO</option>
                    <option value="HOSPITAL">🏥 HOSPITAL / SALUD</option>
                    <option value="TRANSPORTE">🚌 TRANSPORTE / PARADA</option>
                    <option value="RESTAURANTE">🍽️ RESTAURANTE / ALIMENTACIÓN</option>
                    <option value="TIENDA">🛒 TIENDA / ABASTECIMIENTO</option>
                  </select>
                </div>

                {/* Coordenadas en tiempo real y editables */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#f5f4f0] p-3 rounded-xl border border-[#b0c4b1]/60">
                  <div>
                    <label className="text-[10px] text-[#6c7a7c] font-bold uppercase block mb-1">
                      Latitud GPS <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={position[0]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setPosition([val, position[1]]);
                      }}
                      className="w-full bg-white border border-[#b0c4b1] p-2 rounded-lg font-mono text-xs text-[#4a5759] font-extrabold focus:outline-none focus:border-[#4a5759]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6c7a7c] font-bold uppercase block mb-1">
                      Longitud GPS <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={position[1]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setPosition([position[0], val]);
                      }}
                      className="w-full bg-white border border-[#b0c4b1] p-2 rounded-lg font-mono text-xs text-[#4a5759] font-extrabold focus:outline-none focus:border-[#4a5759]"
                    />
                  </div>
                </div>

                {/* Altitud, Orden y Tour Asociado */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6c7a7c] uppercase tracking-wider mb-1">
                      Altitud (msnm)
                    </label>
                    <input
                      type="number"
                      value={altitude}
                      onChange={(e) => setAltitude(e.target.value)}
                      placeholder="Ej. 4200"
                      className="w-full bg-[#f5f4f0] border border-[#b0c4b1] p-2 rounded-xl text-xs text-[#4a5759] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6c7a7c] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ArrowUpDown className="w-3 h-3 text-[#4a5759]" /> Orden Ruta
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={orden}
                      onChange={(e) => setOrden(e.target.value)}
                      placeholder="0, 1, 2..."
                      className="w-full bg-[#f5f4f0] border border-[#b0c4b1] p-2 rounded-xl text-xs text-[#4a5759] font-bold focus:outline-none"
                      title="Orden del punto en la secuencia de la ruta (1, 2, 3...)"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6c7a7c] uppercase tracking-wider mb-1">
                      Tour Asociado
                    </label>
                    <select
                      value={tourId}
                      onChange={(e) => setTourId(e.target.value)}
                      className="w-full bg-[#f5f4f0] border border-[#b0c4b1] p-2 rounded-xl text-xs text-[#4a5759] focus:outline-none"
                    >
                      <option value="">Ninguno (Público General)</option>
                      {tours.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre} ({t.pais})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subida de Imagen del Punto GIS */}
                <div>
                  <label className="block text-xs font-bold text-[#6c7a7c] uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Fotografía del Punto GIS</span>
                    <span className="text-[10px] font-normal text-[#6c7a7c]">Conversión automática a WebP</span>
                  </label>

                  {imageUrl ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#b0c4b1] group">
                      <img
                        src={getImageUrl(imageUrl)}
                        alt="Preview punto"
                        className="w-full h-full object-cover"
                        onError={(e) => handleImageFallback(e, imageUrl)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white text-[#4a5759] rounded-lg text-xs font-bold flex items-center gap-1 shadow-md hover:bg-slate-100"
                        >
                          <Upload className="w-3.5 h-3.5" /> Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md hover:bg-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-[#b0c4b1] hover:border-[#4a5759] rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-[#f5f4f0]/50 hover:bg-[#f5f4f0] transition-colors"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-5 h-5 text-[#4a5759] animate-spin" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-[#6c7a7c]" />
                      )}
                      <span className="text-xs font-bold text-[#4a5759]">
                        {uploadingImage ? 'Subiendo y optimizando...' : 'Haz clic para subir fotografía'}
                      </span>
                      <span className="text-[10px] text-[#6c7a7c]">JPG, PNG o WebP (máx. 5MB)</span>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Descripción Bilingüe */}
                <div>
                  <label className="block text-xs font-bold text-[#6c7a7c] uppercase tracking-wider mb-1">
                    {langTab === 'es' ? 'Descripción / Detalles (Español)' : 'Description / Details (English)'}
                  </label>
                  {langTab === 'es' ? (
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descripción o recomendaciones de llegada en español..."
                      className="w-full bg-[#f5f4f0] border border-[#b0c4b1] p-2.5 rounded-xl text-xs text-[#4a5759] focus:outline-none"
                    />
                  ) : (
                    <textarea
                      rows={3}
                      value={enDescription}
                      onChange={(e) => setEnDescription(e.target.value)}
                      placeholder="Description or arrival recommendations in English..."
                      className="w-full bg-[#ffffff] border border-emerald-500/40 p-2.5 rounded-xl text-xs text-[#4a5759] focus:outline-none focus:border-emerald-600"
                    />
                  )}
                </div>

                {/* Botón Guardar / Actualizar y Cancelar */}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="flex-1 bg-[#4a5759] hover:bg-[#3b4749] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingId ? (
                      <Edit2 className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>
                      {loading
                        ? (editingId ? 'Actualizando...' : 'Guardando...')
                        : (editingId ? 'Actualizar Punto GIS' : 'Guardar Punto GIS')}
                    </span>
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-3 bg-[#dedbd2] hover:bg-[#c5c2b9] text-[#4a5759] rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Selector de Mapa (Map Picker Leaflet) */}
            <div className="lg:col-span-7 bg-white border border-[#b0c4b1] rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#4a5759] border-b border-[#dedbd2] pb-2 flex items-center justify-between">
                  <span>Selector de Mapa Interactivo</span>
                  <span className="text-xs font-normal text-[#6c7a7c]">
                    {editingId ? 'Editando ubicación del punto' : 'Haz clic o arrastra el marcador'}
                  </span>
                </h2>
              </div>
              <div className="flex-1 min-h-[380px]">
                <AttractionMapPicker
                  position={position}
                  setPosition={setPosition}
                  imageUrl={getImageUrl(imageUrl)}
                  category={category}
                  orden={orden}
                />
              </div>
            </div>
          </div>

          {/* Tabla de Puntos Registrados */}
          <div className="bg-white border border-[#b0c4b1] rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-[#4a5759] uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4a5759]" />
              Puntos Geográficos Registrados ({attractionsList.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#dedbd2] bg-[#f5f4f0] text-[#6c7a7c] uppercase text-[10px] font-bold">
                    <th className="p-3">Foto</th>
                    <th className="p-3">Orden</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Coordenadas</th>
                    <th className="p-3">Altitud</th>
                    <th className="p-3">Tour Asociado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dedbd2]">
                  {attractionsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-[#6c7a7c] italic">
                        No hay puntos registrados aún.
                      </td>
                    </tr>
                  ) : (
                    attractionsList.map((attr) => (
                      <tr
                        key={attr.id}
                        className={`hover:bg-[#f5f4f0]/50 transition-colors ${
                          editingId === attr.id ? 'bg-[#b0c4b1]/20 font-semibold' : ''
                        }`}
                      >
                        <td className="p-3">
                          {attr.imageUrl ? (
                            <img
                              src={getImageUrl(attr.imageUrl)}
                              onError={(e) => handleImageFallback(e, attr.imageUrl)}
                              alt={attr.name}
                              className="w-10 h-10 object-cover rounded-lg border border-[#b0c4b1]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#dedbd2]/50 flex items-center justify-center text-[#6c7a7c]">
                              <MapPin className="w-4 h-4 opacity-50" />
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-extrabold text-[#4a5759] bg-[#dedbd2]/60 px-2 py-0.5 rounded-md text-[11px]">
                            #{attr.orden ?? 0}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#4a5759]">{attr.name}</div>
                          {(() => {
                            let tr = attr.traducciones;
                            if (typeof tr === 'string') {
                              try { tr = JSON.parse(tr); } catch { tr = null; }
                            }
                            const enTitle = tr?.en?.name;
                            return enTitle ? (
                              <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium mt-0.5">
                                <span className="px-1 rounded bg-emerald-100 text-[9px] font-extrabold">EN</span>
                                <span>{enTitle}</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-amber-600 flex items-center gap-1 font-medium mt-0.5">
                                <span className="px-1 rounded bg-amber-100 text-[9px] font-extrabold">ES</span>
                                <span>Sin inglés</span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-3">
                          <span className="bg-[#dedbd2] text-[#4a5759] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            {attr.category}
                          </span>
                        </td>
                        <td className="p-3 text-[#6c7a7c]">
                          {Number(attr.latitude || 0).toFixed(4)}, {Number(attr.longitude || 0).toFixed(4)}
                        </td>
                        <td className="p-3 text-[#6c7a7c]">{attr.altitude ? `${attr.altitude} msnm` : '-'}</td>
                        <td className="p-3 text-[#6c7a7c]">{attr.tour?.nombre || 'General'}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(attr)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar punto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(attr.id, attr.name)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar punto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
    </div>
  );
}
