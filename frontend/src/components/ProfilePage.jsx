import { useState, useEffect } from 'react'
import { isLoggedIn, getUser, logout, fetchDashboard, fetchProfileQuestions, updateLocation } from '../lib/auth.js'
import { fetchQuestions } from '../lib/api.js'
import { slugify } from '../lib/slug.js'
import { techBadge, difficultyBadge, techLabel } from '../lib/badges.js'
import AuthModal from './AuthModal.jsx'
import LeagueBadge from './LeagueBadge.jsx'
import PieChart, { toHex, countBy } from './PieChart.jsx'
import Markdown from './Markdown.jsx'
import ActivityHeatmap from './ActivityHeatmap.jsx'
import { resumeBuilderLink } from '../lib/analytics.js'
import { updateUsername, fetchNotes, saveNote, removeNote } from '../lib/auth.js'

export const TECH_COLOR = {
  java: 'bg-orange-500', react: 'bg-cyan-500', node: 'bg-green-500', sql: 'bg-purple-500',
  hld: 'bg-indigo-500', kafka: 'bg-slate-500', golang: 'bg-sky-500',
}
export const DIFF_COLOR = {
  Basic: 'bg-green-500', Intermediate: 'bg-amber-500', Advanced: 'bg-rose-500', Experienced: 'bg-purple-500',
}

// "Where are you from?" — what the user typed wins; otherwise shows the IP-based guess.
const NOTE_MAX = 5000
const NOTE_TITLE_MAX = 120

