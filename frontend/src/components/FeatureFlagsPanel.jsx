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
          <div key={f.key} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3 sm:p-4">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{f.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{f.help}</p>
              <p className="mt-1 break-all text-[11px] font-mono text-slate-400">{f.key}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={`${f.label}: ${on ? 'on' : 'off'}`}
              disabled={saving === f.key}
              onClick={() => toggle(f.key)}
              className={`relative mt-0.5 inline-flex h-4 w-8 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 sm:h-6 sm:w-11 ${on ? 'bg-blue-600 max-sm:border-[1.5px] max-sm:border-blue-600 max-sm:bg-transparent' : 'bg-slate-300 dark:bg-slate-700 max-sm:border-[1.5px] max-sm:border-slate-400 max-sm:bg-transparent dark:max-sm:border-slate-500'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full shadow transition-transform sm:h-5 sm:w-5 sm:bg-white ${on ? 'translate-x-[17px] bg-white max-sm:bg-blue-600 sm:translate-x-5' : 'translate-x-0 bg-white max-sm:bg-slate-400 sm:translate-x-0.5'}`} />
            </button>
          </div>
        )
      })}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
