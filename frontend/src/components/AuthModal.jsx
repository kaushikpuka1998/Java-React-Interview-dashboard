import { useState } from 'react'
import { login, register } from '../lib/auth.js'

// Login / signup modal. Calls onSuccess(user) after a successful auth.
export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = isSignup
        ? await register({ email, password, name })
        : await login({ email, password })
      onSuccess(user)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isSignup ? 'Create account' : 'Welcome back'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isSignup && (
            <input
              type="text" placeholder="Name (optional)" value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <input
            type="email" required placeholder="Email" value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password" required placeholder="Password (min 6 chars)" value={password}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit" disabled={busy}
            className="w-full py-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-95 disabled:opacity-60 transition"
          >
            {busy ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError('') }}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
