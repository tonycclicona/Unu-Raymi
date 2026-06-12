'use client';

import { useState, useEffect } from 'react';
import { X, Compass, Shield, Backpack, Utensils, Bus, Camera, ArrowRight, Calendar, MapPin, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_ASSETS_URL } from '../lib/api';

export default function TourDetailsOverlay({ tour, initialDuration, onClose, onProceed, isShifted }) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const imagenes = tour.imagenes || [];

  // Escuchar teclado para navegar en la galería
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % imagenes.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, imagenes.length]);

  const hasVariants = tour.variantes && tour.variantes.length > 0;
  const [selectedDuration, setSelectedDuration] = useState(() => {
    if (initialDuration) return initialDuration;
    if (hasVariants) return tour.variantes[0].duracion_dias;
    return tour.duracion_dias;
  });

  const activeVariant = hasVariants
    ? tour.variantes.find(v => v.duracion_dias === selectedDuration) || tour.variantes[0]
    : null;

  const displayDuration = activeVariant ? activeVariant.duracion_dias : tour.duracion_dias;
  const displayPrecioAdulto = activeVariant ? activeVariant.precio_adulto : tour.precio_adulto;
  const displayCupos = activeVariant ? activeVariant.cupos_disponibles : tour.cupos_disponibles;
  const displayItinerario = (activeVariant && activeVariant.itinerario) ? activeVariant.itinerario : tour.itinerario;

  useEffect(() => {
    if (imagenes.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagenes.length);
    }, 500);
    return () => clearInterval(interval);
  }, [imagenes.length]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const currentImage = imagenes[currentImageIndex]?.url;

  // Clasificación dinámica inteligente de servicios
  const categorizarServicios = (serviciosIncluidos = [], queLlevar = []) => {
    const guia = [];
    const seguridad = [];
    const equipamiento = [...queLlevar];
    const alimentacion = [];
    const transporte = [];
    const actividades = [];

    const todosServicios = [...serviciosIncluidos];

    todosServicios.forEach(s => {
      const lower = s.toLowerCase();
      if (
        lower.includes('guia') || 
        lower.includes('guiado') || 
        lower.includes('bilingue') || 
        lower.includes('conductor') || 
        lower.includes('experto') ||
        lower.includes('lider')
      ) {
        guia.push(s);
      } else if (
        lower.includes('seguro') || 
        lower.includes('asistencia') || 
        lower.includes('medico') || 
        lower.includes('botquin') || 
        lower.includes('botiquin') || 
        lower.includes('emergencia') ||
        lower.includes('oxigeno')
      ) {
        seguridad.push(s);
      } else if (
        lower.includes('comida') || 
        lower.includes('almuerzo') || 
        lower.includes('cena') || 
        lower.includes('snack') || 
        lower.includes('desayuno') || 
        lower.includes('box') || 
        lower.includes('alimentacion') ||
        lower.includes('cena')
      ) {
        alimentacion.push(s);
      } else if (
        lower.includes('transporte') || 
        lower.includes('traslado') || 
        lower.includes('bus') || 
        lower.includes('auto') || 
        lower.includes('tren') || 
        lower.includes('recogida') || 
        lower.includes('vehiculo') ||
        lower.includes('bote')
      ) {
        transporte.push(s);
      } else if (
        lower.includes('entrada') || 
        lower.includes('ticket') || 
        lower.includes('boleto') || 
        lower.includes('actividad') || 
        lower.includes('visita') || 
        lower.includes('camara') || 
        lower.includes('acceso') || 
        lower.includes('permiso') ||
        lower.includes('ticket')
      ) {
        actividades.push(s);
      } else {
        // Distribuir en guías o actividades por defecto si no encaja
        actividades.push(s);
      }
    });

    return {
      guia,
      seguridad,
      equipamiento,
      alimentacion,
      transporte,
      actividades
    };
  };

  const activeInclusiones = activeVariant?.servicios_incluidos || tour.servicios_incluidos;
  const isStructuredObject = activeInclusiones && !Array.isArray(activeInclusiones) && typeof activeInclusiones === 'object';

  const getCategorias = () => {
    const rawCategorias = isStructuredObject ? {
      guia: activeInclusiones.guia || [],
      seguridad: activeInclusiones.seguridad || [],
      equipamiento: [...(activeInclusiones.equipamiento || []), ...(tour.que_llevar || [])],
      alimentacion: activeInclusiones.alimentacion || [],
      transporte: activeInclusiones.transporte || [],
      actividades: activeInclusiones.actividades || []
    } : categorizarServicios(activeInclusiones || [], tour.que_llevar || []);

    return {
      guia: rawCategorias.guia?.length > 0 ? rawCategorias.guia : ['Guía local profesional en español'],
      seguridad: rawCategorias.seguridad?.length > 0 ? rawCategorias.seguridad : ['Botiquín de primeros auxilios y protocolos de seguridad'],
      equipamiento: rawCategorias.equipamiento?.length > 0 ? rawCategorias.equipamiento : ['Ropa de abrigo o impermeable', 'Calzado cómodo de caminata'],
      alimentacion: rawCategorias.alimentacion?.length > 0 ? rawCategorias.alimentacion : ['Alimentación no incluida (opciones en la ruta)'],
      transporte: rawCategorias.transporte?.length > 0 ? rawCategorias.transporte : ['Traslados incluidos en el punto de encuentro'],
      actividades: rawCategorias.actividades?.length > 0 ? rawCategorias.actividades : ['Caminatas y explicaciones culturales según itinerario']
    };
  };

  const categorias = getCategorias();

  const itemsCategorias = [
    { id: 'guia', label: 'Guías y Dirección', icon: Compass, list: categorias.guia, color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
    { id: 'seguridad', label: 'Seguridad y Asistencia', icon: Shield, list: categorias.seguridad, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { id: 'equipamiento', label: 'Equipamiento Requerido', icon: Backpack, list: categorias.equipamiento, color: 'text-amber-400 border-emerald-500/20 bg-emerald-500/5' },
    { id: 'alimentacion', label: 'Alimentación y Bebidas', icon: Utensils, list: categorias.alimentacion, color: 'text-rose-400 border-rose-500/20 bg-rose-500/5' },
    { id: 'transporte', label: 'Transporte y Logística', icon: Bus, list: categorias.transporte, color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
    { id: 'actividades', label: 'Tickets y Actividades', icon: Camera, list: categorias.actividades, color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
  ];

  const displayExclusiones = (activeVariant && activeVariant.servicios_excluidos && activeVariant.servicios_excluidos.length > 0)
    ? activeVariant.servicios_excluidos
    : (tour.servicios_excluidos || []);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className={`fixed inset-0 z-50 bg-[#f7e1d7]/92 backdrop-blur-md flex items-center transition-all duration-500 ease-in-out p-2 sm:p-4 ${
        isShifted
          ? 'justify-start md:pl-12 md:pr-[600px]'
          : 'justify-center md:p-8'
      }`}
    >
      {/* Contenedor Principal */}
      <div className="glass max-w-7xl w-full rounded-2xl md:rounded-3xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row max-h-[92vh] md:max-h-[85vh] h-full md:h-auto md:max-h-[85vh] shadow-2xl relative border border-black/5">
        
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-[#6c7a7c] hover:text-[#4a5759] p-2.5 bg-black/5 rounded-xl border border-black/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. GALERIA DE IMAGENES — horizontal strip en mobile, columna en desktop */}
        <div className="w-full md:w-[25%] lg:w-[22%] border-b md:border-b-0 md:border-r border-[#b0c4b1]/50 bg-black/10 md:h-full md:overflow-y-auto no-scrollbar">
          {/* Mobile: horizontal scroll */}
          <div className="flex gap-3 p-3 overflow-x-auto no-scrollbar md:hidden">
            {imagenes.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-[#b0c4b1]/50 cursor-pointer shadow-md"
              >
                <img
                  src={img.url.startsWith('http') ? img.url : `${API_ASSETS_URL}${img.url}`}
                  alt={`Imagen ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          {/* Desktop: grid column */}
          <div className="hidden md:grid grid-cols-1 gap-3 p-4">
            {imagenes.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="relative aspect-square rounded-2xl overflow-hidden group border border-[#b0c4b1]/50 cursor-pointer shadow-md hover:scale-[1.12] hover:z-30 hover:shadow-[0_20px_50px_rgba(233,69,96,0.3)] hover:border-[#4a5759]/50 transition-all duration-300 ease-out"
              >
                <img
                  src={img.url.startsWith('http') ? img.url : `${API_ASSETS_URL}${img.url}`}
                  alt={`Imagen ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Columna Central: Información, Duraciones, Itinerario y Exclusiones */}
        <div className="w-full md:w-[45%] lg:w-[48%] p-5 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#b0c4b1]/50 md:h-full md:overflow-y-auto no-scrollbar">
          <div className="space-y-5">
            {/* Header del Tour */}
            <div className="space-y-3 pr-8">
              <div className="flex items-center gap-2">
                <span className="bg-[#4a5759]/10 text-[#4a5759] border border-[#4a5759]/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {tour.pais}
                </span>
                <span className="text-xs text-[#6c7a7c] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#4a5759]" />
                  {displayDuration} {displayDuration === 1 ? 'Día' : 'Días'}
                </span>
              </div>
              <h2 className="text-xl md:text-3xl font-black text-[#4a5759] leading-tight">{tour.nombre}</h2>
              <p className="text-[#6c7a7c] text-sm leading-relaxed">{tour.descripcion}</p>
            </div>

            {/* Multi-duration Toggle Tabs */}
            {hasVariants && (
              <div className="bg-[#121224]/50 border border-[#b0c4b1]/40 p-4 rounded-2xl space-y-2.5">
                <span className="text-[10px] text-[#6c7a7c] block uppercase font-bold tracking-wider">Duración del Paquete</span>
                <div className="flex flex-wrap gap-2">
                  {tour.variantes.map((v) => {
                    const isSelected = selectedDuration === v.duracion_dias;
                    return (
                      <button
                        key={v.duracion_dias}
                        onClick={() => setSelectedDuration(v.duracion_dias)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                          isSelected
                            ? 'bg-[#4a5759] text-white shadow-md shadow-[#4a5759]/20'
                            : 'bg-[#ffffff] hover:bg-[#b0c4b1]/50 text-[#6c7a7c] hover:text-[#4a5759] border border-[#b0c4b1]'
                        }`}
                      >
                        {v.duracion_dias} {v.duracion_dias === 1 ? 'Día' : 'Días'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Itinerario del Tour */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#4a5759] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4a5759]" />
                Itinerario Detallado
              </h3>

              {displayItinerario ? (
                <div className="bg-[#121224]/50 border border-[#b0c4b1]/40 p-4 rounded-2xl space-y-4 text-sm text-[#4a5759] leading-relaxed md:max-h-[260px] md:overflow-y-auto no-scrollbar">
                  {displayItinerario.split('\n\n').map((parrafo, i) => (
                    <p key={i} className="relative pl-4 border-l border-[#4a5759]/30 hover:border-[#4a5759] transition-colors py-0.5">
                      {parrafo}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="bg-[#121224]/50 border border-[#b0c4b1]/40 p-5 rounded-2xl text-center text-xs text-[#6c7a7c]/80 italic">
                  No se ha registrado un itinerario detallado para este tour.
                </div>
              )}
            </div>

            {/* Exclusiones / Servicios Excluidos */}
            {displayExclusiones && displayExclusiones.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#4a5759] uppercase tracking-wider flex items-center gap-2">
                  <X className="w-4 h-4 text-[#4a5759]" />
                  Servicios Excluidos
                </h3>
                <ul className="bg-[#121224]/50 border border-[#b0c4b1]/40 p-4 rounded-2xl space-y-2 text-xs text-[#6c7a7c]">
                  {displayExclusiones.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#4a5759] font-black">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Botón cancelar — desktop only */}
          <div className="pt-6 hidden md:block">
            <button
              onClick={onClose}
              className="text-xs text-[#6c7a7c] hover:text-[#4a5759] font-semibold transition-colors"
            >
              ← Volver al catálogo
            </button>
          </div>
        </div>

        {/* 3. Columna Derecha: Servicios por Categoría, Precios y Pago */}
        <div className="w-full md:w-[30%] p-5 md:p-8 flex flex-col justify-between bg-[#121224]/30 md:h-full md:overflow-y-auto no-scrollbar">
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] text-[#4a5759] font-extrabold uppercase tracking-widest">Inclusiones</span>
              <h3 className="font-extrabold text-[#4a5759] text-base md:text-lg">Servicios Incluidos</h3>
              <p className="text-xs text-[#6c7a7c] leading-relaxed hidden md:block">
                Pasa el cursor sobre cada categoría para ver los detalles.
              </p>
              <p className="text-xs text-[#6c7a7c] leading-relaxed md:hidden">
                Toca una categoría para ver los detalles.
              </p>
            </div>

            {/* Grid de 6 Categorías — tap toggle on mobile, hover on desktop */}
            <div className="grid grid-cols-2 gap-3 relative">
              {itemsCategorias.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeTooltip === cat.id;

                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setActiveTooltip(cat.id)}
                    onMouseLeave={() => setActiveTooltip(null)}
                    onClick={() => setActiveTooltip(isActive ? null : cat.id)}
                    className={`relative p-3 md:p-4 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${isActive ? 'border-[#4a5759]/40' : 'hover:border-[#4a5759]/30'} ${cat.color} group`}
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6 mb-1.5 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-[9px] md:text-[10px] font-bold text-[#4a5759]/90 leading-tight">{cat.label}</span>

                    {/* Tooltip — works on hover (desktop) and tap (mobile) */}
                    {isActive && (
                      <div className="absolute z-30 left-1/2 -translate-x-1/2 bottom-[110%] w-52 md:w-56 bg-[#f7e1d7] border border-[#b0c4b1] p-3 md:p-4 rounded-2xl shadow-2xl animate-fade-in text-left">
                        <div className="text-[10px] text-[#4a5759] font-bold uppercase tracking-wider mb-2">
                          {cat.label}
                        </div>
                        <ul className="space-y-1.5">
                          {cat.list.map((item, index) => (
                            <li key={index} className="text-xs text-[#4a5759] flex items-start gap-1.5 leading-snug">
                              <span className="text-[#4a5759] font-bold mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Financiera y Botón de Acción Principal */}
          <div className="pt-5 space-y-3 md:space-y-4">
            <div className="bg-[#121224] border border-[#b0c4b1]/50 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-[#6c7a7c] block uppercase font-bold tracking-wider">Precio Adulto</span>
                <span className="text-base font-extrabold text-[#4a5759]">${displayPrecioAdulto} USD</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#6c7a7c] block uppercase font-bold tracking-wider">Cupos</span>
                <span className="text-xs bg-[#4a5759]/10 text-[#4a5759] px-2.5 py-0.5 rounded-full font-bold">
                  {displayCupos} libres
                </span>
              </div>
            </div>

            <button
              onClick={() => onProceed(selectedDuration)}
              className="w-full flex items-center justify-center gap-2 bg-[#4a5759] hover:bg-[#384244] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#4a5759]/20 hover:shadow-[#4a5759]/30 transition-all duration-300 text-sm"
            >
              Proceder al Registro
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Mobile back button */}
            <button
              onClick={onClose}
              className="w-full text-center text-xs text-[#6c7a7c]/80 hover:text-[#4a5759] font-semibold transition-colors py-2 md:hidden"
            >
              ← Volver al catálogo
            </button>
          </div>
        </div>

      </div>

      {/* Lightbox de Galería en Tamaño Completo */}
      {lightboxIndex !== null && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLightboxIndex(null);
            }
          }}
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-fade-in"
        >
          {/* Botón Cerrar */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 z-50 text-[#6c7a7c] hover:text-[#4a5759] p-3 bg-black/5 rounded-xl border border-black/10 transition-all hover:bg-black/10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Botón Anterior */}
          {imagenes.length > 1 && (
            <button
              onClick={() => setLightboxIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length)}
              className="absolute left-6 z-50 text-[#6c7a7c] hover:text-[#4a5759] p-3 bg-black/5 rounded-xl border border-black/10 transition-all hover:bg-black/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Imagen Activa */}
          <div className="relative max-w-4xl w-full h-[75vh] flex items-center justify-center select-none">
            <img
              src={
                imagenes[lightboxIndex].url.startsWith('http')
                  ? imagenes[lightboxIndex].url
                  : `${API_ASSETS_URL}${imagenes[lightboxIndex].url}`
              }
              alt={`Galería ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-scale-up"
            />
          </div>

          {/* Botón Siguiente */}
          {imagenes.length > 1 && (
            <button
              onClick={() => setLightboxIndex((prev) => (prev + 1) % imagenes.length)}
              className="absolute right-6 z-50 text-[#6c7a7c] hover:text-[#4a5759] p-3 bg-black/5 rounded-xl border border-black/10 transition-all hover:bg-black/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Indicador de Páginas */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 border border-black/10 px-4 py-1.5 rounded-full text-xs text-[#4a5759] font-bold tracking-wider">
            {lightboxIndex + 1} / {imagenes.length}
          </div>
        </div>
      )}
    </div>
  );
}
