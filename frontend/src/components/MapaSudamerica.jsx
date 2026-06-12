'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';

export default function MapaSudamerica({ filtroPais, setFiltroPais }) {
  const [hoveredPais, setHoveredPais] = useState(null);

  // Datos de los países interactivos
  const paises = [
    {
      id: 'Colombia',
      nombre: 'Colombia',
      // Path estilizado simplificado para Colombia
      path: 'M 140 50 Q 180 30, 190 70 Q 170 120, 150 120 Q 100 80, 140 50 Z',
      color: 'fill-indigo-500/20 hover:fill-indigo-500/40',
      activeColor: 'fill-[#4a5759]/40 stroke-[#4a5759]',
      pinX: '150',
      pinY: '95',
      capital: 'Bogotá',
    },
    {
      id: 'Perú',
      nombre: 'Perú',
      // Path estilizado simplificado para Perú
      path: 'M 120 100 Q 120 110, 80 130 Q 100 160, 110 210 Q 150 230, 140 110 Z',
      color: 'fill-emerald-500/20 hover:fill-emerald-500/40',
      activeColor: 'fill-[#4a5759]/40 stroke-[#4a5759]',
      pinX: '105',
      pinY: '170',
      capital: 'Lima',
    },
    {
      id: 'Chile',
      nombre: 'Chile',
      // Path estilizado simplificado para Chile (largo y delgado)
      path: 'M 160 220 Q 170 210, 175 250 T 140 400 Q 125 430, 135 410 T 155 220 Z',
      color: 'fill-amber-500/20 hover:fill-amber-500/40',
      activeColor: 'fill-[#4a5759]/40 stroke-[#4a5759]',
      pinX: '150',
      pinY: '310',
      capital: 'Santiago',
    },
  ];

  // Resto de Sudamérica (Países de Fondo Inactivos)
  const backgroundPaises = [
    { nombre: 'Ecuador', path: 'M 100 60 Q 135 80, 140 80 Q 120 110, 80 100 Z' },
    { nombre: 'Venezuela', path: 'M 185 45 Q 230 25, 260 50 Q 240 75, 195 70 Z' },
    { nombre: 'Guayanas', path: 'M 260 50 Q 295 55, 305 75 L 285 90 L 240 75 Z' },
    { nombre: 'Bolivia', path: 'M 180 200 Q 220 200, 220 250 L 175 260 L 165 230 Z' },
    { nombre: 'Paraguay', path: 'M 220 250 Q 245 255, 240 285 L 210 290 Z' },
    { nombre: 'Uruguay', path: 'M 230 350 L 250 345 Q 255 365, 240 370 Z' },
    { nombre: 'Argentina', path: 'M 165 260 L 210 290 L 230 350 L 240 370 L 195 420 L 150 420 L 165 290 Z' },
    { nombre: 'Brasil', path: 'M 185 70 Q 240 75, 285 90 L 305 75 Q 360 100, 380 160 Q 370 240, 310 290 Q 245 330, 220 250 Q 220 200, 180 200 Q 190 150, 185 70 Z' },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 bg-[#ffffff] border border-[#b0c4b1]/40 rounded-3xl relative overflow-hidden select-none">
      {/* Luces de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/5 rounded-full filter blur-[80px] pointer-events-none -z-10"></div>

      {/* Header del Mapa */}
      <div className="space-y-1 z-10">
        <span className="text-[10px] text-[#4a5759] font-extrabold uppercase tracking-widest">
          Mapa de Destinos
        </span>
        <h3 className="font-extrabold text-[#4a5759] text-xl">Filtro Interactivo</h3>
        <p className="text-xs text-[#6c7a7c]">
          Haz click en un país para ver los tours disponibles.
        </p>
      </div>

      {/* Contenedor del Gráfico SVG */}
      <div className="flex-1 flex items-center justify-center py-4 relative min-h-[500px]">
        <svg
          viewBox="80 20 320 400"
          className="w-full h-full max-h-[580px] transition-all"
        >
          {/* Imagen de fondo de Sudamérica (Topográfica) */}
          <image
            href="/mapa-sudamerica.png"
            x="36"
            y="0"
            width="380"
            height="490"
            preserveAspectRatio="xMidYMid meet"
            className="opacity-35 pointer-events-none"
          />

          {/* Países de Fondo (Inactivos) */}
          {backgroundPaises.map((pais, i) => (
            <path
              key={i}
              d={pais.path}
              onMouseEnter={() => setHoveredPais(pais.nombre)}
              onMouseLeave={() => setHoveredPais(null)}
              className="fill-white/[0.02] stroke-white/[0.06] stroke-1 hover:fill-white/[0.05] transition-all duration-300 cursor-default"
            />
          ))}

          {/* Países Interactivos */}
          {paises.map((pais) => {
            const isActive = filtroPais === pais.nombre;
            const isHovered = hoveredPais === pais.id;

            return (
              <g key={pais.id}>
                {/* Contorno / Relleno del País */}
                <path
                  d={pais.path}
                  onClick={() => setFiltroPais(isActive ? 'Todos' : pais.nombre)}
                  onMouseEnter={() => setHoveredPais(pais.id)}
                  onMouseLeave={() => setHoveredPais(null)}
                  className={`cursor-pointer transition-all duration-300 stroke-1 ${isActive
                    ? pais.activeColor + ' stroke-[1.5px]'
                    : isHovered
                      ? 'fill-[#4a5759]/20 stroke-[#4a5759]/40'
                      : pais.color + ' stroke-white/[0.15]'
                    }`}
                />

                {/* Marcador del País con pulsación si está seleccionado */}
                <g
                  transform={`translate(${pais.pinX}, ${pais.pinY})`}
                  className="pointer-events-none"
                >
                  {isActive && (
                    <circle
                      r="12"
                      className="fill-[#4a5759]/20 stroke-[#4a5759]/40 stroke-1 animate-ping"
                    />
                  )}
                  <circle
                    r="5"
                    className={`transition-all duration-300 ${isActive ? 'fill-[#4a5759]' : 'fill-white/60'
                      }`}
                  />
                </g>
              </g>
            );
          })}
        </svg>

        {/* Info panel flotante sobre el país hovered */}
        {hoveredPais && (
          <div className="absolute bottom-4 right-4 glass p-4 rounded-2xl animate-fade-in pointer-events-none">
            <span className="text-[10px] text-[#4a5759] font-bold uppercase tracking-wider">
              {paises.some((p) => p.id === hoveredPais) ? 'Destino Disponible' : 'Próximamente'}
            </span>
            <div className="font-extrabold text-[#4a5759] text-lg leading-tight">
              {hoveredPais}
            </div>
            {paises.some((p) => p.id === hoveredPais) && (
              <div className="text-[10px] text-[#6c7a7c] mt-0.5">
                Capital: {paises.find((p) => p.id === hoveredPais)?.capital}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Selector de Todos */}
      <div className="flex justify-between items-center z-10 border-t border-[#b0c4b1]/50 pt-4">
        <div className="text-xs text-[#6c7a7c]">
          Mostrando:{' '}
          <span className="text-[#4a5759] font-bold">
            {filtroPais === 'Todos' ? 'Todos los países' : filtroPais}
          </span>
        </div>

        {filtroPais !== 'Todos' && (
          <button
            onClick={() => setFiltroPais('Todos')}
            className="text-xs bg-[#4a5759]/10 hover:bg-[#4a5759] text-white hover:text-[#4a5759] border border-[#4a5759]/20 hover:border-transparent px-3 py-1.5 rounded-xl font-semibold transition-all duration-200"
          >
            Limpiar Filtro
          </button>
        )}
      </div>
    </div>
  );
}
