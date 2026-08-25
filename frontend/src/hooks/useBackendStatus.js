import { useEffect, useRef, useState } from 'react'

// Same resolution logic as lib/api.js — keep in sync so the status check
// pings the exact backend the app actually talks to.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'

const INITIAL_RETRY_DELAY_MS = 2000
const MAX_RETRY_DELAY_MS = 30000
const CONNECTED_POLL_INTERVAL_MS = 30000

/**
 * Pings the backend's /questions/stats endpoint on mount and keeps checking
 * its health. Returns the live connection status plus the base URL being used,
 * so the UI can surface both to the user.
 *
 * status is one of: 'loading' | 'connected' | 'disconnected'
 */
export function useBackendStatus() {
  const [status, setStatus] = useState('loading')
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY_MS)
  const timeoutRef = useRef(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false

    const checkStatus = async () => {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const res = await fetch(`${API_BASE}/questions/stats`, { signal: controller.signal })
        clearTimeout(timeout)

        if (cancelledRef.current) return

        if (res.ok) {
          setStatus('connected')
          retryDelayRef.current = INITIAL_RETRY_DELAY_MS
          scheduleNext(CONNECTED_POLL_INTERVAL_MS)
        } else {
          setStatus('disconnected')
          scheduleRetryWithBackoff()
        }
      } catch (err) {
        if (cancelledRef.current) return
        setStatus('disconnected')
        scheduleRetryWithBackoff()
      }
    }

    const scheduleNext = (delay) => {
      if (cancelledRef.current) return
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(checkStatus, delay)
    }

    const scheduleRetryWithBackoff = () => {
      const delay = retryDelayRef.current
      retryDelayRef.current = Math.min(delay * 2, MAX_RETRY_DELAY_MS)
      scheduleNext(delay)
    }

    checkStatus()

    return () => {
      cancelledRef.current = true
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return { status, apiBase: API_BASE }
}

export default useBackendStatus
