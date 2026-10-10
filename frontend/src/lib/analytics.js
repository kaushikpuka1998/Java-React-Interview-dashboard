import { useEffect } from 'react'

// Lightweight first-party analytics. No cookies and no IP: visitors are counted
// with a random session id kept in localStorage, so the backend stores no PII.

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'
const SESSION_KEY = 'ir_session_id'

function sessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = (crypto.randomUUID?.() || String(Math.random()).slice(2) + Date.now().toString(36))
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function device() {
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

// The referrer that brought the visitor to the site, captured once on load —
// client-side navigation would otherwise overwrite it with our own URL.
const initialReferrer = typeof document !== 'undefined' ? document.referrer || '' : ''

// Don't double-count the same question in one session/page-load.
const sent = new Set()

export function trackView({ path, questionId } = {}) {
  try {
    const key = questionId || path || location.pathname
    if (sent.has(key)) return
    sent.add(key)

    const body = JSON.stringify({
      path: path || location.pathname,
      questionId: questionId || null,
      referrer: initialReferrer,
      sessionId: sessionId(),
      device: device(),
    })

    const token = localStorage.getItem('ir_token')

    // sendBeacon can't set an Authorization header, so signed-in views go through
    // fetch (with keepalive) to be attributed to the account; anonymous views use
    // the beacon, which survives page unload.
    if (!token && navigator.sendBeacon) {
      navigator.sendBeacon(`${API_BASE}/analytics/track`, new Blob([body], { type: 'application/json' }))
      return
    }
    fetch(`${API_BASE}/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // analytics must never break the page
  }
}

// --- engagement events: reads (scroll depth + time) and clicks ---

const queue = []
let flushTimer = null

export function flushEvents() {
  clearTimeout(flushTimer); flushTimer = null
  if (!queue.length) return
  const body = JSON.stringify(queue.splice(0, 50))
  const token = localStorage.getItem('ir_token')
  fetch(`${API_BASE}/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body,
    keepalive: true,
  }).catch(() => {})
  if (queue.length) flushEvents()
}

function trackEvent(evt) {
  try {
    queue.push({ ...evt, sessionId: sessionId() })
    if (!flushTimer) flushTimer = setTimeout(flushEvents, 15000)
  } catch { /* never break the page */ }
}

// Label a click by its control: explicit data-track, then aria-label/title, then visible text.
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (location.pathname.startsWith('/admin')) return
    const el = e.target.closest?.('[data-track], button, a, [role="button"]')
    if (!el) return
    const label = (el.dataset.track || el.getAttribute('aria-label') || el.title || el.innerText || '')
      .replace(/\s+/g, ' ').trim().slice(0, 80)
    if (label) trackEvent({ type: 'click', label })
  }, { capture: true })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushEvents()
  })
}

/**
 * Records how long a question was actually on screen (tab visible) and how far its
 * answer was scrolled. Emits one `read` event when the question changes, the
 * component unmounts, or the tab is hidden (the only reliable signal before close).
 */
export function useReadTracking(questionId, scrollRef) {
  useEffect(() => {
    if (!questionId) return
    let maxScroll = 0
    let seconds = 0
    let visibleSince = document.visibilityState === 'visible' ? Date.now() : null

    const el = scrollRef.current
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      const pct = max <= 0 ? 100 : Math.round((el.scrollTop / max) * 100)
      if (pct > maxScroll) maxScroll = pct
    }
    // Content shorter than the pane counts as fully seen; measure once it has rendered.
    const measure = setTimeout(() => el && onScroll(), 500)
    el?.addEventListener('scroll', onScroll, { passive: true })

    const emit = () => {
      if (visibleSince) { seconds += (Date.now() - visibleSince) / 1000; visibleSince = null }
      if (seconds >= 2) trackEvent({ type: 'read', questionId, scrollPct: maxScroll, seconds: Math.round(seconds) })
      seconds = 0
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') { emit(); flushEvents() }
      else visibleSince = Date.now()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearTimeout(measure)
      el?.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      emit()
    }
  }, [questionId])
}

// --- admin reads ---

function authHeaders() {
  const t = localStorage.getItem('ir_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export async function fetchAnalytics(days = 30) {
  const res = await fetch(`${API_BASE}/analytics/summary?days=${days}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(res.status === 403 ? 'Admin access required' : 'Failed to load analytics')
  return res.json()
}

export async function fetchSignups(since, limit = 20) {
  const q = new URLSearchParams({ limit: String(limit) })
  if (since) q.set('since', since)
  const res = await fetch(`${API_BASE}/analytics/signups?${q}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to load signups')
  return res.json()
}
