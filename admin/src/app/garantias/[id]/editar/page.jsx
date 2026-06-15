'use client';

import { use } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import GarantiaForm from '@/components/GarantiaForm';

export default function EditarGarantiaPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { data: response, error } = useSWR(`/garantias/${id}`, fetcher);
  const garantia = response?.data;

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
        Error al cargar los datos de la garantía para edición.
      </div>
    );
  }

  if (!garantia) {
    return (
      <div className="py-8 text-center text-[#6c7a7c]/80 text-sm">
        Cargando información de la garantía...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#4a5759] tracking-tight">Editar Garantía</h1>
        <p className="text-[#6c7a7c] mt-1 text-sm">Modifica el título, icono, color e imagen de certificado de la garantía.</p>
      </div>

      <GarantiaForm initialData={garantia} id={id} />
    </div>
  );
}
