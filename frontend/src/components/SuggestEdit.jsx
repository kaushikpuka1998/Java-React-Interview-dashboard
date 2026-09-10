import { useState, useEffect } from 'react'
import { suggestEdit, isLoggedIn } from '../lib/auth.js'
import Markdown from './Markdown.jsx'

/**
 * "Suggest an edit" — a reader proposes a better answer; it goes to the admin
 * queue instead of changing the live question. The reader is notified of the
 * decision through the bell in the sidebar.
 */
export default function SuggestEdit({ question }) {
  const [open, setOpen] = useState(false)
  const [answer, setAnswer] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [preview, setPreview] = useState(true)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState('')
  const [error, setError] = useState('')

  // Reset (and re-seed from the live text) whenever the question changes.
  useEffect(() => {
    setOpen(false); setSent(''); setError('')
    setAnswer(question.answer || '')
    setTitle(question.question || question.title || '')
    setNote('')
  }, [question.id])

  if (!isLoggedIn()) return null

  const changed = answer.trim() !== (question.answer || '').trim()
    || title.trim() !== (question.question || question.title || '').trim()

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      // Only the question text and answer are reader-editable; `title` (the internal
      // label) stays whatever the admin set.
      const res = await suggestEdit(question.id, { question: title, answer, note })
      setSent(res.message)
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally { setBusy(false) }
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
        {sent}
      </div>
    )
  }

  if (!open) {
    return (
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Propose a better answer — an admin reviews it before it goes live"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Suggest an edit
        </button>
      </div>
    )
  }

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500'

  // Editing happens in a full-screen dialog: the article column is only ~3xl wide,
  // which leaves the Markdown box and its live view too narrow to work in.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
         onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}>
      <form
        onSubmit={submit}
        className="w-full max-w-7xl max-h-full flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Suggest an edit</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your version goes to an admin. If it's approved it replaces the published answer and you'll be notified.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 select-none">
              <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600" />
              Live view
            </label>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:underline">Cancel</button>
          </div>
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Question" className={inputCls} />

        {/* The editor grows to fill the dialog; both panes scroll on their own. */}
        <div className={`flex-1 min-h-0 grid grid-cols-1 gap-3 ${preview ? 'lg:grid-cols-2' : ''}`}>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
            placeholder="Answer (Markdown)"
            className={`${inputCls} font-mono text-xs h-full min-h-[16rem] resize-none`} />
          {preview && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3 overflow-y-auto min-h-[16rem]">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Live view</p>
              {answer.trim()
                ? <Markdown text={answer} />
                : <p className="text-sm italic text-slate-400">Your answer renders here as you type…</p>}
            </div>
          )}
        </div>

        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000}
          placeholder="Why is this better? (optional, helps the admin decide)" className={inputCls} />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button type="submit" disabled={busy || !changed}
          className="w-full py-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow disabled:opacity-50">
          {busy ? 'Sending…' : changed ? 'Send for review' : 'Make a change first'}
        </button>
      </form>
    </div>
  )
}
