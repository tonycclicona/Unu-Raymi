export default function StatsCard({ title, value, icon: Icon, colorClass = 'text-[#4a5759]', subtitle }) {
  return (
    <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
      <div className="space-y-2">
        <span className="text-sm font-medium text-[#6c7a7c] block">{title}</span>
        <span className="text-3xl font-bold text-[#4a5759] tracking-tight block">{value}</span>
        {subtitle && <span className="text-xs text-[#6c7a7c]/80 block">{subtitle}</span>}
      </div>
      <div className={`p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
