export default function StatsCard({ title, value, icon: Icon, colorClass = 'text-[#e94560]', subtitle }) {
  return (
    <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-400 block">{title}</span>
        <span className="text-3xl font-bold text-white tracking-tight block">{value}</span>
        {subtitle && <span className="text-xs text-gray-500 block">{subtitle}</span>}
      </div>
      <div className={`p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
