import { useState, useEffect } from 'react'
import { techLabel, techBadge, difficultyBadge } from '../lib/badges.js'
import { TECH_COLOR, DIFF_COLOR } from './ProfilePage.jsx'
import PieChart, { toHex, countBy } from './PieChart.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'

// Public progress page at /u/:username. Shows only what the member chooses to make public:
// name, join date and progress. No email, location or private lists.
export default function PublicProfilePage({ username }) {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [listFilter, setListFilter] = useState('solved')   // Solved | Visited

  useEffect(() => {
    fetch(`${API_BASE}/public/profiles/${encodeURIComponent(username)}`)
      .then(res => {
        if (res.status === 404) throw new Error('This profile does not exist.')
        if (!res.ok) throw new Error('Could not load this profile.')
        return res.json()
      })
      .then(setProfile)
      .catch(e => setError(e.message))
  }, [username])

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Member progress</h1>
          <a href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Interview Reader</a>
        </div>

        {error && <p className="text-slate-500">{error}</p>}
        {!error && !profile && <p className="text-slate-500">Loading…</p>}

        {profile && (
          <>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {profile.name.trim().charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{profile.name}</h2>
                {profile.memberSince && (
                  <p className="text-xs text-slate-400 mt-0.5">Member since {new Date(profile.memberSince).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                ['Solved', profile.solvedCount, 'from-emerald-500 to-teal-600', 'shadow-emerald-500/30'],
                ['Visited', profile.visitedCount, 'from-violet-500 to-fuchsia-600', 'shadow-violet-500/30'],
                ['Solved %', profile.totalQuestions ? Math.round((profile.solvedCount / profile.totalQuestions) * 100) + '%' : '0%', 'from-amber-400 to-orange-500', 'shadow-orange-500/30'],
              ].map(([label, value, gradient, glow]) => (
                <div key={label} className={`rounded-xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg ${glow}`}>
                  <p className="text-xs uppercase tracking-wide text-white/80">{label}</p>
                  <p className="text-2xl font-bold tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <PieChart
                title="Visited by topic"
                empty="No visited questions yet."
                slices={[
                  ...countBy(profile.visited, 'tech').map(({ key, value }) => ({ label: techLabel(key), value, color: toHex(TECH_COLOR[key]) })),
                  { label: 'Not visited', value: Math.max(profile.totalQuestions - profile.visitedCount, 0), color: '#94a3b8' },
                ]}
              />
              <PieChart
                title="Visited by difficulty"
                empty="No visited questions yet."
                slices={[
                  ...countBy(profile.visited, 'difficulty').map(({ key, value }) => ({ label: key, value, color: toHex(DIFF_COLOR[key]) })),
                  { label: 'Not visited', value: Math.max(profile.totalQuestions - profile.visitedCount, 0), color: '#94a3b8' },
                ]}
              />
            </div>

            <div className="flex gap-2 mb-3" role="group" aria-label="Show">
              {[['solved', 'Solved', profile.solved.length], ['visited', 'Visited', profile.visited.length]].map(([key, label, count]) => (
                <button
                  key={key}
                  onClick={() => setListFilter(key)}
                  aria-pressed={listFilter === key}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    listFilter === key
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {label} <span className="tabular-nums opacity-80">({count})</span>
                </button>
              ))}
            </div>

            <section className="rounded-xl bg-white dark:bg-slate-800 p-5 shadow-sm mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {listFilter === 'solved' ? 'Solved questions' : 'Visited questions'}
              </h3>
              {(listFilter === 'solved' ? profile.solved : profile.visited).length === 0 ? (
                <p className="text-sm text-slate-400">
                  {listFilter === 'solved' ? 'Nothing solved yet.' : 'No visited questions yet.'}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[32rem] overflow-y-auto">
                  {(listFilter === 'solved' ? profile.solved : profile.visited).map(q => (
                    <li key={q.id}>
                      <a href={`/?id=${encodeURIComponent(q.id)}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-blue-600 dark:hover:text-blue-400">
                        <span className="text-sm text-slate-800 dark:text-slate-100 break-words">{q.title}</span>
                        <span className="flex gap-1.5 flex-shrink-0">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${techBadge(q.tech)}`}>{techLabel(q.tech)}</span>
                          {q.difficulty && <span className={`text-[11px] px-2 py-0.5 rounded-full ${difficultyBadge(q.difficulty)}`}>{q.difficulty}</span>}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <PieChart
                title="Solved by topic"
                empty="Nothing solved yet."
                slices={[
                  ...profile.byTech.filter(t => t.solved > 0).map(t => ({ label: techLabel(t.tech), value: t.solved, color: toHex(TECH_COLOR[t.tech]) })),
                  { label: 'Not solved', value: Math.max(profile.totalQuestions - profile.solvedCount, 0), color: '#94a3b8' },
                ]}
              />
              <PieChart
                title="Solved by difficulty"
                empty="Nothing solved yet."
                slices={[
                  ...profile.byDifficulty.filter(d => d.solved > 0).map(d => ({ label: d.difficulty, value: d.solved, color: toHex(DIFF_COLOR[d.difficulty]) })),
                  { label: 'Not solved', value: Math.max(profile.totalQuestions - profile.solvedCount, 0), color: '#94a3b8' },
                ]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
