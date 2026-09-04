'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { MapPin, Search, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Navigation, Edit2, Upload, X, ArrowUpDown, Image as ImageIcon } from 'lucide-react';
import { API_BASE_URL, API_ASSETS_URL, uploadApi } from '@/lib/api';

// Carga dinámica de Leaflet para evitar errores con window durante SSR
const AttractionMapPicker = dynamic(
  () => import('@/components/AttractionMapPicker'),
  { ssr: false, loading: () => <div className="w-full h-full min-h-[360px] bg-[#dedbd2]/50 animate-pulse rounded-2xl flex items-center justify-center text-xs text-[#6c7a7c]">Cargando Mapa Leaflet...</div> }
);

const fetcher = (url) => fetch(url).then((res) => res.json());

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
  const { data: toursResponse } = useSWR(`${API_BASE_URL}/tours`, fetcher);
  const tours = toursResponse?.data || [];

  // Obtener la lista de attractions existentes para la tabla admin
  const { data: attractionsResponse, mutate: mutateAttractions } = useSWR(`${API_BASE_URL}/admin/attractions`, fetcher);
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
    formData.append('imagen', file);

    try {
      const data = await uploadApi('/upload', formData);
      if (data.success && data.url) {
        setImageUrl(data.url);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al subir la imagen' });
      }
    } catch (err) {
      console.error('Error en subida de imagen:', err);
      setMessage({ type: 'error', text: err.message || 'Error al conectar con el servidor de subida' });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartEdit = (attr) => {
    setEditingId(attr.id);
    setName(attr.name || '');
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
        latitude: position[0],
        longitude: position[1],
        altitude: altitude ? parseInt(altitude, 10) : null,
        description,
        tourId: tourId ? parseInt(tourId, 10) : null,
        orden: orden ? parseInt(orden, 10) : 0,
        imageUrl: imageUrl || null,
      };

      const url = editingId
        ? `${API_BASE_URL}/admin/attractions/${editingId}`
        : `${API_BASE_URL}/admin/attractions`;

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: editingId
            ? `¡Punto "${name}" actualizado correctamente!`
            : `¡Punto "${name}" registrado correctamente!`
        });

        handleCancelEdit();
        mutateAttractions();
      } else {
        setMessage({ type: 'error', text: data.error || 'No se pudo guardar el punto geográfico.' });
      }
    } catch (err) {
      console.error('Error al guardar punto GIS:', err);
      setMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, attrName) => {
    if (!confirm(`¿Eliminar el punto "${attrName}"?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/attractions/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (editingId === id) handleCancelEdit();
        mutateAttractions();
      }
    } catch (err) {
      console.error('Error al eliminar atracción:', err);
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

                {/* Campo Nombre */}
                <div>
                  <label className="block text-xs font-bold text-[#6c7a7c] uppercase tracking-wider mb-1">
                    Nombre del Punto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Laguna Humantay"
                    className="w-full bg-[#f5f4f0] border border-[#b0c4b1] p-2.5 rounded-xl text-xs text-[#4a5759] font-semibold focus:outline-none focus:border-[#4a5759]"
                  />
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

                {/* Coordenadas en tiempo real */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#f5f4f0] p-3 rounded-xl border border-[#b0c4b1]/60">
                  <div>
                    <span className="text-[10px] text-[#6c7a7c] font-bold uppercase block">Latitud</span>
                    <span className="font-extrabold text-[#4a5759]">{position[0].toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6c7a7c] font-bold uppercase block">Longitud</span>
                    <span className="font-extrabold text-[#4a5759]">{position[1].toFixed(5)}</span>
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
                        src={imageUrl.startsWith('http') ? imageUrl : `${API_ASSETS_URL}${imageUrl}`}
                        alt="Preview punto"
                        className="w-full h-full object-cover"
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

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-bold text-[#6c7a7c] uppercase tracking-wider mb-1">
                    Descripción / Detalles
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción o recomendaciones de llegada..."
                    className="w-full bg-[#f5f4f0] border border-[#b0c4b1] p-2.5 rounded-xl text-xs text-[#4a5759] focus:outline-none"
                  />
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
                <AttractionMapPicker position={position} setPosition={setPosition} />
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
                              src={attr.imageUrl.startsWith('http') ? attr.imageUrl : `${API_ASSETS_URL}${attr.imageUrl}`}
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
                        <td className="p-3 font-bold text-[#4a5759]">{attr.name}</td>
                        <td className="p-3">
                          <span className="bg-[#dedbd2] text-[#4a5759] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            {attr.category}
                          </span>
                        </td>
                        <td className="p-3 text-[#6c7a7c]">
                          {attr.latitude.toFixed(4)}, {attr.longitude.toFixed(4)}
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
