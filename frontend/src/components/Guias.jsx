'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher, API_ASSETS_URL } from '@/lib/api';
import { Sparkles, Languages, Award, Footprints, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// Fondos de respaldo de tours de alta montaña en caso de carga inicial
const DEFAULT_TOUR_BG_IMAGES = [
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1920&q=85', // Montañas andinas y lagunas
  'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=1920&q=85', // Montaña de 7 Colores
  'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&w=1920&q=85', // Machu Picchu y Valle Sagrado
  'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?auto=format&fit=crop&w=1920&q=85', // Salkantay glaciar
];

export default function Guias() {
  const [activeGuiaId, setActiveGuiaId] = useState(null);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useLanguage();

  // 1. Cargar guías de la base de datos
  const { data: responseGuias } = useSWR('/guias?activo=true', fetcher);
  const dbGuias = responseGuias?.data || [];

  // 2. Cargar fotos de los tours para el carrusel de fondo en full screen
  const { data: responseTours } = useSWR('/tours?activo=true', fetcher);
  const dbTours = responseTours?.data || [];

  // Extraer todas las imágenes reales de los tours cargados
  const tourImages = (() => {
    const extracted = [];
    if (Array.isArray(dbTours)) {
      dbTours.forEach((tour) => {
        if (Array.isArray(tour.imagenes)) {
          tour.imagenes.forEach((img) => {
            const url = img.url?.startsWith('http') ? img.url : `${API_ASSETS_URL}${img.url}`;
            if (url && !extracted.includes(url)) extracted.push(url);
          });
        }
      });
    }
    return extracted.length > 0 ? extracted : DEFAULT_TOUR_BG_IMAGES;
  })();

  // Rotación automática suave del carrusel de fondo cada 6 segundos
  useEffect(() => {
    if (tourImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % tourImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [tourImages.length]);

  // Agrupar los guías en bloques de 3 para mantener el grid de 3 en desktop
  const chunkSize = 3;
  const slides = [];
  for (let i = 0; i < dbGuias.length; i += chunkSize) {
    slides.push(dbGuias.slice(i, i + chunkSize));
  }

  // Si no hay suficientes para más de 1 slide, usamos al menos 1
  const totalSlides = Math.max(1, slides.length);

  // Transición automática del carrusel de guías hacia arriba cada 4 segundos
  useEffect(() => {
    if (totalSlides <= 1 || isHovered || activeGuiaId !== null) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(timer);
  }, [totalSlides, isHovered, activeGuiaId]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const toggleActiveGuia = (id) => {
    setActiveGuiaId((prev) => (prev === id ? null : id));
  };

  if (dbGuias.length === 0) {
    return null;
  }

  return (
    <section
      id="guias"
      className="min-h-screen py-10 md:py-14 lg:py-8 px-4 sm:px-6 flex flex-col justify-center border-t border-white/10 relative overflow-hidden scroll-mt-[76px] md:scroll-mt-[84px] bg-[#090a10]"
    >
      {/* ── 1. CARRUSEL DE FOTOS DE TOURS EN FULL SCREEN (FONDO) ── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {tourImages.map((imgUrl, idx) => (
          <div
            key={imgUrl + idx}
            className={`absolute inset-0 w-full h-full transition-opacity duration-2000 ease-in-out ${idx === currentBgIndex ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <img
              src={imgUrl}
              alt="Tour Landscape Background"
              className={`w-full h-full object-cover transition-transform duration-[7000ms] ease-out ${idx === currentBgIndex ? 'scale-105' : 'scale-100'
                }`}
            />
          </div>
        ))}

        {/* Capas de oscurecimiento y gradientes cinematográficos para contraste premium */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60"></div>
        <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/90"></div>
      </div>

      {/* ── 2. CONTENIDO PRINCIPAL ADAPTADO AL VIEWPORT ── */}
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-7 w-full relative z-10 my-auto">

        {/* Encabezado con tipografía clara y proporcionada a la pantalla */}
        <div className="text-center space-y-2 max-w-4xl mx-auto">
          <span className="text-[10px] md:text-[11px] text-white font-extrabold uppercase tracking-widest bg-white/10 border border-white/20 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-lg backdrop-blur-md">
            <Footprints className="w-3.5 h-3.5 text-[#84dcc6] animate-pulse" />
            {t('guias.badge')}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
            {t('guias.title')}
          </h2>
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-200 tracking-tight drop-shadow">
            {t('guias.sub')}
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed drop-shadow max-w-3xl mx-auto hidden sm:block">
            {t('guias.body1')}
          </p>
          <p className="text-[11px] sm:text-xs text-gray-400 italic pt-1 border-t border-white/10 max-w-2xl mx-auto">
            {t('guias.desc')}
          </p>
        </div>

        {/* ── 3. CONTENEDOR DEL CARRUSEL (EXACTAMENTE 1 BLOQUE DE 3 TARJETAS VISIBLE) ── */}
        <div
          className="relative px-0 sm:px-12"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Flecha Izquierda (si hay más de 1 bloque) */}
          {totalSlides > 1 && (
            <button
              onClick={prevSlide}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-black/60 hover:bg-[#c5a880] text-white hover:text-black border border-[#c5a880]/40 transition-all duration-300 shadow-xl backdrop-blur-md cursor-pointer hover:scale-110 active:scale-95"
              aria-label="Ver guías anteriores"
              title="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Flecha Derecha (si hay más de 1 bloque) */}
          {totalSlides > 1 && (
            <button
              onClick={nextSlide}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-black/60 hover:bg-[#c5a880] text-white hover:text-black border border-[#c5a880]/40 transition-all duration-300 shadow-xl backdrop-blur-md cursor-pointer hover:scale-110 active:scale-95"
              aria-label="Ver siguientes guías"
              title="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Viewport del carrusel con máscara horizontal (1 bloque de 3 tarjetas a la vez) */}
          <div className="w-full overflow-hidden">
            <div
              className="w-full flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
              }}
            >
              {slides.map((group, slideIdx) => (
                <div
                  key={slideIdx}
                  className="w-full shrink-0 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 py-2 items-stretch"
                >
                  {group.map((guia) => {
                    const guiaImg = guia.foto
                      ? guia.foto.startsWith('http')
                        ? guia.foto
                        : `${API_ASSETS_URL}${guia.foto}`
                      : '';

                    return (
                      <div
                        key={guia.id}
                        className="relative rounded-2xl md:rounded-3xl p-6 md:p-7 flex flex-col justify-between transition-all duration-300 bg-[#0e1411]/40 hover:bg-[#121a16]/50 border border-[#c5a880]/30 hover:border-[#c5a880]/70 shadow-2xl backdrop-blur-md group"
                      >
                        {/* ── Parte Superior: Avatar Circular con Halo Cálido y Títulos ── */}
                        <div className="flex flex-col items-center text-center space-y-4">
                          {/* Avatar Circular */}
                          <div className="relative">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#d4af37]/60 shadow-[0_0_25px_rgba(212,175,55,0.25)] group-hover:scale-105 group-hover:border-[#d4af37] transition-all duration-500 bg-black/40">
                              <img
                                src={guiaImg}
                                alt={guia.nombre}
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                          </div>

                          {/* Nombre del Guía */}
                          <div className="space-y-1">
                            <h4 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide leading-snug drop-shadow-sm group-hover:text-[#f3e5ab] transition-colors">
                              {guia.nombre}
                            </h4>
                            {/* Rol / Especialidad en dorado */}
                            <p className="text-xs sm:text-[13px] font-semibold text-[#d4af37] tracking-normal leading-relaxed">
                              {guia.rol}
                            </p>
                          </div>

                          {/* Descripción / Bio */}
                          {guia.descripcion && (
                            <p className="text-xs sm:text-[12.5px] text-gray-300/90 leading-relaxed font-normal line-clamp-4 text-center px-1">
                              {guia.descripcion}
                            </p>
                          )}
                        </div>

                        {/* ── Parte Inferior: Experiencia e Idiomas ── */}
                        <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-xs sm:text-[12px]">
                          {/* Experiencia */}
                          {guia.experiencia && (
                            <div className="flex items-center justify-between gap-2 text-gray-300">
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <Award className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                                <span>{t('guias.experiencia')}:</span>
                              </div>
                              <span className="font-bold text-white text-right">
                                {guia.experiencia}
                              </span>
                            </div>
                          )}

                          {/* Idiomas */}
                          {guia.idiomas && (
                            <div className="flex items-center justify-between gap-2 text-gray-300">
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <Languages className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                                <span>{t('guias.idiomas')}:</span>
                              </div>
                              <span className="font-bold text-white text-right">
                                {guia.idiomas}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Indicadores de Paginación / Puntos (si hay más de 1 bloque) */}
          {totalSlides > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={prevSlide}
                className="flex sm:hidden p-1.5 rounded-full bg-black/60 text-white border border-[#c5a880]/40"
                aria-label="Bloque anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`rounded-full transition-all duration-500 cursor-pointer ${currentSlide === idx
                      ? 'w-7 h-2 bg-[#d4af37]'
                      : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                      }`}
                    aria-label={`Ir al bloque ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={nextSlide}
                className="flex sm:hidden p-1.5 rounded-full bg-black/60 text-white border border-[#c5a880]/40"
                aria-label="Siguiente bloque"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
