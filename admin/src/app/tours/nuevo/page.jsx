import TourForm from '@/components/TourForm';

export default function NuevoTourPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Nuevo Tour</h1>
        <p className="text-gray-400 mt-1 text-sm">Registra una nueva aventura en el catálogo de Unu-Raymi.</p>
      </div>

      {/* Formulario */}
      <TourForm />
    </div>
  );
}
