'use client';

import GuiaForm from '@/components/GuiaForm';

export default function NuevoGuia() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#4a5759] tracking-tight">Agregar Guía</h1>
        <p className="text-[#6c7a7c] mt-1 text-sm">Registra un nuevo guía en el equipo de Unu-Raymi.</p>
      </div>
      <GuiaForm />
    </div>
  );
}
