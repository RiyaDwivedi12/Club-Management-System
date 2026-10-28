// Compact KPI tile: icon tile + value + label. Tints follow the landing feature cards.
const TINTS = {
  blue: 'bg-blue-50 text-blue-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  sky: 'bg-sky-50 text-sky-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-600',
};

const StatTile = ({ icon: Icon, label, value, hint, tint = 'blue', className = '' }) => (
  <div className={`card p-4 sm:p-5 flex items-center gap-3.5 min-w-0 ${className}`}>
    {Icon && (
      <div className={`icon-tile ${TINTS[tint] || TINTS.blue}`}>
        <Icon size={20} />
      </div>
    )}
    <div className="min-w-0">
      <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-dark-900 truncate">{value}</p>
      <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
      {hint && <p className="text-[11px] text-slate-400 truncate">{hint}</p>}
    </div>
  </div>
);

export default StatTile;
