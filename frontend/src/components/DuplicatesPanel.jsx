import { useState, useEffect, useCallback } from 'react'
import { fetchDuplicateReports, fetchDuplicateReportCounts, deleteQuestionForDuplicate, dismissDuplicateReport } from '../lib/auth.js'

const TABS = [
  ['PENDING', 'Pending'],
  ['RESOLVED', 'Deleted'],
  ['DISMISSED', 'Dismissed'],
]

/**
 * Admin queue for reader-reported duplicate questions. Deleting confirms the
 * report and removes the question; dismissing leaves the question as-is.
 */
export default function DuplicatesPanel() {
  const [status, setStatus] = useState('PENDING')
  const [items, setItems] = useState([])
  const [counts, setCounts] = useState({ pending: 0, resolved: 0, dismissed: 0 })
  const [busyId, setBusyId] = useState(null)
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    setItems(await fetchDuplicateReports(status))
    setCounts(await fetchDuplicateReportCounts())
  }, [status])

  useEffect(() => { load() }, [load])

  // Keep the queue current without a manual refresh.
  useEffect(() => {
    const interval = setInterval(load, 15000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(interval); window.removeEventListener('focus', onFocus) }
  }, [load])

  async function handleDelete(r) {
    if (!window.confirm(`Delete "${r.questionTitle}"? This can't be undone.`)) return
    setBusyId(r.id); setMsg(null)
    try {
      await deleteQuestionForDuplicate(r.id)
      setMsg({ ok: true, text: `Deleted "${r.questionTitle}"` })
      load()
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusyId(null) }
  }

  async function handleDismiss(r) {
    setBusyId(r.id); setMsg(null)
    try {
      await dismissDuplicateReport(r.id)
      setMsg({ ok: true, text: 'Dismissed — question kept' })
      load()
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusyId(null) }
  }

  const count = { PENDING: counts.pending, RESOLVED: counts.resolved, DISMISSED: counts.dismissed }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {TABS.map(([s, label]) => (
          <button key={s} onClick={() => { setStatus(s); setMsg(null) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${status === s ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            {label} <span className="tabular-nums opacity-70">{count[s]}</span>
          </button>
        ))}
      </div>

      {msg && <p className={`text-sm ${msg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{msg.text}</p>}

      {items.length === 0 && (
        <p className="text-sm text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
          Nothing here.
        </p>
      )}

      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{r.questionTitle}</p>
                <p className="text-xs text-slate-400">
                  {r.userEmail} · {r.questionId} · {r.tech} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
                {r.note && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">“{r.note}”</p>}
              </div>
              {r.status === 'PENDING' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button disabled={busyId === r.id} onClick={() => handleDelete(r)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50">
                    Delete question
                  </button>
                  <button disabled={busyId === r.id} onClick={() => handleDismiss(r)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50">
                    Not a duplicate
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
