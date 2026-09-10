import { useState, useEffect, useRef } from 'react'
import { fetchMySuggestions, markSuggestionsSeen } from '../lib/auth.js'

const LABEL = {
  PENDING: { text: 'Waiting for admin review', cls: 'text-amber-600 dark:text-amber-400' },
  APPROVED: { text: 'Approved — your article is getting published', cls: 'text-emerald-600 dark:text-emerald-400' },
  REJECTED: { text: 'Not accepted — archived', cls: 'text-slate-500 dark:text-slate-400' },
}

/**
 * Bell showing what happened to this reader's suggested edits. The badge counts
 * decisions they haven't looked at; opening the panel clears it.
 */
export default function Notifications() {
  const [data, setData] = useState({ unseen: 0, items: [] })
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => { fetchMySuggestions().then(setData).catch(() => {}) }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Nothing ever suggested — don't clutter the sidebar with an empty bell.
  if (data.items.length === 0) return null

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && data.unseen > 0) {
      markSuggestionsSeen().catch(() => {})
      setData((d) => ({ ...d, unseen: 0 }))
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={toggle}
        title="Your suggested edits"
        className="relative p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1h6z" />
        </svg>
        {data.unseen > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
            {data.unseen}
          </span>
        )}
      </button>

      {/* Centred on the bell and clamped to the viewport: right-anchoring pushed the
          panel off-screen, since the bell sits near the sidebar's left edge. */}
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 z-30 mt-2 w-72 max-w-[calc(100vw-1rem)] max-h-96 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-2">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Your suggested edits</p>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.items.map((s) => {
              const l = LABEL[s.status] || LABEL.PENDING
              return (
                <li key={s.id} className="px-2 py-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{s.questionTitle}</p>
                  <p className={`text-xs font-semibold ${l.cls}`}>{l.text}</p>
                  {s.adminNote && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">“{s.adminNote}”</p>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
