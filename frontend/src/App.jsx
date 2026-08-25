import { useState, useCallback, useRef, useEffect } from 'react'
import { PAGE, fetchQuestions, fetchCategories, fetchStats } from './lib/api.js'
import { slugify } from './lib/slug.js'
import Sidebar from './components/Sidebar.jsx'
import ReaderPane from './components/ReaderPane.jsx'
import { MobileMenuButton, MobileSidebar } from './components/MobileSidebar.jsx'
import AuthModal from './components/AuthModal.jsx'
import { getUser, isLoggedIn, logout as authLogout, fetchProgress, mergeProgress, markVisitedRemote, markReadRemote } from './lib/auth.js'

function App({ path = '/', onPathChange = () => {} }) {
  const [questionsData, setQuestionsData] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [tech, setTech] = useState('all')
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [status, setStatus] = useState('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const theme = localStorage.getItem('theme')
      if (theme) return theme === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const [sidebarWidth, setSidebarWidth] = useState(360)
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Visited/read are per-user and server-authoritative. Empty until the account's
  // progress loads; guests (not logged in) have no persisted status.
  const [visited, setVisited] = useState(() => new Set())
  const [read, setRead] = useState(() => new Set())

  // Auth state
  const [user, setUser] = useState(() => getUser())
  const [authOpen, setAuthOpen] = useState(false)

  // On login: merge any status the user clicked this session (pre-login) into the
  // account, then load the account's authoritative progress.
  const handleAuthSuccess = useCallback(async (u) => {
    setUser({ email: u.email, name: u.name })
    setAuthOpen(false)
    try {
      await mergeProgress({ visited: Array.from(visitedRef.current), read: Array.from(readRef.current) })
      const { visited: v, read: r } = await fetchProgress()
      setVisited(new Set(v)); setRead(new Set(r))
    } catch (e) { console.error('Failed to sync progress:', e) }
  }, [])

  const handleLogout = useCallback(() => {
    authLogout()
    setUser(null)
    setVisited(new Set()); setRead(new Set())
  }, [])

  // If already logged in on load, pull the account's progress from the server.
  useEffect(() => {
    if (isLoggedIn()) {
      fetchProgress().then(({ visited: v, read: r }) => {
        setVisited(new Set(v)); setRead(new Set(r))
      }).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refs for current visited/read to avoid re-fetching on click
  const visitedRef = useRef(visited)
  const readRef = useRef(read)
  visitedRef.current = visited
  readRef.current = read

  // Refs mirror pagination state so the scroll handler always reads fresh values
  // (avoids stale-closure double-loads of the same page)
  const pageRef = useRef(0)
  const hasMoreRef = useRef(false)
  const loadingRef = useRef(false)
  pageRef.current = page
  hasMoreRef.current = hasMore

  // Load questions from backend API
  const loadQuestionsFromAPI = useCallback(async (pageToLoad, append) => {
    loadingRef.current = true
    setIsLoading(true)
    try {
      const data = await fetchQuestions({
        tech: tech === 'all' ? undefined : tech,
        category: category === 'all' ? undefined : category,
        difficulty: difficulty === 'all' ? undefined : difficulty,
        search: query || undefined,
        status: status === 'all' ? undefined : status,
        visitedIds: Array.from(visitedRef.current),
        readIds: Array.from(readRef.current),
        page: pageToLoad,
        size: PAGE
      })
      setQuestionsData(prev => append ? [...prev, ...data.content] : data.content)
      // Update refs synchronously so a scroll firing before re-render sees the new page
      pageRef.current = data.number
      hasMoreRef.current = data.totalPages > data.number + 1
      setPage(data.number)
      setTotalCount(data.totalElements)
      setHasMore(hasMoreRef.current)
    } catch (err) {
      console.error('Failed to load questions:', err)
    } finally {
      loadingRef.current = false
      setIsLoading(false)
      setLoaded(true)
    }
  }, [tech, category, difficulty, query, status])

  // Load page 0 fresh whenever filters change
  useEffect(() => {
    loadQuestionsFromAPI(0, false)
  }, [tech, category, difficulty, query, status])


  // Load categories when tech changes
  useEffect(() => {
    if (tech !== 'all') {
      fetchCategories(tech).then(setCategories).catch(() => setCategories([]))
    } else {
      setCategories([])
    }
  }, [tech])

  // Load stats
  useEffect(() => {
    fetchStats().then(stats => {
      // Stats available if needed
    }).catch(() => {})
  }, [])

  // Load more (pagination) — stable identity; reads fresh state from refs to avoid
  // stale-closure double-loads. Guards against concurrent loads.
  const handleLoadMore = useCallback(() => {
    if (loadingRef.current || !hasMoreRef.current) return
    loadQuestionsFromAPI(pageRef.current + 1, true)
  }, [loadQuestionsFromAPI])

  // Server handles all filtering/pagination — questionsData holds every loaded page
  const filtered = questionsData
  const effectiveHasMore = hasMore

  // URL routing: the path is a question slug. Resolve it against loaded questions.
  const slug = path === '/' ? '' : decodeURIComponent(path.replace(/^\/+/, ''))
  const byId = filtered.find(q => q.id === selectedId)
  const bySlug = slug ? questionsData.find(q => slugify(q.question || q.title) === slug) : null
  // Prefer the current selection, then the URL slug, then default to the first result.
  // Only null (=> reader 404) when there are genuinely no questions to show.
  const selected = byId || bySlug || filtered[0] || questionsData[0] || null

  // Keep selectedId in sync with what's actually shown — covers deep links (slug) and
  // filter changes (stale id -> first result), so the sidebar highlights the right item.
  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id)
  }, [selected?.id])

  // Sync (state -> URL bar): update the address on selection. pushState only — popstate
  // (in main.jsx) handles back/forward, so we never feed `path` back and loop.
  useEffect(() => {
    if (!selected) return
    const next = `/${slugify(selected.question || selected.title)}`
    if (next !== window.location.pathname) window.history.pushState({}, '', next)
  }, [selected?.id])

  const toggleDarkMode = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }, [])

  const questionListRef = useRef(null)

  const scrollToSelected = useCallback(() => {
    if (questionListRef.current) {
      const active = questionListRef.current.querySelector('[data-selected="true"]')
      if (active) {
        active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    }
  }, [])

  useEffect(() => {
    scrollToSelected()
  }, [selectedId, scrollToSelected])

  // Select a question, mark it visited, and close the mobile menu.
  const selectQuestion = useCallback((id) => {
    setSelectedId(id)
    setVisited(prev => {
      if (!prev.has(id)) {
        const next = new Set(prev)
        next.add(id)
        if (isLoggedIn()) markVisitedRemote(id).catch(() => {})
        return next
      }
      return prev
    })
    setMobileMenuOpen(false)
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const handleSelect = selectQuestion
  const handleNavigate = selectQuestion

  const handleMarkRead = useCallback((id) => {
    setRead(prev => {
      const next = new Set(prev)
      next.add(id)
      if (isLoggedIn()) markReadRemote(id).catch(() => {})
      return next
    })
    // Also mark as visited if not already (markRead on the server already implies visited)
    setVisited(prev => {
      if (!prev.has(id)) {
        const next = new Set(prev)
        next.add(id)
        return next
      }
      return prev
    })
  }, [])

  const handleTechChange = useCallback((value) => {
    setTech(value)
    setCategory('all')
  }, [])

  // Resizable divider logic
  const handleDividerMouseDown = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const newWidth = Math.min(Math.max(startWidth + deltaX, 280), 600)
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [sidebarWidth])

  // Shared props for both the desktop and mobile sidebar instances.
  const sidebarProps = {
    questions: questionsData,
    filtered,
    hasMore: effectiveHasMore,
    onLoadMore: handleLoadMore,
    loading: isLoading,
    selectedId,
    query,
    setQuery,
    tech,
    setTech: handleTechChange,
    category,
    setCategory,
    difficulty,
    setDifficulty,
    status,
    setStatus,
    onSelect: handleSelect,
    onToggleDark: toggleDarkMode,
    isDark,
    visited,
    read,
    categories,
    user,
    onLoginClick: () => setAuthOpen(true),
    onLogout: handleLogout,
  }

  return (
    <div className="app-shell h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 flex">
      <Sidebar {...sidebarProps} sidebarWidth={sidebarWidth} questionListRef={questionListRef} />

      {/* Mobile sidebar spacer - pushes content when menu open */}
      {mobileMenuOpen && <div className="lg:hidden w-80 max-w-[85vw]" aria-hidden="true" />}

      <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} {...sidebarProps} />

      <MobileMenuButton isOpen={mobileMenuOpen} onToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Resizable divider - desktop only, single neutral color */}
      <div
        className="hidden lg:block w-1 cursor-col-resize bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors flex-shrink-0 select-none"
        onMouseDown={handleDividerMouseDown}
        role="separator"
        aria-label="Resize sidebar"
        aria-orientation="vertical"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            setSidebarWidth(prev => Math.max(prev - 20, 280))
          } else if (e.key === 'ArrowRight') {
            setSidebarWidth(prev => Math.min(prev + 20, 600))
          }
        }}
      />

      <ReaderPane
        question={selected}
        questions={filtered}
        onNavigate={handleNavigate}
        visited={visited}
        read={read}
        onMarkRead={handleMarkRead}
      />

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} />}
    </div>
  )
}

export default App
