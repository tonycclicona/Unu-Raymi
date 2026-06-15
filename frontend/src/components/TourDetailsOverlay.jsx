'use client';

import { useState, useEffect } from 'react';
import { X, Compass, Shield, Backpack, Utensils, Bus, Camera, ArrowRight, Calendar, MapPin, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_ASSETS_URL } from '../lib/api';
import { useLanguage } from '@/context/LanguageContext';

export default function TourDetailsOverlay({ tour, initialDuration, onClose, onProceed, isShifted }) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const imagenes = tour.imagenes || [];
  const { t, language } = useLanguage();

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
    }, 3000);
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
      guia: rawCategorias.guia?.length > 0 ? rawCategorias.guia : [language === 'es' ? 'Guía local profesional en español' : 'Professional local guide in English'],
      seguridad: rawCategorias.seguridad?.length > 0 ? rawCategorias.seguridad : [language === 'es' ? 'Botiquín de primeros auxilios y protocolos de seguridad' : 'First aid kit and safety protocols'],
      equipamiento: rawCategorias.equipamiento?.length > 0 ? rawCategorias.equipamiento : (language === 'es' ? ['Ropa de abrigo o impermeable', 'Calzado cómodo de caminata'] : ['Warm or waterproof clothing', 'Comfortable hiking shoes']),
      alimentacion: rawCategorias.alimentacion?.length > 0 ? rawCategorias.alimentacion : [language === 'es' ? 'Alimentación no incluida (opciones en la ruta)' : 'Food not included (options along the route)'],
      transporte: rawCategorias.transporte?.length > 0 ? rawCategorias.transporte : [language === 'es' ? 'Traslados incluidos en el punto de encuentro' : 'Transfers included at the meeting point'],
      actividades: rawCategorias.actividades?.length > 0 ? rawCategorias.actividades : [language === 'es' ? 'Caminatas y explicaciones culturales según itinerario' : 'Hikes and cultural explanations according to the itinerary']
    };
  };

  const categorias = getCategorias();

  const itemsCategorias = [
    { id: 'guia', label: language === 'es' ? 'Guías y Dirección' : 'Guides & Direction', icon: Compass, list: categorias.guia, color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
    { id: 'seguridad', label: language === 'es' ? 'Seguridad y Asistencia' : 'Safety & Assistance', icon: Shield, list: categorias.seguridad, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { id: 'equipamiento', label: language === 'es' ? 'Equipamiento Requerido' : 'Required Equipment', icon: Backpack, list: categorias.equipamiento, color: 'text-amber-400 border-emerald-500/20 bg-emerald-500/5' },
    { id: 'alimentacion', label: language === 'es' ? 'Alimentación y Bebidas' : 'Food & Drinks', icon: Utensils, list: categorias.alimentacion, color: 'text-rose-400 border-rose-500/20 bg-rose-500/5' },
    { id: 'transporte', label: language === 'es' ? 'Transporte y Logística' : 'Transport & Logistics', icon: Bus, list: categorias.transporte, color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
    { id: 'actividades', label: language === 'es' ? 'Tickets y Actividades' : 'Tickets & Activities', icon: Camera, list: categorias.actividades, color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
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
      className={`fixed inset-0 z-50 bg-[var(--background)]/50  flex items-center transition-all duration-500 ease-in-out p-2 sm:p-4 ${isShifted
        ? 'justify-start md:pl-12 md:pr-[600px]'
        : 'justify-center md:p-4'
        }`}
    >
      {/* Contenedor Principal */}
      <div className="glass max-w-7.1xl w-full rounded-2xl md:rounded-3xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row h-[95vh] max-h-[96vh] md:h-[94vh] md:max-h-[95vh] shadow-2xl relative border border-black/5">

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-2.5 bg-[var(--sidebar)] rounded-xl border border-black/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. GALERIA DE IMAGENES */}
        <div className="w-full md:w-[25%] lg:w-[22%] border-b md:border-b-0 md:border-r border-[var(--border)]/50 bg-[var(--sidebar)] md:h-full md:overflow-y-auto no-scrollbar">
          {/* Mobile: horizontal scroll */}
          <div className="flex gap-3 p-3 overflow-x-auto no-scrollbar md:hidden">
            {imagenes.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-[var(--border)]/50 cursor-pointer shadow-md"
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
                className="relative aspect-square rounded-2xl overflow-hidden group border border-[var(--border)]/50 cursor-pointer shadow-md hover:scale-[1.12] hover:z-30 hover:shadow-[0_20px_50px_rgba(233,69,96,0.3)] hover:border-[var(--accent)]/50 transition-all duration-300 ease-out"
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

        {/* 2. Columna Central */}
        <div className="w-full md:w-[45%] lg:w-[48%] p-5 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--border)]/50 md:h-full md:overflow-y-auto no-scrollbar">
          <div className="space-y-5">
            {/* Header del Tour */}
            <div className="space-y-3 pr-8">
              <div className="flex items-center gap-2">
                <span className="bg-[var(--accent)]/10 text-[var(--foreground)] border border-[var(--accent)]/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {tour.pais}
                </span>
                <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[var(--foreground)]" />
                  {displayDuration} {displayDuration === 1 ? t('tour_card.dia') : t('tour_card.dias')}
                </span>
              </div>
              <h2 className="text-xl md:text-3xl font-black text-[var(--foreground)] leading-tight">{tour.nombre}</h2>
              <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">{tour.descripcion}</p>
            </div>

            {/* Multi-duration Toggle Tabs */}
            {hasVariants && (
              <div className="bg-[var(--card)] border border-[var(--border)]/40 p-4 rounded-2xl space-y-2.5">
                <span className="text-[10px] text-[var(--muted-foreground)] block uppercase font-bold tracking-wider">{t('tour_details.seleccionar_duracion')}</span>
                <div className="flex flex-wrap gap-2">
                  {tour.variantes.map((v) => {
                    const isSelected = selectedDuration === v.duracion_dias;
                    return (
                      <button
                        key={v.duracion_dias}
                        onClick={() => setSelectedDuration(v.duracion_dias)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${isSelected
                          ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20'
                          : 'bg-[var(--card)] hover:bg-[var(--border)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]'
                          }`}
                      >
                        {v.duracion_dias} {v.duracion_dias === 1 ? t('tour_card.dia') : t('tour_card.dias')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Itinerario del Tour */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--foreground)]" />
                {t('tour_details.itinerario')}
              </h3>

              {displayItinerario ? (
                <div className="bg-[var(--card)] border border-[var(--border)]/40 p-4 rounded-2xl space-y-4 text-sm text-[var(--foreground)] leading-relaxed md:max-h-[260px] md:overflow-y-auto no-scrollbar">
                  {displayItinerario.split('\n\n').map((parrafo, i) => (
                    <p key={i} className="relative pl-4 border-l border-[var(--accent)]/30 hover:border-[var(--accent)] transition-colors py-0.5">
                      {parrafo}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="bg-[var(--card)] border border-[var(--border)]/40 p-5 rounded-2xl text-center text-xs text-[var(--muted-foreground)]/80 italic">
                  {language === 'es' ? 'No se ha registrado un itinerario detallado para este tour.' : 'No detailed itinerary has been registered for this tour.'}
                </div>
              )}
            </div>

            {/* Exclusiones */}
            {displayExclusiones && displayExclusiones.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                  <X className="w-4 h-4 text-[var(--foreground)]" />
                  {language === 'es' ? 'Servicios Excluidos' : 'Excluded Services'}
                </h3>
                <ul className="bg-[var(--card)] border border-[var(--border)]/40 p-4 rounded-2xl space-y-2 text-xs text-[var(--muted-foreground)]">
                  {displayExclusiones.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[var(--foreground)] font-black">•</span>
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
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-semibold transition-colors"
            >
              {language === 'es' ? '← Volver al catálogo' : '← Back to catalog'}
            </button>
          </div>
        </div>

        {/* 3. Columna Derecha */}
        <div className="w-full md:w-[30%] p-5 md:p-8 flex flex-col justify-between bg-[var(--card)] md:h-full md:overflow-y-auto no-scrollbar">
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--foreground)] font-extrabold uppercase tracking-widest">{language === 'es' ? 'Inclusiones' : 'Inclusions'}</span>
              <h3 className="font-extrabold text-[var(--foreground)] text-base md:text-lg">{language === 'es' ? 'Servicios Incluidos' : 'Included Services'}</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed hidden md:block">
                {language === 'es' ? 'Pasa el cursor sobre cada categoría para ver los detalles.' : 'Hover over each category to see the details.'}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed md:hidden">
                {language === 'es' ? 'Toca una categoría para ver los detalles.' : 'Tap a category to see the details.'}
              </p>
            </div>

            {/* Grid de 6 Categorías */}
            <div className="grid grid-cols-2 gap-4 relative">
              {itemsCategorias.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeTooltip === cat.id;

                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setActiveTooltip(cat.id)}
                    onMouseLeave={() => setActiveTooltip(null)}
                    onClick={() => setActiveTooltip(isActive ? null : cat.id)}
                    className={`relative p-4 md:p-6 rounded-2xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${isActive ? 'border-[var(--accent)]/40' : 'hover:border-[var(--accent)]/30'} ${cat.color} group`}
                  >
                    <Icon className="w-6 h-6 md:w-8 md:h-8 mb-2 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-[10px] md:text-xs font-extrabold text-[var(--foreground)]/90 leading-tight">{cat.label}</span>

                    {/* Tooltip */}
                    {isActive && (
                      <div className="absolute z-30 left-1/2 -translate-x-1/2 bottom-[110%] w-52 md:w-56 bg-[var(--background)] border border-[var(--border)] p-3 md:p-4 rounded-2xl shadow-2xl animate-fade-in text-left">
                        <div className="text-[10px] text-[var(--foreground)] font-bold uppercase tracking-wider mb-2">
                          {cat.label}
                        </div>
                        <ul className="space-y-1.5">
                          {cat.list.map((item, index) => (
                            <li key={index} className="text-xs text-[var(--foreground)] flex items-start gap-1.5 leading-snug">
                              <span className="text-[var(--foreground)] font-bold mt-0.5">•</span>
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

          {/* Precios y Registro */}
          <div className="pt-5 space-y-3 md:space-y-4">
            <div className="bg-[var(--card)] border border-[var(--border)]/50 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-[var(--muted-foreground)] block uppercase font-bold tracking-wider">{language === 'es' ? 'Precio Adulto' : 'Adult Price'}</span>
                <span className="text-base font-extrabold text-[var(--foreground)]">${displayPrecioAdulto} USD</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[var(--muted-foreground)] block uppercase font-bold tracking-wider">{language === 'es' ? 'Cupos' : 'Spaces'}</span>
                <span className="text-xs bg-[var(--accent)]/10 text-[var(--foreground)] px-2.5 py-0.5 rounded-full font-bold">
                  {displayCupos} {language === 'es' ? 'libres' : 'left'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onProceed(selectedDuration)}
              className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 rounded-xl font-bold shadow-lg shadow-[var(--accent)]/20 hover:shadow-[var(--accent)]/30 transition-all duration-300 text-sm"
            >
              {language === 'es' ? 'Proceder al Registro' : 'Proceed to Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Mobile back button */}
            <button
              onClick={onClose}
              className="w-full text-center text-xs text-[var(--muted-foreground)]/80 hover:text-[var(--foreground)] font-semibold transition-colors py-2 md:hidden"
            >
              {language === 'es' ? '← Volver al catálogo' : '← Back to catalog'}
            </button>
          </div>
        </div>

      </div>

      {/* Lightbox de Galería */}
      {lightboxIndex !== null && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLightboxIndex(null);
            }
          }}
          className="fixed inset-0 z-[70] bg-[var(--accent)]  flex items-center justify-center p-4 md:p-12 animate-fade-in"
        >
          {/* Botón Cerrar */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 z-50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-3 bg-[var(--sidebar)] rounded-xl border border-black/10 transition-all hover:bg-[var(--sidebar)]"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Botón Anterior */}
          {imagenes.length > 1 && (
            <button
              onClick={() => setLightboxIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length)}
              className="absolute left-6 z-50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-3 bg-[var(--sidebar)] rounded-xl border border-black/10 transition-all hover:bg-[var(--sidebar)]"
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
              className="absolute right-6 z-50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-3 bg-[var(--sidebar)] rounded-xl border border-black/10 transition-all hover:bg-[var(--sidebar)]"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Indicador de Páginas */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 border border-black/10 px-4 py-1.5 rounded-full text-xs text-[var(--foreground)] font-bold tracking-wider">
            {lightboxIndex + 1} / {imagenes.length}
          </div>
        </div>
      )}
    </div>
  );
}

