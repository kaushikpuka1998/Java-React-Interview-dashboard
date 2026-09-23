// Auth + per-user progress against the backend. 
// Uses HttpOnly cookies for authentication.

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'
const USER_KEY = 'ir_user'

export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}
export function isLoggedIn() { return !!getUser() }

function setSession({ email, name, admin }) {
  localStorage.setItem(USER_KEY, JSON.stringify({ email, name, admin: !!admin }))
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
  } catch (e) {
    console.error('Logout request failed', e)
  }
  localStorage.removeItem(USER_KEY)
  window.location.reload()
}

function authHeaders() {
  // Authorization header no longer used, using cookies.
  return {}
}

async function parseError(res) {
  try { return (await res.json()).error } catch { return null }
}

export async function register({ email, password, name }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
    credentials: 'include'
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
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await parseError(res) || 'Login failed')
  const data = await res.json()
  setSession(data)
  return data
}

// --- per-user progress ---

export async function fetchProgress() {
  const res = await fetch(`${API_BASE}/progress`, { headers: authHeaders(), credentials: 'include' })
  if (!res.ok) return { visited: [], read: [], flagged: [] }
  return res.json()
}

export function markVisitedRemote(id) {
  return fetch(`${API_BASE}/progress/visited/${encodeURIComponent(id)}`, { method: 'POST', headers: authHeaders(), credentials: 'include' })
}
export function markReadRemote(id) {
  return fetch(`${API_BASE}/progress/read/${encodeURIComponent(id)}`, { method: 'POST', headers: authHeaders(), credentials: 'include' })
}
export async function toggleFlaggedRemote(id) {
  const res = await fetch(`${API_BASE}/progress/flagged/${encodeURIComponent(id)}`, { method: 'POST', headers: authHeaders(), credentials: 'include' })
  if (!res.ok) throw new Error('Could not update flag')
  return res.json()
}

// Push guest localStorage progress into the account after login.
export function mergeProgress({ visited, read }) {
  return fetch(`${API_BASE}/progress/merge`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ visited, read }),
    credentials: 'include'
  })
}

// --- user profile ---

export async function fetchProfile() {
  const res = await fetch(`${API_BASE}/profile/me`, { headers: authHeaders(), credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res) || 'Failed to load profile')
  return res.json()
}

// kind: 'solved' | 'visited' | 'flagged'
export async function fetchProfileQuestions(kind) {
  const res = await fetch(`${API_BASE}/profile/questions/${kind}`, { headers: authHeaders(), credentials: 'include' })
  if (!res.ok) return []
  return res.json()
}

// --- "was this asked in an interview?" company reports ---

export async function fetchQuestionCompanies(questionId) {
  const res = await fetch(`${API_BASE}/questions/${encodeURIComponent(questionId)}/companies`, {
    headers: authHeaders(), credentials: 'include'
  })
  if (!res.ok) return []
  return res.json()
}

export async function searchCompanies(q) {
  const res = await fetch(`${API_BASE}/companies?q=${encodeURIComponent(q || '')}`, { headers: authHeaders(), credentials: 'include' })
  if (!res.ok) return []
  return res.json()
}

export async function reportCompany(questionId, company, askedOn) {
  const res = await fetch(`${API_BASE}/questions/${encodeURIComponent(questionId)}/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ company, askedOn }),
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await parseError(res) || 'Could not save that')
  return res.json()
}

export async function unreportCompany(questionId, company) {
  const res = await fetch(
    `${API_BASE}/questions/${encodeURIComponent(questionId)}/companies/${encodeURIComponent(company)}`,
    { method: 'DELETE', headers: authHeaders(), credentials: 'include' }
  )
  if (!res.ok) throw new Error('Could not remove that')
  return res.json()
}

// --- suggested edits ---

export async function suggestEdit(questionId, { title, question, answer, note }) {
  const res = await fetch(`${API_BASE}/questions/${encodeURIComponent(questionId)}/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, question, answer, note }),
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await parseError(res) || 'Could not send that suggestion')
  return res.json()
}

export async function fetchMySuggestions() {
  const res = await fetch(`${API_BASE}/suggestions/mine`, { headers: authHeaders(), credentials: 'include' })
  if (!res.ok) return { unseen: 0, items: [] }
  return res.json()
}

export function markSuggestionsSeen() {
  return fetch(`${API_BASE}/suggestions/mine/seen`, { method: 'POST', headers: authHeaders(), credentials: 'include' })
}

// --- admin: review queue ---

export async function fetchSuggestions(status = 'PENDING') {
  const res = await fetch(`${API_BASE}/suggestions?status=${status}`, { headers: authHeaders(), credentials: 'include' })
  if (!res.ok) return []
  return res.json()
}

export async function fetchSuggestionCounts() {
  const res = await fetch(`${API_BASE}/suggestions/counts`, { headers: authHeaders(), credentials: 'include' })
  if (!res.ok) return { pending: 0, approved: 0, rejected: 0 }
  return res.json()
}

export async function reviewSuggestion(id, decision, adminNote) {
  const res = await fetch(`${API_BASE}/suggestions/${id}/${decision}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ adminNote }),
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await parseError(res) || `Failed (${res.status})`)
  return res.json()
}

// --- admin: publish questions ---

export async function createQuestion(input) {
  const res = await fetch(`${API_BASE}/questions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await parseError(res) || `Failed (${res.status})`)
  return res.json()
}

export async function createQuestionsBulk(inputs) {
  const res = await fetch(`${API_BASE}/questions/bulk`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(inputs),
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await parseError(res) || `Failed (${res.status})`)
  return res.json()
}

export async function updateQuestion(id, input) {
  const res = await fetch(`${API_BASE}/questions/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await parseError(res) || `Failed (${res.status})`)
  return res.json()
}

export async function deleteQuestion(id) {
  const res = await fetch(`${API_BASE}/questions/${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: { ...authHeaders() },
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await parseError(res) || `Failed (${res.status})`)
}

export async function uploadImage(file) {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch(`${API_BASE}/images`, {
    method: 'POST', headers: { ...authHeaders() }, body,
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await parseError(res) || `Upload failed (${res.status})`)
  return (await res.json()).url
}
