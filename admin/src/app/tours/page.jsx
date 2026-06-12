'use client';

import useSWR from 'swr';
import { fetcher, mutateApi, API_ASSETS_URL } from '@/lib/api';
import Link from 'next/link';
import { Compass, Plus, Trash2, Calendar, Users, DollarSign } from 'lucide-react';
import { useState } from 'react';

export default function ToursList() {
  const { data: tours, error, mutate } = useSWR('/tours', fetcher);
  const [loadingId, setLoadingId] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este tour? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setLoadingId(id);
    try {
      await mutateApi(`/tours/${id}`, { method: 'DELETE' });
      mutate(); // Revalidar caché de SWR
    } catch (err) {
      alert(err.message || 'Error al eliminar el tour');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#4a5759] tracking-tight">Tours</h1>
          <p className="text-[#6c7a7c] mt-1 text-sm">Gestiona el catálogo de aventuras y precios de Unu-Raymi.</p>
        </div>
        <Link
          href="/tours/nuevo"
          className="flex items-center gap-2 bg-[#4a5759] hover:bg-[#384244] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#4a5759]/20 hover:shadow-[#4a5759]/30 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Tour
        </Link>
      </div>

      {/* Lista de Tours */}
      <div className="glass-card rounded-2xl p-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
            Error al cargar los tours. Asegúrate de que la API backend esté activa en el puerto 4000.
          </div>
        )}

        {!tours && !error && (
          <div className="py-8 text-center text-[#6c7a7c]/80 text-sm">
            Cargando catálogo de tours...
          </div>
        )}

        {tours && (!tours.data || tours.data.length === 0) && (
          <div className="py-8 text-center text-[#6c7a7c]/80 text-sm">
            No se han registrado tours aún en la base de datos.
          </div>
        )}

        {tours && tours.data && tours.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tours.data.map((tour) => (
              <div
                key={tour.id}
                className="bg-[#ffffff]/55 border border-[#b0c4b1]/50 rounded-2xl overflow-hidden flex flex-col group hover:border-[#4a5759]/30 transition-all duration-300"
              >
                {/* Imagen del Tour */}
                <div className="h-48 overflow-hidden relative bg-gray-900">
                  {tour.imagenes && tour.imagenes[0] ? (
                    <img
                      src={tour.imagenes[0].url.startsWith('http') ? tour.imagenes[0].url : `${API_ASSETS_URL}${tour.imagenes[0].url}`}
                      alt={tour.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Compass className="w-12 h-12" />
                    </div>
                  )}
                  <span className="absolute top-4 right-4 bg-black/60  border border-black/10 px-3 py-1 rounded-full text-xs font-semibold text-[#4a5759] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#4a5759]" />
                    {tour.duracion_dias} {tour.duracion_dias === 1 ? 'Día' : 'Días'}
                  </span>
                </div>

                {/* Contenido */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-[#4a5759] group-hover:text-[#4a5759] transition-colors line-clamp-1">
                      {tour.nombre}
                    </h3>
                    <p className="text-[#6c7a7c] text-xs line-clamp-2 leading-relaxed">
                      {tour.descripcion}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-b border-[#b0c4b1]/50 py-3 my-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#6c7a7c]">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>{tour.cupos_disponibles} Cupos</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#6c7a7c] justify-end">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-[#4a5759]">${tour.precio_adulto} USD</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Link
                      href={`/tours/${tour.id}/editar`}
                      className="flex-1 bg-[#b0c4b1]/45 hover:bg-[#4a5759]/10 hover:text-[#4a5759] border border-[#b0c4b1] hover:border-[#4a5759]/20 text-[#4a5759] text-center py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                    >
                      Editar Tour
                    </Link>
                    <button
                      onClick={() => handleDelete(tour.id)}
                      disabled={loadingId === tour.id}
                      className="bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-[#4a5759] hover:text-[#4a5759] p-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
