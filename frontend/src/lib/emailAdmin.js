const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'

function authHeaders() {
  const t = localStorage.getItem('ir_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function json(res, fallback) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || fallback)
  }
  return res.json()
}

export const fetchEmailRecipients = () =>
  fetch(`${API_BASE}/admin/emails/recipients`, { headers: authHeaders() }).then(r => json(r, 'Failed to load recipients'))

export const fetchDigestStatus = () =>
  fetch(`${API_BASE}/admin/emails/digest`, { headers: authHeaders() }).then(r => json(r, 'Failed to load digest status'))

export const fetchEmailLog = () =>
  fetch(`${API_BASE}/admin/emails/log`, { headers: authHeaders() }).then(r => json(r, 'Failed to load the send log'))

export const sendAnnouncement = (payload) =>
  fetch(`${API_BASE}/admin/emails/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  }).then(r => json(r, 'Send failed'))
