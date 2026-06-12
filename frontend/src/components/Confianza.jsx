'use client';

import { ShieldCheck, Award, Lock, Star } from 'lucide-react';

export default function Confianza() {
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
    <section id="reviews" className="py-16 md:py-24 px-6 flex items-center bg-[#0f0f1a] border-t border-[#2b2b46]/30 relative overflow-hidden scroll-mt-16 md:scroll-mt-20">
      {/* Luz ambiental */}
      <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] bg-[#e94560]/5 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LADO IZQUIERDO: Opiniones estilo TripAdvisor (7 columnas en desktop) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] text-[#e94560] font-extrabold uppercase tracking-widest block">
              Opiniones Reales
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Recomendados en TripAdvisor
            </h2>
            <p className="text-sm text-gray-400 max-w-xl">
              Nuestra prioridad es tu seguridad y satisfacción. Mira lo que opinan los viajeros que confiaron en nosotros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {opiniones.map((op) => (
              <div
                key={op.id}
                className="glass-card p-6 rounded-2xl border border-white/5 space-y-4 hover:border-emerald-500/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* TripAdvisor Logo Improvised */}
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400 text-xs">
                      TA
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{op.nombre}</h4>
                      <span className="text-[10px] text-gray-500">{op.origen}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">{op.fecha}</span>
                </div>

                <div className="space-y-1">
                  <TripAdvisorRating rating={op.burbujas} />
                  <h5 className="font-bold text-sm text-white pt-1">{op.titulo}</h5>
                  <p className="text-xs text-gray-400 leading-relaxed italic">
                    "{op.comentario}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LADO DERECHO: Licencias y Sellos SSL (5 columnas en desktop) */}
        <div className="lg:col-span-5 space-y-6 bg-[#16162a]/30 border border-[#2b2b46]/50 p-8 rounded-3xl relative">
          <h3 className="text-base font-extrabold text-white uppercase tracking-wider border-b border-[#2b2b46]/50 pb-3">
            Garantías y Seguridad
          </h3>

          <div className="grid grid-cols-2 gap-6">
            
            {/* Sello 1: Mincetur Licencia */}
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-red-400 flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">MINCETUR</h4>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Operador oficial autorizado de turismo de aventura.
                </p>
              </div>
            </div>

            {/* Sello 2: SSL Seguro */}
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-400 flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">SSL Encriptado</h4>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Tus transacciones y datos están protegidos bajo cifrado SSL.
                </p>
              </div>
            </div>

            {/* Sello 3: Stripe Partner */}
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-blue-400 flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">Stripe Verified</h4>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Procesamiento de tarjetas bajo estándares PCI-DSS.
                </p>
              </div>
            </div>

            {/* Sello 4: Marca Perú */}
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-400 flex-shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">Marca Perú</h4>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Promotor del turismo sostenible e identidad nacional.
                </p>
              </div>
            </div>

          </div>

          <div className="bg-[#121224]/50 border border-[#2b2b46]/40 p-4 rounded-xl text-[10px] text-gray-500 leading-relaxed text-center">
            🔐 En Unu-Raymi nos tomamos en serio tu tranquilidad. Contamos con seguros contra accidentes y cobertura completa para todas nuestras rutas.
          </div>
        </div>

      </div>
    </section>
  );
}
