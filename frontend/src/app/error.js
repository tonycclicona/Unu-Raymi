'use client';

import { useEffect } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Error capturado por Next.js App ErrorBoundary:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[var(--background)]">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-extrabold text-[var(--foreground)]">
        Algo no salió como esperábamos
      </h2>
      <p className="text-xs text-[var(--muted-foreground)] max-w-md leading-relaxed">
        Ocurrió un inconveniente al procesar la información. Puedes reintentar la acción o volver a cargar la página principal.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-[var(--accent)] hover:opacity-90 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          Reintentar
        </button>
        <button
          onClick={() => { window.location.href = '/'; }}
          className="border border-[var(--border)] hover:bg-[var(--card)] text-[var(--foreground)] font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
        >
          Ir al Inicio
        </button>
      </div>
    </div>
  );
}
