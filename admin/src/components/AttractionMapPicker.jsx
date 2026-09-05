'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Corregir marcadores por defecto de Leaflet en Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
    return undefined; // Leaflet usa el defaultIcon
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
    if (center) {
      map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function AttractionMapPicker({ position, setPosition, imageUrl, category, orden }) {
  return (
    <div className="w-full h-full min-h-[360px] rounded-2xl overflow-hidden border border-[#b0c4b1] relative z-0 shadow-inner">
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
    </div>
  );
}
