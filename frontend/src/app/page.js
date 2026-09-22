'use client';

import { useEffect } from 'react';

export default function RootRedirectPage() {
  useEffect(() => {
    // 1. Verificar si hay un idioma guardado por el usuario
    let targetLang = 'en';
    try {
      const savedLang = localStorage.getItem('lang');
      if (savedLang === 'es' || savedLang === 'en') {
        targetLang = savedLang;
      } else if (typeof navigator !== 'undefined') {
        const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (browserLang.startsWith('es')) {
          targetLang = 'es';
        }
      }
    } catch (e) {}

    // 2. Redirigir a la subruta preservando hash o queries
    const currentSearch = window.location.search || '';
    const currentHash = window.location.hash || '';
    window.location.replace(`/${targetLang}/${currentSearch}${currentHash}`);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090910] text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#ca8a04] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-400 font-mono tracking-wider">Unu-Raymi Expeditions...</p>
      </div>
    </div>
  );
}
