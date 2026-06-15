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
    <div className="flex flex-col min-h-screen bg-[var(--background)] relative">
      <Navbar />

      {/* 1. Hero con Dynamic Reveal */}
      <Hero />

      {/* 2. Sección Tours — Layout Responsivo */}
      <section id="tours" className="w-full border-t border-[var(--border)]/20 bg-[var(--sidebar)]/60 relative z-10 scroll-mt-16">

        {/* ── MOBILE/TABLET LAYOUT ── */}
        <div className="flex flex-col lg:hidden">

          {/* Mapa compacto en mobile */}
          <div className="w-full h-[320px] p-3 flex items-center justify-center border-b border-[var(--border)]/40">
            <MapaSudamerica
              filtroPais={filtroPais}
              setFiltroPais={(p) => {
                setFiltroPais(p);
                setVisibleCount(6);
              }}
            />
          </div>

          {/* Header catálogo mobile */}
          <div className="p-4 border-b border-[var(--border)]/40 bg-[#0e0e1a]/90  space-y-3 sticky top-[52px] z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[var(--foreground)] flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[var(--foreground)]" />
                Tours en {filtroPais === 'Todos' ? 'Sudamérica' : filtroPais}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[var(--muted-foreground)]">{filteredTours.length} {filteredTours.length === 1 ? 'result.' : 'results.'}</span>
                {filtroPais !== 'Todos' && (
                  <button
                    onClick={() => { setFiltroPais('Todos'); setVisibleCount(6); }}
                    className="bg-[var(--accent)]/10 text-[var(--foreground)] border border-[var(--accent)]/20 text-[9px] px-2 py-0.5 rounded-full font-bold"
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
                      ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20'
                      : 'bg-[var(--card)]/60 text-[var(--muted-foreground)] border border-[var(--border)]/60'
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
                <Search className="h-3.5 w-3.5 text-[var(--muted-foreground)]/80" />
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setVisibleCount(6); }}
                placeholder="Buscar tours..."
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-[var(--border)]/50 rounded-xl text-xs text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-[var(--accent)]/50"
              />
              {busqueda && (
                <button onClick={() => { setBusqueda(''); setVisibleCount(6); }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted-foreground)]/80">
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
                <h4 className="text-[var(--foreground)] font-bold text-sm">No hay tours en esta región</h4>
                <p className="text-xs text-[var(--muted-foreground)]/80 max-w-xs leading-relaxed">
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
                      className="group flex items-center gap-2 bg-[var(--card)]/60 border border-[var(--accent)]/40 hover:border-[var(--accent)] hover:bg-[var(--accent)] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all"
                    >
                      Cargar más aventuras
                      <Compass className="w-4 h-4 text-[var(--foreground)] group-hover:text-[var(--foreground)] group-hover:rotate-180 transition-all duration-500" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── DESKTOP LAYOUT (split-screen) ── */}
        <div className="hidden lg:flex flex-row lg:h-[calc(100vh-4rem)] lg:min-h-[600px]">

          {/* Columna Izquierda: Mapa */}
          <div className="w-[35%] xl:w-[40%] h-full p-4 flex items-center justify-center border-r border-[var(--border)]">
            <MapaSudamerica
              filtroPais={filtroPais}
              setFiltroPais={(p) => {
                setFiltroPais(p);
                setVisibleCount(6);
              }}
            />
          </div>

          {/* Columna Derecha: Listado Desplazable */}
          <div className="w-[65%] xl:w-[60%] h-full flex flex-col">
            {/* Header del catálogo */}
            <div className="p-4 lg:p-5 border-b border-[var(--border)] bg-[#dcfce7]/40 space-y-1">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base md:text-lg font-black text-[var(--foreground)] flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[var(--foreground)]" />
                      Tours en {filtroPais === 'Todos' ? 'Sudamérica' : filtroPais}
                    </h2>
                    {filtroPais !== 'Todos' && (
                      <button
                        onClick={() => { setFiltroPais('Todos'); setVisibleCount(6); }}
                        className="bg-[var(--accent)] text-[#ffffff] hover:bg-[var(--accent)] hover:text-[var(--foreground)] border border-[var(--accent)]/20 text-[10px] px-2 py-0.5 rounded-full font-bold transition-all"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {filteredTours.length} {filteredTours.length === 1 ? 'aventura encontrada' : 'aventuras encontradas'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {['*', 'Full Days', 'Trekking', 'Trek & Climb'].map((cat) => {
                    const isSelected = filtroCategoria === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setFiltroCategoria(cat); setVisibleCount(6); }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 ${isSelected
                          ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20 scale-105'
                          : 'bg-[var(--card)]/60 hover:bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]/60 hover:border-[var(--accent)]/40'
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
                  <Search className="h-3.5 w-3.5 text-[var(--muted-foreground)]/80" />
                </span>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setVisibleCount(6); }}
                  placeholder="Buscar por nombre, descripción o país..."
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-[var(--border)]/50 rounded-xl text-xs md:text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[#4a5759]/30 transition-all"
                />
                {busqueda && (
                  <button onClick={() => { setBusqueda(''); setVisibleCount(6); }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted-foreground)]/80 hover:text-[var(--foreground)]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista scrollable */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-3 lg:space-y-4 no-scrollbar">
              {filteredTours.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                  <HelpCircle className="w-12 h-12 text-gray-600" />
                  <h4 className="text-[var(--foreground)] font-bold text-sm">No hay tours en esta región</h4>
                  <p className="text-xs text-[var(--muted-foreground)]/80 max-w-xs leading-relaxed">
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
                        className="group flex items-center gap-2 bg-[var(--card)]/60 border border-[var(--accent)]/40 hover:border-[var(--accent)] hover:bg-[var(--accent)] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Cargar más aventuras
                        <Compass className="w-4 h-4 text-[var(--foreground)] group-hover:text-[var(--foreground)] group-hover:rotate-180 transition-all duration-500" />
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
      <section id="contacto" className="bg-[var(--sidebar)] border-t border-[var(--border)]/50 py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo y lema */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/uploads/logo.webp"
                alt="Unuraymi Expeditions"
                className="h-10 w-auto object-contain"
              />
              <span className="font-extrabold text-[var(--foreground)] text-lg tracking-wider">UNU-RAYMI</span>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm leading-relaxed max-w-sm">
              Agencia de viajes dedicada a crear trekking personalizados de lujo y expediciones culturales por los andes sudamericanos.
            </p>
          </div>

          {/* Destinos */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-[var(--foreground)] uppercase text-xs tracking-widest text-[var(--foreground)]">Destinos</h4>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li><button onClick={() => setFiltroPais('Perú')} className="hover:text-[var(--foreground)] transition-colors">Perú y Machupicchu</button></li>
              <li><button onClick={() => setFiltroPais('Colombia')} className="hover:text-[var(--foreground)] transition-colors">Colombia Cafetera</button></li>
              <li><button onClick={() => setFiltroPais('Chile')} className="hover:text-[var(--foreground)] transition-colors">Chile y Lagos Patagónicos</button></li>
            </ul>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-[var(--foreground)] uppercase text-xs tracking-widest text-[var(--foreground)]">Contacto</h4>
            <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[var(--foreground)]" />
                <span>contacto@unu-raymi.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--foreground)]" />
                <span>+51 987 654 321</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--foreground)]" />
                <span>Cusco, Perú</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-[var(--border)]/30 mt-12 pt-6 text-center text-xs text-[var(--muted-foreground)]/80">
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

      {/* Botón Flotante de WhatsApp */}
      <a
        href="https://wa.me/51915082539?text=Hola%20Unu-Raymi!%20Me%20gustar%C3%ADa%20recibir%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20tours%20y%20excursiones%20de%20aventura%20en%20Sudam%C3%A9rica."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
        aria-label="Contactar por WhatsApp"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-6.5 h-6.5 fill-white"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.461 5.48.003 9.944-4.461 9.947-9.948 0-2.658-1.036-5.158-2.92-7.045C17.18 1.737 14.685 1.7 12.012 1.7c-5.485 0-9.95 4.465-9.953 9.954-.001 1.924.506 3.806 1.468 5.418L2.52 21.072l4.128-1.918zm10.748-4.708c-.294-.148-1.745-.86-2.011-.958-.268-.098-.463-.148-.66.148-.196.294-.76.957-.93 1.15-.173.197-.347.222-.64.074-.295-.148-1.246-.459-2.373-1.464-.877-.782-1.47-1.748-1.642-2.044-.173-.294-.018-.454.13-.601.134-.132.294-.347.44-.52.148-.173.197-.295.295-.49.098-.198.05-.371-.025-.52-.075-.148-.66-1.59-.904-2.18-.238-.574-.48-.495-.66-.504-.171-.008-.367-.01-.563-.01-.195 0-.513.073-.78.365-.268.294-1.026 1.004-1.026 2.45 0 1.446 1.052 2.842 1.2 3.038.147.197 2.07 3.16 5.014 4.437.7.304 1.248.487 1.674.623.704.224 1.345.193 1.851.117.564-.084 1.745-.713 1.992-1.4.247-.687.247-1.275.173-1.4-.075-.124-.27-.197-.563-.346z" />
        </svg>
      </a>
    </div>
  );
}
