'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RotateCcw, Route, Image as ImageIcon } from 'lucide-react';
import { API_ASSETS_URL } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

// Solución marcadores e iconos Leaflet en Next.js
delete L.Icon.Default.prototype._getIconUrl;

const categoryIcons = {
  ATRACTIVO: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  HOSPITAL: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  TRANSPORTE: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  RESTAURANTE: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  TIENDA: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
};

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const categoryBorderColors = {
  ATRACTIVO: '#ef4444', // Red
  HOSPITAL: '#3b82f6',  // Blue
  TRANSPORTE: '#22c55e',// Green
  RESTAURANTE: '#f97316',// Orange
  TIENDA: '#8b5cf6',   // Violet
};

// Genera un icono tipo burbuja con la fotografía del punto GIS
function createPhotoBubbleIcon(imageUrl, category, orden) {
  const borderColor = categoryBorderColors[category] || '#ef4444';
  const hasBadge = orden !== undefined && orden !== null && orden !== '';
  const badgeHtml = hasBadge ? `<div class="gis-bubble-badge">${orden}</div>` : '';

  return L.divIcon({
    className: 'gis-bubble-marker',
    html: `
      <div class="gis-bubble-pin">
        <div class="gis-bubble-avatar" style="border-color: ${borderColor};">
          <img src="${imageUrl}" alt="Punto GIS" onerror="this.src='https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'" />
        </div>
        ${badgeHtml}
        <div class="gis-bubble-pointer" style="border-top-color: ${borderColor};"></div>
      </div>
    `,
    iconSize: [48, 58],
    iconAnchor: [24, 56],
    popupAnchor: [0, -52],
  });
}

const SOUTH_AMERICA_CENTER = [-14.235, -51.925];
const DEFAULT_ZOOM = 4;

