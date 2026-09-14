'use client';

import React, { useState, useEffect, useRef, useMemo, Component } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Error Boundary para aislar cualquier excepción de Leaflet/WebGL/OpenStreetMap
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
            className="px-3 py-1.5 bg-[#4a5759] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#3b4749]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar Mapa
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Configuración segura de iconos Leaflet para Next.js en cliente
function ensureLeafletIcons() {
  if (typeof window === 'undefined') return;
  try {
    if (L && L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }
  } catch (e) {
    console.warn('No se pudieron inicializar los iconos por defecto de Leaflet:', e);
  }
}

const categoryBorderColors = {
  ATRACTIVO: '#ef4444',
  HOSPITAL: '#3b82f6',
  TRANSPORTE: '#22c55e',
  RESTAURANTE: '#f97316',
  TIENDA: '#8b5cf6',
};

function createPhotoBubbleIcon(imageUrl, category, orden) {
  const borderColor = categoryBorderColors[category] || '#ef4444';
  const hasBadge = orden !== undefined && orden !== null && orden !== '';
  const badgeHtml = hasBadge ? `<div class="gis-bubble-badge">${orden}</div>` : '';

  try {
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
    return undefined;
  }
}

function LocationMarker({ position, setPosition, imageUrl, category, orden }) {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          setPosition([latLng.lat, latLng.lng]);
        }
      },
    }),
    [setPosition],
  );

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  const markerIcon = useMemo(() => {
    if (imageUrl) {
      return createPhotoBubbleIcon(imageUrl, category, orden);
    }
    return undefined;
  }, [imageUrl, category, orden]);

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={markerIcon}
    >
      <Popup minWidth={140}>
        <div className="text-center font-sans text-xs">
          <div className="font-bold text-slate-800">Ubicación Seleccionada</div>
          <div className="text-slate-500 mt-0.5">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Arrastra para ajustar</div>
        </div>
      </Popup>
    </Marker>
  );
}

function MapFlyTo({ center }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center && map && typeof map.flyTo === 'function') {
      try {
        map.flyTo(center, 14, { duration: 1.5 });
      } catch (e) {}
    }
  }, [center, map]);
  return null;
}

function MapInner({ position, setPosition, imageUrl, category, orden }) {
  return (
    <MapContainer
      center={position}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker
        position={position}
        setPosition={setPosition}
        imageUrl={imageUrl}
        category={category}
        orden={orden}
      />
      <MapFlyTo center={position} />
    </MapContainer>
  );
}

export default function AttractionMapPicker({ position, setPosition, imageUrl, category, orden }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    ensureLeafletIcons();
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[360px] bg-[#dedbd2]/50 animate-pulse rounded-2xl flex items-center justify-center text-xs text-[#6c7a7c]">
        Cargando Mapa Interactivo...
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[360px] rounded-2xl overflow-hidden border border-[#b0c4b1] relative z-0 shadow-inner">
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
