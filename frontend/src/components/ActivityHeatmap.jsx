import { useEffect, useMemo, useState } from 'react'
import Loader from './Loader.jsx'
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

// `times` (ISO strings) can be passed in, as on the public profile; otherwise the signed-in member's own are fetched.
// `compact` trims the card so it fits in a short row.
export default function ActivityHeatmap({ times: given, compact = false }) {
  const [times, setTimes] = useState(given ?? null)
  const [year, setYear] = useState(() => new Date().getFullYear())   // a calendar year (default: this one, future days included), or 'last' = the past 12 months
  useEffect(() => { if (given) { setTimes(given); return } fetchActivity().then(d => setTimes(d.times || [])).catch(() => setTimes([])) }, [])

  const years = useMemo(() => {
    const now = new Date().getFullYear()
    const first = Math.min(now, ...(times || []).map(t => new Date(t).getFullYear()))
    return Array.from({ length: now - first + 1 }, (_, i) => now - i)
  }, [times])

  const grid = useMemo(() => {
    const counts = {}
    for (const t of times || []) {
      const k = dayKey(new Date(t))
      counts[k] = (counts[k] || 0) + 1
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // The window shown: the last 53 weeks, or Jan 1 to Dec 31 of the chosen year (never past today).
    const rangeStart = year === 'last' ? null : new Date(year, 0, 1)
    const rangeEnd = year === 'last' ? today : new Date(year, 11, 31)   // a calendar year always runs to Dec 31
    const anchor = year === 'last' ? new Date(today) : new Date(year, 0, 1)
    const start = new Date(anchor)
    start.setDate(anchor.getDate() - anchor.getDay() - (year === 'last' ? (WEEKS - 1) * 7 : 0))
    const cols = []
    const months = []
    let total = 0
    let activeDays = 0
    // Last-12-months mode is a fixed 53 weeks; a calendar year only needs the weeks it spans, so the grid fills the card.
    const weeks = year === 'last' ? WEEKS : Math.ceil((rangeEnd - start) / 86400000 / 7 + 1 / 7)
    let lastMonth = ''
    for (let w = 0; w < weeks; w++) {
      const col = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(start)
        date.setDate(start.getDate() + w * 7 + d)
        if (date > rangeEnd || (rangeStart && date < rangeStart)) { col.push(null); continue }
        const future = date > today
        const n = future ? 0 : counts[dayKey(date)] || 0
        total += n
        if (n) activeDays++
        col.push({ date, n, future })
      }
      cols.push(col)
      const first = col.find(c => c)
      const label = first ? first.date.toLocaleString('en', { month: 'short', year: '2-digit' }) : ''
      // One label per month: the first column of a month, not both of the first two columns.
      if (first && label !== lastMonth && (w === 0 || first.date.getDate() <= 7)) { months.push({ w, label: first.date.toLocaleString('en', { month: 'short' }) }); lastMonth = label }
    }
    return { cols, months, total, activeDays }
  }, [times, year])

  if (times === null) return <Loader compact label="Loading activity…" />

  // GitHub-style calendar: square cells, one column per week, with a blank column between months so the grid spreads out and reads by month.
  const CELL = 13
  const GAP = 3
  const SPREAD = 14   // width of the blank column between two months
  const startsMonth = new Set(grid.months.map(m => m.w))
  const columns = grid.cols.flatMap((col, w) => (w > 0 && startsMonth.has(w) ? [{ spacer: true, w }] : []).concat({ col, w }))
  const template = columns.map(c => (c.spacer ? `${SPREAD}px` : `${CELL}px`)).join(' ')
  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={`font-semibold text-slate-900 dark:text-slate-100 ${compact ? 'text-base' : 'text-lg'}`}>
          {grid.total} submission{grid.total === 1 ? '' : 's'} {year === 'last' ? 'in the last year' : `in ${year}`}
        </h2>
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">{grid.activeDays} active day{grid.activeDays === 1 ? '' : 's'}</p>
          <select
            value={year}
            onChange={e => setYear(e.target.value === 'last' ? 'last' : Number(e.target.value))}
            aria-label="Year"
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="last">Last 12 months</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-block">
          <div className="grid h-4 text-[10px] text-slate-500 dark:text-slate-400" style={{ gridTemplateColumns: template, gap: GAP }}>
            {columns.map((c, i) => {
              const m = !c.spacer && grid.months.find(x => x.w === c.w && !grid.months.some(y => y.w > c.w && y.w - c.w < 3))
              return <div key={i} className="whitespace-nowrap">{m ? m.label : ''}</div>
            })}
          </div>
          <div className="grid" style={{ gridAutoFlow: 'column', gridTemplateColumns: template, gridTemplateRows: `repeat(7, ${CELL}px)`, gap: GAP }}>
            {columns.flatMap((c, i) => (c.spacer ? Array.from({ length: 7 }, (_, d) => <div key={`${i}-${d}`} />) : c.col.map((cell, d) => cell === null ? (
              <div key={`${i}-${d}`} />
            ) : cell.future ? (
              <div key={`${i}-${d}`} aria-hidden="true" className="rounded-[2px] border border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/40" />
            ) : (
              <div
                key={`${i}-${d}`}
                role="img"
                aria-label={`${cell.n} submissions on ${cell.date.toDateString()}`}
                data-tip={`${cell.n} submission${cell.n === 1 ? '' : 's'} on ${cell.date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                className={`tip relative rounded-[2px] ${LEVEL_CLASS[levelOf(cell.n)]}`}
              />
            ))))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <span>Less</span>
        {LEVEL_CLASS.map((c, i) => <span key={i} className={`h-[11px] w-[11px] rounded-[2px] ${c}`} />)}
        <span>More</span>
      </div>
    </div>
  )
}
