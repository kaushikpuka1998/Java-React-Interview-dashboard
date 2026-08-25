// Visited/Read tracking persisted in localStorage (Sets of question ids).

const STORAGE_KEY_VISITED = 'ir_visited_questions'
const STORAGE_KEY_READ = 'ir_read_questions'

export function loadVisited() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_VISITED) || '[]')) } catch { return new Set() }
}
export function loadRead() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_READ) || '[]')) } catch { return new Set() }
}
export function saveVisited(set) { localStorage.setItem(STORAGE_KEY_VISITED, JSON.stringify([...set])) }
export function saveRead(set) { localStorage.setItem(STORAGE_KEY_READ, JSON.stringify([...set])) }