export default function MapaSudamericaGIS({ attractions = [], selectedTourId, onSelectAttraction }) {
  const [map, setMap] = useState(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }
  }, [map, attractions]);

  const resetView = () => {
    if (map) {
      map.flyTo(SOUTH_AMERICA_CENTER, DEFAULT_ZOOM, { duration: 1.5 });
    }
  };
  // Agrupar atracciones por tour para trazar las rutas polilínea
  const tourRoutes = useMemo(() => {
    const groups = {};
    attractions.forEach((att) => {
      if (att.tourId && att.latitude && att.longitude) {
        if (!groups[att.tourId]) {
          groups[att.tourId] = {
            tourId: att.tourId,
            tourName: att.tour?.nombre || `Tour #${att.tourId}`,
            points: [],
          };
        }
        groups[att.tourId].points.push(att);
      }
    });

    // Ordenar puntos por 'orden' ascendente y armar coordenadas
    return Object.values(groups)
      .map((g) => {
        const sortedPoints = [...g.points].sort((a, b) => (a.orden || 0) - (b.orden || 0));
        const positions = sortedPoints.map((p) => [p.latitude, p.longitude]);
        return {
          ...g,
          sortedPoints,
          positions,
          hasRoute: positions.length >= 2,
        };
      })
      .filter((g) => g.hasRoute);
  }, [attractions]);

  return (
    <div className="w-full h-full min-h-[460px] rounded-3xl overflow-hidden border border-[var(--border)]/40 relative z-0 shadow-lg">
      <MapContainer
        center={SOUTH_AMERICA_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        ref={setMap}
        style={{ height: '100%', width: '100%', minHeight: '460px' }}
      >
        {/* Capa Topográfica Tracestrack Topo (con fallback directo a OpenTopoMap si no hay API key de Tracestrack) */}
        {process.env.NEXT_PUBLIC_TRACESTRACK_KEY ? (
          <TileLayer
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Map style: &copy; <a href="https://www.tracestrack.com/">Tracestrack</a>'
            url={`https://tile.tracestrack.com/topo__/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_TRACESTRACK_KEY}`}
            maxZoom={18}
          />
        ) : (
          <TileLayer
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            subdomains="abc"
            maxZoom={17}
          />
        )}

        {/* Trazado de Rutas Polilíneas de los Tours */}
        {tourRoutes.map((route, idx) => {
          // Paleta de colores distintivos para las rutas
          const routeColors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];
          const strokeColor = routeColors[idx % routeColors.length];
          const isSelected = selectedTourId && String(selectedTourId) === String(route.tourId);

          return (
            <Polyline
              key={`route-${route.tourId}`}
              positions={route.positions}
              pathOptions={{
                color: isSelected ? '#ff385c' : strokeColor,
                weight: isSelected ? 5 : 3.5,
                dashArray: isSelected ? undefined : '6, 8',
                opacity: 0.85,
              }}
            >
              <Tooltip sticky direction="top" className="font-sans font-bold text-xs">
                <span className="flex items-center gap-1">
                  <Route className="w-3.5 h-3.5 text-amber-500" />
                  {t('gis_map.ruta_tooltip')
                    .replace('{name}', route.tourName)
                    .replace('{count}', route.positions.length)}
                </span>
              </Tooltip>
            </Polyline>
          );
        })}

        {attractions.map((att) => {
          const fullImgUrl = att.imageUrl
            ? att.imageUrl.startsWith('http')
              ? att.imageUrl
              : `${API_ASSETS_URL}${att.imageUrl}`
            : null;
          const icon = fullImgUrl
            ? createPhotoBubbleIcon(fullImgUrl, att.category, att.orden)
            : (categoryIcons[att.category] || defaultIcon);
          const tourDificultad = att.tour?.nivel_dificultad || 'Moderado';

          const categoryTranslated = {
            ATRACTIVO: t('gis_map.atractivo'),
            HOSPITAL: t('gis_map.hospital'),
            TRANSPORTE: t('gis_map.transporte'),
            RESTAURANTE: t('gis_map.restaurante'),
            TIENDA: t('gis_map.tienda'),
          }[att.category] || att.category;
          
          return (
            <Marker
              key={att.id}
              position={[att.latitude, att.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectAttraction) {
                    onSelectAttraction(att);
                  }
                },
              }}
            >
              <Popup minWidth={250} maxWidth={280} className="custom-gis-popup">
                <div className="space-y-2 font-sans p-1">
                  {/* Imagen del Punto GIS si existe */}
                  {fullImgUrl && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 mb-1.5 shadow-inner">
                      <img
                        src={fullImgUrl}
                        alt={att.name || 'Punto GIS'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {att.orden !== undefined && att.orden !== null && (
                        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-white/20">
                          {t('gis_map.paso_prefix')}{att.orden}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cabecera del Atractivo / Punto */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                    <span className="text-[10px] font-black uppercase text-indigo-700 px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-200">
                      {categoryTranslated}
                    </span>
                    <div className="flex items-center gap-1">
                      {att.orden !== undefined && att.orden !== null && !fullImgUrl && (
                        <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                          #{att.orden}
                        </span>
                      )}
                      {att.altitude && (
                        <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          ⛰️ {att.altitude}m
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nombre y Coordenadas OSM */}
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {att.name || att.nombre}
                    </h4>
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                      OSM: {att.latitude?.toFixed(4)}, {att.longitude?.toFixed(4)}
                    </span>
                  </div>

                  {/* Descripción del lugar registrada */}
                  {att.description && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {att.description}
                    </p>
                  )}

                  {/* Información del Tour y Nivel de Caminata / Trekking */}
                  {att.tour && (
                    <div className="pt-1.5 border-t border-slate-200 space-y-1.5">
                      <div className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                        <span>🧭 {t('gis_map.tour_label')}</span>
                        <span className="text-indigo-600 font-black">{att.tour.nombre}</span>
                      </div>
                      
                      {/* Tag destacado con el nivel de caminata o trekking */}
                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm">
                        <span>🥾 {t('gis_map.caminata')}</span>
                        <span className="text-emerald-700 uppercase">{tourDificultad}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Botón Flotante para Restablecer Vista */}
      <button
        onClick={resetView}
        className="absolute top-4 left-4 z-[1000] bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)]/60 text-[var(--foreground)] text-xs font-extrabold px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2 hover:bg-[var(--accent)] hover:text-white transition-all"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        {t('gis_map.restablecer_vista')}
      </button>

      {/* Leyenda GIS en esquina inferior izquierda */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)]/40 p-3 rounded-2xl text-[10px] space-y-1.5 shadow-xl">
        <div className="font-extrabold uppercase text-[var(--foreground)] tracking-wider">{t('gis_map.leyenda_titulo')}</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[var(--muted-foreground)] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> {t('gis_map.atractivo')}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {t('gis_map.hospital')}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> {t('gis_map.transporte')}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> {t('gis_map.restaurante')}
          </div>
        </div>
      </div>
    </div>
  );
}
