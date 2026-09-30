// Whole-dataset offline cache backed by IndexedDB. Lets the reader browse any
// previously-synced question while offline — API filtering/pagination is
// replicated client-side over this cached array in api.js.
const DB_NAME = 'ir-offline'
const STORE = 'questions'
const QUEUE_STORE = 'queue'
const META_KEY = 'lastSyncedAt'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
      if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: 'qid', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// --- pending mutation queue: writes made while offline, replayed once back online ---

export async function enqueueMutation(mutation) {
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).add(mutation)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function getQueuedMutations() {
  const db = await openDb()
  const result = await new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly')
    const req = tx.objectStore(QUEUE_STORE).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
  db.close()
  return result
}

export async function removeMutation(qid) {
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).delete(qid)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function saveAllQuestions(questions) {
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction([STORE, 'meta'], 'readwrite')
    const store = tx.objectStore(STORE)
    questions.forEach(q => store.put(q))
    tx.objectStore('meta').put(Date.now(), META_KEY)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function getAllCachedQuestions() {
  const db = await openDb()
  const result = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
  db.close()
  return result
}

export async function getLastSyncedAt() {
  const db = await openDb()
  const result = await new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly')
    const req = tx.objectStore('meta').get(META_KEY)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return result
}
