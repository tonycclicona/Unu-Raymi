'use client';

import { use } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import GuiaForm from '@/components/GuiaForm';

export default function EditarGuiaPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { data: response, error } = useSWR(`/guias/${id}`, fetcher);
  const guia = response?.data;

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
        Error al cargar los datos del guía para edición.
      </div>
    );
  }

  if (!guia) {
    return (
      <div className="py-8 text-center text-[#6c7a7c]/80 text-sm">
        Cargando información del guía...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#4a5759] tracking-tight">Editar Guía</h1>
        <p className="text-[#6c7a7c] mt-1 text-sm">Modifica los detalles, idiomas y experiencia del guía de expedición.</p>
      </div>

      <GuiaForm initialData={guia} id={id} />
    </div>
  );
}
