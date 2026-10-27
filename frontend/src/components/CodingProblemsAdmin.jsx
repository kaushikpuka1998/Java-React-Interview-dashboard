import { useEffect, useState } from 'react'
import { fetchAdminCodingProblems, saveCodingProblem, deleteCodingProblem } from '../lib/codingProblems.js'
import Markdown from './Markdown.jsx'

const TEMPLATE_LANGS = [['cpp', 'C++'], ['c', 'C'], ['python', 'Python'], ['ruby', 'Ruby'], ['rust', 'Rust'], ['csharp', 'C#'], ['php', 'PHP'], ['swift', 'Swift']]
const BLANK_TEMPLATE = { language: 'cpp', starter: '', driver: '' }
const EMPTY = { title: '', difficulty: 'Basic', statement: '', templates: [BLANK_TEMPLATE], tests: [{ input: '', expected: '', hidden: false }] }

// Old problems stored one C++ starter and driver; new ones store one entry per language.
function templatesOf(p) {
  if (p.templates) {
    try {
      const rows = Object.entries(JSON.parse(p.templates)).map(([language, t]) => ({ language, starter: t.starter || '', driver: t.driver || '' }))
      if (rows.length) return rows
    } catch { /* fall through to the old fields */ }
  }
  if (p.starterCode || p.driver) return [{ language: 'cpp', starter: p.starterCode || '', driver: p.driver || '' }]
  return [BLANK_TEMPLATE]
}
// One test per line: "2 3 => 5". Use / for a new input line, and start a line with [hidden] to keep it secret.
function parseBulk(text) {
  return text.split('\n').map(l => l.trim()).filter(Boolean).flatMap(line => {
    const hidden = /^\[hidden\]/i.test(line)
    const body = line.replace(/^\[hidden\]\s*/i, '')
    const at = body.indexOf('=>')
    if (at < 0) return []
    return [{
      input: body.slice(0, at).split('/').map(x => x.trim()).join('\n').trim(),
      expected: body.slice(at + 2).trim(),
      hidden,
    }]
  })
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500'

// Admin editor for LeetCode-style problems. Kept separate from the normal question form.
export default function CodingProblemsAdmin() {
  const [problems, setProblems] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [bulk, setBulk] = useState('')

  const addBulk = () => {
    const parsed = parseBulk(bulk)
    if (parsed.length === 0) { setMsg({ ok: false, text: 'Write tests as "input => output", one per line.' }); return }
    setForm(f => ({ ...f, tests: [...f.tests.filter(t => t.input.trim() || t.expected.trim()), ...parsed] }))
    setBulk('')
    setMsg({ ok: true, text: `Added ${parsed.length} test(s).` })
  }

  const load = () => fetchAdminCodingProblems().then(setProblems).catch(e => setMsg({ ok: false, text: e.message }))
  useEffect(() => { load() }, [])

  const setTest = (i, key, value) => setForm(f => ({ ...f, tests: f.tests.map((t, j) => j === i ? { ...t, [key]: value } : t) }))
  const addTest = () => setForm(f => ({ ...f, tests: [...f.tests, { input: '', expected: '', hidden: false }] }))
  const removeTest = i => setForm(f => ({ ...f, tests: f.tests.filter((_, j) => j !== i) }))
  const setTpl = (i, key, value) => setForm(f => ({ ...f, templates: f.templates.map((t, j) => j === i ? { ...t, [key]: value } : t) }))
  const addTpl = () => setForm(f => ({ ...f, templates: [...f.templates, { ...BLANK_TEMPLATE, language: 'python' }] }))
  const removeTpl = i => setForm(f => ({ ...f, templates: f.templates.filter((_, j) => j !== i) }))

  const edit = p => {
    let tests = []
    try { tests = JSON.parse(p.testCases) } catch { tests = [] }
    setForm({
      title: p.title || '',
      difficulty: p.difficulty || 'Basic',
      statement: p.statement || '',
      templates: templatesOf(p),
      tests: tests.length ? tests.map(t => ({ input: String(t.input ?? ''), expected: String(t.expected ?? ''), hidden: !!t.hidden })) : EMPTY.tests,
    })
    setEditingId(p.id)
    setMsg(null)
  }

  const reset = () => { setForm(EMPTY); setEditingId(null) }

  const save = async e => {
    e.preventDefault()
    setMsg(null); setBusy(true)
    const tests = form.tests
      .filter(t => t.expected.trim() !== '' || t.input.trim() !== '')
      .map(t => ({ input: t.input, expected: t.expected, ...(t.hidden ? { hidden: true } : {}) }))
    try {
      const byLanguage = {}
      form.templates.forEach(t => { if (t.starter.trim() || t.driver.trim()) byLanguage[t.language] = { starter: t.starter, driver: t.driver } })
      await saveCodingProblem(editingId, { title: form.title, difficulty: form.difficulty, statement: form.statement, templates: Object.keys(byLanguage).length ? JSON.stringify(byLanguage) : '', testCases: JSON.stringify(tests) })
      setMsg({ ok: true, text: editingId ? 'Problem updated.' : 'Problem added.' })
      reset()
      load()
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const remove = async p => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return
    try {
      await deleteCodingProblem(p.id)
      if (editingId === p.id) reset()
      load()
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editingId ? 'Edit coding problem' : 'New coding problem'}</h2>
          {editingId && <button type="button" onClick={reset} className="text-sm text-slate-500 hover:underline">Cancel edit</button>}
        </div>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title, for example: Two Sum" required className={inputCls} />
        <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className={inputCls}>
          {['Basic', 'Intermediate', 'Advanced'].map(d => <option key={d}>{d}</option>)}
        </select>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Problem statement (Markdown)</label>
        <textarea value={form.statement} onChange={e => setForm({ ...form, statement: e.target.value })} rows={8} required
          placeholder={'Describe the task, the input and output format, and the examples.'} className={`${inputCls} font-mono text-sm`} />

        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Languages</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">For each language: the starter code members see, and the hidden driver that calls their function. Leave the driver empty for a plain program.</p>
        {form.templates.map((row, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <select value={row.language} onChange={e => setTpl(i, 'language', e.target.value)} className={inputCls}>
                {TEMPLATE_LANGS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <button type="button" onClick={() => removeTpl(i)} disabled={form.templates.length === 1} className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-40">Remove</button>
            </div>
            <textarea value={row.starter} onChange={e => setTpl(i, 'starter', e.target.value)} rows={5} placeholder="Starter code (what members see)" className={`${inputCls} font-mono text-sm`} />
            <textarea value={row.driver} onChange={e => setTpl(i, 'driver', e.target.value)} rows={6} placeholder="Driver (hidden main that calls the function)" className={`${inputCls} font-mono text-sm`} />
          </div>
        ))}
        <button type="button" onClick={addTpl} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">+ Add language</button>

        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Test cases</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Examples written in the statement as "Input: ... Output: ..." are added as tests automatically, so you can leave these empty. Add rows here for hidden tests. Tick "Hidden" to keep a test secret; members see only its pass or fail.</p>
        <div className="space-y-2">
          {form.tests.map((t, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-700 sm:grid-cols-[1fr_1fr_auto]">
              <textarea value={t.input} onChange={e => setTest(i, 'input', e.target.value)} rows={2} placeholder="Input" className={`${inputCls} font-mono text-sm`} />
              <textarea value={t.expected} onChange={e => setTest(i, 'expected', e.target.value)} rows={2} placeholder="Expected output" className={`${inputCls} font-mono text-sm`} />
              <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={t.hidden} onChange={e => setTest(i, 'hidden', e.target.checked)} /> Hidden
                </label>
                <button type="button" onClick={() => removeTest(i)} disabled={form.tests.length === 1} className="text-xs text-red-600 hover:underline disabled:opacity-40">Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-600">
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Paste many tests at once, one per line: <code>input =&gt; output</code>. Use <code>/</code> for a new input line, and start a line with <code>[hidden]</code> to hide it.</p>
          <textarea value={bulk} onChange={e => setBulk(e.target.value)} rows={4} placeholder={'4 / 2 7 11 15 / 9 => 0 1\n[hidden] 3 / 3 2 4 / 6 => 1 2'} className={`${inputCls} font-mono text-sm`} />
          <button type="button" onClick={addBulk} disabled={!bulk.trim()} className="mt-2 rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">Add tests</button>
        </div>
        <button type="button" onClick={addTest} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">+ Add test case</button>

        {msg && <p className={`text-sm ${msg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{msg.text}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white disabled:opacity-60">
          {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add problem'}
        </button>
      </form>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/40">
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Problems ({problems?.length ?? 0})</h2>
          {!problems && <p className="text-sm text-slate-500">Loading…</p>}
          {problems?.length === 0 && <p className="text-sm text-slate-500">No coding problems yet. Practice coding stays hidden until you add one.</p>}
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {problems?.map(p => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-slate-800 dark:text-slate-200">{p.title} <span className="text-xs text-slate-400">· {p.difficulty}</span></span>
                <span className="flex gap-3">
                  <button type="button" onClick={() => edit(p)} className="text-blue-600 hover:underline dark:text-blue-400">Edit</button>
                  <button type="button" onClick={() => remove(p)} className="text-red-600 hover:underline dark:text-red-400">Delete</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
        {form.statement && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</p>
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{form.title || 'Untitled problem'}</h3>
            <Markdown text={form.statement} />
          </div>
        )}
      </div>
    </div>
  )
}
