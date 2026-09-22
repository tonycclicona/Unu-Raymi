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

    const detectLanguage = () => {
      // 1. Check localStorage first
      try {
        const savedLang = localStorage.getItem('lang');
        if (savedLang === 'es' || savedLang === 'en') {
          setLanguageState(savedLang);
          setLoading(false);
          return;
        }
      } catch (e) {}

      // 2. Detección instantánea por navegador (0ms, sin llamadas de red externas)
      if (typeof navigator !== 'undefined') {
        const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (browserLang.startsWith('es')) {
          setLanguageState('es');
          setLoading(false);
          return;
        }
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
