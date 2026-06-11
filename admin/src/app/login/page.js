'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mutateApi } from '@/lib/api';
import { Lock, User, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await mutateApi('/auth/login', {
        method: 'POST',
        body: { username, password },
      });

      if (res.success && res.token) {
        // Guardar en cookie para que middleware.js lo verifique en el servidor
        document.cookie = `session_token=${res.token}; path=/; max-age=${8 * 60 * 60}; SameSite=Strict`;
        router.push('/');
        router.refresh();
      } else {
        throw new Error('No se recibió un token válido');
      }
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] relative px-4">
      {/* Luces decorativas */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-[#e94560]/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="glass w-full max-w-md p-8 rounded-3xl space-y-8 relative shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#e94560] flex items-center justify-center font-bold text-white text-2xl mx-auto shadow-lg shadow-[#e94560]/30 animate-pulse">
            U
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Unu-Raymi</h1>
            <p className="text-gray-400 text-xs mt-1">Panel de Administración</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuario</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#121224] border border-[#2b2b46] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560] transition-all text-sm"
                placeholder="Ingresa tu usuario"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#121224] border border-[#2b2b46] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560] transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e94560] hover:bg-[#ff5c77] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#e94560]/20 hover:shadow-[#e94560]/30 transition-all text-sm disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
