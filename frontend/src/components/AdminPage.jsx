import { useState, useEffect, useCallback, useRef } from 'react'
import { getUser, isLoggedIn, logout } from '../lib/auth.js'
import { createQuestion, createQuestionsBulk, updateQuestion, deleteQuestion, uploadImage } from '../lib/auth.js'
import { fetchQuestions } from '../lib/api.js'
import AuthModal from './AuthModal.jsx'
import Markdown from './Markdown.jsx'

const TECHS = ['java', 'react', 'node', 'sql', 'hld', 'kafka','golang']
const DIFFICULTIES = ['Basic', 'Intermediate', 'Advanced', 'Experienced']
const EMPTY = { id: '', tech: 'java', title: '', question: '', answer: '', difficulty: 'Basic', category: '' }
const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500'

function Banner({ msg }) {
  if (!msg) return null
  return <p className={`text-sm ${msg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{msg.text}</p>
}

// Shared editable fields for both the Add tab and the Manage edit panel.
function EditorFields({ form, set, requireAnswer, answerRows = 12, onInsertImage }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [upErr, setUpErr] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    setUploading(true); setUpErr('')
    try {
      const url = await uploadImage(file)
      onInsertImage(url) // parent appends the markdown into the answer
    } catch (err) {
      setUpErr(err.message)
    } finally { setUploading(false) }
  }

  return (
    <div className="space-y-3">
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

      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Answer (Markdown)</label>
        <div className="flex items-center gap-2">
          {upErr && <span className="text-xs text-red-500">{upErr}</span>}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" /></svg>
            {uploading ? 'Uploading…' : 'Upload image'}
          </button>
        </div>
      </div>
      <textarea required={requireAnswer} value={form.answer} onChange={set('answer')} placeholder="Answer (Markdown). Uploaded images are inserted as ![](url)." rows={answerRows} className={inputCls} />
    </div>
  )
}

function PreviewPanel({ form }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Preview — how it will render</p>
      <QuestionPreview form={form} />
    </div>
  )
}

// Renders the in-progress question the same way the reader will show it.
function QuestionPreview({ form }) {
  const title = form.title || 'Untitled question'
  const question = form.question || form.title
  return (
    <article>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">{form.tech}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{form.difficulty}</span>
        {form.category && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{form.category}</span>}
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h2>
      {question && question !== title && <p className="text-slate-600 dark:text-slate-400 mb-3">{question}</p>}
      {form.answer
        ? <Markdown text={form.answer} />
        : <p className="text-sm italic text-slate-400">Answer preview appears here as you type…</p>}
    </article>
  )
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
  const [showPreview, setShowPreview] = useState(true)

  // manage list
  const [tech, setTech] = useState('java')
  const [search, setSearch] = useState('')
  const [list, setList] = useState([])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Append an uploaded image as Markdown into the answer.
  const insertImage = (url) => setForm((f) => ({
    ...f,
    answer: (f.answer ? f.answer.replace(/\s*$/, '') + '\n\n' : '') + `![image](${url})\n`,
  }))

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

  // Load a question into the form. In the Manage tab we edit inline (no tab switch).
  function startEdit(q, { switchTab = true } = {}) {
    setForm({ id: q.id, tech: q.tech, title: q.title || '', question: q.question || '', answer: q.answer || '', difficulty: q.difficulty || 'Basic', category: q.category || '' })
    setEditingId(q.id)
    setMsg(null)
    if (switchTab) {
      setTab('single')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
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
        <form onSubmit={submitSingle}>
          {editingId && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Editing <code>{editingId}</code>.
              <button type="button" onClick={() => { setForm(EMPTY); setEditingId(null) }} className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">Cancel edit</button>
            </p>
          )}

          <div className={showPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-5 items-start' : ''}>
            {/* Left: editor fields */}
            <div className="space-y-3">
              <EditorFields form={form} set={set} requireAnswer={!editingId} onInsertImage={insertImage} />
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 select-none">
                <input type="checkbox" checked={showPreview} onChange={(e) => setShowPreview(e.target.checked)} className="rounded border-slate-300 dark:border-slate-600" />
                Live preview
              </label>
            </div>

            {/* Right: live preview */}
            {showPreview && <PreviewPanel form={form} />}
          </div>

          <button type="submit" disabled={busy} className="w-full mt-4 py-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-95 disabled:opacity-60">
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
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-5 items-start">
          {/* Left: search + question list */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <select value={tech} onChange={(e) => setTech(e.target.value)} className={inputCls}>
                {TECHS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className={`${inputCls} col-span-2`} />
            </div>
            <ul className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg max-h-[calc(100vh-8rem)] overflow-y-auto">
              {list.length === 0 && <li className="p-4 text-sm text-slate-500">No questions.</li>}
              {list.map((q) => (
                <li
                  key={q.id}
                  onClick={() => startEdit(q, { switchTab: false })}
                  className={`flex items-center justify-between gap-3 p-3 cursor-pointer transition-colors ${editingId === q.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{q.title}</p>
                    <p className="text-xs text-slate-400">{q.id} · {q.tech} · {q.difficulty}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); remove(q) }} className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex-shrink-0">Delete</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: inline editor for the selected question */}
          <div className="lg:sticky lg:top-4">
            {editingId ? (
              <form onSubmit={submitSingle} className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Editing <code>{editingId}</code>.
                  <button type="button" onClick={() => { setForm(EMPTY); setEditingId(null) }} className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">Cancel</button>
                </p>
                <EditorFields form={form} set={set} requireAnswer={false} answerRows={10} onInsertImage={insertImage} />
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 select-none">
                  <input type="checkbox" checked={showPreview} onChange={(e) => setShowPreview(e.target.checked)} className="rounded border-slate-300 dark:border-slate-600" />
                  Live preview
                </label>
                {showPreview && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4 max-h-[50vh] overflow-y-auto">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Preview</p>
                    <QuestionPreview form={form} />
                  </div>
                )}
                <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-95 disabled:opacity-60">
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-400">
                Select a question on the left to edit its question &amp; answer here.
              </div>
            )}
          </div>
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
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
