// Backend API integration for the questions service.

export const PAGE = 50
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'

export async function fetchQuestions({ tech, category, difficulty, search, status, visitedIds, readIds, page = 0, size = PAGE }) {
  // Always send IDs when status filter is active for correct pagination
  const shouldSendIds = status && status !== 'all'

  const params = new URLSearchParams()
  if (tech && tech !== 'all') params.set('tech', tech)
  if (category && category !== 'all') params.set('category', category)
  if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty)
  if (search) params.set('search', search)
  if (status && status !== 'all') params.set('status', status)
  if (shouldSendIds && visitedIds && visitedIds.length > 0) params.set('visitedIds', visitedIds.join(','))
  if (shouldSendIds && readIds && readIds.length > 0) params.set('readIds', readIds.join(','))
  params.set('page', page)
  params.set('size', size)
  const token = localStorage.getItem('ir_token')
  const res = await fetch(`${API_BASE}/questions?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.message || 'Create a free account to view this topic')
    err.signupRequired = true          // App shows the sign-up prompt instead of an error
    err.tech = body.tech
    throw err
  }
  if (!res.ok) throw new Error('Failed to fetch questions')
  return res.json()
}

export async function fetchCategories(tech) {
  const res = await fetch(`${API_BASE}/questions/categories?tech=${tech}`)
  if (!res.ok) return []
  return res.json()
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/questions/stats`)
  if (!res.ok) return { total: 0, byTech: {} }
  return res.json()
}
