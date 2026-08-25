// Auth + per-user progress against the backend. Token kept in localStorage.

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'
const TOKEN_KEY = 'ir_token'
const USER_KEY = 'ir_user'

export function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}
export function isLoggedIn() { return !!getToken() }

function setSession({ token, email, name }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify({ email, name }))
}
export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function authHeaders() {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function parseError(res) {
  try { return (await res.json()).error } catch { return null }
}

export async function register({ email, password, name }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  if (!res.ok) throw new Error(await parseError(res) || 'Registration failed')
  const data = await res.json()
  setSession(data)
  return data
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(await parseError(res) || 'Login failed')
  const data = await res.json()
  setSession(data)
  return data
}

// --- per-user progress ---

export async function fetchProgress() {
  const res = await fetch(`${API_BASE}/progress`, { headers: authHeaders() })
  if (!res.ok) return { visited: [], read: [] }
  return res.json()
}

export function markVisitedRemote(id) {
  return fetch(`${API_BASE}/progress/visited/${encodeURIComponent(id)}`, { method: 'POST', headers: authHeaders() })
}
export function markReadRemote(id) {
  return fetch(`${API_BASE}/progress/read/${encodeURIComponent(id)}`, { method: 'POST', headers: authHeaders() })
}

// Push guest localStorage progress into the account after login.
export function mergeProgress({ visited, read }) {
  return fetch(`${API_BASE}/progress/merge`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ visited, read }),
  })
}
