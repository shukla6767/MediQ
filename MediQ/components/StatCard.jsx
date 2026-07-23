







export default function StatCard({
  icon,
  label,
  value,
  trend,
  gradient = "from-primary to-accent"
}) {
  return (
    <div className="group relative bg-surface rounded-2xl border border-border p-6 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden">
      {/* Accent top-line on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted font-medium mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-foreground">{value}</p>
          {trend &&
          <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${trend.positive ? "text-emerald-500" : "text-red-500"}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {trend.positive ?
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /> :

              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              }
              </svg>
              {trend.value}
            </p>
          }
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>);

}