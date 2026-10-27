import { useEffect, useState } from 'react'
import { fetchCodingProblems, fetchCodingProblem } from '../lib/codingProblems.js'
import { isLoggedIn } from '../lib/auth.js'
import { difficultyBadge } from '../lib/badges.js'
import Markdown from './Markdown.jsx'
import CodeRunner from './CodeRunner.jsx'

const CUSTOM = 'custom'

// Practice coding: LeetCode-style problems on the left, plus a free code box for writing your own program.
export default function PracticePage() {
  const [problems, setProblems] = useState(null)
  const [selected, setSelected] = useState(null)   // CUSTOM, or a problem id
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCodingProblems()
      .then(list => { setProblems(list); setSelected(list[0]?.id ?? CUSTOM) })
      .catch(e => { setError(e.message); setProblems([]); setSelected(CUSTOM) })
  }, [])

  useEffect(() => {
    if (selected == null || selected === CUSTOM) { setDetail(null); return }
    setDetail(null)
    fetchCodingProblem(selected).then(setDetail).catch(e => setError(e.message))
  }, [selected])

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 dark:bg-slate-900">
      <div className="mx-auto w-full max-w-[1800px]">
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
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="space-y-2">
            <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Coding problems</h2>
            <ul className="max-h-[70vh] divide-y divide-slate-200 overflow-y-auto rounded-2xl bg-white dark:divide-slate-800 dark:bg-slate-950">
              <li>
                <button
                  type="button"
                  onClick={() => setSelected(CUSTOM)}
                  aria-pressed={selected === CUSTOM}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${selected === CUSTOM ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'}`}
                >
                  <span>Write your own code</span>
                  <span aria-hidden="true">✎</span>
                </button>
              </li>
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
            </div>

            <div className="space-y-4">
              {selected === CUSTOM && (
                <>
                  <div className="rounded-2xl bg-white p-5 dark:bg-slate-950">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Write your own code</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Write any program, choose a language, and run it. No tests are checked here.</p>
                  </div>
                  <CodeRunner />
                </>
              )}
              {selected !== CUSTOM && detail && (
                <>
                  <div className="rounded-2xl bg-white p-5 dark:bg-slate-950">
                    <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{detail.title}</h2>
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      <Markdown text={detail.statement} />
                    </div>
                  </div>
                  <CodeRunner key={detail.id} problemId={detail.id} starters={detail.starters || {}} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
