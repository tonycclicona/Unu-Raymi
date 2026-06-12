'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MapaSudamerica from '@/components/MapaSudamerica';
import TourCard from '@/components/TourCard';
import CheckoutOverlay from '@/components/CheckoutOverlay';
import TourDetailsOverlay from '@/components/TourDetailsOverlay';
import Confianza from '@/components/Confianza';
import Guias from '@/components/Guias';
import { Compass, HelpCircle, Phone, Mail, MapPin, Search, X } from 'lucide-react';

export default function Home() {
  const [filtroPais, setFiltroPais] = useState('Todos');
  const [filtroCategoria, setFiltroCategoria] = useState('*');
  const [selectedTour, setSelectedTour] = useState(null);
  const [checkoutTour, setCheckoutTour] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [busqueda, setBusqueda] = useState('');

  // Cerrar todos los overlays al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedTour(null);
        setCheckoutTour(null);
        setSelectedDuration(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  // Cargar tours de la API
  const { data: response, error } = useSWR('/tours?activo=true', fetcher);
  const toursList = response?.data || [];

  // Mocks de fallback de alta calidad por si la base de datos está vacía/inactiva
  const mockTours = [
    {
      id: 101,
      nombre: 'Camino Inca Clásico a Machupicchu',
      slug: 'camino-inca-clasico',
      descripcion: 'La ruta de trekking más famosa de América. Camina por senderos ancestrales y descubre el místico santuario inca de Machupicchu.',
      precio_adulto: 650.00,
      precio_nino: 450.00,
      duracion_dias: 4,
      cupos_disponibles: 8,
      pais: 'Perú',
      categoria: 'Trekking',
      ciudad: 'Cusco',
      imagenes: [{ url: 'https://images.unsplash.com/photo-1587590227264-0ac64ce63ce8?auto=format&fit=crop&w=800&q=80' }],
    },
    {
      id: 102,
      nombre: 'Aventura al Valle de Cocora y Cafetales',
      slug: 'valle-cocora-cafe',
      descripcion: 'Explora las palmas de cera gigantes más altas del mundo en Quindío y sumérgete en la cultura cafetera de Colombia.',
      precio_adulto: 280.00,
      precio_nino: 180.00,
      duracion_dias: 3,
      cupos_disponibles: 12,
      pais: 'Colombia',
      categoria: 'Trekking',
      ciudad: 'Salento',
      imagenes: [{ url: 'https://images.unsplash.com/photo-1534067783941-51c9c23eccfd?auto=format&fit=crop&w=800&q=80' }],
    },
    {
      id: 103,
      nombre: 'Cruce Andino por los Lagos de la Patagonia',
      slug: 'cruce-andino-patagonia',
      descripcion: 'Cruza la imponente cordillera de los Andes navegando entre lagos cristalinos y volcanes cubiertos de nieve en el sur de Chile.',
      precio_adulto: 490.00,
      precio_nino: 350.00,
      duracion_dias: 5,
      cupos_disponibles: 6,
      pais: 'Chile',
      categoria: 'Trekking',
      ciudad: 'Puerto Natales',
      imagenes: [{ url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' }],
    }
  ];

  // Si la API devuelve tours, los usamos; si no, caemos en el mock. Normalizamos campos.
  const rawTours = toursList.length > 0 ? toursList : mockTours;
  const activeTours = rawTours.map(tour => ({
    ...tour,
    categoria: tour.categoria || 'Trekking',
    ciudad: tour.ciudad || (tour.pais === 'Perú' ? 'Cusco' : tour.pais === 'Colombia' ? 'Santa Marta' : 'Puerto Natales'),
  }));

  // Filtrado reactivo en base al mapa interactivo, chips y búsqueda
  const filteredTours = filteredToursList();
  const visibleTours = filteredTours.slice(0, visibleCount);

  function filteredToursList() {
    let list = activeTours;
    if (filtroPais !== 'Todos') {
      list = list.filter(tour => tour.pais.toLowerCase() === filtroPais.toLowerCase());
    }
    if (filtroCategoria !== '*') {
      list = list.filter(tour => tour.categoria.toLowerCase() === filtroCategoria.toLowerCase());
    }
    if (busqueda.trim() !== '') {
      const term = busqueda.toLowerCase().trim();
      list = list.filter(tour =>
        tour.nombre.toLowerCase().includes(term) ||
        tour.descripcion.toLowerCase().includes(term) ||
        tour.pais.toLowerCase().includes(term) ||
        tour.ciudad.toLowerCase().includes(term) ||
        tour.categoria.toLowerCase().includes(term)
      );
    }
    return list;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f7e1d7] relative">
      <Navbar />

      {/* 1. Hero con Dynamic Reveal */}
      <Hero />

      {/* 2. Sección Tours — Layout Responsivo */}
      <section id="tours" className="w-full border-t border-[#b0c4b1]/50 bg-[#0c0c14] relative z-10 scroll-mt-16">

        {/* ── MOBILE LAYOUT ── */}
        <div className="flex flex-col md:hidden">

          {/* Mapa compacto en mobile */}
          <div className="w-full h-[230px] p-3 flex items-center justify-center border-b border-[#b0c4b1]/40">
            <MapaSudamerica
              filtroPais={filtroPais}
              setFiltroPais={(p) => {
                setFiltroPais(p);
                setVisibleCount(6);
              }}
            />
          </div>

          {/* Header catálogo mobile */}
          <div className="p-4 border-b border-[#b0c4b1]/40 bg-[#0e0e1a]/90 backdrop-blur-md space-y-3 sticky top-[52px] z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[#4a5759] flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#4a5759]" />
                Tours en {filtroPais === 'Todos' ? 'Sudamérica' : filtroPais}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#6c7a7c]">{filteredTours.length} {filteredTours.length === 1 ? 'result.' : 'results.'}</span>
                {filtroPais !== 'Todos' && (
                  <button
                    onClick={() => { setFiltroPais('Todos'); setVisibleCount(6); }}
                    className="bg-[#4a5759]/10 text-[#4a5759] border border-[#4a5759]/20 text-[9px] px-2 py-0.5 rounded-full font-bold"
                  >
                    ✕ Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Chips de categoría */}
            <div className="flex flex-nowrap gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {['*', 'Full Days', 'Trekking', 'Trek & Climb'].map((cat) => {
                const isSelected = filtroCategoria === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => { setFiltroCategoria(cat); setVisibleCount(6); }}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all ${isSelected
                      ? 'bg-[#4a5759] text-white shadow-md shadow-[#4a5759]/20'
                      : 'bg-[#ffffff]/60 text-[#6c7a7c] border border-[#b0c4b1]/60'
                    }`}
                  >
                    {cat === '*' ? 'Todos' : cat}
                  </button>
                );
              })}
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-[#6c7a7c]/80" />
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setVisibleCount(6); }}
                placeholder="Buscar tours..."
                className="w-full pl-9 pr-8 py-2.5 bg-white/80 border border-[#b0c4b1]/50 rounded-xl text-xs text-[#4a5759] placeholder-gray-500 focus:outline-none focus:border-[#4a5759]/50"
              />
              {busqueda && (
                <button onClick={() => { setBusqueda(''); setVisibleCount(6); }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6c7a7c]/80">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de tours mobile */}
          <div className="p-4 space-y-4">
            {filteredTours.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <HelpCircle className="w-10 h-10 text-gray-600" />
                <h4 className="text-[#4a5759] font-bold text-sm">No hay tours en esta región</h4>
                <p className="text-xs text-[#6c7a7c]/80 max-w-xs leading-relaxed">
                  Selecciona otro país en el mapa.
                </p>
              </div>
            ) : (
              <>
                {visibleTours.map((tour) => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    onReservar={(t, dur) => { setSelectedTour(t); setSelectedDuration(dur); }}
                  />
                ))}
                {visibleCount < filteredTours.length && (
                  <div className="flex justify-center pt-2 pb-4">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 6)}
                      className="group flex items-center gap-2 bg-[#ffffff]/60 border border-[#4a5759]/40 hover:border-[#4a5759] hover:bg-[#4a5759] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all"
                    >
                      Cargar más aventuras
                      <Compass className="w-4 h-4 text-[#4a5759] group-hover:text-[#4a5759] group-hover:rotate-180 transition-all duration-500" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── DESKTOP LAYOUT (split-screen) ── */}
        <div className="hidden md:flex flex-row h-screen">

          {/* Columna Izquierda: Mapa */}
          <div className="w-[55%] h-full p-8 flex items-center justify-center border-r border-[#b0c4b1]/40">
            <MapaSudamerica
              filtroPais={filtroPais}
              setFiltroPais={(p) => {
                setFiltroPais(p);
                setVisibleCount(6);
              }}
            />
          </div>

          {/* Columna Derecha: Listado Desplazable */}
          <div className="w-[45%] h-full flex flex-col">
            {/* Header del catálogo */}
            <div className="p-6 border-b border-[#b0c4b1]/40 bg-[#0e0e1a]/80 backdrop-blur-md space-y-4">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-[#4a5759] flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#4a5759]" />
                      Tours en {filtroPais === 'Todos' ? 'Sudamérica' : filtroPais}
                    </h2>
                    {filtroPais !== 'Todos' && (
                      <button
                        onClick={() => { setFiltroPais('Todos'); setVisibleCount(6); }}
                        className="bg-[#4a5759]/10 text-[#4a5759] hover:bg-[#4a5759] hover:text-[#4a5759] border border-[#4a5759]/20 text-[9px] px-2 py-0.5 rounded-full font-bold transition-all"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[#6c7a7c] mt-0.5">
                    {filteredTours.length} {filteredTours.length === 1 ? 'aventura encontrada' : 'aventuras encontradas'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {['*', 'Full Days', 'Trekking', 'Trek & Climb'].map((cat) => {
                    const isSelected = filtroCategoria === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setFiltroCategoria(cat); setVisibleCount(6); }}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all duration-300 ${isSelected
                          ? 'bg-[#4a5759] text-white shadow-md shadow-[#4a5759]/20 scale-105'
                          : 'bg-[#ffffff]/60 hover:bg-[#ffffff] text-[#6c7a7c] hover:text-[#4a5759] border border-[#b0c4b1]/60 hover:border-[#4a5759]/40'
                        }`}
                      >
                        {cat === '*' ? '*' : cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-[#6c7a7c]/80" />
                </span>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setVisibleCount(6); }}
                  placeholder="Buscar por nombre, descripción o país..."
                  className="w-full pl-9 pr-8 py-2.5 bg-white/80 border border-[#b0c4b1]/50 rounded-xl text-xs text-[#4a5759] placeholder-gray-500 focus:outline-none focus:border-[#4a5759]/50 focus:ring-1 focus:ring-[#4a5759]/30 transition-all"
                />
                {busqueda && (
                  <button onClick={() => { setBusqueda(''); setVisibleCount(6); }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6c7a7c]/80 hover:text-[#4a5759]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {filteredTours.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                  <HelpCircle className="w-12 h-12 text-gray-600" />
                  <h4 className="text-[#4a5759] font-bold text-sm">No hay tours en esta región</h4>
                  <p className="text-xs text-[#6c7a7c]/80 max-w-xs leading-relaxed">
                    Pronto agregaremos nuevas expediciones para {filtroPais}. Selecciona otro país en el mapa.
                  </p>
                </div>
              ) : (
                <>
                  {visibleTours.map((tour) => (
                    <TourCard
                      key={tour.id}
                      tour={tour}
                      onReservar={(t, dur) => { setSelectedTour(t); setSelectedDuration(dur); }}
                    />
                  ))}
                  {visibleCount < filteredTours.length && (
                    <div className="flex justify-center pt-2 pb-6">
                      <button
                        onClick={() => setVisibleCount((prev) => prev + 6)}
                        className="group flex items-center gap-2 bg-[#ffffff]/60 border border-[#4a5759]/40 hover:border-[#4a5759] hover:bg-[#4a5759] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Cargar más aventuras
                        <Compass className="w-4 h-4 text-[#4a5759] group-hover:text-[#4a5759] group-hover:rotate-180 transition-all duration-500" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Secciones de Confianza y Expertos */}
      <Confianza />
      <Guias />

      {/* 4. Sección de Contacto / Footer */}
      <section id="contacto" className="bg-[#0b0b14] border-t border-[#b0c4b1]/50 py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo y lema */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#4a5759] flex items-center justify-center font-bold text-[#4a5759] text-xl shadow-lg">
                U
              </div>
              <span className="font-extrabold text-[#4a5759] text-lg tracking-wider">UNU-RAYMI</span>
            </div>
            <p className="text-[#6c7a7c] text-sm leading-relaxed max-w-sm">
              Agencia de viajes dedicada a crear trekking personalizados de lujo y expediciones culturales por los andes sudamericanos.
            </p>
          </div>

          {/* Destinos */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-[#4a5759] uppercase text-xs tracking-widest text-[#4a5759]">Destinos</h4>
            <ul className="space-y-2 text-sm text-[#6c7a7c]">
              <li><button onClick={() => setFiltroPais('Perú')} className="hover:text-[#4a5759] transition-colors">Perú y Machupicchu</button></li>
              <li><button onClick={() => setFiltroPais('Colombia')} className="hover:text-[#4a5759] transition-colors">Colombia Cafetera</button></li>
              <li><button onClick={() => setFiltroPais('Chile')} className="hover:text-[#4a5759] transition-colors">Chile y Lagos Patagónicos</button></li>
            </ul>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-[#4a5759] uppercase text-xs tracking-widest text-[#4a5759]">Contacto</h4>
            <div className="space-y-2 text-sm text-[#6c7a7c]">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#4a5759]" />
                <span>contacto@unu-raymi.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#4a5759]" />
                <span>+51 987 654 321</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#4a5759]" />
                <span>Cusco, Perú</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-[#b0c4b1]/30 mt-12 pt-6 text-center text-xs text-[#6c7a7c]/80">
          © {new Date().getFullYear()} Unu-Raymi Agencia de Viajes. Todos los derechos reservados.
        </div>
      </section>

      {/* Tour Details Overlay */}
      {selectedTour && (
        <TourDetailsOverlay
          tour={selectedTour}
          initialDuration={selectedDuration}
          onClose={() => {
            setSelectedTour(null);
            setSelectedDuration(null);
          }}
          onProceed={(dur) => {
            setSelectedDuration(dur);
            setCheckoutTour(selectedTour);
          }}
          isShifted={!!checkoutTour}
        />
      )}

      {/* Checkout Overlay Modal */}
      {checkoutTour && (
        <CheckoutOverlay
          tour={checkoutTour}
          selectedDuration={selectedDuration}
          onClose={() => {
            setCheckoutTour(null);
            setSelectedTour(null);
            setSelectedDuration(null);
          }}
          onBack={() => {
            setCheckoutTour(null);
          }}
        />
      )}
    </div>
  );
}
