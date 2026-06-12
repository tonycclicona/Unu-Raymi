'use client';

import useSWR from 'swr';
import { fetcher, API_BASE_URL } from '@/lib/api';
import EstadoBadge from '@/components/EstadoBadge';
import { Receipt, Calendar, Users, DollarSign, Download, Eye } from 'lucide-react';
import { useState } from 'react';

export default function ReservasPage() {
  const { data: reservas, error } = useSWR('/reservas', fetcher);
  const [filtro, setFiltro] = useState('ALL');

  const filteredReservas = (reservas || []).filter(reserva => {
    if (filtro === 'ALL') return true;
    return reserva.estado === filtro;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Reservas</h1>
          <p className="text-gray-400 mt-1 text-sm">Gestiona y consulta las órdenes de reserva y estados de pago.</p>
        </div>

        {/* Filtros */}
        <div className="flex bg-[#1a1d15]/55 border border-[#414833]/50 p-1 rounded-xl gap-1">
          {['ALL', 'PENDING', 'PAID', 'CANCELLED'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltro(estado)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filtro === estado
                  ? 'bg-[#656d4a] text-white shadow-lg shadow-[#656d4a]/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {estado === 'ALL' && 'Todas'}
              {estado === 'PENDING' && 'Pendientes'}
              {estado === 'PAID' && 'Pagadas'}
              {estado === 'CANCELLED' && 'Canceladas'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Reservas */}
      <div className="glass-card rounded-2xl p-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
            Error al cargar las reservas. Verifica que el servidor backend esté activo en el puerto 4000.
          </div>
        )}

        {!reservas && !error && (
          <div className="py-8 text-center text-gray-500 text-sm">
            Cargando el listado de reservas...
          </div>
        )}

        {reservas && filteredReservas.length === 0 && (
          <div className="py-8 text-center text-gray-500 text-sm">
            No se encontraron reservas con el filtro seleccionado.
          </div>
        )}

        {reservas && filteredReservas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead>
                <tr className="border-b border-[#414833] text-gray-400 text-xs font-semibold uppercase">
                  <th className="py-3.5 px-4">Referencia</th>
                  <th className="py-3.5 px-4">Titular</th>
                  <th className="py-3.5 px-4">Tour / Viaje</th>
                  <th className="py-3.5 px-4">Pasajeros</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#414833]/50">
                {filteredReservas.map((reserva) => (
                  <tr key={reserva.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-gray-400">
                      #{reserva.id}
                      <span className="block text-[10px] text-gray-600 truncate max-w-[80px]" title={reserva.tokenSeguridad}>
                        {reserva.tokenSeguridad.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{reserva.titularNombre}</div>
                      <div className="text-xs text-gray-500">{reserva.titularEmail}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-white">{reserva.tour?.nombre || 'Tour cargando...'}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-[#656d4a]" />
                        {new Date(reserva.fechaViaje).toLocaleDateString('es-PE')}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span>{reserva.pasajeros.length} viajeros</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-white">${reserva.precioTotal.toFixed(2)}</div>
                    </td>
                    <td className="py-4 px-4">
                      <EstadoBadge estado={reserva.estado} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      {reserva.estado === 'PAID' ? (
                        <a
                          href={`${API_BASE_URL}/reservas/${reserva.id}/invoice?token=${reserva.tokenSeguridad}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[#656d4a]/10 hover:bg-[#656d4a] text-[#656d4a] hover:text-white border border-[#656d4a]/20 hover:border-transparent px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-xs text-gray-600 italic">Pagar para generar</span>
                      )}
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
