import { useState, useEffect } from 'react'
import { ProgressBar, TECH_COLOR, DIFF_COLOR } from './ProfilePage.jsx'
import { techLabel } from '../lib/badges.js'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'

// Public progress page at /u/:id. Shows only what the member chooses to make public:
// name, join date and progress. No email, location or private lists.
export default function PublicProfilePage({ id }) {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/public/profiles/${encodeURIComponent(id)}`)
      .then(res => {
        if (res.status === 404) throw new Error('This profile does not exist.')
        if (!res.ok) throw new Error('Could not load this profile.')
        return res.json()
      })
      .then(setProfile)
      .catch(e => setError(e.message))
  }, [id])

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

            {profile.byTech.length > 0 && (
              <section className="rounded-xl bg-white dark:bg-slate-800 p-5 shadow-sm mb-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">By topic</h3>
                <div className="space-y-3">
                  {profile.byTech.map(t => (
                    <ProgressBar key={t.tech} label={techLabel(t.tech)} total={t.total} solved={t.solved} color={TECH_COLOR[t.tech]} />
                  ))}
                </div>
              </section>
            )}

            {profile.byDifficulty.length > 0 && (
              <section className="rounded-xl bg-white dark:bg-slate-800 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">By difficulty</h3>
                <div className="space-y-3">
                  {profile.byDifficulty.map(d => (
                    <ProgressBar key={d.difficulty} label={d.difficulty} total={d.total} solved={d.solved} color={DIFF_COLOR[d.difficulty]} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
