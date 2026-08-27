import { useState, useEffect, useRef } from 'react'
import Markdown from './Markdown.jsx'
import NotFound from './NotFound.jsx'
import OnThisPage from './OnThisPage.jsx'
import AskedAt from './AskedAt.jsx'
import { isLoggedIn } from '../lib/auth.js'
import { techBadge, difficultyBadge, techLabel } from '../lib/badges.js'

/**
 * Inline-editable question position: click the number, type a new one, press Enter to jump.
 */
function JumpToQuestion({ current, total, onJump }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(current))

  // Keep the shown value in sync when navigating by other means.
  useEffect(() => { setVal(String(current)) }, [current])

  const commit = () => {
    setEditing(false)
    const n = parseInt(val, 10)
    if (Number.isNaN(n)) { setVal(String(current)); return }
    onJump(Math.min(Math.max(n, 1), total))
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-400/60 dark:ring-blue-500/50 px-2 py-0.5 align-middle shadow-sm">
        <input
          autoFocus
          type="number"
          min={1}
          max={total}
          value={val}
          onChange={e => setVal(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setVal(String(current)); setEditing(false) }
          }}
          className="jump-input w-10 text-center bg-transparent font-semibold text-blue-700 dark:text-blue-300 focus:outline-none tabular-nums"
          aria-label="Jump to question number"
        />
        <button
          type="button"
          /* commit on pointer-down: fires before the input's blur, so one tap works */
          onPointerDown={e => { e.preventDefault(); commit() }}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          aria-label="Go to question"
          title="Go"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group inline-flex items-center gap-1 rounded-full px-2 py-0.5 align-middle font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors tabular-nums"
      title="Click to jump to a question"
    >
      {current}
      <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  )
}

/**
 * Reader pane component
 */
export default function ReaderPane({ question, questions, onNavigate, visited, read, onMarkRead }) {
  const scrollRef = useRef(null)   // the scrolling column; the section rail reads it

  if (!question) {
    return (
      <main className="reader flex-1 flex items-center justify-center bg-white dark:bg-slate-800 min-w-0">
        <NotFound />
      </main>
    )
  }

  const selectedIndex = questions.findIndex(q => q.id === question.id)
  const prev = questions[selectedIndex - 1]
  const next = questions[selectedIndex + 1]

  return (
    <main className="reader flex-1 h-screen overflow-hidden bg-white dark:bg-slate-800 flex flex-col min-w-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8 min-w-0">
      {/* Article plus the section rail; the rail only appears on xl and wider. */}
      <div className="mx-auto w-full max-w-3xl xl:max-w-[56rem] flex gap-6 items-start min-w-0">
      <article className="paper flex-1 min-w-0 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15),0_0_20px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5),0_0_20px_rgba(0,0,0,0.3)] p-4 sm:p-6 lg:p-8">
        {/* Mobile top navigation - Previous/Next at top on mobile */}
        <div className="lg:hidden mb-4 flex items-center justify-between px-2">
          <button
            disabled={!prev}
            onClick={() => onNavigate(prev.id)}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            aria-label="Previous question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Previous</span>
          </button>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex-1 text-center px-2">
            <JumpToQuestion current={selectedIndex + 1} total={questions.length} onJump={n => onNavigate(questions[n - 1].id)} /> / {questions.length}
          </div>
          <button
            disabled={!next}
            onClick={() => onNavigate(next.id)}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            aria-label="Next question"
          >
            <span className="hidden sm:inline">Next</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <header className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="badges flex items-center justify-between mb-4 px-0.5">
            <span className={`badge px-3 py-1 text-xs font-medium rounded-full ${techBadge(question.tech)}`}>
              {techLabel(question.tech)}
            </span>
            <span className="badge px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {question.category}
            </span>
            <span className={`badge px-3 py-1 text-xs font-medium rounded-full ${difficultyBadge(question.difficulty)}`}>
              {question.difficulty}
            </span>
          </div>
          <h2 className="question-title text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Q{question.displayNumber}. {question.question}
          </h2>

          {/* Read status and Mark as Read button — signed-in only */}
          {isLoggedIn() && <div className="mt-4 flex items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-sm">
              {read.has(question.id) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Marked as read
                </span>
              )}
              {visited.has(question.id) && !read.has(question.id) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Visited
                </span>
              )}
            </div>
            <div className="flex-shrink-0 ml-auto">
              {!read.has(question.id) && (
                <button
                  onClick={() => onMarkRead(question.id)}
                  className="btn-read p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  aria-label="Mark as read"
                  title="Mark as read"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              {read.has(question.id) && (
                <span className="p-2 text-emerald-600 dark:text-emerald-400" aria-label="Read" title="Marked as read">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
          </div>}

          {/* Which companies have asked this question */}
          <AskedAt questionId={question.id} />
        </header>

        <div className="answer-content">
          <Markdown text={question.answer} />
        </div>
      </article>

      <OnThisPage text={question.answer} scrollRef={scrollRef} />
      </div>
      </div>

      {/* Desktop bottom navigation */}
      <footer className="hidden lg:block pager flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
        <div className="max-w-3xl mx-auto w-full px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            disabled={!prev}
            onClick={() => onNavigate(prev.id)}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="text-sm text-slate-500 dark:text-slate-400">
            Question <JumpToQuestion current={selectedIndex + 1} total={questions.length} onJump={n => onNavigate(questions[n - 1].id)} /> of {questions.length}
          </div>

          <button
            disabled={!next}
            onClick={() => onNavigate(next.id)}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </footer>
    </main>
  )
}