// One note: a formatted view, or an editor with a live Markdown preview beside it.
function NoteEditor({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [body, setBody] = useState(initial?.body || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setBusy(true); setError('')
    try { await onSave({ title, body }) }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="rounded-2xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-950 p-5">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          value={title}
          onChange={e => setTitle(e.target.value.slice(0, NOTE_TITLE_MAX))}
          placeholder="Note title"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <span className="text-xs tabular-nums text-slate-400">{body.length}/{NOTE_MAX}</span>
        <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
        <button onClick={save} disabled={busy || !body.trim()} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
      </div>
      <p className="mb-3 text-xs text-slate-400">Only you can see this. Markdown works: # heading, **bold**, - lists, `code`.</p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value.slice(0, NOTE_MAX))}
          rows={14}
          placeholder={'# Topic\n\n- Point one\n- Point two'}
          className="min-h-[18rem] w-full rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <div className="min-h-[18rem] overflow-auto rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
          {body.trim() ? <Markdown text={body} /> : <p className="text-sm text-slate-400">Preview appears here.</p>}
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

// The member's private notes: a list of formatted notes, with add, edit and delete.
function PersonalNotes() {
  const [notes, setNotes] = useState(null)
  const [editing, setEditing] = useState(null)   // null | 'new' | note id
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNotes().then(setNotes).catch(e => setError(e.message))
  }, [])

  const save = async (id, data) => {
    const saved = await saveNote(id, data)
    setNotes(list => id ? list.map(n => (n.id === id ? saved : n)) : [saved, ...list])
    setEditing(null)
  }
  const remove = async (id) => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return
    try { await removeNote(id); setNotes(list => list.filter(n => n.id !== id)) }
    catch (e) { setError(e.message) }
  }

  if (error && !notes) return <p className="text-sm text-slate-500">{error}</p>
  if (!notes) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">My notes <span className="text-slate-400 font-normal">({notes.length})</span></h2>
        {editing !== 'new' && (
          <button onClick={() => setEditing('new')} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">New note</button>
        )}
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {editing === 'new' && <NoteEditor onSave={(d) => save(null, d)} onCancel={() => setEditing(null)} />}

      {notes.length === 0 && editing !== 'new' && (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
          No notes yet. Keep track of what you're preparing for, goals, or things to revisit.
        </p>
      )}

      {notes.map(n => editing === n.id ? (
        <NoteEditor key={n.id} initial={n} onSave={(d) => save(n.id, d)} onCancel={() => setEditing(null)} />
      ) : (
        <article key={n.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</h3>
              <p className="text-xs text-slate-400">Updated {new Date(n.updatedAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <button onClick={() => setEditing(n.id)} className="font-medium text-blue-600 hover:underline dark:text-blue-400">Edit</button>
              <button onClick={() => remove(n.id)} className="font-medium text-red-600 hover:underline dark:text-red-400">Delete</button>
            </div>
          </div>
          <Markdown text={n.body} />
        </article>
      ))}
    </section>
  )
}

// Public handle for the /u/ link. Changing it retires the old link.
function UsernameEditor({ username, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(username || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async (e) => {
    e.preventDefault(); setError(''); setBusy(true)
    try { const r = await updateUsername(value.trim()); onSaved(r.username); setEditing(false) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  if (editing) return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-1.5 mt-1">
      <span className="text-xs text-slate-500">/u/</span>
      <input className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-40" value={value} onChange={e => setValue(e.target.value)} aria-label="Username" />
      <button type="submit" disabled={busy} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Save</button>
      <button type="button" onClick={() => { setValue(username || ''); setEditing(false); setError('') }} className="text-xs text-slate-500 hover:underline">Cancel</button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </form>
  )
  return (
    <div className="flex items-center gap-2">
      {username ? (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">/u/{username}</span>
      ) : (
        <span className="text-xs text-slate-400">No username yet</span>
      )}
      <button onClick={() => setEditing(true)} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">Change</button>
    </div>
  )
}

function LocationEditor({ profile }) {
  const [editing, setEditing] = useState(false)
  const [loc, setLoc] = useState({ country: profile.country || '', city: profile.city || '', locationSource: profile.locationSource || '' })
  const [form, setForm] = useState(loc)
  const [error, setError] = useState('')

  const save = async (e) => {
    e.preventDefault(); setError('')
    if (!form.country.trim() || !form.city.trim()) return setError('Both country and city are required')
    try { const saved = await updateLocation(form); setLoc(saved); setForm(saved); setEditing(false) }
    catch (err) { setError(err.message) }
  }

  const input = 'px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-28'
  if (editing) return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-1.5 mt-1">
      <input className={input} placeholder="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} aria-label="Country" />
      <input className={input} placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} aria-label="City" />
      <button type="submit" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Save</button>
      <button type="button" onClick={() => { setForm(loc); setEditing(false) }} className="text-xs text-slate-500 hover:underline">Cancel</button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </form>
  )
  const place = [loc.city, loc.country].filter(Boolean).join(', ')
  return (
    <p className="text-xs text-slate-400 mt-0.5">
      {place ? <>📍 {place}{loc.locationSource === 'ip' && ' (detected)'}</> : 'Location not set'}
      {' · '}
      <button onClick={() => setEditing(true)} className="text-blue-600 dark:text-blue-400 hover:underline">
        {place ? 'Edit' : 'Add location'}
      </button>
    </p>
  )
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

export function ProgressBar({ label, total, solved, color }) {
  const pct = total ? Math.round((solved / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">{solved}/{total} · {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color || 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// Fixed height so the lists line up; long lists scroll inside their card.
// fixed={false} sizes the card to its contents (used for the full-width Important card).
function QuestionList({ title, items, emptyText, fixed = true }) {
  return (
    <div className={`flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 ${fixed ? 'h-[26rem]' : ''}`}>
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">{title} <span className="text-slate-400 font-normal">({items.length})</span></h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className={`divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto ${fixed ? 'min-h-0 flex-1' : 'max-h-80'}`}>
          {items.map((q) => (
            <li key={q.id} className="py-2">
              <a href={`/${slugify(q.question || q.title)}?id=${q.id}`} className="block group">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {q.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${techBadge(q.tech)}`}>
                    {techLabel(q.tech)}
                  </span>
                  {q.difficulty && (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${difficultyBadge(q.difficulty)}`}>
                      {q.difficulty}
                    </span>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Last dashboard this browser saw for the account: shown at once, refreshed in the background.
const readDashboardCache = () => {
  try {
    const email = getUser()?.email
    return email ? JSON.parse(localStorage.getItem(`ir_dash_${email}`) || 'null') : null
  } catch { return null }
}

export default function ProfilePage() {
  const [cache] = useState(() => (isLoggedIn() ? readDashboardCache() : null))
  const [profile, setProfile] = useState(() => cache?.me ?? null)
  const [solved, setSolved] = useState(() => cache?.solved ?? [])
  const [visited, setVisited] = useState(() => cache?.visited ?? [])
  const [visitedLoaded, setVisitedLoaded] = useState(false)   // the visited list loads when its tab is opened
  const [listFilter, setListFilter] = useState('solved')   // which of the two lists to show
  useEffect(() => {
    if (listFilter !== 'visited' || visitedLoaded) return
    let alive = true
    fetchProfileQuestions('visited').then(list => { if (alive) { setVisited(list); setVisitedLoaded(true) } })
    return () => { alive = false }
  }, [listFilter, visitedLoaded])
  const [flagged, setFlagged] = useState(() => cache?.flagged ?? [])
  const [important, setImportant] = useState(() => cache?.important ?? [])
  const [loading, setLoading] = useState(() => !cache)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [handle, setHandle] = useState('')
  useEffect(() => { if (profile?.username) setHandle(profile.username) }, [profile])

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return }
    let cancelled = false
    fetchDashboard()
      .then((d) => {
        if (cancelled) return
        setProfile(d.me); setSolved(d.solved); setImportant(d.important); setFlagged(d.flagged)
        setLoading(false)
        localStorage.setItem(`ir_dash_${d.me.email}`, JSON.stringify(d))
      })
      .catch((e) => { if (!cancelled) { if (!cache) setError(e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  if (!isLoggedIn()) {
    return (
      <Shell>
        <p className="text-slate-600 dark:text-slate-300 mb-4">Log in to view your profile and progress.</p>
        <AuthModal onClose={() => { window.location.href = '/' }} onSuccess={() => window.location.reload()} />
      </Shell>
    )
  }

  if (loading) return <Shell><ProfileSkeleton /></Shell>
  if (error) return <Shell><p className="text-red-500">{error}</p></Shell>
  if (!profile) return <Shell><p className="text-slate-500">No profile data.</p></Shell>

  const { username, name, email, totalQuestions, visitedCount, solvedCount, byTech = [], byDifficulty = [], memberSince } = profile
  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/u/${handle}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    })
  }
  const solvedPct = totalQuestions ? Math.round((solvedCount / totalQuestions) * 100) : 0

  return (
    <Shell>
      {/* Identity header */}
      <div className="relative flex items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Avatar and league badge both open the leaderboard */}
        <a href="/leaderboard" title="View leaderboard" className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold hover:opacity-90">
          {(name || email || '?').trim().charAt(0).toUpperCase()}
        </a>
        {profile.league && (
          <a href="/leaderboard" title="View leaderboard" className="absolute right-0 top-0 hover:opacity-80">
            <LeagueBadge league={profile.league} />
          </a>
        )}
        <div className={`min-w-0 ${profile.league ? 'pr-24 sm:pr-28' : ''}`}>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 break-words">{name || 'Learner'}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 break-all">{email}</p>

          {profile.league && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">{profile.weeklyXp} XP this week</span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <UsernameEditor username={handle} onSaved={setHandle} />
            {handle && (
              <button
                onClick={copyLink}
                className="rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                {copied ? 'Link copied!' : 'Copy link'}
              </button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {memberSince && <span>Member since {new Date(memberSince).toLocaleDateString()}</span>}
            <LocationEditor profile={profile} />
          </div>
        </div>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="mb-4 flex justify-stretch sm:justify-end">
          <a href={resumeBuilderLink('profile')} className="w-full sm:w-auto text-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:opacity-95">Build your resume →</a>
        </div>
        <PersonalNotes />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Solved" value={solvedCount} sub={`${solvedPct}% of all`} accent="text-green-600 dark:text-green-400" />
        <StatCard label="Visited" value={visitedCount} accent="text-blue-600 dark:text-blue-400" />
        <StatCard label="Flagged" value={flagged.length} accent="text-amber-600 dark:text-amber-400" />
        <StatCard label="Important" value={important.length} accent="text-rose-600 dark:text-rose-400" />
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
        <PieChart
          title="Solved by technology"
          empty="Nothing solved yet."
          slices={[
            ...byTech.filter(t => t.solved > 0).map(t => ({ label: techLabel(t.tech), value: t.solved, color: toHex(TECH_COLOR[t.tech]) })),
            { label: 'Not solved', value: Math.max(totalQuestions - solvedCount, 0), color: '#94a3b8' },
          ]}
        />
        <PieChart
          title="Solved by difficulty"
          empty="Nothing solved yet."
          slices={[
            ...byDifficulty.filter(d => d.solved > 0).map(d => ({ label: d.difficulty, value: d.solved, color: toHex(DIFF_COLOR[d.difficulty]) })),
            { label: 'Not solved', value: Math.max(totalQuestions - solvedCount, 0), color: '#94a3b8' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <PieChart
          title="Visited by technology"
          empty="No visited questions yet."
          slices={[
            ...(profile.visitedByTech || []).map(({ tech, count }) => ({ label: techLabel(tech), value: count, color: toHex(TECH_COLOR[tech]) })),
            { label: 'Not visited', value: Math.max(totalQuestions - visitedCount, 0), color: '#94a3b8' },
          ]}
        />
        <PieChart
          title="Visited by difficulty"
          empty="No visited questions yet."
          slices={[
            ...(profile.visitedByDifficulty || []).map(({ difficulty, count }) => ({ label: difficulty, value: count, color: toHex(DIFF_COLOR[difficulty]) })),
            { label: 'Not visited', value: Math.max(totalQuestions - visitedCount, 0), color: '#94a3b8' },
          ]}
        />
      </div>

      {/* Coding activity, like a LeetCode calendar */}
      <div className="mb-6 sm:mb-8">
        <ActivityHeatmap />
      </div>

      {/* Question lists */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your questions</h2>
        <div className="inline-flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800" role="group" aria-label="Show">
        {[['solved', 'Solved', solved.length], ['visited', 'Visited', visitedCount]].map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setListFilter(key)}
            aria-pressed={listFilter === key}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              listFilter === key
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {label} <span className="tabular-nums opacity-70">({count})</span>
          </button>
        ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {listFilter === 'solved'
          ? <QuestionList title="Solved questions" items={solved} emptyText="Nothing solved yet — mark questions as read to track them." />
          : <QuestionList title="Visited questions" items={visited} emptyText={visitedLoaded ? 'No visited questions yet.' : 'Loading visited questions…'} />}
        <QuestionList title="Flagged questions" items={flagged} emptyText="No flagged questions yet." />
        <div className="lg:col-span-2">
          <QuestionList title="Important questions" items={important} emptyText="No questions marked important yet." fixed={false} />
        </div>
      </div>
    </Shell>
  )
}

// Mirrors the real layout's sizes so something substantial paints immediately,
// instead of the page's biggest content waiting on the network (hurts LCP).
function ProfileSkeleton() {
  const block = 'animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60'
  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className={`${block} h-24`} />)}
      </div>
      <div className={`${block} h-16 mb-8`} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className={`${block} h-48`} />
        <div className={`${block} h-48`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${block} h-64`} />
        <div className={`${block} h-64`} />
        <div className={`${block} h-64`} />
      </div>
    </div>
  )
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Your Profile</h1>
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Back to app</a>
            {isLoggedIn() && <button onClick={() => logout({ redirect: '/' })} className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-red-600/30 transition-colors hover:bg-red-700 hover:shadow-md hover:shadow-red-600/40 dark:bg-red-600 dark:hover:bg-red-500">Log out</button>}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
