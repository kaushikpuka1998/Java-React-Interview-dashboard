import { useState, useEffect, useCallback } from 'react'
import { fetchSuggestions, fetchSuggestionCounts, reviewSuggestion } from '../lib/auth.js'
import Markdown from './Markdown.jsx'

const TABS = [
  ['PENDING', 'Pending'],
  ['APPROVED', 'Approved'],
  ['REJECTED', 'Archive (rejected)'],
]

/**
 * Admin review queue for reader-suggested edits. Approving writes the proposed
 * text onto the live question; rejecting leaves it and files the row under Archive.
 */
export default function SuggestionsPanel() {
  const [status, setStatus] = useState('PENDING')
  const [items, setItems] = useState([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [openId, setOpenId] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    setItems(await fetchSuggestions(status))
    setCounts(await fetchSuggestionCounts())
  }, [status])

  useEffect(() => { load() }, [load])

  async function decide(s, decision) {
    if (decision === 'reject' && !note.trim()
        && !window.confirm('Reject without a reason? The reader only sees "not accepted".')) return
    setBusy(true); setMsg(null)
    try {
      await reviewSuggestion(s.id, decision, note.trim() || undefined)
      setMsg({ ok: true, text: decision === 'approve' ? `Published the edit to "${s.questionTitle}"` : 'Moved to the archive' })
      setOpenId(null); setNote('')
      load()
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusy(false) }
  }

  const count = { PENDING: counts.pending, APPROVED: counts.approved, REJECTED: counts.rejected }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {TABS.map(([s, label]) => (
          <button key={s} onClick={() => { setStatus(s); setOpenId(null); setMsg(null) }}
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
        {items.map((s) => (
          <li key={s.id} className="rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => { setOpenId(openId === s.id ? null : s.id); setNote('') }}
              className="w-full text-left p-3 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{s.questionTitle}</p>
                <p className="text-xs text-slate-400">
                  {s.userEmail} · {s.questionId} · {new Date(s.createdAt).toLocaleDateString()}
                </p>
                {s.note && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">“{s.note}”</p>}
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">{openId === s.id ? 'Hide' : 'Review'}</span>
            </button>

            {openId === s.id && (
              <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-3">
                {s.proposedTitle && s.proposedTitle !== s.currentTitle && (
                  <p className="text-sm">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Title</span><br />
                    <s className="text-red-500">{s.currentTitle}</s><br />
                    <span className="text-emerald-600 dark:text-emerald-400">{s.proposedTitle}</span>
                  </p>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 max-h-80 overflow-y-auto">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Current</p>
                    <Markdown text={s.currentAnswer || ''} />
                  </div>
                  <div className="rounded-lg border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-900/10 p-3 max-h-80 overflow-y-auto">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-2">Proposed</p>
                    <Markdown text={s.proposedAnswer || s.currentAnswer || ''} />
                  </div>
                </div>

                {s.status === 'PENDING' ? (
                  <>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Message to the contributor (required for a fair rejection)"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button disabled={busy} onClick={() => decide(s, 'approve')}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:opacity-95 disabled:opacity-60">
                        {busy ? 'Working…' : 'Approve & publish'}
                      </button>
                      <button disabled={busy} onClick={() => decide(s, 'reject')}
                        className="flex-1 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:opacity-95 disabled:opacity-60">
                        Reject & archive
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">
                    {s.status === 'APPROVED' ? 'Approved' : 'Rejected'} on {s.reviewedAt ? new Date(s.reviewedAt).toLocaleString() : '—'}
                    {s.adminNote && <> · “{s.adminNote}”</>}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
