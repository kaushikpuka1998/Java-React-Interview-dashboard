// Replays progress mutations (visited/read/flag/important) made while offline, once the
// connection comes back. The endpoints are all "set/toggle this on the server"
// POSTs, so replaying them in the order they happened reproduces the same result
// a user would get clicking them live.
import { enqueueMutation, getQueuedMutations, removeMutation } from './offlineStore.js'
import { markVisitedRemote, markReadRemote, toggleFlaggedRemote, toggleImportantRemote } from './auth.js'

const RUNNERS = {
  visited: markVisitedRemote,
  read: markReadRemote,
  flag: toggleFlaggedRemote,
  important: toggleImportantRemote,
}

// True for a dropped connection, not a real server rejection (which should just be dropped).
function isOffline(err) {
  return !navigator.onLine || err instanceof TypeError
}

// Sends now if online; otherwise (or on a network failure) queues for later and
// resolves anyway, since the caller already applied the optimistic UI update.
export async function sendOrQueue(type, questionId, sendFn) {
  if (!navigator.onLine) {
    await enqueueMutation({ type, questionId, createdAt: Date.now() })
    return
  }
  try {
    await sendFn()
  } catch (err) {
    if (!isOffline(err)) throw err
    await enqueueMutation({ type, questionId, createdAt: Date.now() })
  }
}

let flushing = false
export async function flushQueuedMutations() {
  if (flushing || !navigator.onLine) return
  flushing = true
  try {
    const items = await getQueuedMutations()
    for (const item of items) {
      const runner = RUNNERS[item.type]
      try {
        await runner(item.questionId)
        await removeMutation(item.qid)
      } catch (err) {
        if (isOffline(err)) break   // network dropped again mid-flush, stop and retry next time
        await removeMutation(item.qid)   // server rejected it (e.g. logged out) — don't retry forever
      }
    }
  } finally {
    flushing = false
  }
}

export function initOfflineSync() {
  window.addEventListener('online', flushQueuedMutations)
  if (navigator.onLine) flushQueuedMutations()
}
