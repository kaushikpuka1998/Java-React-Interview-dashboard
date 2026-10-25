import { useState } from 'react'
import { login, register, checkUsername } from '../lib/auth.js'
import TermsContent from './TermsContent.jsx'

// Login / signup modal. Calls onSuccess(user) after a successful auth.
export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [username, setUsername] = useState('')
  const [nameStatus, setNameStatus] = useState(null)   // null | { available, error }
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)     // sign-up: Terms and Privacy accepted
  const [showTerms, setShowTerms] = useState(false)

  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (isSignup && !agreed) {
      setError('Please accept the Terms and Privacy notice to create an account.')
      return
    }
    setBusy(true)
    try {
      if (isForgot) {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to send reset link')
        setSuccess(data.message)
      } else {
        const user = isSignup
          ? await register({ email, password, name, country, city, username, termsAccepted: agreed })
          : await login({ email, password })
        onSuccess(user)
      }
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
            {isForgot ? 'Reset password' : isSignup ? 'Create account' : 'Welcome back'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isSignup && (
            <input
              type="text" placeholder="Username (optional, for your public link)" value={username}
              onChange={(e) => { setUsername(e.target.value); setNameStatus(null) }}
              onBlur={() => username.trim() && checkUsername(username.trim()).then(setNameStatus).catch(() => {})}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {isSignup && nameStatus && (
            <p className={`-mt-2 text-xs ${nameStatus.available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {nameStatus.available ? `interviewreader.com/u/${nameStatus.username} is free` : (nameStatus.error || 'That username is taken')}
            </p>
          )}
          {isSignup && (
            <input
              type="text" placeholder="Name (optional)" value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {isSignup && (
            <div className="flex gap-2">
              <input
                type="text" required placeholder="Country" value={country} autoComplete="country-name"
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text" required placeholder="City" value={city} autoComplete="address-level2"
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <input
            type="email" required placeholder="Email" value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!isForgot && (
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} required placeholder="Password (min 6 chars)" value={password}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.7 9.7 0 0112 5c5 0 8.3 4.3 9.5 7a10.6 10.6 0 01-2.2 3.3M6.6 6.6A10.6 10.6 0 002.5 12c1.2 2.7 4.5 7 9.5 7 1.7 0 3.2-.5 4.5-1.2" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S5.8 5 12 5s9.5 7 9.5 7-3.3 7-9.5 7S2.5 12 2.5 12z" />
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          )}

          {isSignup && (
            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setError('') }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  I agree to the Terms and how my data is used.{' '}
                  <button type="button" onClick={() => setShowTerms(v => !v)} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    {showTerms ? 'Hide terms' : 'Read terms'}
                  </button>
                </span>
              </label>
              {showTerms && (
                <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <TermsContent />
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

          <button
            type="submit" disabled={busy || (isSignup && !agreed)}
            className="w-full py-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-95 disabled:opacity-60 transition"
          >
            {busy ? 'Please wait…' : isForgot ? 'Send reset link' : isSignup ? 'Sign up' : 'Log in'}
          </button>
        </form>

        {!isForgot && (
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); setSuccess('') }}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </p>
        )}

        {mode === 'login' && (
          <div className="mt-2 text-center">
            <button onClick={() => { setMode('forgot'); setError(''); setSuccess('') }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Forgot password?
            </button>
          </div>
        )}

        {isForgot && (
          <div className="mt-4 text-center">
            <button onClick={() => { setMode('login'); setError(''); setSuccess('') }} className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
              ← Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
