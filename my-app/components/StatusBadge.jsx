





const STATUS_CONFIG = {
  low: { bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", label: "Low" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500", label: "Moderate" },
  high: { bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-500", label: "Busy" },
  waiting: { bg: "bg-blue-500/10", text: "text-blue-500", dot: "bg-blue-500", label: "Waiting" },
  "in-progress": { bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500", label: "In Progress" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", label: "Completed" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-500", label: "Cancelled" },
  skipped: { bg: "bg-slate-500/10", text: "text-slate-500", dot: "bg-slate-500", label: "Skipped" }
};

export default function StatusBadge({ status, size = "sm", pulse = true }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.waiting;
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClasses} ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${pulse && (status === "waiting" || status === "in-progress" || status === "low" || status === "medium" || status === "high") ? "animate-pulse" : ""}`} />
      {c.label}
    </span>);

}