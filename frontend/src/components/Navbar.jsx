'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Excursiones', href: '#tours' },
    { label: 'Experiencias', href: '#reviews' },
    { label: 'Nosotros', href: '#guias' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,backdrop-filter,padding,border-color,box-shadow] duration-500 ease-in-out  ${isScrolled
        ? 'bg-[#dbeafe] border-b border-[#b0c4b1]/30 shadow-sm py-1.5 md:py-2'
        : 'bg-transparent py-2 md:py-5'
        }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-2 md:px-1 flex items-center justify-between gap-5">
        {/* Logo + montaña móvil */}
        <div className="flex items-center min-w-0 flex-1 md:flex-none">
          <Link href="#inicio" className="flex items-center group shrink-0 transition-all duration-300">
            <img
              src="/uploads/logo.webp"
              alt="Unuraymi Expeditions"
              className={`w-auto object-contain transition-[height] duration-500 ease-in-out group-hover:scale-105 ${isScrolled ? 'h-9 sm:h-10 md:h-12' : 'h-12 sm:h-14 md:h-16'
                }`}
            />
          </Link>

          {/* Montaña visible en móvil */}
          <div className="flex md:hidden items-center justify-center flex-1 ml-3 overflow-hidden">
            <svg
              viewBox="0 0 200 50"
              className="w-full max-w-[140px] h-8 text-gray-700"
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
            className="w-full h-12 text-gray-700 hover:text-[#4a5759] transition-colors duration-500"
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#4a5759] after:transition-all hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#tours"
            className="bg-[#4a5759] hover:bg-[#384244] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-[#4a5759]/20 hover:shadow-[#4a5759]/30 transition-all duration-300 text-sm"
          >
            Explorar Ahora
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-700 hover:text-gray-900 p-2 shrink-0"
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 py-4 px-5 space-y-2.5 shadow-xl">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block text-sm font-semibold text-gray-700 hover:text-gray-900 py-1.5 leading-tight"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#tours"
            onClick={() => setIsOpen(false)}
            className="block text-center bg-[#4a5759] hover:bg-[#384244] text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#4a5759]/20"
          >
            Explorar Ahora
          </a>
        </div>
      )}
    </header>
  );
}
