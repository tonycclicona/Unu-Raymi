'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[Admin App Error]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center p-6 text-[#4a5759]">
      <div className="max-w-md w-full bg-white border border-[#b0c4b1] rounded-3xl p-8 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-black text-[#4a5759]">Hubo un problema al cargar esta vista</h2>
          <p className="text-xs text-[#6c7a7c] mt-1">
            {error?.message || 'Ocurrió un error inesperado al procesar los componentes de la página.'}
          </p>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-[#4a5759] hover:bg-[#3b4749] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md"
          >
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-[#dedbd2] hover:bg-[#c5c2b9] text-[#4a5759] rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <Home className="w-4 h-4" /> Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
