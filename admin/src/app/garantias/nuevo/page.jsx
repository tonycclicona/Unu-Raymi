'use client';

import GarantiaForm from '@/components/GarantiaForm';

export default function NuevaGarantia() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#4a5759] tracking-tight">Agregar Garantía</h1>
        <p className="text-[#6c7a7c] mt-1 text-sm">Registra una nueva certificación de seguridad o garantía oficial.</p>
      </div>
      <GarantiaForm />
    </div>
  );
}
