const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'

function authHeaders() {
  const token = localStorage.getItem('ir_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseError(res) {
  try { return (await res.json()).error } catch { return null }
}

// Public: id, title and difficulty of every coding problem.
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

export async function deleteCodingProblem(id) {
  const res = await fetch(`${API_BASE}/admin/coding-problems/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok && res.status !== 204) throw new Error('Could not delete the problem.')
}
