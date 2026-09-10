import { useMemo, useState } from 'react'
import { diffLines, diffStats } from '../lib/diff.js'

const ROW = {
  add: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200',
  del: 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200 line-through decoration-red-400/60',
  same: 'text-slate-500 dark:text-slate-400',
}
const SIGN = { add: '+', del: '−', same: ' ' }

// Unchanged runs longer than this are folded away — an answer is mostly context.
const CONTEXT = 3

/** Green = added by the suggestion, red = removed from what is published. */
export default function DiffView({ before, after, className = '' }) {
  const rows = useMemo(() => diffLines(before || '', after || ''), [before, after])
  const stats = useMemo(() => diffStats(rows), [rows])
  const [expanded, setExpanded] = useState(() => new Set())

  // Group into runs so a long stretch of untouched lines collapses to one line.
  const blocks = []
  for (const r of rows) {
    const last = blocks[blocks.length - 1]
    if (last && last.type === r.type) last.lines.push(r.text)
    else blocks.push({ type: r.type, lines: [r.text] })
  }

  if (stats.added === 0 && stats.removed === 0) {
    return <p className={`text-sm italic text-slate-400 ${className}`}>No changes to the answer.</p>
  }

  return (
    <div className={className}>
      <p className="text-xs font-semibold mb-2">
        <span className="text-emerald-600 dark:text-emerald-400">+{stats.added} added</span>
        <span className="text-slate-400"> · </span>
        <span className="text-red-600 dark:text-red-400">−{stats.removed} removed</span>
      </p>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto font-mono text-xs leading-relaxed">
        {blocks.map((b, bi) => {
          const folded = b.type === 'same' && b.lines.length > CONTEXT * 2 + 1 && !expanded.has(bi)
          const shown = folded ? [...b.lines.slice(0, CONTEXT), null, ...b.lines.slice(-CONTEXT)] : b.lines

          return shown.map((line, li) =>
            line === null ? (
              <button
                key={`${bi}-fold`}
                type="button"
                onClick={() => setExpanded((s) => new Set(s).add(bi))}
                className="w-full text-left px-3 py-1 bg-slate-50 dark:bg-slate-800/60 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                ⋯ {b.lines.length - CONTEXT * 2} unchanged lines
              </button>
            ) : (
              <div key={`${bi}-${li}`} className={`flex ${ROW[b.type]}`}>
                <span className="select-none px-2 opacity-60 flex-shrink-0">{SIGN[b.type]}</span>
                <span className="whitespace-pre-wrap break-words pr-3">{line || ' '}</span>
              </div>
            )
          )
        })}
      </div>
    </div>
  )
}
