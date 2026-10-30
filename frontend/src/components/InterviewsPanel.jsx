import { useCallback, useEffect, useState } from 'react'
import Loader from './Loader.jsx'
import { fetchAllInterviews, adminTakeInterview, typeLabel, formatSlot } from '../lib/interviews.js'

// Admin: every mock interview request. Take a waiting one yourself, and see who offered to interview others.
export default function InterviewsPanel() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)

  const load = useCallback(() => fetchAllInterviews().then(setItems).catch(e => setError(e.message)), [])
  useEffect(() => { load() }, [load])

  const take = async id => {
    setBusy(id); setError('')
    try { await adminTakeInterview(id); await load() } catch (e) { setError(e.message) } finally { setBusy(null) }
  }

  if (!items) return error ? <p className="text-sm text-red-600">{error}</p> : <Loader compact label="Loading interviews…" />
  const waiting = items.filter(i => i.status === 'WAITING')
  const leads = items.filter(i => i.wantsToInterview)

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <section>
        <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Waiting for an interviewer ({waiting.length})</h3>
        {waiting.length === 0 ? <p className="text-sm text-slate-500">Nobody is waiting.</p> : (
          <ul className="space-y-2">
            {waiting.map(i => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                <span className="text-slate-800 dark:text-slate-200">
                  <span className="font-semibold">{typeLabel(i.type)}</span> · {i.candidateName || i.candidateEmail} · {formatSlot(i.slotAt)}{i.hasResume ? ' · resume' : ''}{i.wantsToInterview ? ' · wants to interview' : ''}
                </span>
                <button onClick={() => take(i.id)} disabled={busy === i.id} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Take this interview</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Members who want to interview others ({leads.length})</h3>
        {leads.length === 0 ? <p className="text-sm text-slate-500">None yet.</p> : (
          <ul className="text-sm text-slate-700 dark:text-slate-300">
            {[...new Map(leads.map(l => [l.candidateEmail, l])).values()].map(l => <li key={l.candidateEmail}><a href={`mailto:${l.candidateEmail}`} className="text-blue-600 hover:underline dark:text-blue-400">{l.candidateName ? `${l.candidateName} · ` : ''}{l.candidateEmail}</a></li>)}
          </ul>
        )}
      </section>
      <section>
        <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">All interviews ({items.length})</h3>
        <ul className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {items.map(i => (
            <li key={i.id} className="py-1.5 text-slate-700 dark:text-slate-300">
              {typeLabel(i.type)} · {i.candidateEmail} → {i.interviewer || 'no interviewer yet'} · {formatSlot(i.slotAt)} · <span className="text-xs text-slate-500">{i.status === 'NO_SHOW' ? `no-show: ${(i.noShowBy || '').toLowerCase()}` : i.status.toLowerCase()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
