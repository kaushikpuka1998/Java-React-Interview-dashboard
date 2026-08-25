import { useState, useEffect } from 'react'
import { isLoggedIn, logout, fetchProfile, fetchProfileQuestions } from '../lib/auth.js'
import { slugify } from '../lib/slug.js'
import AuthModal from './AuthModal.jsx'

const TECH_COLOR = {
  java: 'bg-orange-500', react: 'bg-cyan-500', node: 'bg-green-500', sql: 'bg-purple-500',
  hld: 'bg-indigo-500', kafka: 'bg-slate-500', golang: 'bg-sky-500',
}
const DIFF_COLOR = {
  Basic: 'bg-green-500', Intermediate: 'bg-amber-500', Advanced: 'bg-rose-500', Experienced: 'bg-purple-500',
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent || 'text-slate-900 dark:text-slate-100'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ProgressBar({ label, total, solved, color }) {
  const pct = total ? Math.round((solved / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-slate-700 dark:text-slate-200 capitalize">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">{solved}/{total} · {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color || 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function QuestionList({ title, items, emptyText }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">{title} <span className="text-slate-400 font-normal">({items.length})</span></h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
          {items.map((q) => (
            <li key={q.id} className="py-2">
              <a href={`/${slugify(q.question || q.title)}`} className="block hover:text-blue-600 dark:hover:text-blue-400">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{q.title}</p>
                <p className="text-xs text-slate-400">{q.tech} · {q.difficulty}</p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [solved, setSolved] = useState([])
  const [visited, setVisited] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return }
    Promise.all([fetchProfile(), fetchProfileQuestions('solved'), fetchProfileQuestions('visited')])
      .then(([p, s, v]) => { setProfile(p); setSolved(s); setVisited(v) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (!isLoggedIn()) {
    return (
      <Shell>
        <p className="text-slate-600 dark:text-slate-300 mb-4">Log in to view your profile and progress.</p>
        <AuthModal onClose={() => { window.location.href = '/' }} onSuccess={() => window.location.reload()} />
      </Shell>
    )
  }

  if (loading) return <Shell><p className="text-slate-500">Loading profile…</p></Shell>
  if (error) return <Shell><p className="text-red-500">{error}</p></Shell>
  if (!profile) return <Shell><p className="text-slate-500">No profile data.</p></Shell>

  const { name, email, totalQuestions, visitedCount, solvedCount, byTech = [], byDifficulty = [], memberSince } = profile
  const solvedPct = totalQuestions ? Math.round((solvedCount / totalQuestions) * 100) : 0

  return (
    <Shell>
      {/* Identity header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
          {(name || email || '?').trim().charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{name || 'Learner'}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{email}</p>
          {memberSince && <p className="text-xs text-slate-400 mt-0.5">Member since {new Date(memberSince).toLocaleDateString()}</p>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Solved" value={solvedCount} sub={`${solvedPct}% of all`} accent="text-green-600 dark:text-green-400" />
        <StatCard label="Visited" value={visitedCount} accent="text-blue-600 dark:text-blue-400" />
        <StatCard label="Total questions" value={totalQuestions} />
        <StatCard label="Remaining" value={Math.max(totalQuestions - solvedCount, 0)} />
      </div>

      {/* Overall progress bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold text-slate-900 dark:text-slate-100">Overall progress</span>
          <span className="text-slate-500 dark:text-slate-400">{solvedCount}/{totalQuestions} solved · {solvedPct}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: `${solvedPct}%` }} />
        </div>
      </div>

      {/* Breakdowns: technology + difficulty side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {byTech.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Progress by technology</h3>
            <div className="space-y-4">
              {byTech.map((t) => <ProgressBar key={t.tech} label={t.tech} total={t.total} solved={t.solved} color={TECH_COLOR[t.tech]} />)}
            </div>
          </div>
        )}
        {byDifficulty.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Progress by difficulty</h3>
            <div className="space-y-4">
              {byDifficulty.map((d) => <ProgressBar key={d.difficulty} label={d.difficulty} total={d.total} solved={d.solved} color={DIFF_COLOR[d.difficulty]} />)}
            </div>
          </div>
        )}
      </div>

      {/* Question lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QuestionList title="Solved questions" items={solved} emptyText="Nothing solved yet — mark questions as read to track them." />
        <QuestionList title="Visited questions" items={visited} emptyText="No visited questions yet." />
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your Profile</h1>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Back to app</a>
            {isLoggedIn() && <button onClick={() => { logout(); window.location.href = '/' }} className="text-sm text-slate-500 hover:text-red-600 dark:hover:text-red-400">Log out</button>}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
