import { useEffect, useState } from 'react'
import { fetchFeatures, setFeature } from '../lib/features.js'

// Each entry is a flag the server knows about (see FeatureFlagController).
const FLAGS = [
  { key: 'resume_promo', label: 'Resume builder login promo', help: 'Shows the resume builder card to members right after they log in.' },
]

export default function FeatureFlagsPanel() {
  const [flags, setFlags] = useState(null)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { fetchFeatures().then(setFlags) }, [])

  const toggle = async (key) => {
    setSaving(key); setError('')
    try {
      setFlags(await setFeature(key, !flags[key]))
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(null)
    }
  }

  if (!flags) return <p className="text-sm text-slate-500">Loading feature flags…</p>

  return (
    <div className="space-y-3">
      {FLAGS.map(f => {
        const on = flags[f.key] !== false
        return (
          <div key={f.key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{f.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{f.help}</p>
              <p className="mt-1 text-[11px] font-mono text-slate-400">{f.key}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={`${f.label}: ${on ? 'on' : 'off'}`}
              disabled={saving === f.key}
              onClick={() => toggle(f.key)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        )
      })}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
