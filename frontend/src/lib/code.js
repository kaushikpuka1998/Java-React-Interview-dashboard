const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'

// Runs a snippet on the server (through Judge0). Throws with the server's message on failure.
export async function runCode({ language, code, stdin }) {
  const token = localStorage.getItem('ir_token')
  const res = await fetch(`${API_BASE}/code/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ language, code, stdin }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not run the code.')
  return data
}

// Runs the code against a coding problem's test cases. Returns { passed, total, results: [{ number, passed, status }] }.
export async function runTests({ problemId, language, code }) {
  const token = localStorage.getItem('ir_token')
  const res = await fetch(`${API_BASE}/code/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ problemId, language, code }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not run the tests.')
  return data
}
