import { useEffect, useMemo, useState } from 'react'
import { fetchActivity } from '../lib/code.js'

// LeetCode-style calendar: one square per day for the last year, shaded by how many submissions that day.
const WEEKS = 53
const LEVEL_CLASS = [
  'bg-slate-200 dark:bg-slate-800',
  'bg-emerald-200 dark:bg-emerald-900',
  'bg-emerald-400 dark:bg-emerald-700',
  'bg-emerald-500 dark:bg-emerald-500',
  'bg-emerald-700 dark:bg-emerald-300',
]
const levelOf = n => (n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : n <= 6 ? 3 : 4)
const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function ActivityHeatmap() {
  const [times, setTimes] = useState(null)
  useEffect(() => { fetchActivity().then(d => setTimes(d.times || [])).catch(() => setTimes([])) }, [])

  const grid = useMemo(() => {
    const counts = {}
    for (const t of times || []) {
      const k = dayKey(new Date(t))
      counts[k] = (counts[k] || 0) + 1
    }
    // Columns are weeks (Sunday first), ending with the current week.
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7)
    const cols = []
    const months = []
    let total = 0
    let activeDays = 0
    for (let w = 0; w < WEEKS; w++) {
      const col = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(start)
        date.setDate(start.getDate() + w * 7 + d)
        if (date > today) { col.push(null); continue }
        const n = counts[dayKey(date)] || 0
        total += n
        if (n) activeDays++
        col.push({ date, n })
      }
      cols.push(col)
      const first = col.find(c => c)
      if (first && first.date.getDate() <= 7) months.push({ w, label: first.date.toLocaleString('en', { month: 'short' }) })
    }
    return { cols, months, total, activeDays }
  }, [times])

  if (times === null) return <p className="text-sm text-slate-500">Loading activity…</p>

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {grid.total} submission{grid.total === 1 ? '' : 's'} in the last year
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{grid.activeDays} active day{grid.activeDays === 1 ? '' : 's'}</p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels, one per column where a new month starts. */}
          <div className="flex h-4 text-[10px] text-slate-500 dark:text-slate-400" style={{ gap: 3 }}>
            {grid.cols.map((_, w) => {
              const m = grid.months.find(x => x.w === w)
              return <div key={w} className="w-[11px] shrink-0 whitespace-nowrap">{m ? m.label : ''}</div>
            })}
          </div>
          <div className="flex" style={{ gap: 3 }}>
            {grid.cols.map((col, w) => (
              <div key={w} className="flex flex-col" style={{ gap: 3 }}>
                {col.map((cell, d) => cell === null ? (
                  <div key={d} className="h-[11px] w-[11px]" />
                ) : (
                  <div
                    key={d}
                    role="img"
                    aria-label={`${cell.n} submissions on ${cell.date.toDateString()}`}
                    data-tip={`${cell.n} submission${cell.n === 1 ? '' : 's'} on ${cell.date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    className={`tip relative h-[11px] w-[11px] rounded-[2px] ${LEVEL_CLASS[levelOf(cell.n)]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <span>Less</span>
        {LEVEL_CLASS.map((c, i) => <span key={i} className={`h-[11px] w-[11px] rounded-[2px] ${c}`} />)}
        <span>More</span>
      </div>
    </div>
  )
}
