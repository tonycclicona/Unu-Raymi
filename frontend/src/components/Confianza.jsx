'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher, API_ASSETS_URL } from '@/lib/api';
import { ShieldCheck, Award, Lock, Star, Heart, Shield, X, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Award3D, Lock3D, Star3D, ShieldCheck3D, Shield3D } from './illustrations/Neomorphic3DIcons';

const ICON_MAP = {
  Award: Award3D,
  Lock: Lock3D,
  ShieldCheck: ShieldCheck3D,
  Star: Star3D,
  Heart: Shield3D,
  Shield: Shield3D,
};

const COLOR_MAP = {
  red: 'bg-red-500/5 border-red-500/10 text-red-400',
  emerald: 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400',
  blue: 'bg-blue-500/5 border-blue-500/10 text-blue-400',
  amber: 'bg-amber-500/5 border-amber-500/10 text-amber-400',
  indigo: 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400',
  teal: 'bg-teal-500/5 border-teal-500/10 text-teal-400',
};

const TRIPADVISOR_URL = 'https://www.tripadvisor.com/Attraction_Review-g294314-d34586345-Reviews-Unu_Raymi_Expeditions-Cusco_Cusco_Region.html';

// Componente de aislamiento seguro para el widget oficial de TripAdvisor
// Evita que los scripts legados de TripAdvisor que usan document.write() o mutan el DOM destruyan el árbol de React o el navbar
function TripAdvisorEmbed({ language }) {
  const lang = language === 'es' ? 'es' : 'en_US';
  const srcDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <base target="_blank">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #TA_cdswritereviewlg596 {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }
  </style>
</head>
<body>
  <div id="TA_cdswritereviewlg596" class="TA_cdswritereviewlg">
    <ul id="OeOeCAZawa" class="TA_links Uy5KK44v" style="list-style:none;margin:0;padding:0;">
      <li id="vAndio5BVL9" class="IbFTHOtIAh7" style="list-style:none;margin:0;padding:0;">
        <a target="_blank" rel="noopener noreferrer" href="${TRIPADVISOR_URL}">
          <img src="https://static.tacdn.com/img2/brand_refresh/Tripadvisor_lockup_horizontal_secondary_registered.svg" alt="TripAdvisor" style="height:26px;width:auto;" />
        </a>
      </li>
    </ul>
  </div>
  <script async src="https://www.jscache.com/wejs?wtype=cdswritereviewlg&uniq=596&locationId=34586345&lang=${lang}&display_version=2" data-loadtrk onload="this.loadtrk=true"></script>
</body>
</html>`;

  return (
    <div className="w-full md:w-auto flex items-center justify-center shrink-0">
      <iframe
        key={lang}
        srcDoc={srcDoc}
        title="TripAdvisor Official Widget"
        className="w-[245px] h-[215px] border-0 bg-transparent overflow-hidden rounded-xl"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        loading="lazy"
      />
    </div>
  );
}

export default function Confianza() {
  const [hoveredGarantiaId, setHoveredGarantiaId] = useState(null);
  const [selectedGarantiaImg, setSelectedGarantiaImg] = useState(null);
  const [ratingFilter, setRatingFilter] = useState('all');
  const { t, language } = useLanguage();

  const { data: response } = useSWR('/garantias?activo=true', fetcher);
  const dbGarantias = response?.data || [];

  const opiniones = t('reviews.opiniones') || [];

  // Filtro de opiniones
  const filteredOpiniones = opiniones.filter((op) => {
    if (ratingFilter === 'all') return true;
    return (op.rating || 5) === Number(ratingFilter);
  });

  const countAll = opiniones.length;
  const count5 = opiniones.filter((op) => (op.rating || 5) === 5).length;
  const count4 = opiniones.filter((op) => (op.rating || 5) === 4).length;

  // Renderizador de las clásicas burbujas verdes de TripAdvisor
  const TripAdvisorRating = ({ rating = 5 }) => {
    return (
      <div className="flex items-center gap-1" title={`${rating}/5 en TripAdvisor`}>
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`w-3.5 h-3.5 rounded-full border border-emerald-500 flex items-center justify-center transition-all ${
              i < rating ? 'bg-emerald-500' : 'bg-transparent'
            }`}
          />
        ))}
        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 ml-1">
          {rating}.0
        </span>
      </div>
    );
  };

  return (
    <section id="reviews" className="py-16 md:py-24 px-6 flex items-center bg-[var(--background)] border-t border-[var(--border)]/30 relative overflow-hidden scroll-mt-14">
      {/* Luz ambiental */}
      <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] bg-[var(--accent)]/5 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LADO IZQUIERDO: Opiniones y Widget TripAdvisor (7 columnas en desktop) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] text-[var(--foreground)] font-extrabold uppercase tracking-widest block">
              {t('reviews.badge')}
            </span>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight">
                {t('reviews.title')}
              </h2>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] max-w-xl">
              {t('reviews.desc')}
            </p>
          </div>

          {/* Tarjeta de Reputación y Widget Oficial de TripAdvisor */}
          <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('reviews.perfil_verificado')}
                </span>
                <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                  {t('reviews.calificacion_promedio')}
                </span>
              </div>
              <TripAdvisorRating rating={5} />

              <div className="pt-1 flex flex-wrap items-center gap-2.5">
                <a
                  href={TRIPADVISOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                >
                  <span>{t('reviews.escribir_opinion')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={TRIPADVISOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[var(--foreground)] bg-[var(--card)] hover:bg-[var(--sidebar)] border border-[var(--border)]/70 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                >
                  <span>{t('reviews.ver_en_tripadvisor')}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
              </div>
            </div>

            {/* Widget Oficial de TripAdvisor aislado en sandbox seguro */}
            <TripAdvisorEmbed language={language} />
          </div>

          {/* Filtros Interactivos por Puntaje */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRatingFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  ratingFilter === 'all'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]/50'
                }`}
              >
                {t('reviews.filtro_todos')} ({countAll})
              </button>

              <button
                type="button"
                onClick={() => setRatingFilter('5')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  ratingFilter === '5'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                5 {t('reviews.filtro_burbujas')} ({count5})
              </button>

              {count4 > 0 && (
                <button
                  type="button"
                  onClick={() => setRatingFilter('4')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    ratingFilter === '4'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                      : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]/50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  4 {t('reviews.filtro_burbujas')} ({count4})
                </button>
              )}
            </div>
          </div>

          {/* Cuadrícula de Opiniones Filtradas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {filteredOpiniones.map((op) => (
              <div
                key={op.id}
                className="glass-card p-5 rounded-2xl border border-[var(--border)]/60 hover:border-emerald-500/30 flex flex-col justify-between space-y-3 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400 text-xs">
                        {op.nombre ? op.nombre.charAt(0) : 'T'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--foreground)] leading-tight">{op.nombre}</h4>
                        <span className="text-[10px] text-[var(--muted-foreground)]/80 block">{op.origen}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)]/80">{op.fecha}</span>
                  </div>

                  {op.tour && (
                    <div className="inline-block bg-[var(--background)] border border-[var(--border)]/50 px-2 py-0.5 rounded-md text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {op.tour}
                    </div>
                  )}

                  <div className="space-y-1">
                    <TripAdvisorRating rating={op.rating || 5} />
                    <h5 className="font-bold text-sm text-[var(--foreground)] pt-1">{op.titulo}</h5>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed italic">
                      "{op.comentario}"
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border)]/30 flex items-center justify-between text-[10px] text-[var(--muted-foreground)]/80">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    TripAdvisor
                  </span>
                  <a
                    href={TRIPADVISOR_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-0.5"
                  >
                    {t('reviews.ver_en_tripadvisor')}
                    <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                  </a>
                </div>
              </div>
            ))}

            {filteredOpiniones.length === 0 && (
              <div className="col-span-full py-8 text-center glass-card rounded-2xl border border-[var(--border)]/50 p-6 space-y-3">
                <p className="text-xs text-[var(--muted-foreground)]">{t('reviews.sin_opiniones')}</p>
                <button
                  type="button"
                  onClick={() => setRatingFilter('all')}
                  className="text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
                >
                  {t('reviews.ver_todas_filtro')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO: Licencias y Sellos SSL (5 columnas en desktop) */}
        <div className="lg:col-span-5 space-y-6 bg-[var(--card)] border border-[var(--border)]/50 p-8 rounded-3xl relative">
          <h3 className="text-base font-extrabold text-[var(--foreground)] uppercase tracking-wider border-b border-[var(--border)]/50 pb-3">
            {t('reviews.garantias_titulo')}
          </h3>

          <div className="grid grid-cols-2 gap-6">
            {(() => {
              const mockGarantias = [
                {
                  id: 1,
                  titulo: 'MINCETUR',
                  descripcion: t('confianza.mincetur_desc'),
                  icono: 'Award',
                  color: 'red',
                  imagenUrl: '',
                },
                {
                  id: 2,
                  titulo: t('confianza.ssl_titulo'),
                  descripcion: t('confianza.ssl_desc'),
                  icono: 'Lock',
                  color: 'emerald',
                  imagenUrl: '',
                },
                {
                  id: 3,
                  titulo: t('confianza.stripe_titulo'),
                  descripcion: t('confianza.stripe_desc'),
                  icono: 'ShieldCheck',
                  color: 'blue',
                  imagenUrl: '',
                },
                {
                  id: 4,
                  titulo: t('confianza.marca_peru_titulo'),
                  descripcion: t('confianza.marca_peru_desc'),
                  icono: 'Star',
                  color: 'amber',
                  imagenUrl: '',
                },
              ];

              const garantias = dbGarantias.length > 0 ? dbGarantias : mockGarantias;

              return garantias.map((g) => {
                const IconComponent = ICON_MAP[g.icono] || Shield;
                const colorClass = COLOR_MAP[g.color] || 'bg-gray-500/5 border-gray-500/10 text-gray-400';

                return (
                  <div
                    key={g.id}
                    className={`flex items-start gap-3 relative group/sello ${
                      g.imagenUrl ? 'cursor-pointer' : ''
                    }`}
                    onMouseEnter={() => {
                      if (g.imagenUrl) setHoveredGarantiaId(g.id);
                    }}
                    onMouseLeave={() => {
                      if (g.imagenUrl) setHoveredGarantiaId(null);
                    }}
                    onClick={() => {
                      if (g.imagenUrl) setSelectedGarantiaImg(g.imagenUrl);
                    }}
                  >
                    {/* Tooltip con preview en hover */}
                    {hoveredGarantiaId === g.id && g.imagenUrl && (
                      <div className="absolute z-20 bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 h-32 bg-[var(--card)] border border-[var(--border)]/40 rounded-2xl shadow-xl p-1.5 pointer-events-none animate-fade-in flex items-center justify-center">
                        <img
                          src={g.imagenUrl.startsWith('http') ? g.imagenUrl : `${API_ASSETS_URL}${g.imagenUrl}`}
                          alt={g.titulo}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      </div>
                    )}

                    <div className={`p-2.5 rounded-xl border flex-shrink-0 transition-all duration-300 shadow-sm ${
                      g.imagenUrl ? 'group-hover/sello:scale-110 group-hover/sello:border-[#ca8a04]' : ''
                    } ${colorClass}`}>
                      <IconComponent className="w-8 h-8 md:w-9 md:h-9" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className={`text-xs font-bold text-[var(--foreground)] transition-colors ${
                        g.imagenUrl ? 'group-hover/sello:text-[#ca8a04]' : ''
                      }`}>
                        {g.traducciones?.[language]?.titulo || g.titulo}
                      </h4>
                      <p className="text-[10px] text-[var(--muted-foreground)]/80 leading-normal">
                        {g.traducciones?.[language]?.descripcion || g.descripcion}
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)]/40 p-4 rounded-xl text-[10px] text-[var(--muted-foreground)]/80 leading-relaxed text-center">
            {t('reviews.garantias_fallback')}
          </div>
        </div>

      </div>

      {/* Lightbox Modal para ver el certificado en tamaño completo */}
      {selectedGarantiaImg && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
          onClick={() => setSelectedGarantiaImg(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <img
              src={selectedGarantiaImg.startsWith('http') ? selectedGarantiaImg : `${API_ASSETS_URL}${selectedGarantiaImg}`}
              alt={t('reviews.certificado_titulo')}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedGarantiaImg(null);
              }}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white p-2.5 rounded-full transition-all"
              aria-label={t('reviews.cerrar_vista')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

