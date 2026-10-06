'use client';

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { Calendar, Users, DollarSign, ArrowRight } from 'lucide-react';
import { API_ASSETS_URL, getImageUrl, handleImageFallback } from '../lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatDifficulty, getVariantLabel, getVariantKey } from '@/lib/translations';

function TourCard({ tour, onReservar }) {
  const imagenes = tour.imagenes || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const hasVariants = tour.variantes && tour.variantes.length > 0;
  const [selectedVariantKey, setSelectedVariantKey] = useState(() => {
    if (hasVariants) return getVariantKey(tour.variantes[0]);
    return 'default';
  });

  const activeVariant = hasVariants
    ? tour.variantes.find(v => getVariantKey(v) === selectedVariantKey) || tour.variantes[0]
    : null;

  const displayDuration = activeVariant ? activeVariant.duracion_dias : tour.duracion_dias;
  const displayPrecio = activeVariant ? activeVariant.precio_adulto : tour.precio_adulto;
  const displayCupos = activeVariant ? activeVariant.cupos_disponibles : tour.cupos_disponibles;

  // Solo ciclar imágenes cuando el usuario pasa el mouse sobre la tarjeta específica
  // Esto elimina re-renders continuos en segundo plano y previene los tirones de scroll
  useEffect(() => {
    if (!isHovered || imagenes.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagenes.length);
    }, 2600);

    return () => clearInterval(interval);
  }, [isHovered, imagenes.length]);

  const currentImage = imagenes[currentImageIndex]?.url || (typeof imagenes[currentImageIndex] === 'string' ? imagenes[currentImageIndex] : null);
  const localized = tour.traducciones?.[language] || {};
  const displayName = localized.nombre || tour.nombre;
  const displayDesc = localized.descripcion || tour.descripcion;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-[var(--card)]/40 border border-[var(--border)]/50 rounded-2xl overflow-hidden flex flex-col sm:flex-row group hover:border-[var(--accent)]/30 transition-colors duration-200 shadow-md"
      style={{
        contain: 'content',
        transform: 'translateZ(0)',
      }}
    >
      {/* Imagen */}
      <div className="w-full sm:w-2/5 h-52 sm:h-auto relative overflow-hidden bg-[var(--card)] flex-shrink-0">
        {currentImage ? (
          <Image
            src={getImageUrl(currentImage)}
            alt={displayName}
            fill
            sizes="(max-width: 640px) 100vw, 40vw"
            loading="lazy"
            decoding="async"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => handleImageFallback(e, currentImage)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]/80">
            {t('tour_card.sin_imagen')}
          </div>
        )}

        {/* Indicadores de imágenes disponibles */}
        {imagenes.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
            {imagenes.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(idx);
                }}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentImageIndex
                    ? 'w-3 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/90'
                }`}
                aria-label={`Ver foto ${idx + 1}`}
              />
            ))}
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="bg-[var(--background)]/80 border border-black/10 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[var(--foreground)] uppercase tracking-wider">
            {tour.pais}
          </span>
          {tour.ciudad && (
            <span className="bg-[var(--card)] border border-[var(--border)]/50 px-2.5 py-1 rounded-full text-[10px] font-bold text-[var(--foreground)] uppercase tracking-wider">
              {tour.ciudad}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2.5">
        <div className="space-y-1.5 lg:space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[var(--muted-foreground)]">
            {hasVariants ? (
              <div className="flex flex-wrap gap-1.5 items-center">
                <Calendar className="w-3.5 h-3.5 text-[var(--foreground)]" />
                {tour.variantes.map((v) => {
                  const vKey = getVariantKey(v);
                  const isSelected = selectedVariantKey === vKey;
                  const label = getVariantLabel(v, language);
                  return (
                    <button
                      key={vKey}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVariantKey(vKey);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition-all border ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white border-transparent shadow-sm'
                          : 'bg-[var(--card)] hover:bg-[var(--sidebar)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-[var(--border)]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--foreground)]" />
                {displayDuration} {displayDuration === 1 ? t('tour_card.dia') : t('tour_card.dias')}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              {displayCupos} {displayCupos === 0 ? t('tour_card.cupos_none') : t('tour_card.cupos')}
            </span>
            {tour.categoria && (
              <span className="bg-[var(--accent)]/10 text-[var(--foreground)] border border-[var(--accent)]/20 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                {tour.categoria}
              </span>
            )}
            {tour.nivel_dificultad && (
              <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                {formatDifficulty(tour.nivel_dificultad, language)}
              </span>
            )}
          </div>

          <h3 className="font-extrabold text-[var(--foreground)] text-base md:text-lg leading-snug group-hover:text-[var(--foreground)] transition-colors line-clamp-2">
            {displayName}
          </h3>

          <p className="text-[var(--muted-foreground)] text-xs md:text-sm line-clamp-2 leading-relaxed">
            {displayDesc}
          </p>
        </div>

        {/* Footer Tarjeta */}
        <div className="flex items-center justify-between border-t border-[var(--border)]/50 pt-2 gap-2">
          <div>
            <span className="text-xs text-[var(--muted-foreground)]/80 block uppercase font-bold tracking-wider">{t('tour_card.desde')}</span>
            <span className="text-lg md:text-xl font-black text-emerald-400">
              {formatPrice(displayPrecio)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onReservar(tour, displayDuration, activeVariant)}
              className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-[var(--accent)]/10 hover:shadow-[var(--accent)]/20 transition-all duration-300 group/btn whitespace-nowrap"
            >
              {t('tour_card.reservar')}
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TourCard);

