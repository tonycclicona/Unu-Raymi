'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Calendar, Users, DollarSign, ArrowRight } from 'lucide-react';
import { API_ASSETS_URL } from '../lib/api';

export default function TourCard({ tour, onReservar }) {
  const imagenes = tour.imagenes || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasVariants = tour.variantes && tour.variantes.length > 0;
  const [selectedDuration, setSelectedDuration] = useState(() => {
    if (hasVariants) return tour.variantes[0].duracion_dias;
    return tour.duracion_dias;
  });

  const activeVariant = hasVariants
    ? tour.variantes.find(v => v.duracion_dias === selectedDuration) || tour.variantes[0]
    : null;

  const displayDuration = activeVariant ? activeVariant.duracion_dias : tour.duracion_dias;
  const displayPrecio = activeVariant ? activeVariant.precio_adulto : tour.precio_adulto;
  const displayCupos = activeVariant ? activeVariant.cupos_disponibles : tour.cupos_disponibles;

  useEffect(() => {
    if (imagenes.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagenes.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [imagenes.length]);

  const currentImage = imagenes[currentImageIndex]?.url;

  return (
    <div className="bg-[var(--card)]/40 border border-[var(--border)]/50 rounded-2xl overflow-hidden flex flex-col sm:flex-row group hover:border-[var(--accent)]/30 transition-all duration-300 shadow-md">
      {/* Imagen */}
      <div className="w-full sm:w-2/5 h-52 sm:h-auto relative overflow-hidden bg-[var(--card)] flex-shrink-0">
        {currentImage ? (
          <Image
            src={currentImage.startsWith('http') ? currentImage : `${API_ASSETS_URL}${currentImage}`}
            alt={tour.nombre}
            fill
            sizes="(max-width: 640px) 100vw, 40vw"
            loading="lazy"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]/80">
            No Image
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="bg-[var(--background)]/80  border border-black/10 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[var(--foreground)] uppercase tracking-wider">
            {tour.pais}
          </span>
          {tour.ciudad && (
            <span className="bg-[var(--card)]  border border-[var(--border)]/50 px-2.5 py-1 rounded-full text-[10px] font-bold text-[var(--foreground)] uppercase tracking-wider">
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
                  const isSelected = selectedDuration === v.duracion_dias;
                  return (
                    <button
                      key={v.duracion_dias}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDuration(v.duracion_dias);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition-all border ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white border-transparent'
                          : 'bg-white hover:bg-[var(--border)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-[var(--border)]'
                      }`}
                    >
                      {v.duracion_dias} {v.duracion_dias === 1 ? 'Día' : 'Días'}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--foreground)]" />
                {displayDuration} {displayDuration === 1 ? 'Día' : 'Días'}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              {displayCupos} Cupos libres
            </span>
            {tour.categoria && (
              <span className="bg-[var(--accent)]/10 text-[var(--foreground)] border border-[var(--accent)]/20 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                {tour.categoria}
              </span>
            )}
          </div>

          <h3 className="font-extrabold text-[var(--foreground)] text-base md:text-lg leading-snug group-hover:text-[var(--foreground)] transition-colors line-clamp-2">
            {tour.nombre}
          </h3>

          <p className="text-[var(--muted-foreground)] text-xs md:text-sm line-clamp-2 leading-relaxed">
            {tour.descripcion}
          </p>
        </div>

        {/* Footer Tarjeta */}
        <div className="flex items-center justify-between border-t border-[var(--border)]/50 pt-2 gap-2">
          <div>
            <span className="text-xs text-[var(--muted-foreground)]/80 block uppercase font-bold tracking-wider">Desde</span>
            <span className="text-xl font-black text-[var(--foreground)] flex items-center">
              <DollarSign className="w-4 h-4 text-emerald-400 -mr-0.5" />
              {displayPrecio} <span className="text-xs text-[var(--muted-foreground)] font-normal ml-1">USD</span>
            </span>
          </div>

          <button
            onClick={() => onReservar(tour, displayDuration)}
            className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-[var(--accent)]/10 hover:shadow-[var(--accent)]/20 transition-all duration-300 group/btn whitespace-nowrap"
          >
            Reservar
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
