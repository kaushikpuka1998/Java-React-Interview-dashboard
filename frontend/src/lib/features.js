const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'

// Feature flags from the server. If the request fails, return no flags so features fall back to their defaults.
export async function fetchFeatures() {
  try {
    const res = await fetch(`${API_BASE}/features`)
    return res.ok ? res.json() : {}
  } catch {
    return {}
  }
}

export async function setFeature(key, enabled) {
  const token = localStorage.getItem('ir_token')
  const res = await fetch(`${API_BASE}/admin/features/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) throw new Error('Could not update the feature flag.')
  return res.json()
}
