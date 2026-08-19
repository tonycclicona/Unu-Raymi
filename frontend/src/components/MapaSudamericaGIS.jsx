'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RotateCcw } from 'lucide-react';

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

const SOUTH_AMERICA_CENTER = [-14.235, -51.925];
const DEFAULT_ZOOM = 4;

export default function MapaSudamericaGIS({ attractions = [], selectedTourId, onSelectAttraction }) {
  const [map, setMap] = useState(null);

  const resetView = () => {
    if (map) {
      map.flyTo(SOUTH_AMERICA_CENTER, DEFAULT_ZOOM, { duration: 1.5 });
    }
  };

  return (
    <div className="w-full h-full min-h-[460px] rounded-3xl overflow-hidden border border-[var(--border)]/40 relative z-0 shadow-lg">
      <MapContainer
        center={SOUTH_AMERICA_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        ref={setMap}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Capa outdoor / topográfica CyclOSM de OpenStreetMap */}
        <TileLayer
          attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://github.com/cyclosm/cyclosm-cartocss-style">CyclOSM</a>'
          url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        {attractions.map((att) => {
          const icon = categoryIcons[att.category] || defaultIcon;
          const tourDificultad = att.tour?.nivel_dificultad || 'Moderado';
          
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
              <Popup minWidth={240} className="custom-gis-popup">
                <div className="space-y-2 font-sans p-1.5">
                  {/* Cabecera del Atractivo / Punto */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                    <span className="text-[10px] font-black uppercase text-indigo-700 px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-200">
                      {att.category}
                    </span>
                    {att.altitude && (
                      <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        ⛰️ {att.altitude} msnm
                      </span>
                    )}
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
                        <span>🧭 Tour:</span>
                        <span className="text-indigo-600 font-black">{att.tour.nombre}</span>
                      </div>
                      
                      {/* Tag destacado con el nivel de caminata o trekking */}
                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm">
                        <span>🥾 Nivel de Caminata:</span>
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
        Restablecer Vista
      </button>

      {/* Leyenda GIS en esquina inferior izquierda */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)]/40 p-3 rounded-2xl text-[10px] space-y-1.5 shadow-xl">
        <div className="font-extrabold uppercase text-[var(--foreground)] tracking-wider">LEYENDA GIS</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[var(--muted-foreground)] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Atractivo
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Hospital / Salud
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Transporte
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Restaurante
          </div>
        </div>
      </div>
    </div>
  );
}
