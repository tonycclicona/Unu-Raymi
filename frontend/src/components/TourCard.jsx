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
    }, 500);

    return () => clearInterval(interval);
  }, [imagenes.length]);

  const currentImage = imagenes[currentImageIndex]?.url;

  return (
    <div className="bg-[#16162a]/40 border border-[#2b2b46]/50 rounded-2xl overflow-hidden flex flex-col sm:flex-row group hover:border-[#e94560]/30 transition-all duration-300 shadow-md">
      {/* Imagen */}
      <div className="w-full sm:w-2/5 h-48 sm:h-auto relative overflow-hidden bg-[#121224]">
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
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
          <span className="bg-[#0f0f1a]/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[9px] font-extrabold text-[#e94560] uppercase tracking-wider">
            {tour.pais}
          </span>
          {tour.ciudad && (
            <span className="bg-[#121224]/90 backdrop-blur-md border border-[#2b2b46]/50 px-2.5 py-1 rounded-full text-[9px] font-bold text-gray-300 uppercase tracking-wider">
              {tour.ciudad}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-gray-400">
            {hasVariants ? (
              <div className="flex flex-wrap gap-1.5 items-center">
                <Calendar className="w-3.5 h-3.5 text-[#e94560]" />
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
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold transition-all border ${
                        isSelected
                          ? 'bg-[#e94560] text-white border-transparent'
                          : 'bg-[#121224]/80 hover:bg-[#2b2b46]/50 text-gray-400 hover:text-white border-[#2b2b46]'
                      }`}
                    >
                      {v.duracion_dias} {v.duracion_dias === 1 ? 'Día' : 'Días'}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#e94560]" />
                {displayDuration} {displayDuration === 1 ? 'Día' : 'Días'}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              {displayCupos} Cupos libres
            </span>
            {tour.categoria && (
              <span className="bg-[#e94560]/10 text-[#e94560] border border-[#e94560]/20 px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider">
                {tour.categoria}
              </span>
            )}
          </div>

          <h3 className="font-extrabold text-white text-lg leading-snug group-hover:text-[#e94560] transition-colors line-clamp-1">
            {tour.nombre}
          </h3>

          <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
            {tour.descripcion}
          </p>
        </div>

        {/* Footer Tarjeta */}
        <div className="flex items-center justify-between border-t border-[#2b2b46]/50 pt-4">
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Desde</span>
            <span className="text-lg font-black text-white flex items-center">
              <DollarSign className="w-4 h-4 text-emerald-400 -mr-0.5" />
              {displayPrecio} <span className="text-[10px] text-gray-400 font-normal ml-1">USD</span>
            </span>
          </div>

          <button
            onClick={() => onReservar(tour, displayDuration)}
            className="flex items-center gap-1.5 bg-[#e94560] hover:bg-[#ff5c77] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-[#e94560]/10 hover:shadow-[#e94560]/20 transition-all duration-300 group/btn"
          >
            Reservar
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
