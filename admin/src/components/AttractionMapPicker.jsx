'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
    // Garantizar que NUNCA retorne undefined
    return L.divIcon({
      className: 'gis-default-pin',
      html: '<div style="background-color:#ef4444;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }
}

export default function AttractionMapPicker({ position, setPosition, imageUrl, category, orden }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const setPositionRef = useRef(setPosition);

  // Mantener setPosition actualizado en el ref
  useEffect(() => {
    setPositionRef.current = setPosition;
  }, [setPosition]);

  const safeLat = Number(position?.[0] || -13.5319);
  const safeLng = Number(position?.[1] || -71.9675);

  const getPopupContent = (lat, lng) => `
    <div style="text-align:center;font-family:sans-serif;font-size:12px;">
      <div style="font-weight:bold;color:#1e293b;">Ubicación Seleccionada</div>
      <div style="color:#64748b;margin-top:2px;font-family:monospace;">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
      <div style="font-size:10px;color:#059669;font-weight:600;margin-top:4px;">Arrastra para ajustar</div>
    </div>
  `;

  // 1. Inicialización y destrucción limpia del mapa Leaflet
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Si el contenedor tenía un mapa previo o _leaflet_id colgado, limpiarlo
    if (containerRef.current._leaflet_id) {
      containerRef.current._leaflet_id = null;
    }

    const map = L.map(containerRef.current, {
      center: [safeLat, safeLng],
      zoom: 12,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    // Capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Marcador arrastrable
    const marker = L.marker([safeLat, safeLng], {
      draggable: true,
      icon: createCustomMarkerIcon(imageUrl, category, orden),
    }).addTo(map);
    markerRef.current = marker;

    marker.bindPopup(getPopupContent(safeLat, safeLng), { minWidth: 140 });

    // Evento arrastrar marcador
    marker.on('dragend', () => {
      const latLng = marker.getLatLng();
      if (latLng) {
        marker.setPopupContent(getPopupContent(latLng.lat, latLng.lng));
        setPositionRef.current?.([latLng.lat, latLng.lng]);
      }
    });

    // Evento clic en cualquier parte del mapa
    map.on('click', (e) => {
      if (e?.latlng) {
        marker.setLatLng(e.latlng);
        marker.setPopupContent(getPopupContent(e.latlng.lat, e.latlng.lng));
        setPositionRef.current?.([e.latlng.lat, e.latlng.lng]);
      }
    });

    // Invalidar tamaño para asegurar que todos los tiles carguen correctamente
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (_) {}
    }, 250);

    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch (_) {}
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      try {
        map.remove();
      } catch (_) {}
      mapRef.current = null;
      markerRef.current = null;
      if (containerRef.current) {
        containerRef.current._leaflet_id = null;
      }
    };
  }, []); // Montaje único

  // 2. Sincronizar coordenadas externas (buscador Nominatim o campos numéricos)
  useEffect(() => {
    if (!position || !Array.isArray(position) || position.length !== 2) return;
    const lat = Number(position[0]);
    const lng = Number(position[1]);
    if (isNaN(lat) || isNaN(lng)) return;

    const marker = markerRef.current;
    const map = mapRef.current;
    if (!marker || !map) return;

    const currentLatLng = marker.getLatLng();
    if (
      Math.abs(currentLatLng.lat - lat) > 0.00001 ||
      Math.abs(currentLatLng.lng - lng) > 0.00001
    ) {
      marker.setLatLng([lat, lng]);
      marker.setPopupContent(getPopupContent(lat, lng));
      map.setView([lat, lng], map.getZoom() || 12);
    }
  }, [position]);

  // 3. Sincronizar cambios en categoría, imagen o número de orden del icono
  useEffect(() => {
    if (!markerRef.current) return;
    const newIcon = createCustomMarkerIcon(imageUrl, category, orden);
    if (newIcon) {
      markerRef.current.setIcon(newIcon);
    }
  }, [imageUrl, category, orden]);

  return (
    <div className="w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-[#b0c4b1] relative z-0 shadow-inner">
      <div
        ref={containerRef}
        className="w-full h-full min-h-[380px]"
        style={{ height: '100%', width: '100%', minHeight: '380px' }}
      />
    </div>
  );
}

