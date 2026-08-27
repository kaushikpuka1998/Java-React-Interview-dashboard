import { useState, useRef, useEffect } from 'react'
import QuestionLink from './QuestionLink.jsx'
import { SearchInput, TechFilter, CategorySelect, StatusSelect, DifficultySelect, QuestionCount } from './SidebarFilters.jsx'

/**
 * Sidebar component
 */
export default function Sidebar({ questions, filtered, selectedId, query, setQuery, tech, setTech, category, setCategory, difficulty, setDifficulty, status, setStatus, onSelect, onToggleDark, isDark, isMobile = false, sidebarWidth = 360, questionListRef, hasMore, onLoadMore, loading, visited, read, categories, user, onLoginClick, onLogout, onAdminClick, freeTechs = [], onLockedTech }) {
  const [filtersOpen, setFiltersOpen] = useState(!isMobile) // closed on mobile by default
  const sentinelRef = useRef(null)
  // Fallback ref so the mobile instance (which isn't given a questionListRef) still works
  const internalListRef = useRef(null)
  const listRef = questionListRef || internalListRef

  // ponytail: scroll-listener pagination — fires onLoadMore when within 200px of the bottom.
  // More reliable than IntersectionObserver, which is throttled/flaky on some mobile browsers.
  useEffect(() => {
    const el = listRef.current
    if (!hasMore || !el) return
    const onScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) onLoadMore()
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // in case the list is already short enough to show the bottom
    return () => el.removeEventListener('scroll', onScroll)
  }, [hasMore, onLoadMore, listRef])

  return (
    <aside
      className={`sidebar sidebar-responsive h-full flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 ${isMobile ? '' : 'hidden lg:flex'}`}
      style={{ width: `${sidebarWidth}px`, minWidth: '280px', maxWidth: '600px', flexShrink: 0 }}
    >
      <div className="brand p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="logo w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
              IR
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">Interview Reader</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{questions.length} Java, React, Node & SQL questions</p>
            </div>
          </div>
          <button
            onClick={onToggleDark}
            className="flex-shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle dark mode"
            aria-pressed={isDark}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Auth row: shows sign-in when logged out, account + logout when logged in */}
        <div className="mt-3 flex items-center justify-between gap-2">
          {user ? (
            <>
              <a href="/profile" className="flex items-center gap-2 min-w-0 hover:opacity-80" title="View your profile">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(user.name || user.email || '?').trim().charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 truncate hover:underline">{user.name || user.email}</span>
              </a>
              <div className="flex items-center gap-2 flex-shrink-0">
                {user.admin && (
                  <button
                    onClick={onAdminClick}
                    title="Open the admin dashboard"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" />
                    </svg>
                    Admin
                  </button>
                )}
                <button onClick={onLogout} className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                  Log out
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="w-full py-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow hover:opacity-95 transition"
            >
              Log in / Sign up
            </button>
          )}
        </div>
      </div>

      {/* Search always visible */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <SearchInput value={query} onChange={setQuery} placeholder="Search questions... (try '352' or 'Q352' for direct number lookup)" />
      </div>

      {/* Collapsible filters on mobile */}
      {isMobile ? (
        <div className="border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            aria-expanded={filtersOpen}
            aria-controls="mobile-filters"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </span>
            <svg className={`w-4 h-4 text-slate-500 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div id="mobile-filters" className={`${filtersOpen ? 'block' : 'hidden'}`}>
            <div className="p-4 space-y-4">
              <TechFilter value={tech} onChange={setTech} locked={!user} freeTechs={freeTechs} onLockedClick={onLockedTech} />
              <CategorySelect
                value={category}
                onChange={setCategory}
                options={categories}
                disabled={tech === 'all' && categories.length > 50}
              />
              <DifficultySelect
                value={difficulty}
                onChange={setDifficulty}
                questions={questions}
                tech={tech}
              />
              {user && <StatusSelect value={status} onChange={setStatus} />}
              <QuestionCount count={filtered.length} total={questions.length} />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <TechFilter value={tech} onChange={setTech} locked={!user} freeTechs={freeTechs} onLockedClick={onLockedTech} />
          <CategorySelect
            value={category}
            onChange={setCategory}
            options={categories}
            disabled={tech === 'all' && categories.length > 50}
          />
          <DifficultySelect
            value={difficulty}
            onChange={setDifficulty}
            questions={questions}
            tech={tech}
          />
          {user && <StatusSelect value={status} onChange={setStatus} />}
          <QuestionCount count={filtered.length} total={questions.length} />
        </div>
      )}

      <nav ref={listRef} className="question-list flex-1 overflow-y-auto p-2 space-y-1.5" aria-label="Question list">
        {loading && filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
            Loading questions…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No questions match your filters</p>
          </div>
        ) : (
          <>
            {filtered.map(q => (
              <QuestionLink
                key={q.id}
                question={q}
                isActive={selectedId === q.id}
                onClick={() => onSelect(q.id)}
                selectedId={selectedId}
                visited={visited}
                read={read}
              />
            ))}
            {hasMore && (
              <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                Loading more…
              </div>
            )}
          </>
        )}
      </nav>
    </aside>
  )
}
