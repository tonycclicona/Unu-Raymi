'use client';

import { use } from 'react';
import { useParams, usePathname } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import TourForm from '@/components/TourForm';

export default function EditarTourClient({ params }) {
  const nextParams = useParams();
  const pathname = usePathname();
  
  // Extraer ID ya sea de props, useParams o directamente del pathname de la URL
  let id = params ? (typeof params.then === 'function' ? use(params)?.id : params?.id) : null;
  if (!id && nextParams?.id) id = nextParams.id;
  if (!id && typeof window !== 'undefined') {
    const match = window.location.pathname.match(/\/tours\/([^/]+)\/editar/);
    if (match) id = match[1];
  }
  if (!id && pathname) {
    const match = pathname.match(/\/tours\/([^/]+)\/editar/);
    if (match) id = match[1];
  }

  const { data: tour, error } = useSWR(id ? `/tours/${id}` : null, fetcher);

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
  const formData = tour?.data || (tour?.id ? tour : null);

  if (!formData && !error) {
    return (
      <div className="py-8 text-center text-[#6c7a7c]/80 text-sm">
        Cargando información del tour...
      </div>
    );
  }

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
