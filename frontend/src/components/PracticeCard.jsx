import { useEffect, useState } from 'react'
import { fetchCodingProblems, newProblemCount } from '../lib/codingProblems.js'
import { useFeature } from '../lib/features.js'

// Sidebar entry to practice coding. Always shown, so members can write their own code too.
export default function PracticeCard() {
  const [count, setCount] = useState(0)
  const [newCount, setNewCount] = useState(0)
  const practiceOn = useFeature('code_practice')

  useEffect(() => {
    fetchCodingProblems().then(list => { setCount(list.length); setNewCount(newProblemCount(list)) }).catch(() => setCount(0))
  }, [])

  if (!practiceOn) return null

  return (
    <div className="px-4 pt-3 flex-shrink-0">
      <a
        href="/practice"
        className="relative flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-3 text-white shadow-md shadow-teal-500/20 transition hover:brightness-110"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Practice coding</span>
          <span className="block text-xs text-white/85">{newCount > 0 ? `${newCount} new problem${newCount === 1 ? '' : 's'} this week, or write your own code` : count > 0 ? `${count} problem${count === 1 ? '' : 's'} to solve, or write your own code` : 'Write your own code'}</span>
        </span>
        <span aria-hidden="true" className="text-lg">→</span>
        {newCount > 0 && <span
          role="img"
          aria-label="New problems are coming"
          data-tip="New problems are coming"
          className="tip tip-end absolute -right-1.5 -top-1.5 flex h-6 w-6 animate-[pulse_1.5s_ease-in-out_3] items-center justify-center rounded-full bg-amber-400 text-white shadow-md shadow-amber-500/40"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.5l7.1-.6z" /></svg>
        </span>}
      </a>
    </div>
  )
}
