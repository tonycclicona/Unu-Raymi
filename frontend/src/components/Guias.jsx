'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, API_ASSETS_URL } from '@/lib/api';
import { Sparkles, Languages, Award, MapPin, Footprints } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Guias() {
  const [activeGuiaId, setActiveGuiaId] = useState(null);
  const { t, language } = useLanguage();

  const { data: response } = useSWR('/guias?activo=true', fetcher);
  const dbGuias = response?.data || [];

  const toggleActiveGuia = (id) => {
    setActiveGuiaId(prev => prev === id ? null : id);
  };

  const mockGuias = [
    {
      id: 1,
      nombre: 'Edgar Quispe',
      rol: language === 'es' ? 'Guía de Alta Montaña' : 'High Mountain Guide',
      experiencia: language === 'es' ? '12 años de experiencia' : '12 years of experience',
      idiomas: language === 'es' ? 'Español, Inglés, Quechua' : 'Spanish, English, Quechua',
      foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=500&q=80&fm=webp',
      descripcion: language === 'es'
        ? 'Experto en escalada en hielo en el Nevado Ausangate. Ha liderado más de 200 expediciones clásicas de trekking.'
        : 'Expert in ice climbing at Nevado Ausangate. Has led more than 200 classic trekking expeditions.',
    },
    {
      id: 2,
      nombre: 'Camila Ospina',
      rol: language === 'es' ? 'Líder de Aventura y Flora' : 'Adventure & Flora Leader',
      experiencia: language === 'es' ? '8 años de experiencia' : '8 years of experience',
      idiomas: language === 'es' ? 'Español, Inglés, Francés' : 'Spanish, English, French',
      foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=500&q=80&fm=webp',
      descripcion: language === 'es'
        ? 'Bióloga y guía certificada. Apasionada de la historia precolombina y la botánica andina en el Valle de Cocora.'
        : 'Biologist and certified guide. Passionate about pre-Columbian history and Andean botany in the Cocora Valley.',
    },
    {
      id: 3,
      nombre: 'Roberto Rojas',
      rol: language === 'es' ? 'Especialista en Glaciología y Clima' : 'Glaciology & Climate Specialist',
      experiencia: language === 'es' ? '15 años de experiencia' : '15 years of experience',
      idiomas: language === 'es' ? 'Español, Inglés, Alemán' : 'Spanish, English, German',
      foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=500&q=80&fm=webp',
      descripcion: language === 'es'
        ? 'Ex-rescatista de montaña en la Patagonia. Ha cruzado los campos de hielo sur y norte en Chile en múltiples ocasiones.'
        : 'Former mountain rescuer in Patagonia. Has crossed the Southern and Northern Ice Fields in Chile on multiple occasions.',
    },
  ];

  const guias = dbGuias.length > 0 ? dbGuias : mockGuias;

  return (
    <section
      id="guias"
      className="min-h-screen py-10 md:py-10 px-6 flex items-center justify-center border-t border-[var(--border)]/50 relative overflow-hidden scroll-mt-4 md:scroll-mt-2 bg-cover bg-bottom bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(to bottom, transparent 50%, transparent 80%, var(--background) 100%), url('/uploads/mountain_bg.jpg')`
      }}
    >
      {/* Luz ambiental */}
      <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-purple-500/10 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>

      <div className="max-w-5xl mx-auto space-y-1 w-full">

        {/* Encabezado */}
        <div className="text-center space-y-1 max-w-4xl mx-auto">
          <span className="text-[10px] text-[#4a5759] font-extrabold uppercase tracking-widest bg-[#4a5759]/10 border border-[#4a5759]/20 px-4 py-1.5 rounded-full inline-flex items-center gap-2 shadow-lg">
            <Footprints className="w-3.5 h-3.5 text-[#4a5759] animate-pulse" />
            {t('guias.badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-[#4a5759] tracking-tight">
            {t('guias.title')}
          </h2>
          <h3 className="text-lg md:text-xl font-bold text-[#4a5759]/90 tracking-tight">
            {t('guias.sub')}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            {t('guias.body1')}
          </p>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            {t('guias.body2')}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]/80 italic pt-2 border-t border-[var(--border)]/30">
            {t('guias.desc')}
          </p>
        </div>

        {/* Grid de Guías con Hover Avanzado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {guias.map((guia) => (
            <div
              key={guia.id}
              onClick={() => toggleActiveGuia(guia.id)}
              className="relative h-[400px] md:h-[420px] rounded-3xl overflow-hidden border border-[var(--border)]/50 group bg-[var(--card)] shadow-xl cursor-pointer select-none"
            >
              {/* Foto de fondo (.webp optimizada desde Unsplash) */}
              <img
                src={guia.foto ? (guia.foto.startsWith('http') ? guia.foto : `${API_ASSETS_URL}${guia.foto}`) : ''}
                alt={guia.nombre}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Oscurecimiento inicial de la imagen */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-90"></div>

              {/* Panel Desplizable Dinámico desde Abajo (Hover animado) */}
              <div className={`absolute bottom-0 left-0 right-0 p-5 md:p-4 bg-gradient-to-t from-[var(--card)]/98 via-[var(--card)]/90 to-transparent border-t border-black/5 transition-transform duration-500 ease-out ${activeGuiaId === guia.id
                ? 'translate-y-0'
                : 'translate-y-[calc(100%-85px)] md:translate-y-[calc(100%-85px)] group-hover:translate-y-0'
                }`}>

                {/* Cabecera del Panel (Siempre visible) */}
                <div className="space-y-1.5 pb-4">
                  <h4 className={`text-lg font-black leading-tight transition-colors duration-300 ${activeGuiaId === guia.id
                    ? 'text-[var(--foreground)]'
                    : 'text-[#ffffff] group-hover:text-[var(--foreground)]'
                    }`}>
                    {guia.nombre}
                  </h4>
                  <div className={`flex items-center gap-1.5 text-xs font-bold transition-colors duration-300 ${activeGuiaId === guia.id
                    ? 'text-[var(--muted-foreground)]'
                    : 'text-[#ffffff] group-hover:text-[var(--muted-foreground)]'
                    }`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{guia.rol}</span>
                  </div>
                </div>

                {/* Detalles extra que se revelan al hacer Hover */}
                <div className="space-y-4 pt-3 border-t border-[var(--border)]/90">

                  {/* Idiomas */}
                  <div className="flex items-start gap-2.5">
                    <Languages className="w-4.5 h-4.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[var(--muted-foreground)]/80 font-bold uppercase tracking-wider block">{t('guias.idiomas')}</span>
                      <span className="text-xs text-[var(--foreground)] font-medium">{guia.idiomas}</span>
                    </div>
                  </div>

                  {/* Años de experiencia */}
                  <div className="flex items-start gap-2.5">
                    <Award className="w-4.5 h-4.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[var(--muted-foreground)]/80 font-bold uppercase tracking-wider block">{t('guias.experiencia')}</span>
                      <span className="text-xs text-[var(--foreground)] font-medium">{guia.experiencia}</span>
                    </div>
                  </div>

                  {/* Descripción / Bio */}
                  <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed font-normal pt-1 border-t border-[var(--border)]/30">
                    {guia.descripcion}
                  </p>

                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

