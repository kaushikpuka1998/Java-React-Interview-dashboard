// Pie chart drawn as SVG arcs (no chart library). Slices: [{ label, value, color }] where color is a hex.
const HEX = {
  'bg-orange-500': '#f97316', 'bg-cyan-500': '#06b6d4', 'bg-green-500': '#22c55e', 'bg-purple-500': '#a855f7',
  'bg-indigo-500': '#6366f1', 'bg-slate-500': '#64748b', 'bg-sky-500': '#0ea5e9', 'bg-amber-500': '#f59e0b',
  'bg-rose-500': '#f43f5e', 'bg-blue-500': '#3b82f6', 'bg-violet-500': '#8b5cf6', 'bg-emerald-500': '#10b981',
}
// Converts the Tailwind colour classes used by the progress bars into hex for the chart.
export const toHex = (cls) => HEX[cls] || '#64748b'

export default function PieChart({ title, slices, empty }) {
  const data = slices.filter(s => s.value > 0)
  const total = data.reduce((sum, s) => sum + s.value, 0)
  const card = 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5'
  if (total === 0) {
    return (
      <div className={card}>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">{title}</h3>
        <p className="text-sm text-slate-400">{empty}</p>
      </div>
    )
  }

  const cx = 60, cy = 60, r = 56
  let angle = -Math.PI / 2
  const drawn = data.map(s => {
    const frac = s.value / total
    let path = null
    if (frac < 0.9999) {
      const start = angle, end = angle + frac * 2 * Math.PI
      const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start)
      const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end)
      path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`
      angle = end
    }
    return { ...s, pct: Math.round(frac * 100), path }
  })

  return (
    <div className={card}>
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{title}</h3>
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 120 120" className="w-32 h-32 flex-shrink-0" role="img" aria-label={title}>
          {drawn.map(s => s.path
            ? <path key={s.label} d={s.path} fill={s.color} stroke="white" strokeWidth="1" className="dark:stroke-slate-950"><title>{`${s.label}: ${s.value} (${s.pct}%)`}</title></path>
            : <circle key={s.label} cx={cx} cy={cy} r={r} fill={s.color}><title>{`${s.label}: ${s.value} (100%)`}</title></circle>
          )}
        </svg>
        <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
          {drawn.map(s => (
            <li key={s.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                <span className="truncate text-slate-700 dark:text-slate-200">{s.label}</span>
              </span>
              <span className="tabular-nums text-slate-500 dark:text-slate-400 flex-shrink-0">{s.value} · {s.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Counts items per field value: countBy(questions, 'tech') -> [{ key, value }]
export function countBy(items, field) {
  const counts = {}
  items.forEach(item => { const k = item[field] || 'unknown'; counts[k] = (counts[k] || 0) + 1 })
  return Object.entries(counts).map(([key, value]) => ({ key, value }))
}
