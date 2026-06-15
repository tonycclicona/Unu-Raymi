'use client';

import { useState, useEffect } from 'react';

export default function MapaSudamerica({ filtroPais, setFiltroPais }) {
  const [hoveredPais, setHoveredPais] = useState(null);
  const [hasHover, setHasHover] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasHover(window.matchMedia('(hover: hover)').matches);
    }
  }, []);

  // Datos de los países interactivos con sus paths reales de Highcharts
  const paises = [
    {
      id: 'Colombia',
      nombre: 'Colombia',
      path: "M184.8,214.8 185,213.4 186.6,212.4 188.1,210.3 187.6,209 187.6,205 186.5,203.8 187.9,202.5 187.5,201 188.3,201.3 190.9,199.5 191.1,197.4 193.8,195.9 195.4,196 198.8,193.8 199.1,194.9 197.9,195.3 196.1,197.7 195.9,199.9 197.1,201.6 197.6,204.1 201.4,204.3 202.7,205.9 206.5,205.7 205.7,209 206.8,211 205.8,212.1 207,213 207.6,215.2 206.8,213.6 205.2,214.3 201.9,214.3 201.5,217.9 202.7,220.3 201.7,225.6 200.3,224.8 201.5,222.7 199.7,221.7 197.1,222.3 195.5,221.8 194.7,219.9 191.5,217.7 189.6,216.7 187.4,216.3 184.8,214.8Z",
      color: 'fill-indigo-500/10 hover:fill-indigo-500/20 stroke-indigo-500/40',
      activeColor: 'fill-[var(--accent)]/30 stroke-[var(--accent)]',
      pinX: '196',
      pinY: '208',
      capital: 'Bogotá',
    },
    {
      id: 'Perú',
      nombre: 'Perú',
      path: "M191.5,217.7 194.7,219.9 195.5,221.8 197.1,222.3 199.7,221.7 201.5,222.7 200.3,224.8 201.7,225.6 200.1,225.5 196.1,227.4 195.7,229.7 193.9,231.9 197.4,236.6 199.4,236.5 200.6,235.5 200.5,238.6 202.5,238.5 204.2,241.5 203.4,243.7 203.8,244.7 202.8,247.4 201.6,247.9 203.4,248.7 203.5,248.6 203.6,248.7 203.4,249.2 203.5,249.4 202.3,250.8 202.6,251.2 201.7,252.6 200.9,252.8 198.8,250.8 191.7,247 189.6,244.5 189.7,243.1 187,239.2 184.5,233.2 182.6,230.5 180.4,229.2 180.1,225.6 181.9,224 181.5,225.4 184.3,227.1 185.7,224 188.8,222.5 191,220.5 191.5,217.7Z",
      color: 'fill-emerald-500/10 hover:fill-emerald-500/20 stroke-emerald-500/40',
      activeColor: 'fill-[var(--accent)]/30 stroke-[var(--accent)]',
      pinX: '190',
      pinY: '240',
      capital: 'Lima',
    },
    {
      id: 'Chile',
      nombre: 'Chile',
      path: "M195.3,330.3 197.5,331.4 196.2,332.3 194.4,330.5 195.3,330.3 M192,316.3 193,318.4 193.1,321.5 190.9,320.8 192.3,319.9 190.8,318.9 191,317 192,316.3 M194.9,303.5 194.5,305.8 192.5,306.5 193.5,305 193.9,302.5 194.9,303.5 M204.3,328.4 204.3,334 204.1,334 204.3,334.1 204.3,334.3 201.7,334 200.6,335.1 199.2,332.6 200.8,330.8 201,332.8 203.6,333.1 201.5,332.2 200.8,329.4 202.8,327.9 204.3,328.4 M200.9,252.8 201.7,252.6 202.6,251.2 203.6,254.1 204.6,255 204,257 205.1,258.6 205.7,261.7 207,261.7 206.8,264.1 204.4,265.7 204.9,270 203.9,270.5 202.3,273.1 200.5,279.7 202.1,283.5 200.9,287.4 200.9,289.4 199.7,290.3 199.4,292.9 200,295.1 199,295.6 197.9,299.7 198.3,302.8 197.5,304.9 198.5,307 197.7,309 199.2,310.3 198,314.9 196.8,316.6 197.3,317.6 194.8,320.6 195.5,323.6 197.2,323.4 197,325.6 198,326.7 201.7,326.8 204.6,327.7 203.3,327.3 200.3,328.6 199.7,331.4 195.5,329.9 195.9,328.9 193.7,328.6 193.2,327.1 194.6,327.4 194.3,324.9 191.9,323.7 193.5,322.8 193.2,318.3 192.6,316.1 193.5,313.8 191.3,313.5 193.2,310.6 194,312 195.5,310.3 195.2,309.2 193.2,309.1 194.3,306.7 194.8,309 196.9,302.7 196,301.4 194.5,302 194.1,300.3 195.4,296.9 194.6,293 195.5,291.7 196.6,288.3 197.4,287.3 199,281.4 198.5,276.9 199.2,276.3 198.7,274.2 199.9,271.5 200.8,266.9 200.5,262.3 201.5,259 200.9,252.8 M207,334.5 208.3,335.3 204.3,335 207.3,337 205.9,337 203.9,335.1 202.1,335.7 201.8,334.7 206.5,334.4 206.8,334.4 207,334.5Z",
      color: 'fill-amber-500/10 hover:fill-amber-500/20 stroke-amber-500/40',
      activeColor: 'fill-[var(--accent)]/30 stroke-[var(--accent)]',
      pinX: '197',
      pinY: '293',
      capital: 'Santiago',
    },
  ];

  // Resto de Sudamérica (Países de Fondo Inactivos)
  const backgroundPaises = [
    { nombre: 'Ecuador', path: "M181.9,224 183,222.6 180.8,222 180.8,219.6 182.4,217.5 182.3,216.2 184.8,214.8 187.4,216.3 189.6,216.7 191.5,217.7 191,220.5 188.8,222.5 185.7,224 184.3,227.1 181.5,225.4 181.9,224Z" },
    { nombre: 'Venezuela', path: "M199.1,194.9 198,195.4 198.6,197.1 197.6,198.8 198.8,200.3 199.7,199 198.6,196.9 201.4,195.7 203.8,195.7 205.6,197.6 208.8,197.2 211.7,198.3 213.3,197.3 215.6,197 216.5,198.4 219.3,199.7 219.1,200.6 220.8,201.2 219.8,202.7 220.3,204 218.5,205.1 218.1,206.3 219.4,207.7 217.8,209.5 211.9,210 213,212.8 214.4,213 212.9,214.6 210.1,216.3 207.6,215.2 207,213 205.8,212.1 206.8,211 205.7,209 206.5,205.7 202.7,205.9 201.4,204.3 197.6,204.1 197.1,201.6 195.9,199.9 196.1,197.7 197.9,195.3 199.1,194.9Z" },
    { nombre: 'Bolivia', path: "M203.4,248.7 203.4,248.4 203.6,248.7 203.5,248.6 203.4,248.7 M202.6,251.2 202.3,250.8 203.5,249.4 204.4,248.9 202.8,247.4 203.8,244.7 203.4,243.7 204.2,241.5 202.5,238.5 204.9,238.5 208.1,236.5 210.4,236.1 210.5,238.8 212.4,241.4 214.9,241.7 217.3,243.5 219.9,244 220.5,248.8 223.7,248.9 223.9,250.7 225.5,252.5 224.3,256.5 222.5,254.7 217.4,255.4 216.5,257.2 215.7,260.6 213.3,260.1 212.5,261.9 212,260.5 208.8,259.7 207,261.7 205.7,261.7 205.1,258.6 204,257 204.6,255 203.6,254.1 202.6,251.2Z" },
    { nombre: 'Paraguay', path: "M231.8,264.3 231.5,265 231.1,267 231.2,267.2 231.2,267.3 230.8,269.5 228.9,271.1 223.5,270.8 225.5,267 220.7,264.1 218.9,263.7 215.7,260.6 216.5,257.2 217.4,255.4 222.5,254.7 224.3,256.5 225,258 224.6,260.3 227.7,260.3 229.2,261.4 229.5,264 231.8,264.3Z" },
    { nombre: 'Uruguay', path: "M233.9,282 233,283 233.2,283.9 233.2,284.1 233.5,284.3 232.7,285.7 230.5,286.9 228.1,286.9 224.9,285.9 223.9,284.8 224.3,281.5 224.3,280.4 225.4,276.8 226.8,276.6 228.5,278.7 229.2,278.2 233.9,282Z" },
    { nombre: 'Argentina', path: "M204.3,334.1 204.4,334.3 204.3,334.3 204.3,334.1 M231.2,267.3 232.5,267.4 232.6,270.5 228.9,272.8 225.4,276.8 224.3,280.4 224.3,281.5 223.5,285.5 226.3,288 225.8,288.9 227.2,291.2 225.4,293.9 222.6,295.1 219.2,295.7 216.8,295.6 216.3,300 213.5,300.6 211.4,299.6 211.1,302.5 212,303.5 213.6,302.8 213.9,304.3 212.3,303.7 212.3,304.8 210.6,306.5 210.1,309.6 208.9,309.5 206.8,311 206.2,312.3 207.8,314.4 209.4,314.5 209.4,316.9 206.3,319.3 205.7,321.7 203.8,322.5 203.2,324.2 204.6,327.7 201.7,326.8 198,326.7 197,325.6 197.2,323.4 195.5,323.6 194.8,320.6 197.3,317.6 196.8,316.6 198,314.9 199.2,310.3 197.7,309 198.5,307 197.5,304.9 198.3,302.8 197.9,299.7 199,295.6 200,295.1 199.4,292.9 199.7,290.3 200.9,289.4 200.9,287.4 202.1,283.5 202.1,283.5 200.5,279.7 202.3,273.1 203.9,270.5 204.9,270 204.4,265.7 206.8,264.1 207,261.7 208.8,259.7 212,260.5 212.5,261.9 213.3,260.1 215.7,260.6 218.9,263.7 220.7,264.1 225.5,267 223.5,270.8 228.9,271.1 230.8,269.5 231.2,267.3 M204.3,334 204.3,328.4 204.6,330.1 206.8,332.1 209.6,333.7 212,334.3 208.3,334.7 207,334.5 206.5,334.4 204.3,334Z" },
    { nombre: 'Brasil', path: "M240.5,217.9 243,218.1 242.2,220.3 238.8,221 238.4,218.7 240.5,217.9 M233.2,283.9 233.9,282.3 233.9,282 229.2,278.2 228.5,278.7 226.8,276.6 225.4,276.8 228.9,272.8 232.6,270.5 232.5,267.4 231.2,267.3 231.2,267.2 231.1,267 231.8,265.5 231.8,264.3 229.5,264 229.2,261.4 227.7,260.3 224.6,260.3 225,258 224.3,256.5 225.5,252.5 223.9,250.7 223.7,248.9 220.5,248.8 219.9,244 217.3,243.5 214.9,241.7 212.4,241.4 210.5,238.8 210.4,236.1 208.1,236.5 204.9,238.5 202.5,238.5 200.5,238.6 200.6,235.5 199.4,236.5 197.4,236.6 193.9,231.9 195.7,229.7 196.1,227.4 200.1,225.5 201.7,225.6 202.7,220.3 201.5,217.9 201.9,214.3 205.2,214.3 206.8,213.6 207.6,215.2 210.1,216.3 212.9,214.6 214.4,213 213,212.8 211.9,210 217.8,209.5 219.4,207.7 220.8,207.9 221.7,210.1 220.8,212.5 221.3,214 223.1,215.3 226.3,213.7 227.5,213.9 228.5,212.8 231.1,213.2 234.3,213.4 236.7,209.9 237.9,210.2 238.6,213.4 240.1,214.4 240.3,217.5 237.3,218.5 238.7,221 241.4,221.3 244.3,218.6 249.5,220.1 250.2,222.7 252.1,221.9 256,223.1 259.1,223 262,224.6 264.5,226.9 267.6,227.4 269,231.2 268.1,235.1 265,238.1 262.8,241.7 261.1,242.9 261.3,248 260.8,251.5 259.8,252.6 259.7,254.9 257,259.2 257.2,260 255.2,262 250.8,262 245.8,264.6 244.1,266 242.6,268.3 243,271 242.3,273.4 240.3,275.2 239.4,277.4 237.6,276.8 237.2,278.7 235.7,280.1 234.9,283 233.5,284.3 233.2,284.1 233.2,283.9Z" },
    { nombre: 'Guyana', path: "M220.8,201.2 222.5,202.3 226.2,206 226.1,207.1 224.5,209.6 227.5,213.9 226.3,213.7 223.1,215.3 221.3,214 220.8,212.5 221.7,210.1 220.8,207.9 219.4,207.7 218.1,206.3 218.5,205.1 220.3,204 219.8,202.7 220.8,201.2Z" },
    { nombre: 'Suriname', path: "M231.1,213.2 228.5,212.8 227.5,213.9 224.5,209.6 226.1,207.1 226.6,206.1 232.3,206.5 231.9,207.4 231.4,208.3 232.3,211 231.1,213.2Z" }
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 lg:p-5 bg-[var(--card)] border border-[var(--border)]/40 rounded-3xl relative overflow-hidden select-none">
      {/* Luces de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/5 rounded-full filter blur-[80px] pointer-events-none -z-10"></div>

      {/* Header del Mapa */}
      <div className="space-y-1 z-10">
        <span className="text-[10px] text-[var(--foreground)] font-extrabold uppercase tracking-widest">
          Mapa de Destinos
        </span>
        <h3 className="font-extrabold text-[var(--foreground)] text-xl">Filtro Interactivo</h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          Haz click en un país para ver los tours disponibles.
        </p>
      </div>

      {/* Contenedor del Gráfico SVG */}
      <div className="flex-1 flex items-center justify-center py-2 relative min-h-0 md:min-h-[350px] lg:min-h-[420px] xl:min-h-[480px]">
        <svg
          viewBox="170 190 100 160"
          className="w-full h-full max-h-[580px] transition-all"
        >
          {/* Países de Fondo (Inactivos) */}
          {backgroundPaises.map((pais, i) => (
            <path
              key={i}
              d={pais.path}
              onMouseEnter={() => {
                if (hasHover) setHoveredPais(pais.nombre);
              }}
              onMouseLeave={() => {
                if (hasHover) setHoveredPais(null);
              }}
              className="fill-[var(--border)]/20 stroke-[var(--border)]/30 stroke-[0.3px] hover:fill-[var(--border)]/30 transition-all duration-300 cursor-default"
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
                  onMouseEnter={() => {
                    if (hasHover) setHoveredPais(pais.id);
                  }}
                  onMouseLeave={() => {
                    if (hasHover) setHoveredPais(null);
                  }}
                  className={`cursor-pointer transition-all duration-300 stroke-[0.5px] ${isActive
                    ? pais.activeColor + ' stroke-[0.8px]'
                    : isHovered
                      ? 'fill-[var(--accent)]/30 stroke-[var(--accent)]/50'
                      : pais.color
                    }`}
                />

                {/* Marcador del País con pulsación si está seleccionado */}
                <g
                  transform={`translate(${pais.pinX}, ${pais.pinY})`}
                  className="pointer-events-none"
                >
                  {isActive && (
                    <circle
                      r="4"
                      className="fill-[var(--accent)]/20 stroke-[var(--accent)]/40 stroke-[0.2px] animate-ping"
                    />
                  )}
                  <circle
                    r="1.5"
                    className={`transition-all duration-300 ${isActive ? 'fill-[var(--accent)]' : 'fill-[var(--foreground)]/60'
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
            <span className="text-[10px] text-[var(--foreground)] font-bold uppercase tracking-wider">
              {paises.some((p) => p.id === hoveredPais) ? 'Destino Disponible' : 'Próximamente'}
            </span>
            <div className="font-extrabold text-[var(--foreground)] text-lg leading-tight">
              {hoveredPais}
            </div>
            {paises.some((p) => p.id === hoveredPais) && (
              <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                Capital: {paises.find((p) => p.id === hoveredPais)?.capital}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Selector de Todos */}
      <div className="flex justify-between items-center z-10 border-t border-[var(--border)]/50 pt-2 lg:pt-3">
        <div className="text-xs text-[var(--muted-foreground)]">
          Mostrando:{' '}
          <span className="text-[var(--foreground)] font-bold">
            {filtroPais === 'Todos' ? 'Todos los países' : filtroPais}
          </span>
        </div>

        {filtroPais !== 'Todos' && (
          <button
            onClick={() => setFiltroPais('Todos')}
            className="text-xs bg-[var(--accent)]/80 hover:bg-[var(--accent)] text-white hover:text-[var(--foreground)] border border-[var(--accent)]/20 hover:border-transparent px-3 py-1.5 rounded-xl font-semibold transition-all duration-200"
          >
            Limpiar Filtro
          </button>
        )}
      </div>
    </div>
  );
}
