'use client';

import React, { useState, useEffect, useRef, useMemo, Component } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Error Boundary para aislar cualquier excepción de WebGL/Leaflet
class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[Leaflet Map Warning]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[360px] rounded-2xl bg-[#f5f4f0] border border-[#b0c4b1] flex flex-col items-center justify-center p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600" />
          <div className="text-xs font-bold text-[#4a5759]">
            El mapa interactivo no pudo inicializarse en este entorno.
          </div>
          <p className="text-[11px] text-[#6c7a7c] max-w-sm">
            Puedes ajustar las coordenadas numéricamente en el formulario a la izquierda o reintentar.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1.5 bg-[#4a5759] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#3b4749] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar Mapa
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const categoryBorderColors = {
  ATRACTIVO: '#ef4444',
  HOSPITAL: '#3b82f6',
  TRANSPORTE: '#22c55e',
  RESTAURANTE: '#f97316',
  TIENDA: '#8b5cf6',
};

const categoryPinUrls = {
  ATRACTIVO: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  HOSPITAL: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  TRANSPORTE: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  RESTAURANTE: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  TIENDA: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
};

// Crea o retorna un icono seguro para Leaflet sin depender de L.Icon.Default
function createCustomMarkerIcon(imageUrl, category, orden) {
  if (typeof window === 'undefined' || !L) return undefined;

  // Si hay imagen cargada, usar burbuja fotográfica
  if (imageUrl) {
    try {
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
    } catch (e) {
      console.warn('Error al generar bubble icon:', e);
    }
  }

  // Fallback a pin oficial por categoría con URLs CDN seguras
  try {
    const pinUrl = categoryPinUrls[category] || 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    return L.icon({
      iconUrl: pinUrl,
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  } catch (e) {
    return undefined;
  }
}

// Controlador del mapa para redimensionamiento seguro y movimiento fluido
function MapViewController({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (e) {}
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (!map || !center || !Array.isArray(center) || center.length !== 2) return;
    const [lat, lng] = center;
    if (isNaN(lat) || isNaN(lng)) return;
    try {
      map.flyTo([lat, lng], 14, { duration: 1.2 });
    } catch (e) {
      try {
        map.setView([lat, lng], 14);
      } catch (err) {}
    }
  }, [center, map]);

  return null;
}

// Escuchador de clics en el mapa para posicionar el marcador
function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      if (e?.latlng && onLocationChange) {
        onLocationChange([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

// Marcador arrastrable
function DraggableMarker({ position, onLocationChange, icon }) {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          if (latLng && onLocationChange) {
            onLocationChange([latLng.lat, latLng.lng]);
          }
        }
      },
    }),
    [onLocationChange]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={icon}
    >
      <Popup minWidth={140}>
        <div className="text-center font-sans text-xs">
          <div className="font-bold text-slate-800">Ubicación Seleccionada</div>
          <div className="text-slate-500 mt-0.5 font-mono">
            {Number(position[0]).toFixed(5)}, {Number(position[1]).toFixed(5)}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Arrastra para ajustar</div>
        </div>
      </Popup>
    </Marker>
  );
}

// Componente interno del mapa
function MapInner({ position, setPosition, imageUrl, category, orden }) {
  const markerIcon = useMemo(() => {
    return createCustomMarkerIcon(imageUrl, category, orden);
  }, [imageUrl, category, orden]);

  return (
    <MapContainer
      center={position}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', minHeight: '380px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DraggableMarker
        position={position}
        onLocationChange={setPosition}
        icon={markerIcon}
      />
      <MapClickHandler onLocationChange={setPosition} />
      <MapViewController center={position} />
    </MapContainer>
  );
}

export default function AttractionMapPicker({ position, setPosition, imageUrl, category, orden }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[380px] bg-[#dedbd2]/50 animate-pulse rounded-2xl flex items-center justify-center text-xs text-[#6c7a7c]">
        Cargando Mapa Interactivo Leaflet...
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-[#b0c4b1] relative z-0 shadow-inner">
      <MapErrorBoundary>
        <MapInner
          position={position}
          setPosition={setPosition}
          imageUrl={imageUrl}
          category={category}
          orden={orden}
        />
      </MapErrorBoundary>
    </div>
  );
}
