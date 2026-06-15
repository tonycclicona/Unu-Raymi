'use client';

import useSWR from 'swr';
import { fetcher, mutateApi, API_ASSETS_URL } from '@/lib/api';
import Link from 'next/link';
import { Users, Plus, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';

export default function GuiasList() {
  const { data: response, error, mutate } = useSWR('/guias', fetcher);
  const guias = response?.data || [];
  const [loadingId, setLoadingId] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este guía? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setLoadingId(id);
    try {
      await mutateApi(`/guias/${id}`, { method: 'DELETE' });
      mutate(); // Revalidar caché de SWR
    } catch (err) {
      alert(err.message || 'Error al eliminar el guía');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#4a5759] tracking-tight">Guías de Expedición</h1>
          <p className="text-[#6c7a7c] mt-1 text-sm">Gestiona el equipo de guías y líderes que se muestran en la landing page.</p>
        </div>
        <Link
          href="/guias/nuevo"
          className="flex items-center gap-2 bg-[#4a5759] hover:bg-[#384244] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#4a5759]/20 hover:shadow-[#4a5759]/30 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Guía
        </Link>
      </div>

      {/* Lista de Guías */}
      <div className="glass-card rounded-2xl p-6 bg-[#ffffff]/60 border border-[#b0c4b1]/30">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
            Error al cargar los guías de la API.
          </div>
        )}

        {!response && !error && (
          <div className="py-8 text-center text-[#6c7a7c]/80 text-sm">
            Cargando guías de la base de datos...
          </div>
        )}

        {response && guias.length === 0 && (
          <div className="py-8 text-center text-[#6c7a7c]/80 text-sm">
            No se han registrado guías aún.
          </div>
        )}

        {guias.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#b0c4b1]/50 text-xs font-extrabold text-[#4a5759] uppercase tracking-wider">
                  <th className="pb-3 pl-4">Foto</th>
                  <th className="pb-3">Nombre</th>
                  <th className="pb-3">Rol</th>
                  <th className="pb-3">Experiencia</th>
                  <th className="pb-3">Idiomas</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3 pr-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b0c4b1]/30 text-sm text-[#4a5759]">
                {guias.map((guia) => (
                  <tr key={guia.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-4 pl-4">
                      <img
                        src={guia.foto.startsWith('http') ? guia.foto : `${API_ASSETS_URL}${guia.foto}`}
                        alt={guia.nombre}
                        className="w-12 h-12 rounded-full object-cover border border-[#b0c4b1]"
                      />
                    </td>
                    <td className="py-4 font-bold">{guia.nombre}</td>
                    <td className="py-4">{guia.rol}</td>
                    <td className="py-4">{guia.experiencia}</td>
                    <td className="py-4">{guia.idiomas}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        guia.activo
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {guia.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/guias/${guia.id}/editar`}
                          className="p-2 bg-[#b0c4b1]/30 hover:bg-[#4a5759]/10 rounded-xl text-[#4a5759] transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(guia.id)}
                          disabled={loadingId === guia.id}
                          className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl text-red-500 border border-red-500/10 hover:border-red-500 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
