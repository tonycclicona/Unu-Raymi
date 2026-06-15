'use client';

import { useState, useEffect } from 'react';
import { X, Users, DollarSign, Calendar, ShieldCheck, Mail, Phone, User, CheckCircle, CreditCard, ArrowLeft } from 'lucide-react';
import { mutateApi, API_BASE_URL } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

export default function CheckoutOverlay({ tour, selectedDuration, onClose, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const { t, language } = useLanguage();

  const hasVariants = tour.variantes && tour.variantes.length > 0;
  const activeVariant = hasVariants && selectedDuration
    ? tour.variantes.find(v => v.duracion_dias === selectedDuration) || tour.variantes[0]
    : null;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Fecha mínima: Hoy
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Fecha inicial: Mañana
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fechasDisponibles = activeVariant && Array.isArray(activeVariant.fechas_disponibles) && activeVariant.fechas_disponibles.length > 0
    ? activeVariant.fechas_disponibles
    : (Array.isArray(tour.fechas_disponibles) ? tour.fechas_disponibles : []);

  // Form State
  const [fechaViaje, setFechaViaje] = useState(() => {
    return fechasDisponibles.length > 0 ? fechasDisponibles[0] : getTomorrowDateString();
  });

  // Sincronizar fechas al cambiar variante
  useEffect(() => {
    if (fechasDisponibles.length > 0) {
      setFechaViaje(fechasDisponibles[0]);
    } else {
      setFechaViaje(getTomorrowDateString());
    }
  }, [selectedDuration, tour, fechasDisponibles.length]);
  const [cantAdultos, setCantAdultos] = useState(1);
  const [cantNinos, setCantNinos] = useState(0);

  // Datos del Pasajero #1 (Titular de la Reserva)
  const [titularNombre, setTitularNombre] = useState('');
  const [titularApellido, setTitularApellido] = useState('');
  const [titularDni, setTitularDni] = useState('');
  const [titularEmail, setTitularEmail] = useState('');
  const [titularTelefono, setTitularTelefono] = useState('');

  // Datos de los pasajeros adicionales
  const [pasajerosAdicionales, setPasajerosAdicionales] = useState([]);

  // Ajustar el array de pasajeros adicionales cuando cambian los contadores
  useEffect(() => {
    const totalPasajeros = cantAdultos + cantNinos;
    const adicionalesCount = Math.max(0, totalPasajeros - 1);

    setPasajerosAdicionales((prev) => {
      const updated = [];
      for (let i = 0; i < adicionalesCount; i++) {
        updated.push(
          prev[i] || { nombre: '', apellido: '', dni: '' }
        );
      }
      return updated;
    });
  }, [cantAdultos, cantNinos]);

  const handleAdicionalFieldChange = (index, field, value) => {
    setPasajerosAdicionales((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar titular obligatorio
    if (!titularNombre.trim() || !titularApellido.trim() || !titularEmail.trim()) {
      setError(language === 'es' ? 'El nombre, apellido y correo electrónico del titular son obligatorios.' : 'The main passenger\'s first name, last name, and email are required.');
      setLoading(false);
      return;
    }

    // Validar pasajeros adicionales completos
    for (let i = 0; i < pasajerosAdicionales.length; i++) {
      const p = pasajerosAdicionales[i];
      if (!p.nombre.trim() || !p.apellido.trim()) {
        setError(language === 'es' ? `Por favor completa el nombre y apellido del Pasajero Adicional #${i + 1}.` : `Please fill out the first name and last name for Additional Passenger #${i + 1}.`);
        setLoading(false);
        return;
      }
    }

    try {
      const totalPasajeros = [
        {
          nombre: titularNombre,
          apellido: titularApellido,
          dni: titularDni || null,
          tipo: 'adulto'
        },
        ...pasajerosAdicionales.map((p, index) => ({
          nombre: p.nombre,
          apellido: p.apellido,
          dni: p.dni || null,
          tipo: index < (cantAdultos - 1) ? 'adulto' : 'nino'
        }))
      ];

      const payload = {
        tourId: tour.id,
        duracion_dias: displayDuration,
        fechaViaje: new Date(fechaViaje).toISOString(),
        cantAdultos: parseInt(cantAdultos, 10),
        cantNinos: parseInt(cantNinos, 10),
        titularNombre: `${titularNombre.trim()} ${titularApellido.trim()}`,
        titularEmail: titularEmail.trim(),
        titularTelefono: titularTelefono || null,
        pasajeros: totalPasajeros
      };

      const res = await mutateApi('/reservas/checkout', {
        method: 'POST',
        body: payload
      });

      if (res.success) {
        setSuccessData(res.data);
      } else {
        throw new Error(res.error || (language === 'es' ? 'Error al procesar reserva' : 'Error processing booking'));
      }
    } catch (err) {
      setError(err.message || (language === 'es' ? 'Ocurrió un error al enviar el pago.' : 'An error occurred while sending the payment.'));
    } finally {
      setLoading(false);
    }
  };

  const displayDuration = activeVariant ? activeVariant.duracion_dias : tour.duracion_dias;
  const precioAdulto = activeVariant ? parseFloat(activeVariant.precio_adulto) : parseFloat(tour.precio_adulto);
  const precioNino = activeVariant ? parseFloat(activeVariant.precio_nino) : parseFloat(tour.precio_nino);
  const total = (cantAdultos * precioAdulto) + (cantNinos * precioNino);

  if (successData) {
    return (
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 bg-[var(--background)]  flex items-center justify-center p-4"
      >
        <div className="glass max-w-lg w-full p-8 rounded-3xl text-center space-y-6 shadow-2xl relative border border-black/5">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[var(--foreground)]">{language === 'es' ? '¡Reserva Creada!' : 'Booking Created!'}</h2>
            <p className="text-[var(--muted-foreground)] text-sm">
              {language === 'es' ? 'Hemos registrado la orden con estado' : 'We have registered the order with status'} <span className="text-amber-400 font-bold">{successData.estado}</span>.
            </p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] p-5 rounded-2xl space-y-3 text-left">
            <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
              <span>{language === 'es' ? 'Tour:' : 'Tour:'}</span>
              <span className="text-[var(--foreground)] font-bold">{tour.nombre} ({displayDuration} {displayDuration === 1 ? t('tour_card.dia') : t('tour_card.dias')})</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
              <span>{language === 'es' ? 'Total a Pagar:' : 'Total to Pay:'}</span>
              <span className="text-emerald-400 font-extrabold">${parseFloat(successData.precioTotal).toFixed(2)} USD</span>
            </div>
            <div className="border-t border-[var(--border)]/50 my-2 pt-2">
              <span className="text-[10px] text-[var(--muted-foreground)]/80 block uppercase font-bold tracking-wider mb-1">{language === 'es' ? 'Token de Seguridad (Invoice PDF)' : 'Security Token (Invoice PDF)'}</span>
              <span className="text-[11px] text-[var(--muted-foreground)] font-mono select-all break-all">{successData.tokenSeguridad}</span>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left space-y-2">
            <span className="text-xs font-bold text-amber-400 block flex items-center gap-1">
              <CreditCard className="w-4 h-4" /> {language === 'es' ? 'Integración con Stripe / Pago Simulado' : 'Stripe Integration / Simulated Payment'}
            </span>
            <p className="text-[11px] text-[var(--foreground)] leading-relaxed">
              {language === 'es'
                ? 'El servidor ha enviado el Webhook. En un entorno real serás redirigido a la pasarela segura. Pulsa abajo para simular el pago digital.'
                : 'The server has sent the Webhook. In a real environment, you will be redirected to the secure gateway. Click below to simulate digital payment.'}
            </p>
          </div>

          <div className="flex gap-4">
            <a
              href={`${API_BASE_URL}/reservas/${successData.reservaId || successData.id}/invoice?token=${successData.tokenSeguridad}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-[var(--sidebar)] hover:bg-[var(--sidebar)] text-[var(--foreground)] py-3.5 rounded-xl text-sm font-bold border border-black/10 transition-all text-center"
            >
              {language === 'es' ? 'Inspeccionar PDF' : 'Inspect PDF'}
            </a>

            <button
              onClick={onClose}
              className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-[var(--accent)]/20 transition-all"
            >
              {language === 'es' ? 'Finalizar' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onBack ? onBack() : onClose();
        }
      }}
      className={`fixed inset-0 z-[60] flex items-center justify-end transition-all duration-300 ${onBack ? 'bg-[var(--sidebar)]/30' : 'bg-[var(--sidebar)] '
        }`}
    >
      {/* Contenedor checkout */}
      <div className="w-full max-w-full md:max-w-xl h-full bg-[var(--background)]/80 md:border-l border-[var(--border)] flex flex-col relative shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBack ? onBack : onClose}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-2.5 bg-[var(--sidebar)] rounded-xl border border-black/5 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'es' ? 'Volver' : 'Back'}
            </button>
            <div>
              <span className="text-[10px] text-[var(--foreground)] font-extrabold uppercase tracking-widest">{language === 'es' ? 'Paso 2' : 'Step 2'}</span>
              <h2 className="font-extrabold text-[var(--foreground)] text-base leading-tight">{language === 'es' ? 'Datos de Registro y Facturación' : 'Registration & Billing Details'}</h2>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Configuración */}
          <div className="bg-[var(--card)] border border-[var(--border)]/40 p-5 rounded-2xl space-y-4">
            <div className="border-b border-[var(--border)]/30 pb-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-[var(--muted-foreground)] block uppercase font-bold tracking-wider">{language === 'es' ? 'Aventura' : 'Adventure'}</span>
                <span className="text-xs font-bold text-[var(--foreground)]">{tour.nombre}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[var(--muted-foreground)] block uppercase font-bold tracking-wider">{t('tour_details.duracion')}</span>
                <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--foreground)] border border-[var(--accent)]/20 px-2.5 py-0.5 rounded-full font-bold">
                  {displayDuration} {displayDuration === 1 ? t('tour_card.dia') : t('tour_card.dias')}
                </span>
              </div>
            </div>

            <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[var(--foreground)]" />
              {language === 'es' ? 'Fecha de Viaje y Cantidad' : 'Travel Date & Quantity'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">{language === 'es' ? 'Calendario *' : 'Calendar *'}</label>
                {fechasDisponibles.length > 0 ? (
                  <select
                    value={fechaViaje}
                    onChange={(e) => setFechaViaje(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--foreground)] text-xs focus:outline-none focus:border-[var(--accent)]"
                  >
                    {fechasDisponibles.map((d) => (
                      <option key={d} value={d}>
                        {new Date(d + 'T00:00:00').toLocaleDateString(language === 'es' ? 'es-PE' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="date"
                    required
                    min={getTodayDateString()}
                    value={fechaViaje}
                    onChange={(e) => setFechaViaje(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--foreground)] text-xs focus:outline-none focus:border-[var(--accent)]"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">{language === 'es' ? 'Adultos' : 'Adults'}</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={cantAdultos}
                  onChange={(e) => setCantAdultos(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">{language === 'es' ? 'Niños (0-12)' : 'Children (0-12)'}</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={cantNinos}
                  onChange={(e) => setCantNinos(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Titular */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-[var(--foreground)]" />
              {language === 'es' ? 'Pasajero #1: Titular de la Reserva (Adulto)' : 'Passenger #1: Booking Holder (Adult)'}
            </h3>

            <div className="bg-[var(--card)] border border-[var(--border)]/60 p-5 rounded-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--muted-foreground)]">{language === 'es' ? 'Nombre *' : 'First Name *'}</label>
                  <input
                    type="text"
                    required
                    value={titularNombre}
                    onChange={(e) => setTitularNombre(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--foreground)] text-xs focus:outline-none"
                    placeholder={language === 'es' ? 'Ej. Juan' : 'e.g. John'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--muted-foreground)]">{language === 'es' ? 'Apellido *' : 'Last Name *'}</label>
                  <input
                    type="text"
                    required
                    value={titularApellido}
                    onChange={(e) => setTitularApellido(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--foreground)] text-xs focus:outline-none"
                    placeholder={language === 'es' ? 'Ej. Pérez' : 'e.g. Smith'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--muted-foreground)]">{language === 'es' ? 'Documento (DNI/Pasaporte)' : 'Document (ID/Passport)'}</label>
                  <input
                    type="text"
                    value={titularDni}
                    onChange={(e) => setTitularDni(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--foreground)] text-xs focus:outline-none"
                    placeholder={language === 'es' ? 'Opcional' : 'Optional'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--muted-foreground)]">{language === 'es' ? 'Teléfono Móvil' : 'Mobile Phone'}</label>
                  <input
                    type="tel"
                    value={titularTelefono}
                    onChange={(e) => setTitularTelefono(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--foreground)] text-xs focus:outline-none"
                    placeholder={language === 'es' ? 'Opcional' : 'Optional'}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted-foreground)]">{language === 'es' ? 'Correo Electrónico (Obligatorio para Invoice) *' : 'Email Address (Required for Invoice) *'}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]/80" />
                  <input
                    type="email"
                    required
                    value={titularEmail}
                    onChange={(e) => setTitularEmail(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-[var(--foreground)] text-xs focus:outline-none focus:border-[var(--accent)]"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pasajeros Adicionales */}
          {pasajerosAdicionales.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[var(--foreground)]" />
                {language === 'es' ? 'Pasajeros Adicionales' : 'Additional Passengers'}
              </h3>

              <div className="space-y-4">
                {pasajerosAdicionales.map((p, index) => {
                  const labelTipo = index < (cantAdultos - 1) ? (language === 'es' ? 'Adulto' : 'Adult') : (language === 'es' ? 'Niño' : 'Child');

                  return (
                    <div key={index} className="bg-[var(--card)] border border-[var(--border)]/40 p-4 rounded-2xl space-y-3">
                      <span className="text-[9px] text-[var(--foreground)] font-bold uppercase tracking-wider">
                        {language === 'es' ? `Pasajero #${index + 2} (${labelTipo})` : `Passenger #${index + 2} (${labelTipo})`}
                      </span>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={p.nombre}
                          onChange={(e) => handleAdicionalFieldChange(index, 'nombre', e.target.value)}
                          className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] text-xs focus:outline-none"
                          placeholder={language === 'es' ? 'Nombre *' : 'First Name *'}
                        />
                        <input
                          type="text"
                          required
                          value={p.apellido}
                          onChange={(e) => handleAdicionalFieldChange(index, 'apellido', e.target.value)}
                          className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] text-xs focus:outline-none"
                          placeholder={language === 'es' ? 'Apellido *' : 'Last Name *'}
                        />
                      </div>

                      <input
                        type="text"
                        value={p.dni}
                        onChange={(e) => handleAdicionalFieldChange(index, 'dni', e.target.value)}
                        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] text-xs focus:outline-none"
                        placeholder={language === 'es' ? 'Documento (DNI/Pasaporte)' : 'Document (ID/Passport)'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border)] bg-white  space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] text-[var(--muted-foreground)]/80 block uppercase font-bold tracking-wider">{language === 'es' ? 'Monto Total' : 'Total Amount'}</span>
              <span className="text-xl font-black text-[var(--foreground)] flex items-center">
                <DollarSign className="w-5 h-5 -mr-0.5 text-emerald-400" />
                {total.toFixed(2)} <span className="text-xs text-[var(--muted-foreground)] font-normal ml-1">USD</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'es' ? 'Checkout Protegido' : 'Secure Checkout'}</span>
            </div>
          </div>

          <button
            onClick={handleCheckoutSubmit}
            disabled={loading}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[var(--accent)]/20 hover:shadow-[var(--accent)]/30 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading 
              ? (language === 'es' ? 'Redirigiendo a Pasarela...' : 'Redirecting to Gateway...') 
              : (language === 'es' ? 'Proceder al Pago' : 'Proceed to Payment')}
          </button>
        </div>

      </div>
    </div>
  );
}

