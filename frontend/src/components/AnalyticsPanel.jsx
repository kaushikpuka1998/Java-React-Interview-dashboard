import { useState, useEffect, useCallback } from 'react'
import { fetchAnalytics, fetchSignups } from '../lib/analytics.js'

// When the admin last acknowledged the signup list — used to badge new joiners.
const SEEN_KEY = 'ir_signups_seen_at'

function Stat({ label, value, sub, tone }) {
  const tones = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    violet: 'text-violet-600 dark:text-violet-400',
  }
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tones[tone] || 'text-slate-900 dark:text-slate-100'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// Horizontal bar list — used for referrers, questions and devices.
function BarList({ title, rows, labelKey, valueKey, empty }) {
  const max = Math.max(1, ...rows.map(r => r[valueKey]))
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i}>
              <div className="flex items-baseline justify-between gap-3 text-sm mb-0.5">
                <span className="truncate text-slate-700 dark:text-slate-200" title={String(r[labelKey])}>
                  {r[labelKey] || 'direct'}
                </span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400 flex-shrink-0">
                  {r[valueKey].toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  style={{ width: `${(r[valueKey] / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Compact bar chart of daily views.
function DailyChart({ daily }) {
  if (!daily || daily.length === 0) return null
  const max = Math.max(1, ...daily.map(d => d.views))
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Views per day</h3>
      <div className="flex items-end gap-1 h-28">
        {daily.map((d) => (
          <div key={d.date} className="flex-1 min-w-0 group relative flex flex-col justify-end h-full">
            <div
              className="w-full rounded-t bg-gradient-to-t from-blue-500 to-indigo-400 min-h-[2px] transition-opacity group-hover:opacity-80"
              style={{ height: `${(d.views / max) * 100}%` }}
            />
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 z-10">
              {d.date}: {d.views} views · {d.visitors} visitors
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Split bar: two proportional segments with a shared legend.
function SplitBar({ a, b, aLabel, bLabel, aTone = 'bg-blue-500', bTone = 'bg-slate-300 dark:bg-slate-600' }) {
  const total = a + b
  const pct = total > 0 ? (a / total) * 100 : 0
  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <div className={aTone} style={{ width: `${pct}%` }} />
        <div className={`${bTone} flex-1`} />
      </div>
      <div className="flex justify-between mt-1.5 text-xs">
        <span className="text-slate-600 dark:text-slate-300">
          {aLabel} <span className="tabular-nums font-semibold">{a.toLocaleString()}</span>
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          {bLabel} <span className="tabular-nums font-semibold">{b.toLocaleString()}</span>
        </span>
      </div>
    </div>
  )
}

// Unique-audience panel: who the visitors were, not just how many hits.
function AudienceBlock({ audience, days }) {
  if (!audience) return null
  const {
    unique = 0, newVisitors = 0, returningVisitors = 0, engagedVisitors = 0,
    identifiedUsers = 0, signedInViews = 0, anonymousViews = 0,
    registeredMembers = 0, viewsPerVisitor = 0,
  } = audience

  const signedInPct = registeredMembers > 0 ? Math.round((identifiedUsers / registeredMembers) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Unique audience</h3>
        <span className="text-[11px] text-slate-400">last {days} days</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div>
          <p className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{unique.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">unique visitors</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{identifiedUsers.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">signed-in users</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{engagedVisitors.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">read 2+ questions</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{viewsPerVisitor}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">views per visitor</p>
        </div>
      </div>

      <div className="space-y-4">
        <SplitBar
          a={newVisitors} b={returningVisitors}
          aLabel="New" bLabel="Returning"
          aTone="bg-violet-500"
        />
        <SplitBar
          a={signedInViews} b={anonymousViews}
          aLabel="Signed-in views" bLabel="Anonymous views"
          aTone="bg-blue-500"
        />
      </div>

      <p className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-200">{identifiedUsers.toLocaleString()}</span>
        {' '}of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{registeredMembers.toLocaleString()}</span>
        {' '}members were active ({signedInPct}%)
      </p>
    </div>
  )
}

export default function AnalyticsPanel() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [signups, setSignups] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const seen = localStorage.getItem(SEEN_KEY)
      const [summary, sign] = await Promise.all([fetchAnalytics(days), fetchSignups(seen, 20)])
      setData(summary); setSignups(sign)
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }, [days])

  useEffect(() => { load() }, [load])

  const acknowledge = () => {
    localStorage.setItem(SEEN_KEY, new Date().toISOString())
    setSignups(s => ({ ...s, newSince: 0 }))
  }

  if (loading && !data) return <p className="text-sm text-slate-500">Loading analytics…</p>
  if (error) return <p className="text-sm text-red-500">{error}</p>
  if (!data) return null

  const t = data.traffic || {}
  const s = data.signups || {}
  const newJoiners = signups?.newSince || 0

  return (
    <div className="space-y-5">
      {/* New-joiner alert: only an admin ever sees this panel */}
      {newJoiners > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3">
          <p className="text-sm text-green-800 dark:text-green-300">
            <span className="font-semibold">{newJoiners} new {newJoiners === 1 ? 'person has' : 'people have'} joined</span>
            {' '}since you last checked.
          </p>
          <button onClick={acknowledge} className="text-xs font-semibold text-green-700 dark:text-green-400 hover:underline flex-shrink-0">
            Mark as seen
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                days === d ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <button onClick={load} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Refresh
        </button>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Views today" value={t.viewsToday ?? 0} tone="blue" />
        <Stat label={`Views (${data.windowDays}d)`} value={t.viewsInWindow ?? 0} sub={`${(t.totalViews ?? 0).toLocaleString()} all time`} />
        <Stat label="Visitors" value={t.uniqueInWindow ?? 0} sub={`${(t.uniqueVisitors ?? 0).toLocaleString()} all time`} tone="violet" />
        <Stat label="Members" value={s.total ?? 0} sub={`+${s.today ?? 0} today · +${s.thisWeek ?? 0} this week`} tone="green" />
      </div>

      <AudienceBlock audience={data.audience} days={data.windowDays} />

      <DailyChart daily={data.daily} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <BarList
          title="Where visitors come from"
          rows={data.referrers || []}
          labelKey="source"
          valueKey="views"
          empty="No traffic recorded yet."
        />
        <BarList
          title="Most viewed questions"
          rows={data.topQuestions || []}
          labelKey="title"
          valueKey="views"
          empty="No question views yet."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <BarList
          title="Devices"
          rows={data.devices || []}
          labelKey="device"
          valueKey="views"
          empty="No device data yet."
        />

        {/* Recent joiners */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Recent sign-ups</h3>
          {!signups?.users?.length ? (
            <p className="text-sm text-slate-400">Nobody has signed up yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
              {signups.users.map((u, i) => (
                <li key={u.email + i} className="py-2 flex items-center gap-3">
                  <div className="w-7 h-7 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                    {(u.name || u.email || '?').trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800 dark:text-slate-100 truncate">{u.name || u.email}</p>
                    {u.name && <p className="text-xs text-slate-400 truncate">{u.email}</p>}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Visitors are counted with an anonymous session id. No IP addresses or cookies are stored.
      </p>
    </div>
  )
}
