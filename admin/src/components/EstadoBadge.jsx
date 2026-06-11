export default function EstadoBadge({ estado }) {
  const configs = {
    PENDING: {
      text: 'Pendiente',
      classes: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    PAID: {
      text: 'Pagado',
      classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    CANCELLED: {
      text: 'Cancelado',
      classes: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    },
  };

  const current = configs[estado] || {
    text: estado,
    classes: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${current.classes}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current"></span>
      {current.text}
    </span>
  );
}
