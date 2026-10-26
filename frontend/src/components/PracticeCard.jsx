import { useEffect, useState } from 'react'
import { fetchCodingProblems } from '../lib/codingProblems.js'
import { useFeature } from '../lib/features.js'

// Sidebar entry to practice coding. Always shown, so members can write their own code too.
export default function PracticeCard() {
  const [count, setCount] = useState(0)
  const practiceOn = useFeature('code_practice')

  useEffect(() => {
    fetchCodingProblems().then(list => setCount(list.length)).catch(() => setCount(0))
  }, [])

  if (!practiceOn) return null

  return (
    <div className="px-4 pt-3 flex-shrink-0">
      <a
        href="/practice"
        className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-3 text-white shadow-md shadow-teal-500/20 transition hover:brightness-110"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Practice coding</span>
          <span className="block text-xs text-white/85">{count > 0 ? `${count} problem${count === 1 ? '' : 's'} to solve, or write your own code` : 'Write your own code'}</span>
        </span>
        <span aria-hidden="true" className="text-lg">→</span>
      </a>
    </div>
  )
}
