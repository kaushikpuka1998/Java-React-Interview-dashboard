const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'

function authHeaders() {
  const token = localStorage.getItem('ir_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseError(res) {
  try { return (await res.json()).error } catch { return null }
}

// Public: id, title and difficulty of every coding problem.
// When the member last opened the Practice page. Problems added after this, within a week, count as new.
const SEEN_KEY = 'ir_practice_seen'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function markPracticeSeen() {
  localStorage.setItem(SEEN_KEY, String(Date.now()))
}

// How many problems were added in the last week and after the member last looked.
export function newProblemCount(list) {
  const cutoff = Math.max(Number(localStorage.getItem(SEEN_KEY) || 0), Date.now() - WEEK_MS)
  return list.filter(p => p.createdAt && Date.parse(p.createdAt) > cutoff).length
}

export async function fetchCodingProblems() {
  const res = await fetch(`${API_BASE}/coding-problems`)
  if (!res.ok) throw new Error('Could not load the problems.')
  return res.json()
}

// Public: one problem's statement (never its test cases).
export async function fetchCodingProblem(id) {
  const res = await fetch(`${API_BASE}/coding-problems/${id}`)
  if (!res.ok) throw new Error('Could not load this problem.')
  return res.json()
}

// Admin: every problem, including test cases, for editing.
export async function fetchAdminCodingProblems() {
  const res = await fetch(`${API_BASE}/admin/coding-problems`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Could not load the problems.')
  return res.json()
}

// Admin: every problem in the bulk import shape, for downloading. Unlike fetchAdminCodingProblems
// this drops ids and returns testCases/templates as real JSON, so the file imports back as-is.
export async function fetchCodingProblemsExport() {
  const res = await fetch(`${API_BASE}/admin/coding-problems/export`, { headers: authHeaders() })
  if (!res.ok) throw new Error(await parseError(res) || 'Could not export the problems.')
  return res.json()
}

// Admin: create (no id) or update (with id) a problem.
export async function saveCodingProblem(id, input) {
  const res = await fetch(`${API_BASE}/admin/coding-problems${id ? `/${id}` : ''}`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await parseError(res) || 'Could not save the problem.')
  return res.json()
}

// Admin: saves many problems from one list. Returns { saved, failed: [{ index, title, error }] }.
export async function importCodingProblems(items) {
  const res = await fetch(`${API_BASE}/admin/coding-problems/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(items),
  })
  if (!res.ok) throw new Error(await parseError(res) || 'Could not import the problems.')
  return res.json()
}

export async function deleteCodingProblem(id) {
  const res = await fetch(`${API_BASE}/admin/coding-problems/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok && res.status !== 204) throw new Error('Could not delete the problem.')
}
