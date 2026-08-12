'use client';

import React from 'react';

/**
 * 1. BRÚJULA 3D NEOMÓRFICA & DORADA (Guías y Dirección)
 */
export function Compass3D({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        {/* Sombra suave de elevación neomórfica */}
        <filter id="neo-shadow" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
          <feDropShadow dx="4" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
          <feDropShadow dx="-2" dy="-2" stdDeviation="4" floodColor="#ffffff" floodOpacity="0.15" />
        </filter>
        {/* Gradiente Bisel Metal Dorado */}
        <linearGradient id="gold-bevel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE259" />
          <stop offset="50%" stopColor="#FFA751" />
          <stop offset="100%" stopColor="#9A5900" />
        </linearGradient>
        {/* Gradiente Aguja Brújula 3D */}
        <linearGradient id="needle-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4B2B" />
          <stop offset="100%" stopColor="#FF416C" />
        </linearGradient>
        <linearGradient id="needle-silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0E0E0" />
          <stop offset="100%" stopColor="#8E9EAB" />
        </linearGradient>
        {/* Glassmorphism Reflejo Cristal */}
        <linearGradient id="glass-reflection" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Anillo de Base Pulido */}
      <circle cx="50" cy="50" r="42" fill="url(#gold-bevel)" filter="url(#neo-shadow)" />
      <circle cx="50" cy="50" r="36" fill="#141824" stroke="#D4AF37" strokeWidth="1.5" />

      {/* Marcas Cardenales 3D */}
      <circle cx="50" cy="20" r="2" fill="#FFE259" />
      <circle cx="80" cy="50" r="2" fill="#FFE259" />
      <circle cx="50" cy="80" r="2" fill="#FFE259" />
      <circle cx="20" cy="50" r="2" fill="#FFE259" />

      {/* Aguja Tridimensional Norte (Roja) */}
      <polygon points="50,18 44,50 50,46" fill="url(#needle-red)" />
      <polygon points="50,18 56,50 50,46" fill="#D31027" />

      {/* Aguja Tridimensional Sur (Plateada) */}
      <polygon points="50,82 44,50 50,54" fill="url(#needle-silver)" />
      <polygon points="50,82 56,50 50,54" fill="#6B7C85" />

      {/* Esfera Central Dorada de Pivote */}
      <circle cx="50" cy="50" r="5" fill="url(#gold-bevel)" />
      <circle cx="48" cy="48" r="1.5" fill="#FFFFFF" />

      {/* Cúpula de Cristal Glassmorphism */}
      <circle cx="50" cy="50" r="36" fill="url(#glass-reflection)" />
    </svg>
  );
}

/**
 * 2. MOCHILA / BOTAS DE TREKKING 3D (Equipamiento Requerido)
 */
export function Backpack3D({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="pack-shadow" x="-10" y="-10" width="120" height="120">
          <feDropShadow dx="4" dy="8" stdDeviation="5" floodColor="#000000" floodOpacity="0.35" />
        </filter>
        <linearGradient id="bag-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F2994A" />
          <stop offset="100%" stopColor="#F2C94C" />
        </linearGradient>
        <linearGradient id="pocket-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2F80ED" />
          <stop offset="100%" stopColor="#56CCF2" />
        </linearGradient>
      </defs>

      {/* Cuerpo de la Mochila 3D Volumétrica */}
      <rect x="26" y="24" width="48" height="58" rx="16" fill="url(#bag-main)" filter="url(#pack-shadow)" />
      
      {/* Tapa Superior Acolchada */}
      <rect x="22" y="16" width="56" height="20" rx="10" fill="#E07A28" />

      {/* Bolsillo Frontal 3D Azul Neón */}
      <rect x="32" y="46" width="36" height="28" rx="8" fill="url(#pocket-dark)" />
      <line x1="38" y1="54" x2="62" y2="54" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

      {/* Correas Acolchadas y Cierres */}
      <rect x="28" y="32" width="6" height="18" rx="3" fill="#333333" />
      <rect x="66" y="32" width="6" height="18" rx="3" fill="#333333" />

      {/* Brillo 3D Clay Soft Light */}
      <ellipse cx="40" cy="28" rx="10" ry="4" fill="#FFFFFF" fillOpacity="0.3" />
    </svg>
  );
}

