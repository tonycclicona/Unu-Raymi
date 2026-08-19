'use client';

import { use } from 'react';
import { useParams, usePathname } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import TourForm from '@/components/TourForm';

export default function EditarTourClient({ params }) {
  const nextParams = useParams();
  const pathname = usePathname();

  // Resolver ID de params (soporte React 19 use(params), useParams o fallback de URL)
  let id = null;
  try {
    if (params && typeof params.then === 'function') {
      const resolved = use(params);
      id = resolved?.id;
    } else if (params?.id) {
      id = params.id;
    }
  } catch (e) {}

  if (!id && nextParams?.id) id = nextParams.id;
  if (!id && pathname) {
    const match = pathname.match(/\/tours\/([^/]+)\/editar/);
    if (match) id = match[1];
  }
  if (!id && typeof window !== 'undefined') {
    const match = window.location.pathname.match(/\/tours\/([^/]+)\/editar/);
    if (match) id = match[1];
  }

  const { data: response, error } = useSWR(id ? `/tours/${id}` : null, fetcher);
  const tour = response?.data || (response?.id ? response : null);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
        Error al cargar los datos del tour para edición ({error.message}).
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#4a5759] tracking-tight">Editar Tour</h1>
        <p className="text-[#6c7a7c] mt-1 text-sm">Modifica los detalles y servicios de la aventura.</p>
      </div>

      {/* Formulario con key para remounting reactivo al cargar datos */}
      <TourForm initialData={tour} key={tour.id} />
    </div>
  );
}

