'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calcular transformaciones basadas en scroll
  const scale = 1 + scrollY * 0.0008;
  const videoOpacity = Math.max(0.2, 0.6 - scrollY * 0.0015);
  const textTranslateY = scrollY * 0.4;
  const textOpacity = Math.max(0, 1 - scrollY * 0.002);
  const blurProgress = Math.min(10, scrollY * 0.02);

  return (
    <section id="inicio" className="h-screen w-full relative overflow-hidden flex items-center justify-center bg-[#090910]">
      {/* Video de fondo con efecto de escala y desenfoque por scroll */}
      <div
        className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out overflow-hidden"
        style={{
          transform: `scale(${scale})`,
          filter: `blur(${blurProgress}px)`,
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ opacity: videoOpacity }}
          poster="/uploads/Background_Home_page_poster.jpg"
        >
          <source src="/uploads/Background_Home_page.webm" type="video/webm" />
          <source src="/uploads/Background_Home_page.mp4" type="video/mp4" />
          Tu navegador no soporta elementos de video integrados.
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-[#f7e1d7] via-transparent to-black/40"></div>
      </div>

      {/* Contenido del Hero con Parallax y desvanecimiento */}
      <div
        className="relative z-10 text-center max-w-4xl px-6 space-y-6"
        style={{
          transform: `translateY(${textTranslateY}px)`,
          opacity: textOpacity,
        }}
      >
        <span className="text-[#4a5759] font-extrabold uppercase tracking-widest text-xs md:text-sm bg-[#4a5759]/10 border border-[#4a5759]/20 px-4 py-2 rounded-full shadow-lg shadow-[#4a5759]/5">
          🏔️ Descubre los Andes y más allá
        </span>
        <h1 className="text-4xl md:text-7xl font-extrabold text-[#4a5759] tracking-tight leading-none drop-shadow-md">
          Aventuras Auténticas <br />
          <span className="bg-gradient-to-r from-white via-gray-200 to-[#4a5759] bg-clip-text text-transparent">
            en Sudamérica
          </span>
        </h1>
        <p className="text-[#4a5759] text-sm md:text-lg max-w-xl mx-auto leading-relaxed">
          Diseñamos experiencias únicas de trekking y exploración cultural por Perú, Colombia y Chile. Conéctate con la naturaleza en su estado puro.
        </p>

        <div className="pt-6">
          <a
            href="#tours"
            className="inline-flex items-center gap-2 bg-[#4a5759] hover:bg-[#384244] text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#4a5759]/20 hover:shadow-[#4a5759]/30 transition-all duration-300 group"
          >
            Ver Catálogo de Tours
            <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
          </a>
        </div>
      </div>

      {/* Flecha inferior animada indicando scroll */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-bounce hidden md:block">
        <a href="#tours" className="text-[#4a5759]/40 hover:text-[#4a5759]/80 transition-colors">
          <ChevronDown className="w-8 h-8" />
        </a>
      </div>
    </section>
  );
}
