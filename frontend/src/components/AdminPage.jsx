import { useState, useEffect, useCallback } from 'react'
import { getUser, isLoggedIn, logout } from '../lib/auth.js'
import { createQuestion, createQuestionsBulk, updateQuestion, deleteQuestion } from '../lib/auth.js'
import { fetchQuestions } from '../lib/api.js'
import AuthModal from './AuthModal.jsx'

const TECHS = ['java', 'react', 'node', 'sql', 'hld', 'kafka','golang']
const DIFFICULTIES = ['Basic', 'Intermediate', 'Advanced']
const EMPTY = { id: '', tech: 'java', title: '', question: '', answer: '', difficulty: 'Basic', category: '' }
const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500'

function Banner({ msg }) {
  if (!msg) return null
  return <p className={`text-sm ${msg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{msg.text}</p>
}

export default function AdminPage() {
  const [user, setUser] = useState(() => getUser())
  const isAdmin = user && user.admin

  const [tab, setTab] = useState('single') // single | bulk | manage
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null) // when set, form is editing an existing question
  const [bulk, setBulk] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  // manage list
  const [tech, setTech] = useState('java')
  const [search, setSearch] = useState('')
  const [list, setList] = useState([])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const loadList = useCallback(async () => {
    try {
      const data = await fetchQuestions({ tech, search: search || undefined, page: 0, size: 100 })
      setList(data.content || [])
    } catch { setList([]) }
  }, [tech, search])

  useEffect(() => { if (isAdmin && tab === 'manage') loadList() }, [isAdmin, tab, loadList])

  async function submitSingle(e) {
    e.preventDefault(); setBusy(true); setMsg(null)
    try {
      if (editingId) {
        const q = await updateQuestion(editingId, form)
        setMsg({ ok: true, text: `Updated "${q.title}"` })
      } else {
        const q = await createQuestion(form)
        setMsg({ ok: true, text: `Published "${q.title}" (id: ${q.id})` })
      }
      setForm(EMPTY); setEditingId(null); loadList()
    } catch (err) { setMsg({ ok: false, text: err.message }) } finally { setBusy(false) }
  }

  async function submitBulk(e) {
    e.preventDefault(); setBusy(true); setMsg(null)
    let parsed
    try {
      parsed = JSON.parse(bulk)
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array')
    } catch (err) { setBusy(false); return setMsg({ ok: false, text: 'Invalid JSON: ' + err.message }) }
    try {
      const res = await createQuestionsBulk(parsed)
      setMsg({ ok: true, text: `Created ${res.created} question(s)` })
      setBulk('')
    } catch (err) { setMsg({ ok: false, text: err.message }) } finally { setBusy(false) }
  }

  function startEdit(q) {
    setForm({ id: q.id, tech: q.tech, title: q.title || '', question: q.question || '', answer: q.answer || '', difficulty: q.difficulty || 'Basic', category: q.category || '' })
    setEditingId(q.id)
    setTab('single')
    setMsg(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(q) {
    if (!window.confirm(`Delete "${q.title}"? This cannot be undone.`)) return
    try { await deleteQuestion(q.id); setMsg({ ok: true, text: `Deleted ${q.id}` }); loadList() }
    catch (err) { setMsg({ ok: false, text: err.message }) }
  }

  // --- gates ---
  if (!isLoggedIn()) {
    return (
      <Shell>
        <p className="text-slate-600 dark:text-slate-300 mb-4">Log in with an admin account to manage questions.</p>
        <AuthModal onClose={() => { window.location.href = '/' }} onSuccess={(u) => setUser({ email: u.email, name: u.name, admin: u.admin })} />
      </Shell>
    )
  }
  if (!isAdmin) {
    return (
      <Shell>
        <p className="text-red-600 dark:text-red-400">Your account ({user.email}) is not an admin. Ask an admin to add your email to <code>ADMIN_EMAILS</code>.</p>
        <button onClick={() => { logout(); window.location.href = '/' }} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">Log out</button>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="flex gap-2 mb-5">
        {[['single', editingId ? 'Edit' : 'Add'], ['bulk', 'Bulk (JSON)'], ['manage', 'Manage']].map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t); setMsg(null) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mb-4"><Banner msg={msg} /></div>

      {tab === 'single' && (
        <form onSubmit={submitSingle} className="space-y-3">
          {editingId && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Editing <code>{editingId}</code>.
              <button type="button" onClick={() => { setForm(EMPTY); setEditingId(null) }} className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">Cancel edit</button>
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <select value={form.tech} onChange={set('tech')} className={inputCls}>
              {TECHS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.difficulty} onChange={set('difficulty')} className={inputCls}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <input value={form.category} onChange={set('category')} placeholder="Category (optional)" className={inputCls} />
          <input required value={form.title} onChange={set('title')} placeholder="Title" className={inputCls} />
          <textarea value={form.question} onChange={set('question')} placeholder="Question (defaults to title if empty)" rows={3} className={inputCls} />
          <textarea required={!editingId} value={form.answer} onChange={set('answer')} placeholder="Answer (Markdown)" rows={8} className={inputCls} />
          <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-95 disabled:opacity-60">
            {busy ? 'Saving…' : editingId ? 'Save changes' : 'Publish question'}
          </button>
        </form>
      )}

      {tab === 'bulk' && (
        <form onSubmit={submitBulk} className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Paste a JSON array. Each item needs <code>tech</code>, <code>title</code>, <code>answer</code>; optional <code>question</code>, <code>difficulty</code>, <code>category</code>, <code>id</code>.</p>
          <textarea required value={bulk} onChange={(e) => setBulk(e.target.value)} rows={16}
            placeholder={'[\n  { "tech": "java", "title": "What is JVM?", "answer": "..." }\n]'}
            className={`${inputCls} font-mono text-xs`} />
          <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-95 disabled:opacity-60">
            {busy ? 'Uploading…' : 'Bulk publish'}
          </button>
        </form>
      )}

      {tab === 'manage' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <select value={tech} onChange={(e) => setTech(e.target.value)} className={inputCls}>
              {TECHS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className={`${inputCls} col-span-2`} />
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
            {list.length === 0 && <li className="p-4 text-sm text-slate-500">No questions.</li>}
            {list.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{q.title}</p>
                  <p className="text-xs text-slate-400">{q.id} · {q.tech} · {q.difficulty}</p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button onClick={() => startEdit(q)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                  <button onClick={() => remove(q)} className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin · Questions</h1>
          <a href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Back to app</a>
        </div>
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
