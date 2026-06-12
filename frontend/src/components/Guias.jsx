'use client';

import { Sparkles, Languages, Award, MapPin } from 'lucide-react';

export default function Guias() {
  const guias = [
    {
      id: 1,
      nombre: 'Edgar Quispe',
      rol: 'Guía de Alta Montaña',
      experiencia: '12 años de experiencia',
      idiomas: 'Español, Inglés, Quechua',
      foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=500&q=80&fm=webp',
      descripcion: 'Experto en escalada en hielo en el Nevado Ausangate. Ha liderado más de 200 expediciones clásicas de trekking.',
    },
    {
      id: 2,
      nombre: 'Camila Ospina',
      rol: 'Líder de Aventura y Flora',
      experiencia: '8 años de experiencia',
      idiomas: 'Español, Inglés, Francés',
      foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=500&q=80&fm=webp',
      descripcion: 'Bióloga y guía certificada. Apasionada de la historia precolombina y la botánica andina en el Valle de Cocora.',
    },
    {
      id: 3,
      nombre: 'Roberto Rojas',
      rol: 'Especialista en Glaciología y Clima',
      experiencia: '15 años de experiencia',
      idiomas: 'Español, Inglés, Alemán',
      foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=500&q=80&fm=webp',
      descripcion: 'Ex-rescatista de montaña en la Patagonia. Ha cruzado los campos de hielo sur y norte en Chile en múltiples ocasiones.',
    },
  ];

  return (
    <section id="guias" className="py-16 md:py-24 px-6 flex items-center bg-[#0c0c14] border-t border-[#b0c4b1]/30 relative overflow-hidden scroll-mt-16 md:scroll-mt-20">
      {/* Luz ambiental */}
      <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Encabezado */}
        <div className="text-center space-y-3">
          <span className="text-[10px] text-[#4a5759] font-extrabold uppercase tracking-widest bg-[#4a5759]/10 border border-[#4a5759]/20 px-4 py-1.5 rounded-full inline-block shadow-lg">
            About Us / Expertos
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-[#4a5759] tracking-tight">
            El Alma de Unu-Raymi
          </h2>
          <p className="text-sm text-[#6c7a7c] max-w-xl mx-auto leading-relaxed">
            Te presentamos a nuestros líderes y guías de expedición. Profesionales certificados con capacitaciones internacionales en primeros auxilios y rescate.
          </p>
        </div>

        {/* Grid de Guías con Hover Avanzado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {guias.map((guia) => (
            <div
              key={guia.id}
              className="relative h-[400px] md:h-[420px] rounded-3xl overflow-hidden border border-[#b0c4b1]/50 group bg-[#ffffff]/20 shadow-xl"
            >
              {/* Foto de fondo (.webp optimizada desde Unsplash) */}
              <img
                src={guia.foto}
                alt={guia.nombre}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Oscurecimiento inicial de la imagen */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-90"></div>

              {/* Panel Desplizable Dinámico desde Abajo (Hover animado) */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 bg-gradient-to-t from-[#f7e1d7]/95 via-[#f7e1d7]/90 to-transparent border-t border-black/5 translate-y-[calc(100%-85px)] md:translate-y-[calc(100%-85px)] group-hover:translate-y-0 transition-transform duration-500 ease-out">
                
                {/* Cabecera del Panel (Siempre visible) */}
                <div className="space-y-1.5 pb-4">
                  <h4 className="text-lg font-black text-[#4a5759] leading-tight">
                    {guia.nombre}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-[#4a5759] font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{guia.rol}</span>
                  </div>
                </div>

                {/* Detalles extra que se revelan al hacer Hover */}
                <div className="space-y-4 pt-3 border-t border-[#b0c4b1]/50">
                  
                  {/* Idiomas */}
                  <div className="flex items-start gap-2.5">
                    <Languages className="w-4.5 h-4.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[#6c7a7c]/80 font-bold uppercase tracking-wider block">Idiomas</span>
                      <span className="text-xs text-[#4a5759] font-medium">{guia.idiomas}</span>
                    </div>
                  </div>

                  {/* Años de experiencia */}
                  <div className="flex items-start gap-2.5">
                    <Award className="w-4.5 h-4.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[#6c7a7c]/80 font-bold uppercase tracking-wider block">Experiencia</span>
                      <span className="text-xs text-[#4a5759] font-medium">{guia.experiencia}</span>
                    </div>
                  </div>

                  {/* Descripción / Bio */}
                  <p className="text-[11px] text-[#6c7a7c] leading-relaxed font-normal pt-1 border-t border-[#b0c4b1]/30">
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
