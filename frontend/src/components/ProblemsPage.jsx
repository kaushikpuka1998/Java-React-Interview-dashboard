import { useEffect, useMemo, useState } from 'react'
import { fetchCodingProblems } from '../lib/codingProblems.js'
import { fetchSolvedIds, fetchAttemptedIds } from '../lib/code.js'
import { isLoggedIn } from '../lib/auth.js'
import { difficultyBadge } from '../lib/badges.js'

const DIFFICULTIES = ['All', 'Basic', 'Intermediate', 'Advanced']
const STATUSES = [['all', 'All'], ['solved', 'Solved'], ['todo', 'Not solved']]

// Every coding problem on one page, with search and filters. Each row opens the problem in the practice page.
export default function ProblemsPage() {
  const [problems, setProblems] = useState(null)
  const [solved, setSolved] = useState(() => new Set())
  const [attempted, setAttempted] = useState(() => new Set())
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState('All')
  const [status, setStatus] = useState('all')
  const signedIn = isLoggedIn()

  useEffect(() => {
    fetchCodingProblems().then(setProblems).catch(e => setError(e.message))
    if (signedIn) {
      fetchSolvedIds().then(ids => setSolved(new Set(ids))).catch(() => {})
      fetchAttemptedIds().then(ids => setAttempted(new Set(ids))).catch(() => {})
    }
  }, [])

  // Rows are numbered by their position in the list (1, 2, 3...), not by database id.
  const numberOf = useMemo(() => new Map((problems || []).map((p, i) => [p.id, i + 1])), [problems])

  const rows = useMemo(() => {
    if (!problems) return []
    const q = query.trim().toLowerCase().replace(/^#/, '')
    return problems.filter(p => {
      if (difficulty !== 'All' && p.difficulty !== difficulty) return false
      if (status === 'solved' && !solved.has(p.id)) return false
      if (status === 'todo' && solved.has(p.id)) return false
      if (!q) return true
      return p.title.toLowerCase().includes(q) || String(numberOf.get(p.id)) === q
    })
  }, [problems, query, difficulty, status, solved, numberOf])

  const segment = (items, active, onPick, label) => (
    <div className="inline-flex flex-wrap rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800" role="group" aria-label={label}>
      {items.map(([key, text]) => (
        <button
          key={key}
          type="button"
          onClick={() => onPick(key)}
          aria-pressed={active === key}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${active === key ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}
        >
          {text}
        </button>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 dark:bg-slate-900">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-100">Problems</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {problems ? `${rows.length} of ${problems.length} problems` : 'Loading…'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="/practice" className="text-blue-600 hover:underline dark:text-blue-400">Practice coding</a>
            <a href="/" className="text-blue-600 hover:underline dark:text-blue-400">← Back to app</a>
          </div>
        </div>

        <div className="mb-4 space-y-3 rounded-2xl bg-white p-4 dark:bg-slate-950">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title or number, e.g. Two Sum or #1"
            aria-label="Search problems"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex flex-wrap items-center gap-3">
            {segment(DIFFICULTIES.map(d => [d, d]), difficulty, setDifficulty, 'Difficulty')}
            {signedIn && segment(STATUSES, status, setStatus, 'Status')}
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {problems && rows.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">No problems match these filters.</p>}

        {rows.length > 0 && (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white dark:divide-slate-800 dark:bg-slate-950">
            {rows.map(p => (
              <li key={p.id}>
                <a href={`/practice?id=${p.id}`} className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <span className="w-12 shrink-0 text-slate-400 dark:text-slate-500">#{numberOf.get(p.id)}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-900 dark:text-slate-100">{p.title}</span>
                  {signedIn && solved.has(p.id) && <span aria-label="Solved" className="text-emerald-600 dark:text-emerald-400">✓</span>}
                  {signedIn && !solved.has(p.id) && attempted.has(p.id) && <span aria-label="Attempted" className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />}
                  {p.difficulty && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${difficultyBadge(p.difficulty)}`}>{p.difficulty}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
