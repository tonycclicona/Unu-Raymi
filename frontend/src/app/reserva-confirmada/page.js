'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Download, Home, Calendar, Users, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { API_BASE_URL, fetcher } from '@/lib/api';
import Link from 'next/link';

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useLanguage();

  const reservaId = searchParams.get('id');
  const token = searchParams.get('token');
  const isOpenpay = searchParams.get('openpay') === 'success';

  const [reserva, setReserva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reservaId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const queryUrl = token ? `/reservas/${reservaId}?token=${token}` : `/reservas/${reservaId}`;
        const data = await fetcher(queryUrl);
        if (isMounted) {
          setReserva(data);
        }
      } catch (err) {
        console.warn('No se pudo obtener el detalle de la reserva:', err.message);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, [reservaId, token]);

  const es = language === 'es';
  const invoiceUrl = reservaId && token ? `${API_BASE_URL}/reservas/${reservaId}/invoice?token=${token}` : null;
  const isPaid = reserva?.estado === 'PAID' || isOpenpay;

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 py-12">
      <div className="max-w-xl w-full bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 mb-6 shadow-inner">
          <CheckCircle2 className="w-10 h-10 animate-pulse" />
        </div>

        {/* Título & Estado */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--foreground)]">
            {es ? '¡Reserva y Pago Procesado!' : 'Booking & Payment Processed!'}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {es
              ? 'Tu transacción ha sido gestionada con éxito a través de OpenPay Perú.'
              : 'Your transaction has been successfully processed through OpenPay Peru.'}
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mt-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            {isPaid ? (es ? 'Estado: Confirmado (PAID)' : 'Status: Confirmed (PAID)') : (es ? 'Estado: En Verificación' : 'Status: Verifying')}
          </div>
        </div>

        {/* Tarjeta con detalles de la reserva */}
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-[var(--muted-foreground)] text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>{es ? 'Cargando información de tu reserva...' : 'Loading booking details...'}</span>
          </div>
        ) : (
          <div className="bg-[var(--secondary)]/40 border border-[var(--border)] rounded-2xl p-5 space-y-3.5 mb-6 text-sm">
            {reserva?.tour?.nombre && (
              <div className="flex justify-between items-start gap-4">
                <span className="text-[var(--muted-foreground)]">{es ? 'Tour:' : 'Tour:'}</span>
                <span className="font-bold text-[var(--foreground)] text-right">{reserva.tour.nombre}</span>
              </div>
            )}

            {reservaId && (
              <div className="flex justify-between items-center">
                <span className="text-[var(--muted-foreground)]">{es ? 'Orden de Reserva:' : 'Booking Reference:'}</span>
                <span className="font-mono font-bold text-emerald-400">#UNU-{reservaId}</span>
              </div>
            )}

            {reserva?.titularNombre && (
              <div className="flex justify-between items-center">
                <span className="text-[var(--muted-foreground)]">{es ? 'Titular:' : 'Main Passenger:'}</span>
                <span className="font-medium text-[var(--foreground)]">{reserva.titularNombre}</span>
              </div>
            )}

            {reserva?.fechaViaje && (
              <div className="flex justify-between items-center">
                <span className="text-[var(--muted-foreground)] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {es ? 'Fecha de Viaje:' : 'Travel Date:'}
                </span>
                <span className="text-[var(--foreground)]">{new Date(reserva.fechaViaje).toLocaleDateString()}</span>
              </div>
            )}

            {reserva?.precioTotal && (
              <div className="flex justify-between items-center border-t border-[var(--border)] pt-2.5">
                <span className="text-[var(--muted-foreground)] font-semibold">{es ? 'Total Pagado:' : 'Total Paid:'}</span>
                <span className="text-base font-extrabold text-emerald-400">${parseFloat(reserva.precioTotal).toFixed(2)} USD</span>
              </div>
            )}

            {token && (
              <div className="border-t border-[var(--border)]/60 pt-2 text-[11px] text-[var(--muted-foreground)] font-mono break-all select-all">
                <span className="font-bold block uppercase text-[9px] tracking-wider mb-0.5">{es ? 'Token de Seguridad:' : 'Security Token:'}</span>
                {token}
              </div>
            )}
          </div>
        )}

        {/* Acciones principales */}
        <div className="flex flex-col sm:flex-row gap-3">
          {invoiceUrl && (
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              {es ? 'Descargar Invoice (PDF)' : 'Download Invoice (PDF)'}
            </a>
          )}

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] font-bold py-3.5 px-6 rounded-xl text-sm transition-all"
          >
            <Home className="w-4 h-4" />
            {es ? 'Volver al Inicio' : 'Return Home'}
          </Link>
        </div>

        {/* Nota al pie */}
        <div className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
          <p>
            {es
              ? 'Hemos enviado la confirmación y el voucher a tu correo electrónico.'
              : 'We have sent the confirmation and voucher to your email address.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReservaConfirmadaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  );
}
