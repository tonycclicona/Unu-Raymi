'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const { language, setLanguage, t } = useLanguage();
  const navRef = useRef(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  };

  const navItems = [
    { label: t('nav.inicio'), href: '#inicio' },
    { label: t('nav.excursiones'), href: '#tours' },
    { label: t('nav.experiencias'), href: '#reviews' },
    { label: t('nav.nosotros'), href: '#guias' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setIsOpen(false);
    const targetId = href.replace('#', '');
    if (targetId === 'inicio') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      window.history.pushState(null, '', '#inicio');
      return;
    }

    const el = document.getElementById(targetId);
    if (el) {
      // El navbar en estado scrolleado mide ~56px (h-14). Al iniciar desde el tope (isScrolled=false)
      // media ~76px y se achica a ~56px al hacer scroll. Usamos siempre la altura final scrolleada (56px)
      // para que el destino coincida exactamente con la posición final donde se detiene el navbar.
      const TARGET_NAV_HEIGHT = 56;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - TARGET_NAV_HEIGHT;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth',
      });
      window.history.pushState(null, '', href);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,backdrop-filter,padding,border-color,box-shadow] duration-300 ease-in-out ${isScrolled
        ? 'bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)]/30 shadow-sm py-1.5 md:py-2'
        : 'bg-[var(--background)]/80 backdrop-blur-sm py-2 md:py-2.5'
        }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-2 md:px-1 flex items-center justify-between gap-5">
        {/* Logo + montaña móvil */}
        <div className="flex items-center min-w-0 flex-1 md:flex-none">
          <a
            href="#inicio"
            onClick={(e) => handleNavClick(e, '#inicio')}
            className="flex items-center group shrink-0 transition-all duration-300 cursor-pointer"
          >
            <img
              src="/uploads/logo.webp"
              alt="Unuraymi Expeditions"
              className="w-auto object-contain h-9 sm:h-10 md:h-11 transition-all duration-300 group-hover:scale-105"
            />
          </a>

          {/* Montaña visible en móvil */}
          <div className="flex md:hidden items-center justify-center flex-1 ml-3 overflow-hidden">
            <svg
              viewBox="0 0 200 50"
              className="w-full max-w-[140px] h-8 text-gray-700 hover:text-[#ca8a04] active:text-[#ca8a04] transition-colors duration-500 cursor-pointer"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              preserveAspectRatio="xMidYMid meet"
            >
              <path
                d="M0 40
                   L18 40
                   L28 31
                   L38 40
                   L50 24
                   L62 40
                   L78 15
                   L92 34
                   L108 10
                   L126 40
                   L142 27
                   L154 40
                   L170 18
                   L184 40
                   L200 40"
              />

              <path d="M74 20 L82 20" />
              <path d="M70 23 L86 23" />
              <path d="M102 14 L111 14" />
              <path d="M98 17 L116 17" />
              <path d="M165 22 L174 22" />
              <path d="M161 25 L178 25" />
            </svg>
          </div>
        </div>

        {/* Montaña desktop */}
        <div className="hidden md:flex items-center justify-center flex-grow mx-4">
          <svg
            viewBox="0 0 200 50"
            className="w-full h-12 text-gray-700 hover:text-[#ca8a04] active:text-[#ca8a04] transition-colors duration-500 cursor-pointer"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            preserveAspectRatio="none"
          >
            <path
              d="M0 40
                 L18 40
                 L28 31
                 L38 40
                 L50 24
                 L62 40
                 L78 15
                 L92 34
                 L108 10
                 L126 40
                 L142 27
                 L154 40
                 L170 18
                 L184 40
                 L200 40"
            />

            <path d="M74 20 L82 20" />
            <path d="M70 23 L86 23" />
            <path d="M102 14 L111 14" />
            <path d="M98 17 L116 17" />
            <path d="M165 22 L174 22" />
            <path d="M161 25 L178 25" />
          </svg>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-sm font-medium text-[var(--foreground)]/90 hover:text-[var(--foreground)] transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[var(--accent)] after:transition-all hover:after:w-full cursor-pointer"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#tours"
            onClick={(e) => handleNavClick(e, '#tours')}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-[var(--accent)]/20 hover:shadow-[var(--accent)]/30 transition-all duration-300 text-sm cursor-pointer"
          >
            {t('nav.explorar')}
          </a>

          {/* Selector de idioma Desktop */}
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--sidebar)] text-[var(--foreground)] hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm flex items-center gap-1.5 font-extrabold text-xs cursor-pointer shrink-0"
            aria-label="Cambiar idioma / Switch language"
            title={language === 'es' ? 'Cambiar a English' : 'Switch to Español'}
          >
            <span className="text-sm">{language === 'es' ? '🇪🇸' : '🇺🇸'}</span>
            <span className="uppercase tracking-wider">{language === 'es' ? 'ES' : 'EN'}</span>
            <span className="text-[10px] text-[var(--muted-foreground)] ml-0.5">⇄</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--sidebar)] text-[var(--foreground)] hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm flex items-center justify-center cursor-pointer shrink-0"
            aria-label={t('nav.cambiarTema')}
          >
            {theme === 'light' ? (
              <Moon className="w-4.5 h-4.5 text-[var(--foreground)]" />
            ) : (
              <Sun className="w-4.5 h-4.5 text-amber-400" />
            )}
          </button>
        </nav>

        {/* Mobile buttons */}
        <div className="flex md:hidden items-center gap-2">
          {/* Selector de idioma móvil */}
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--sidebar)] text-[var(--foreground)] hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm flex items-center gap-1 font-extrabold text-[10px] cursor-pointer shrink-0"
            aria-label="Cambiar idioma / Switch language"
          >
            <span>{language === 'es' ? '🇪🇸' : '🇺🇸'}</span>
            <span className="uppercase">{language === 'es' ? 'ES' : 'EN'}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--sidebar)] text-[var(--foreground)] hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm flex items-center justify-center cursor-pointer shrink-0"
            aria-label={t('nav.cambiarTema')}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-[var(--foreground)]" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-[var(--foreground)]/80 hover:text-[var(--foreground)] p-2 shrink-0 flex items-center justify-center cursor-pointer"
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[var(--card)] border-b border-[var(--border)]/30 py-4 px-5 space-y-2.5 shadow-xl">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="block text-sm font-semibold text-[var(--foreground)]/80 hover:text-[var(--foreground)] py-1.5 leading-tight cursor-pointer"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#tours"
            onClick={(e) => handleNavClick(e, '#tours')}
            className="block text-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[var(--accent)]/20 cursor-pointer"
          >
            {t('nav.explorar')}
          </a>
        </div>
      )}
    </header>
  );
}

