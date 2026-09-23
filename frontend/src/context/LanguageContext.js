'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/lib/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children, initialLocale }) {
  const [language, setLanguageState] = useState(initialLocale || 'en');
  const [loading, setLoading] = useState(!initialLocale);

  const setLanguage = (lang) => {
    if (lang === 'es' || lang === 'en') {
      setLanguageState(lang);
      try {
        localStorage.setItem('lang', lang);
      } catch (e) {}

      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash || '';
        const currentSearch = window.location.search || '';
        
        // Si estamos en una ruta /[locale], reemplazar el prefijo
        if (currentPath.startsWith('/es/') || currentPath === '/es') {
          const newPath = currentPath.replace(/^\/es(\/|$)/, `/${lang}$1`);
          window.location.href = `${newPath}${currentSearch}${currentHash}`;
        } else if (currentPath.startsWith('/en/') || currentPath === '/en') {
          const newPath = currentPath.replace(/^\/en(\/|$)/, `/${lang}$1`);
          window.location.href = `${newPath}${currentSearch}${currentHash}`;
        } else {
          // Si estamos en la raíz '/', navegar a /{lang}/
          window.location.href = `/${lang}/${currentSearch}${currentHash}`;
        }
      }
    }
  };

  useEffect(() => {
    if (initialLocale) {
      setLanguageState(initialLocale);
      setLoading(false);
      return;
    }

    const detectLanguage = async () => {
      // 1. Check localStorage first
      const savedLang = localStorage.getItem('lang');
      if (savedLang === 'es' || savedLang === 'en') {
        setLanguageState(savedLang);
        setLoading(false);
        return;
      }

      // 2. Try Geolocation via API (with a 2-second timeout)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          const country = data.country_code;
          
          const spanishSpeaking = [
            'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 
            'GQ', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'ES', 
            'UY', 'VE'
          ];

          if (country) {
            const isSpanishCountry = spanishSpeaking.includes(country.toUpperCase());
            const detectedLang = isSpanishCountry ? 'es' : 'en';
            setLanguageState(detectedLang);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Geolocation lookup failed or timed out, defaulting to English:', err);
      }

      // 3. Fallback Default: English
      setLanguageState('en');
      setLoading(false);
    };

    detectLanguage();
  }, []);

  const t = (path) => {
    const keys = path.split('.');
    let result = translations[language];
    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        let fallback = translations['es'];
        for (const k of keys) {
          if (fallback && fallback[k] !== undefined) {
            fallback = fallback[k];
          } else {
            return path;
          }
        }
        return fallback;
      }
    }
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