/**
 * 3. BUS / SPRINTER 3D (Transporte y Logística)
 */
export function Sprinter3D({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="bus-shadow" x="-10" y="-10" width="120" height="120">
          <feDropShadow dx="3" dy="8" stdDeviation="5" floodColor="#000000" floodOpacity="0.4" />
        </filter>
        <linearGradient id="bus-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2F80ED" />
          <stop offset="100%" stopColor="#0056C6" />
        </linearGradient>
        <linearGradient id="bus-window" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F7FA" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#80DEEA" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Carrocería Sprinter Neomórfica 3D */}
      <rect x="14" y="32" width="72" height="38" rx="12" fill="url(#bus-body)" filter="url(#bus-shadow)" />

      {/* Parabrisas y Ventanas Panoramic Glassmorphism */}
      <rect x="20" y="38" width="58" height="16" rx="6" fill="url(#bus-window)" />
      
      {/* Luces LED Delanteras 3D */}
      <circle cx="20" cy="58" r="4" fill="#FFF176" />
      <circle cx="20" cy="58" r="2" fill="#FFFFFF" />

      {/* Ruedas Tridimensionales con Relieve */}
      <circle cx="32" cy="70" r="9" fill="#1C1D21" />
      <circle cx="32" cy="70" r="4" fill="#9E9E9E" />

      <circle cx="68" cy="70" r="9" fill="#1C1D21" />
      <circle cx="68" cy="70" r="4" fill="#9E9E9E" />
    </svg>
  );
}

/**
 * 4. PLATO GOURMET 3D (Alimentación y Bebidas)
 */
export function GourmetPlate3D({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="food-shadow" x="-10" y="-10" width="120" height="120">
          <feDropShadow dx="3" dy="7" stdDeviation="5" floodColor="#000000" floodOpacity="0.35" />
        </filter>
        <linearGradient id="plate-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>

      {/* Base del Plato Cerámico Neomórfico */}
      <circle cx="50" cy="50" r="40" fill="url(#plate-grad)" filter="url(#food-shadow)" />
      <circle cx="50" cy="50" r="30" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />

      {/* Elementos Gourmets 3D (Sombras Cálidas) */}
      <circle cx="44" cy="46" r="10" fill="#E11D48" /> {/* Vegetal / Proteína */}
      <circle cx="58" cy="52" r="8" fill="#10B981" />  {/* Hierbas/Vegetales */}
      <circle cx="48" cy="58" r="6" fill="#F59E0B" />  {/* Salsa gourmet */}

      {/* Brillo Tridimensional Cerámico */}
      <ellipse cx="38" cy="26" rx="14" ry="5" fill="#FFFFFF" fillOpacity="0.7" />
    </svg>
  );
}

/**
 * 5. ESCUDO 3D ESMERALDA (Seguridad y Asistencia)
 */
