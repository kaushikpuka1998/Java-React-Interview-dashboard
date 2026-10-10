import { useState, useEffect } from 'react'
import { fetchProfile, updateLocation } from '../lib/auth.js'

// Required step for signed-in members missing a country or city: shown on every sign-in and
// page load until one is saved. Members who already have a location (typed or IP-detected) skip it.
// × hides it for this visit only; it returns on the next sign-in or page load.
export default function LocationPrompt() {
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ country: '', city: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
      .then((p) => { if (!p.country || !p.city) setShow(true) })
      .catch(() => {})
  }, [])

  if (!show) return null

  const save = async (e) => {
    e.preventDefault()
    if (!form.country.trim() || !form.city.trim()) return setError('Both country and city are required')
    setBusy(true); setError('')
    try {
      await updateLocation(form)
      setShow(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div role="dialog" aria-modal="true" aria-label="Set your location" className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Where are you from?</h2>
          <button onClick={() => setShow(false)} aria-label="Close" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Please tell us your location to continue.</p>
        <form onSubmit={save} className="space-y-3">
          <input className={input} placeholder="Country (required)" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <input className={input} placeholder="City (required)" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold disabled:opacity-60">
            {busy ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
