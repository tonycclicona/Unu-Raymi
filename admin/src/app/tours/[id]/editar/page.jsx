'use client';

import { use } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import TourForm from '@/components/TourForm';

export default function EditarTourPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { data: tour, error } = useSWR(`/tours/${id}`, fetcher);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
        Error al cargar los datos del tour para edición.
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="py-8 text-center text-[#6c7a7c]/80 text-sm">
        Cargando información del tour...
      </div>
    );
  }

  // Mapear los datos de la API al formato esperado por el formulario
  const formData = tour?.data ? {
    ...tour.data,
  } : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#4a5759] tracking-tight">Editar Tour</h1>
        <p className="text-[#6c7a7c] mt-1 text-sm">Modifica los detalles y servicios de la aventura.</p>
      </div>

      {/* Formulario */}
      <TourForm initialData={formData} />
    </div>
  );
}