export function Shield3D({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="shield-shadow" x="-10" y="-10" width="120" height="120">
          <feDropShadow dx="4" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
        </filter>
        <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Escudo 3D Neomórfico Esmeralda */}
      <path
        d="M50 16 L80 28 V50 C80 68 50 84 50 84 C50 84 20 68 20 50 V28 L50 16 Z"
        fill="url(#shield-grad)"
        filter="url(#shield-shadow)"
      />

      {/* Relieve Cruz Médica en Volumen 3D */}
      <rect x="44" y="34" width="12" height="32" rx="3" fill="#FFFFFF" />
      <rect x="34" y="44" width="32" height="12" rx="3" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * 6. TICKET / CÁMARA 3D (Tickets y Actividades)
 */
export function Camera3D({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="cam-shadow" x="-10" y="-10" width="120" height="120">
          <feDropShadow dx="4" dy="7" stdDeviation="5" floodColor="#000000" floodOpacity="0.35" />
        </filter>
        <linearGradient id="cam-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>

      {/* Cuerpo Cámara/Pase 3D */}
      <rect x="18" y="28" width="64" height="48" rx="14" fill="url(#cam-grad)" filter="url(#cam-shadow)" />
      <circle cx="50" cy="52" r="16" fill="#1E1B4B" stroke="#A78BFA" strokeWidth="3" />
      <circle cx="50" cy="52" r="8" fill="#60A5FA" fillOpacity="0.8" />
      <circle cx="47" cy="49" r="3" fill="#FFFFFF" />

      {/* Destello de Flash 3D */}
      <rect x="62" y="34" width="10" height="6" rx="2" fill="#FBBF24" />
    </svg>
  );
}

/**
 * 7. MEDALLA / CERTIFICADO 3D (MINCETUR / Licencias)
 */
export function Award3D({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="award-sh" x="-10" y="-10" width="120" height="120">
          <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
        </filter>
        <linearGradient id="gold-medallion" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE259" />
          <stop offset="60%" stopColor="#FFA751" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        <linearGradient id="ribbon-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4B2B" />
          <stop offset="100%" stopColor="#FF416C" />
        </linearGradient>
      </defs>

      {/* Cintas Inferiores 3D */}
      <polygon points="34,54 22,86 36,80 48,86 44,54" fill="url(#ribbon-red)" />
      <polygon points="66,54 56,86 64,80 78,86 66,54" fill="#D31027" />

      {/* Medallón Principal en Relieve Dorado */}
      <circle cx="50" cy="42" r="30" fill="url(#gold-medallion)" filter="url(#award-sh)" />
      <circle cx="50" cy="42" r="24" fill="#1A202C" stroke="#FFE259" strokeWidth="1.5" />

      {/* Estrella Central 3D */}
      <polygon points="50,26 54,36 65,36 56,43 59,54 50,47 41,54 44,43 35,36 46,36" fill="#FFE259" />
    </svg>
  );
}

/**
 * 8. CANDADO SSL 3D (SSL Encriptado)
 */
export function Lock3D({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="lock-sh" x="-10" y="-10" width="120" height="120">
          <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.4" />
        </filter>
        <linearGradient id="lock-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Arco/Gancho de Acero 3D */}
      <path d="M34 44 V30 A16 16 0 0 1 66 30 V44" fill="none" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />

      {/* Cuerpo del Candado 3D Esmeralda Neomórfico */}
      <rect x="24" y="42" width="52" height="42" rx="12" fill="url(#lock-emerald)" filter="url(#lock-sh)" />

      {/* Cerradura en Relieve */}
      <circle cx="52" cy="60" r="5" fill="#064E3B" />
      <polygon points="49,63 55,63 53,74 51,74" fill="#064E3B" />
      <circle cx="50" cy="58" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * 9. ESTRELLA MARCA PERÚ 3D (Calidad y Prestigio)
 */
export function Star3D({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="star-sh" x="-10" y="-10" width="120" height="120">
          <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.35" />
        </filter>
        <linearGradient id="amber-star" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      <polygon
        points="50,12 62,36 88,38 68,56 74,82 50,68 26,82 32,56 12,38 38,36"
        fill="url(#amber-star)"
        filter="url(#star-sh)"
      />
      {/* Faceta de Sombra Tridimensional */}
      <polygon points="50,12 50,68 74,82 68,56 88,38 62,36" fill="#B45309" fillOpacity="0.3" />
    </svg>
  );
}

/**
 * 10. VERIFICADO STRIPE 3D (Stripe Verified)
 */
export function ShieldCheck3D({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="chk-sh" x="-10" y="-10" width="120" height="120">
          <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.35" />
        </filter>
        <linearGradient id="blue-stripe" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      <path
        d="M50 14 L80 26 V48 C80 66 50 82 50 82 C50 82 20 66 20 48 V26 L50 14 Z"
        fill="url(#blue-stripe)"
        filter="url(#chk-sh)"
      />
      <polyline points="36,48 46,58 64,40" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

