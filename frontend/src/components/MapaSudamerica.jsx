'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher, API_BASE_URL } from '@/lib/api';
import { MapPin, Compass, AlertTriangle, Navigation, X, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

import dynamic from 'next/dynamic';

const MapaSudamericaGIS = dynamic(
  () => import('@/components/MapaSudamericaGIS'),
  { ssr: false, loading: () => <div className="w-full h-full min-h-[460px] bg-[var(--card)]/50 animate-pulse rounded-3xl flex items-center justify-center text-xs text-[var(--muted-foreground)]">Cargando Mapa CyclOSM Leaflet...</div> }
);

export default function MapaSudamerica({ filtroPais, setFiltroPais, onSelectAttraction }) {
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [activeLayers, setActiveLayers] = useState({
    attractions: true,
    routes: true,
  });

  const { t, language } = useLanguage();

  // Cargar datos GIS desde el Backend API (v1 /attractions)
  const { data: v1Response } = useSWR('/v1/attractions', fetcher);
  const v1Attractions = v1Response?.data || [];

  // Al cambiar de país, reiniciar la selección si no corresponde al país activo
  useEffect(() => {
    if (selectedAttraction && filtroPais !== 'Todos') {
      const countryMatch = selectedAttraction.attraction?.country?.nombre === filtroPais;
      if (!countryMatch) {
        setSelectedAttraction(null);
      }
    }
  }, [filtroPais]);

  const fetchAttractionDetail = async (slug) => {
    try {
      const res = await fetch(`${API_BASE_URL}/gis/attraction/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAttraction(data);
        if (onSelectAttraction) {
          onSelectAttraction(data.attraction);
        }
      }
    } catch (e) {
      console.error('Error al cargar detalle del atractivo:', e);
    }
  };

  const toggleLayer = (layerKey) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const filteredAttractions = v1Attractions.filter(a => {
    if (filtroPais && filtroPais !== 'Todos' && a.tour?.pais !== filtroPais) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 lg:p-5 bg-[var(--card)] border border-[var(--border)]/40 rounded-3xl relative overflow-hidden select-none">
      {/* Luz ambiental de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[var(--accent)]/5 rounded-full filter blur-[90px] pointer-events-none -z-10"></div>

      {/* Header del Mapa (Título y selector de capas) */}
      <div className="space-y-2 z-10">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-[var(--foreground)] font-extrabold uppercase tracking-widest block">
              Módulo GIS Turístico Sudamérica
            </span>
            <h3 className="font-extrabold text-[var(--foreground)] text-xl flex items-center gap-2">
              <Compass className="w-5 h-5 text-[var(--accent)]" />
              MapaSudamerica
            </h3>
          </div>
        </div>
      </div>

      {/* Cuerpo Principal del Mapa + Panel Informativo Flotante (CyclOSM Leaflet) */}
      <div className="flex-1 w-full py-3 relative min-h-[460px] flex items-center justify-center">
        <MapaSudamericaGIS attractions={filteredAttractions} onSelectAttraction={onSelectAttraction} />
      </div>

      {/* Footer del Mapa (Filtro Activo y Atribución) */}
      <div className="flex justify-between items-center z-10 border-t border-[var(--border)]/50 pt-2.5 text-xs text-[var(--muted-foreground)]">
        <div>
          Filtro Activo: <span className="text-[var(--foreground)] font-bold">{filtroPais === 'Todos' ? 'Sudamérica Completa' : filtroPais}</span>
        </div>
        <div className="text-[10px] opacity-70">
          Datos © OpenStreetMap & Unu-Raymi GIS Engine
        </div>
      </div>
    </div>
  );
}
