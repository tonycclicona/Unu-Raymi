'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import EstadoBadge from '@/components/EstadoBadge';
import { Users, Compass, Receipt, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: tours, error: errTours } = useSWR('/tours', fetcher);
  const { data: reservas, error: errReservas } = useSWR('/reservas', fetcher);

  const totalTours = tours?.data?.length || 0;
  const totalReservas = reservas?.length || 0;
  
  // Calcular ingresos totales y clientes atendidos
  const ingresosTotales = (reservas || [])
    .filter(r => r.estado === 'PAID')
    .reduce((sum, r) => sum + r.precioTotal, 0);

  const pasajerosUnicos = (reservas || [])
    .filter(r => r.estado === 'PAID')
    .reduce((sum, r) => sum + r.pasajeros.length, 0);

  const ultimasReservas = (reservas || [])
    .slice()
    .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#4a5759] tracking-tight">Dashboard</h1>
        <p className="text-[#6c7a7c] mt-1 text-sm">Resumen general de las operaciones de Unu-Raymi.</p>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Ingresos Confirmados"
          value={`$${ingresosTotales.toFixed(2)}`}
          icon={DollarSign}
          colorClass="text-emerald-400"
          subtitle="De reservas con estado PAGADO"
        />
        <StatsCard
          title="Total Reservas"
          value={totalReservas}
          icon={Receipt}
          colorClass="text-indigo-400"
          subtitle="Reservas registradas"
        />
        <StatsCard
          title="Tours Activos"
          value={totalTours}
          icon={Compass}
          colorClass="text-[#4a5759]"
          subtitle="Tours en catálogo"
        />
        <StatsCard
          title="Pasajeros Atendidos"
          value={pasajerosUnicos}
          icon={Users}
          colorClass="text-purple-400"
          subtitle="De reservas pagadas"
        />
      </div>

      {/* Reservas Recientes */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex justify-between items-center border-b border-[#b0c4b1] pb-4 mb-4">
          <h2 className="text-lg font-bold text-[#4a5759] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#4a5759]" />
            Últimas Reservas
          </h2>
          <Link href="/reservas" className="text-xs text-[#4a5759] hover:text-[#384244] font-semibold transition-colors">
            Ver todas las reservas →
          </Link>
        </div>

        {ultimasReservas.length === 0 ? (
          <div className="py-8 text-center text-[#6c7a7c]/80 text-sm">
            No se han registrado reservas aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#4a5759]">
              <thead>
                <tr className="border-b border-[#b0c4b1] text-[#6c7a7c] text-xs font-semibold uppercase">
                  <th className="py-3 px-4">Titular</th>
                  <th className="py-3 px-4">Tour</th>
                  <th className="py-3 px-4">Fecha Viaje</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b0c4b1]/50">
                {ultimasReservas.map((reserva) => (
                  <tr key={reserva.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-4 font-medium text-[#4a5759]">{reserva.titularNombre}</td>
                    <td className="py-4 px-4">{reserva.tour?.nombre || 'Tour desconocido'}</td>
                    <td className="py-4 px-4">{new Date(reserva.fechaViaje).toLocaleDateString('es-PE')}</td>
                    <td className="py-4 px-4 font-bold text-[#4a5759]">${reserva.precioTotal.toFixed(2)}</td>
                    <td className="py-4 px-4">
                      <EstadoBadge estado={reserva.estado} />
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
