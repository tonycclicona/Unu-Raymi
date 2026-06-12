import TourForm from '@/components/TourForm';

export default function NuevoTourPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#4a5759] tracking-tight">Nuevo Tour</h1>
        <p className="text-[#6c7a7c] mt-1 text-sm">Registra una nueva aventura en el catálogo de Unu-Raymi.</p>
      </div>

      {/* Formulario */}
      <TourForm />
    </div>
  );
}
