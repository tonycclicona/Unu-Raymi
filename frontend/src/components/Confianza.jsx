'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, API_ASSETS_URL } from '@/lib/api';
import { ShieldCheck, Award, Lock, Star, Heart, Shield, X } from 'lucide-react';

const ICON_MAP = {
  Award,
  Lock,
  ShieldCheck,
  Star,
  Heart,
  Shield,
};

const COLOR_MAP = {
  red: 'bg-red-500/5 border-red-500/10 text-red-400',
  emerald: 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400',
  blue: 'bg-blue-500/5 border-blue-500/10 text-blue-400',
  amber: 'bg-amber-500/5 border-amber-500/10 text-amber-400',
  indigo: 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400',
  teal: 'bg-teal-500/5 border-teal-500/10 text-teal-400',
};

export default function Confianza() {
  const [hoveredGarantiaId, setHoveredGarantiaId] = useState(null);
  const [selectedGarantiaImg, setSelectedGarantiaImg] = useState(null);

  const { data: response } = useSWR('/garantias?activo=true', fetcher);
  const dbGarantias = response?.data || [];

  const opiniones = [
    {
      id: 1,
      nombre: 'Mark S.',
      origen: 'Boston, EE. UU.',
      fecha: 'Hace 2 semanas',
      titulo: 'Experiencia inolvidable en Cusco',
      comentario: 'Hicimos el Camino Inca con Unu-Raymi y fue espectacular. Los guías sabían muchísimo de arqueología y la comida era increíble.',
      burbujas: 5,
    },
    {
      id: 2,
      nombre: 'Elena R.',
      origen: 'Madrid, España',
      fecha: 'Hace 1 mes',
      titulo: 'Muy profesionales y seguros',
      comentario: 'Viajamos en familia y nos dieron una asistencia impecable desde la recogida en el aeropuerto. Muy recomendados en trekking de altura.',
      burbujas: 5,
    },
  ];

  // Renderizador de las clásicas burbujas verdes de TripAdvisor
  const TripAdvisorRating = ({ rating }) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`w-3.5 h-3.5 rounded-full border border-emerald-500 flex items-center justify-center ${
              i < rating ? 'bg-emerald-500' : 'bg-transparent'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <section id="reviews" className="py-16 md:py-24 px-6 flex items-center bg-[var(--background)] border-t border-[var(--border)]/30 relative overflow-hidden scroll-mt-16 md:scroll-mt-20">
      {/* Luz ambiental */}
      <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] bg-[var(--accent)]/5 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LADO IZQUIERDO: Opiniones estilo TripAdvisor (7 columnas en desktop) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] text-[var(--foreground)] font-extrabold uppercase tracking-widest block">
              Opiniones Reales
            </span>
            <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight">
              Recomendados en TripAdvisor
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] max-w-xl">
              Nuestra prioridad es tu seguridad y satisfacción. Mira lo que opinan los viajeros que confiaron en nosotros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {opiniones.map((op) => (
              <div
                key={op.id}
                className="glass-card p-6 rounded-2xl border border-black/5 space-y-4 hover:border-emerald-500/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* TripAdvisor Logo Improvised */}
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400 text-xs">
                      TA
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--foreground)] leading-tight">{op.nombre}</h4>
                      <span className="text-[10px] text-[var(--muted-foreground)]/80">{op.origen}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--muted-foreground)]/80">{op.fecha}</span>
                </div>

                <div className="space-y-1">
                  <TripAdvisorRating rating={op.burbujas} />
                  <h5 className="font-bold text-sm text-[var(--foreground)] pt-1">{op.titulo}</h5>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed italic">
                    "{op.comentario}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LADO DERECHO: Licencias y Sellos SSL (5 columnas en desktop) */}
        <div className="lg:col-span-5 space-y-6 bg-[var(--card)] border border-[var(--border)]/50 p-8 rounded-3xl relative">
          <h3 className="text-base font-extrabold text-[var(--foreground)] uppercase tracking-wider border-b border-[var(--border)]/50 pb-3">
            Garantías y Seguridad
          </h3>

          <div className="grid grid-cols-2 gap-6">
            {(() => {
              const mockGarantias = [
                {
                  id: 1,
                  titulo: 'MINCETUR',
                  descripcion: 'Operador oficial autorizado de turismo de aventura.',
                  icono: 'Award',
                  color: 'red',
                  imagenUrl: '',
                },
                {
                  id: 2,
                  titulo: 'SSL Encriptado',
                  descripcion: 'Tus transacciones y datos están protegidos bajo cifrado SSL.',
                  icono: 'Lock',
                  color: 'emerald',
                  imagenUrl: '',
                },
                {
                  id: 3,
                  titulo: 'Stripe Verified',
                  descripcion: 'Procesamiento de tarjetas bajo estándares PCI-DSS.',
                  icono: 'ShieldCheck',
                  color: 'blue',
                  imagenUrl: '',
                },
                {
                  id: 4,
                  titulo: 'Marca Perú',
                  descripcion: 'Promotor del turismo sostenible e identidad nacional.',
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

                    <div className={`p-3 rounded-xl border flex-shrink-0 transition-transform duration-300 ${
                      g.imagenUrl ? 'group-hover/sello:scale-105 group-hover/sello:border-[#ca8a04]' : ''
                    } ${colorClass}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className={`text-xs font-bold text-[var(--foreground)] transition-colors ${
                        g.imagenUrl ? 'group-hover/sello:text-[#ca8a04]' : ''
                      }`}>
                        {g.titulo}
                      </h4>
                      <p className="text-[10px] text-[var(--muted-foreground)]/80 leading-normal">
                        {g.descripcion}
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)]/40 p-4 rounded-xl text-[10px] text-[var(--muted-foreground)]/80 leading-relaxed text-center">
            🔐 En Unu-Raymi nos tomamos en serio tu tranquilidad. Contamos con seguros contra accidentes y cobertura completa para todas nuestras rutas.
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
              alt="Certificado en tamaño completo"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedGarantiaImg(null);
              }}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white p-2.5 rounded-full transition-all"
              aria-label="Cerrar vista"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
