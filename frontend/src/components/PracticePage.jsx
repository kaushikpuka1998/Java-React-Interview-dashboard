import { useEffect, useRef, useState } from 'react'
import { fetchCodingProblems, fetchCodingProblem, markPracticeSeen } from '../lib/codingProblems.js'
import { fetchSubmissions } from '../lib/code.js'
import { getUser, isLoggedIn } from '../lib/auth.js'
import { difficultyBadge } from '../lib/badges.js'
import Markdown from './Markdown.jsx'
import CodeRunner, { languageLabel } from './CodeRunner.jsx'

const CUSTOM = 'custom'
const NAV_BTN = 'tip relative flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'

// Practice coding: LeetCode-style problems on the left, plus a free code box for writing your own program.
export default function PracticePage() {
  const [problems, setProblems] = useState(null)
  const [selected, setSelected] = useState(null)   // CUSTOM, or a problem id
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  // The statement panel has two tabs: the problem, and the member's saved submissions for it.
  const [tab, setTab] = useState('description')
  const [history, setHistory] = useState([])
  const [openRequest, setOpenRequest] = useState(null)
  // The top bar's Run and Submit call the code box through codeRef, and the code box reports whether it is busy.
  const codeRef = useRef(null)
  const [busy, setBusy] = useState(false)
  // The problem list can be collapsed to give the statement and the code box more room. The choice is remembered.
  const [listOpen, setListOpen] = useState(() => localStorage.getItem('ir_practice_list_open') !== 'false')
  // Width of the statement panel, as a percent of the row. Drag the divider to change it; the choice is remembered.
  const [split, setSplit] = useState(() => Number(localStorage.getItem('ir_practice_split')) || 38)
  const splitRef = useRef(null)
  const startDrag = e => {
    e.preventDefault()
    const move = ev => {
      const rect = splitRef.current.getBoundingClientRect()
      setSplit(Math.min(70, Math.max(25, ((ev.clientX - rect.left) / rect.width) * 100)))
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setSplit(value => { localStorage.setItem('ir_practice_split', String(Math.round(value))); return value })
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }
  const loadHistory = () => { if (detail && isLoggedIn()) fetchSubmissions(detail.id).then(setHistory).catch(() => {}) }
  useEffect(() => {
    setTab('description')
    setHistory([])
    setOpenRequest(null)
    if (detail) loadHistory()
  }, [detail?.id])
  // Previous, next and random move through the problem list. The Playground is not in the list, so these are off there.
  const currentIndex = problems ? problems.findIndex(p => p.id === selected) : -1
  const canPrev = currentIndex > 0
  const canNext = currentIndex >= 0 && currentIndex < problems.length - 1
  const goToProblem = step => { if (currentIndex >= 0) setSelected(problems[currentIndex + step].id) }
  const goToRandom = () => {
    if (!problems || problems.length < 2) return
    const others = problems.filter(p => p.id !== selected)
    setSelected(others[Math.floor(Math.random() * others.length)].id)
  }
  const toggleList = () => setListOpen(open => { localStorage.setItem('ir_practice_list_open', String(!open)); return !open })

  useEffect(() => {
    fetchCodingProblems()
      .then(list => { setProblems(list); setSelected(list[0]?.id ?? CUSTOM); markPracticeSeen() })
      .catch(e => { setError(e.message); setProblems([]); setSelected(CUSTOM) })
  }, [])

  useEffect(() => {
    if (selected == null || selected === CUSTOM) { setDetail(null); return }
    setDetail(null)
    fetchCodingProblem(selected).then(setDetail).catch(e => setError(e.message))
  }, [selected])

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 xl:flex xl:h-screen xl:flex-col xl:overflow-hidden xl:pb-8 dark:bg-slate-900">
      <div className="mx-auto w-full max-w-[1800px] xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-100">Practice coding</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Solve a problem, or write your own code and run it.</p>
          </div>
          <a href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">← Back to app</a>
        </div>

        {!isLoggedIn() && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            Sign in to run your code. You can still read the problems.
          </p>
        )}
        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {!problems && !error && <p className="text-sm text-slate-500">Loading…</p>}

        {problems && (
          <div className={`grid grid-cols-[minmax(0,1fr)] items-start gap-5 xl:min-h-0 xl:flex-1 xl:grid-rows-[minmax(0,1fr)] xl:items-stretch ${listOpen ? 'lg:grid-cols-[260px_minmax(0,1fr)]' : 'lg:grid-cols-1'}`}>
            {listOpen && <div className="space-y-2">
            {listOpen && <>
            <ul className="overflow-hidden rounded-2xl bg-white dark:bg-slate-950">
              <li>
                <button
                  type="button"
                  onClick={() => setSelected(CUSTOM)}
                  aria-pressed={selected === CUSTOM}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${selected === CUSTOM ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'}`}
                >
                  <span>Playground</span>
                  <span aria-hidden="true">✎</span>
                </button>
              </li>
            </ul>
            <h2 className="px-1 pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Problems</h2>
            <ul className="max-h-[70vh] divide-y divide-slate-200 overflow-y-auto rounded-2xl bg-white dark:divide-slate-800 dark:bg-slate-950">
              {problems.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(p.id)}
                    aria-pressed={p.id === selected}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm transition-colors ${p.id === selected ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'}`}
                  >
                    <span>{p.title}</span>
                    {p.difficulty && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${difficultyBadge(p.difficulty)}`}>{p.difficulty}</span>}
                  </button>
                </li>
              ))}
              {problems.length === 0 && <li className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">No coding problems yet.</li>}
            </ul>
            </>}
            </div>}

            <div className="min-w-0 space-y-4 xl:flex xl:min-h-0 xl:flex-col xl:space-y-0 xl:gap-4">
            {/* Top bar across the statement and the code box: home and problem navigation on the left, Run and Submit in the middle. */}
            <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-3 rounded-2xl bg-white p-3 dark:bg-slate-950 lg:grid-cols-[1fr_auto_1fr]">
              <div className="flex min-w-0 items-center gap-2">
                <a
                  href="/"
                  aria-label="Home"
                  data-tip="Home"
                  className="tip relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" /></svg>
                </a>
                <div className="flex min-w-0 items-center rounded-lg border border-slate-200 dark:border-slate-700">
                  <button type="button" onClick={toggleList} aria-label={listOpen ? 'Collapse problem list' : 'Expand problem list'} data-tip={listOpen ? 'Collapse problem list' : 'Expand problem list'} className={NAV_BTN}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h16" /></svg>
                  </button>
                  <span className="min-w-0 truncate px-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{selected === CUSTOM ? 'Playground' : detail?.title || 'Problems'}</span>
                  <button type="button" onClick={() => goToProblem(-1)} disabled={!canPrev} aria-label="Previous problem" data-tip="Previous problem" className={NAV_BTN}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
                  </button>
                  <button type="button" onClick={() => goToProblem(1)} disabled={!canNext} aria-label="Next problem" data-tip="Next problem" className={NAV_BTN}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                  </button>
                  <button type="button" onClick={goToRandom} disabled={!problems || problems.length < 2} aria-label="Random problem" data-tip="Random problem" className={NAV_BTN}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => codeRef.current?.run()}
                  disabled={!isLoggedIn() || busy}
                  data-track="code_run"
                  className="flex items-center gap-1.5 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                  {busy ? 'Running…' : 'Run'}
                </button>
                {selected !== CUSTOM && (
                  <button
                    type="button"
                    onClick={() => codeRef.current?.submit()}
                    disabled={!isLoggedIn() || busy}
                    data-track="code_submit"
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit
                  </button>
                )}
              </div>

              <div className="flex items-center justify-start gap-2 lg:justify-end">
                {!isLoggedIn() && <span className="text-xs text-slate-500 dark:text-slate-400">Sign in to run code.</span>}
              </div>
            </div>

            {/* Wide screens show the statement and the code box side by side, with a draggable divider. */}
            <div ref={splitRef} className="flex flex-col gap-4 xl:min-h-0 xl:flex-1 xl:flex-row xl:items-stretch" style={{ '--split': `${split}%` }}>
              {selected === CUSTOM && (
                <>
                  <div className="min-w-0 rounded-2xl bg-white p-5 dark:bg-slate-950 xl:w-[var(--split)] xl:shrink-0">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Playground</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Write any program, choose a language, and run it. No tests are checked here.</p>
                  </div>
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize panels"
                    onMouseDown={startDrag}
                    className="hidden w-3 shrink-0 cursor-col-resize items-center justify-center xl:flex"
                  >
                    <span className="h-16 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                  <div className="min-w-0 flex-1 xl:min-h-0 xl:overflow-y-auto">
                    <CodeRunner key={`custom-${getUser()?.email ?? 'guest'}`} actionsRef={codeRef} onBusyChange={setBusy} />
                  </div>
                </>
              )}
              {selected !== CUSTOM && detail && (
                <>
                  <div className="min-w-0 rounded-2xl bg-white p-5 pb-24 dark:bg-slate-950 xl:w-[var(--split)] xl:shrink-0 xl:overflow-y-auto">
                    <div role="tablist" className="mb-4 flex gap-1 border-b border-slate-200 dark:border-slate-800">
                      {[['description', 'Description'], ['submissions', `Submissions${history.length ? ` (${history.length})` : ''}`]].map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          role="tab"
                          aria-selected={tab === key}
                          onClick={() => setTab(key)}
                          className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${tab === key ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {tab === 'description' ? (
                      <>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{detail.title}</h2>
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          <Markdown text={detail.statement} />
                        </div>
                      </>
                    ) : (
                      <SubmissionList items={history} signedIn={isLoggedIn()} onOpen={id => setOpenRequest({ id, at: Date.now() })} />
                    )}
                  </div>
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize panels"
                    onMouseDown={startDrag}
                    className="hidden w-3 shrink-0 cursor-col-resize items-center justify-center xl:flex"
                  >
                    <span className="h-16 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                  <div className="min-w-0 flex-1 xl:min-h-0 xl:overflow-y-auto">
                    <CodeRunner key={`${detail.id}-${getUser()?.email ?? 'guest'}`} problemId={detail.id} starters={detail.starters || {}} history={history} onSubmitted={loadHistory} openRequest={openRequest} actionsRef={codeRef} onBusyChange={setBusy} />
                  </div>
                </>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// The member's saved submissions for this problem. Clicking one opens its code in the editor.
function SubmissionList({ items, signedIn, onOpen }) {
  if (!signedIn) return <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to see your submissions.</p>
  if (items.length === 0) return <p className="text-sm text-slate-500 dark:text-slate-400">No submissions yet. Press Submit in the code box to save one.</p>
  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
      {items.map(h => (
        <li key={h.id}>
          <button
            type="button"
            onClick={() => onOpen(h.id)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <span className={h.status === 'Accepted' ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-semibold text-rose-600 dark:text-rose-400'}>{h.status}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{h.passed}/{h.total} · {languageLabel(h.language)} · {new Date(h.createdAt).toLocaleString()}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
