import { useEffect, useState } from 'react'
import { fetchCodingProblems } from '../lib/codingProblems.js'

// Sidebar entry to practice coding. Always shown, so members can write their own code too.
export default function PracticeCard() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetchCodingProblems().then(list => setCount(list.length)).catch(() => setCount(0))
  }, [])

  return (
    <div className="px-4 pt-3 flex-shrink-0">
      <a
        href="/practice"
        className="flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition hover:border-blue-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Practice coding</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">{count > 0 ? `${count} problem${count === 1 ? '' : 's'} to solve, or write your own code` : 'Write your own code'}</span>
        </span>
        <span aria-hidden="true" className="text-lg text-blue-600 dark:text-blue-400">→</span>
      </a>
    </div>
  )
}
