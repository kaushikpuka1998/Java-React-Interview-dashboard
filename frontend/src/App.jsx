import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import NotFound from './components/NotFound.jsx'

const PAGE = 50
const STORAGE_KEY_VISITED = 'ir_visited_questions'
const STORAGE_KEY_READ = 'ir_read_questions'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8082/api'

// URL slug from a question's text, e.g. "What are the four..." -> "what-are-the-four-..."
const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

// Backend API integration
async function fetchQuestions({ tech, category, difficulty, search, status, visitedIds, readIds, page = 0, size = PAGE }) {
  // Always send IDs when status filter is active for correct pagination
  const shouldSendIds = status && status !== 'all'

  const params = new URLSearchParams()
  if (tech && tech !== 'all') params.set('tech', tech)
  if (category && category !== 'all') params.set('category', category)
  if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty)
  if (search) params.set('search', search)
  if (status && status !== 'all') params.set('status', status)
  if (shouldSendIds && visitedIds && visitedIds.length > 0) params.set('visitedIds', visitedIds.join(','))
  if (shouldSendIds && readIds && readIds.length > 0) params.set('readIds', readIds.join(','))
  params.set('page', page)
  params.set('size', size)
  const res = await fetch(`${API_BASE}/questions?${params}`)
  if (!res.ok) throw new Error('Failed to fetch questions')
  return res.json()
}

async function fetchCategories(tech) {
  const res = await fetch(`${API_BASE}/questions/categories?tech=${tech}`)
  if (!res.ok) return []
  return res.json()
}

async function fetchStats() {
  const res = await fetch(`${API_BASE}/questions/stats`)
  if (!res.ok) return { total: 0, byTech: {} }
  return res.json()
}

// Visited/Read tracking utilities
function loadVisited() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_VISITED) || '[]')) } catch { return new Set() }
}
function loadRead() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_READ) || '[]')) } catch { return new Set() }
}
function saveVisited(set) { localStorage.setItem(STORAGE_KEY_VISITED, JSON.stringify([...set])) }
function saveRead(set) { localStorage.setItem(STORAGE_KEY_READ, JSON.stringify([...set])) }

/**
 * Markdown renderer with support for:
 * - Headers (h1-h3)
 * - Code blocks with language
 * - Inline code
 * - Bold/italic
 * - Lists (unordered)
 * - Tables
 * - Blockquotes
 */
function Markdown({ text }) {
  const parts = String(text || '').split(/```(\w+)?\n([\s\S]*?)```/g)

  return (
    <div className="markdown prose prose-slate dark:prose-invert max-w-none">
      {parts.map((part, index) => {
        if (index % 3 === 2) {
          return (
            <pre key={index} className="bg-slate-900 rounded-lg p-3 sm:p-4 text-[12px] sm:text-sm overflow-x-auto max-w-full -mx-4 sm:mx-0 border border-slate-700/50">
              <code className="text-slate-100 leading-relaxed font-mono whitespace-pre">{highlightCode(part.trim())}</code>
            </pre>
          )
        }
        if (index % 3 === 1) return null

        const lines = part.split('\n')
        const out = []
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex]
          const key = `${index}-${lineIndex}`

          // Images: ![alt](src "optional title")
          const imgMatch = line.match(/!\[([^\]]*)\]\(([^)"\s]+)(?:\s+"([^"]*)")?\)/)
          if (imgMatch) {
            const [, alt, src, title] = imgMatch
            out.push(
              <div key={key} className="my-4">
                <img
                  src={src}
                  alt={alt}
                  title={title}
                  className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700"
                  loading="lazy"
                />
                {alt && <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">{alt}</p>}
              </div>
            )
            continue
          }

          // Group consecutive pipe lines into one table (skip the |---| separator)
          const isRow = (l) => l && l.includes('|') && l.split('|').map(c => c.trim()).filter(Boolean).length > 1
          const isSep = (l) => l && /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(l) && l.includes('-')
          if (isRow(line)) {
            const rows = []
            let j = lineIndex
            while (j < lines.length && (isRow(lines[j]) || isSep(lines[j]))) {
              if (!isSep(lines[j])) rows.push(lines[j].split('|').map(c => c.trim()).filter((c, i, a) => !(c === '' && (i === 0 || i === a.length - 1))))
              j++
            }
            const [head, ...body] = rows
            out.push(
              <div key={key} className="overflow-x-auto my-4 -mx-4 sm:mx-0 rounded-lg border border-slate-200 dark:border-slate-700 max-w-full">
                <table className="min-w-full text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      {head.map((cell, ci) => (
                        <th key={ci} className="px-3 sm:px-4 py-2 sm:py-2.5 text-left font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">{formatInline(cell)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((cells, ri) => (
                      <tr key={ri} className="even:bg-slate-50 dark:even:bg-slate-800/40">
                        {cells.map((cell, ci) => (
                          <td key={ci} className="px-3 sm:px-4 py-2 sm:py-2.5 align-top text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">{formatInline(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
            lineIndex = j - 1
            continue
          }

          if (line.trim() === '```') continue // orphan/empty code fence from source data
          if (!line.trim()) { out.push(<br key={key} />); continue }
          if (line.startsWith('### ')) { out.push(<h3 key={key} className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2">{line.slice(4)}</h3>); continue }
          if (line.startsWith('## ')) { out.push(<h2 key={key} className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-6 mb-3">{line.slice(3)}</h2>); continue }
          if (line.startsWith('# ')) { out.push(<h1 key={key} className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-6 mb-4">{line.slice(2)}</h1>); continue }
          if (line.startsWith('> ')) { out.push(<blockquote key={key} className="border-l-4 border-blue-500 pl-4 italic text-slate-700 dark:text-slate-300 my-3">{line.slice(2)}</blockquote>); continue }
          if (line.startsWith('- ') || line.startsWith('* ')) { out.push(<li key={key} className="ml-6 list-disc text-slate-700 dark:text-slate-300 leading-relaxed">{formatInline(line.slice(2))}</li>); continue }
          if (line.match(/^\d+\.\s/)) { out.push(<li key={key} className="ml-6 list-decimal text-slate-700 dark:text-slate-300 leading-relaxed">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>); continue }
          out.push(<p key={key} className="text-slate-700 dark:text-slate-300 leading-relaxed my-2">{formatInline(line)}</p>)
        }
        return out
      })}
    </div>
  )
}

// ponytail: regex tokenizer, covers Java/JS/TS well enough; swap for Shiki if more langs needed
const KEYWORDS = new Set('abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var let function async await yield typeof instanceof of in delete null true false undefined NaN'.split(' '))

function highlightCode(code) {
  // token regex: comments | strings | numbers | annotations | identifiers | other
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(@\w+)|(\b\d[\d.xXa-fA-F_]*\b)|(\b[A-Za-z_$][\w$]*\b)/g
  const out = []
  let last = 0, m, k = 0
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index))
    const key = k++
    if (m[1]) out.push(<span key={key} className="text-slate-500 italic">{m[1]}</span>)
    else if (m[2]) out.push(<span key={key} className="text-emerald-400">{m[2]}</span>)
    else if (m[3]) out.push(<span key={key} className="text-amber-400">{m[3]}</span>)
    else if (m[4]) out.push(<span key={key} className="text-orange-400">{m[4]}</span>)
    else if (m[5]) {
      const w = m[5]
      if (KEYWORDS.has(w)) out.push(<span key={key} className="text-purple-400 font-medium">{w}</span>)
      else if (/^[A-Z]/.test(w)) out.push(<span key={key} className="text-cyan-300">{w}</span>)
      else if (code[re.lastIndex] === '(') out.push(<span key={key} className="text-blue-400">{w}</span>)
      else out.push(w)
    }
    last = re.lastIndex
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

function formatInline(line) {
  const chunks = line.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~)/g)
  return chunks.map((chunk, index) => {
    if (chunk.startsWith('`') && chunk.endsWith('`')) return <code key={index} className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-slate-900 dark:text-slate-100">{chunk.slice(1, -1)}</code>
    if (chunk.startsWith('**') && chunk.endsWith('**')) return <strong key={index} className="font-semibold text-slate-900 dark:text-slate-100">{chunk.slice(2, -2)}</strong>
    if (chunk.startsWith('*') && chunk.endsWith('*')) return <em key={index} className="italic text-slate-700 dark:text-slate-300">{chunk.slice(1, -1)}</em>
    if (chunk.startsWith('~~') && chunk.endsWith('~~')) return <del key={index} className="line-through text-slate-500 dark:text-slate-400">{chunk.slice(2, -2)}</del>
    return <span key={index}>{chunk}</span>
  })
}

/**
 * Question item in sidebar - polished, professional design
 */
function QuestionLink({ question, isActive, onClick, selectedId, visited, read }) {
  // Tech badge colors - consistent with TechFilter
  const techStyles = {
    hld: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
    java: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
    react: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400',
    node: 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    sql: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    microservices: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
    'design-patterns': 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    kafka: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
    default: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  }

  // Difficulty badge colors - softer, more refined
  const diffStyles = {
    Basic: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    Intermediate: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    Advanced: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    Experienced: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
    default: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
  }

  const techLabel = question.tech === 'design-patterns' ? 'Design Patterns' :
                    question.tech === 'hld' ? 'HLD' :
                    question.tech.charAt(0).toUpperCase() + question.tech.slice(1)

  return (
    <button
      data-selected={isActive}
      className={`question-link relative w-full text-left pl-2 pr-3 py-2.5 rounded-xl transition-all duration-200 ease-out group
        border border-transparent
        ${
          isActive
            ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 text-slate-900 dark:text-slate-100 shadow-[0_0_0_1px_rgba(59,130,246,0.3)] dark:shadow-[0_0_0_1px_rgba(59,130,246,0.2)]'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-100 dark:hover:border-slate-800'
        }
        ${
          isActive
            ? 'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-7 before:bg-blue-500 before:rounded-r-full'
            : ''
        }`}
      onClick={onClick}
      style={{ transformOrigin: 'left center' }}
    >
      {/* Subtle hover lift effect */}
      <div className="relative flex items-start gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
        {/* Badge stack on the left - tech type above, difficulty below */}
        <div className="flex flex-col gap-1 flex-shrink-0 items-start w-20">
          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded tracking-wide ${techStyles[question.tech] || techStyles.default}`} style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            {techLabel}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded ${diffStyles[question.difficulty] || diffStyles.default}`}>
            {question.difficulty}
          </span>
        </div>

        {/* Question number - fixed width for alignment */}
        <span className="qnum flex-shrink-0 w-12 text-right text-[11px] font-mono font-semibold text-slate-400 dark:text-slate-500 leading-none mt-0.5 pr-2">
          Q{question.displayNumber}.
        </span>

        {/* Question text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug text-slate-900 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors duration-150 pr-10" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {question.question}
          </p>
        </div>
      </div>

      {/* Visited/Read indicators - fixed right side */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {read.has(question.id) && (
            <span className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded" title="Read" aria-label="Read">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          {visited.has(question.id) && !read.has(question.id) && (
            <span className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded" title="Visited" aria-label="Visited">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
      </div>
      </button>
  )
}

/**
 * Search input with clear button
 */
function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        className="search w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Search questions"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          aria-label="Clear search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

/**
 * Tech filter segmented control - colorful icons per technology
 */
function TechFilter({ value, onChange }) {
  const options = [
    {
      value: 'all', label: 'All',
      active: 'bg-blue-500 text-white shadow-sm shadow-blue-500/30',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    },
    {
      value: 'java', label: 'Java',
      active: 'bg-orange-500 text-white shadow-sm shadow-orange-500/30',
      // Coffee cup with steam (Java)
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>,
    },
    {
      value: 'hld', label: 'HLD',
      active: 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30',
      // architecture/sitemap icon
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    },
    {
      value: 'react', label: 'React',
      active: 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/30',
      // React atom logo
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/><ellipse cx="12" cy="12" rx="9" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5"/><ellipse cx="12" cy="12" rx="9" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)"/></svg>,
    },
    {
      value: 'node', label: 'Node',
      active: 'bg-green-500 text-white shadow-sm shadow-green-500/30',
      // Node.js hexagon logo
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.5 3.75v8.64L12 21.82 4.5 18.07v-8.64L12 4.18zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>,
    },
    {
      value: 'sql', label: 'SQL',
      active: 'bg-purple-500 text-white shadow-sm shadow-purple-500/30',
      // database cylinder (SQL)
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-4.42 0-8 1.34-8 3v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5c0-1.66-3.58-3-8-3zm6 17c0 .3-2.13 1.5-6 1.5S6 19.3 6 19v-2.23c1.5.77 3.72 1.23 6 1.23s4.5-.46 6-1.23V19zm0-4.5c0 .3-2.13 1.5-6 1.5s-6-1.2-6-1.5v-2.23c1.5.77 3.72 1.23 6 1.23s4.5-.46 6-1.23v2.23zM12 8.5C8.13 8.5 6 7.3 6 7s2.13-1.5 6-1.5S18 6.7 18 7s-2.13 1.5-6 1.5z"/></svg>,
    },
    {
      value: 'microservices', label: 'Microservices',
      active: 'bg-rose-500 text-white shadow-sm shadow-rose-500/30',
      // connected nodes (microservices)
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a3 3 0 00-1 5.83V10H7a3 3 0 00-3 3v1.17a3 3 0 101.99.01V13a1 1 0 011-1h10a1 1 0 011 1v1.18A3 3 0 1020 14.17V13a3 3 0 00-3-3h-4V7.83A3 3 0 0012 2z"/></svg>,
    },
    {
      value: 'kafka', label: 'Kafka',
      active: 'bg-slate-700 text-white shadow-sm shadow-slate-700/30',
      // Kafka logo - streaming platform
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>,
    },
    {
      value: 'design-patterns', label: 'Design Pattern',
      active: 'bg-amber-500 text-white shadow-sm shadow-amber-500/30',
      // puzzle piece (design patterns)
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.5 11H19V7a2 2 0 00-2-2h-4V3.5a2.5 2.5 0 00-5 0V5H4a2 2 0 00-2 2v3.8h1.5a2.2 2.2 0 010 4.4H2V19a2 2 0 002 2h3.8v-1.5a2.2 2.2 0 014.4 0V21H17a2 2 0 002-2v-4h1.5a2.5 2.5 0 000-5z"/></svg>,
    },
  ]

  return (
    <div className="segmented grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-lg" role="group" aria-label="Filter by technology">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`w-full min-w-0 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
            value === opt.value
              ? opt.active
              : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
          }`}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          title={opt.label}
        >
          {opt.icon}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Category dropdown - enhanced UI
 */
function CategorySelect({ value, onChange, options, disabled }) {
  if (disabled || options.length === 0) return null

  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
      </svg>
      <select
        className="select w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer appearance-none"
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Filter by category"
      >
        <option value="all">All categories</option>
        {options.map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8l4 4 4-4" />
      </svg>
    </div>
  )
}

/**
 * Status filter - All / Visited / Solved / Unread
 */
function StatusSelect({ value, onChange }) {
  const options = [
    { value: 'all', label: 'All' },
    { value: 'visited', label: 'Visited' },
    { value: 'solved', label: 'Solved' },
    { value: 'unsolved', label: 'Unsolved' },
  ]

  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <select
        className="select w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer appearance-none"
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Filter by status"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8l4 4 4-4" />
      </svg>
    </div>
  )
}

/**
 * Difficulty filter dropdown - enhanced UI (uses actual data difficulties)
 */
function DifficultySelect({ value, onChange, questions, tech }) {
  // Get unique difficulties from filtered questions
  const allDifficulties = ['Basic', 'Intermediate', 'Advanced', 'Experienced']
  const difficulties = useMemo(() => {
    const techQuestions = questions.filter(q => tech === 'all' || q.tech === tech)
    const found = new Set(techQuestions.map(q => q.difficulty))
    return allDifficulties.filter(d => found.has(d))
  }, [questions, tech])

  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <select
        className="select w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer appearance-none"
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Filter by difficulty"
      >
        <option value="all">All difficulties</option>
        {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8l4 4 4-4" />
      </svg>
    </div>
  )
}

/**
 * Question count display
 */
function QuestionCount({ count, total }) {
  return (
    <div className="count text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
      <span>{count} of {total} questions</span>
    </div>
  )
}

/**
 * Sidebar component
 */
function Sidebar({ questions, filtered, selectedId, query, setQuery, tech, setTech, category, setCategory, difficulty, setDifficulty, status, setStatus, onSelect, onToggleDark, isDark, isMobile = false, sidebarWidth = 360, questionListRef, hasMore, onLoadMore, loading, visited, read, categories }) {
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
              <TechFilter value={tech} onChange={setTech} />
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
              <StatusSelect value={status} onChange={setStatus} />
              <QuestionCount count={filtered.length} total={questions.length} />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <TechFilter value={tech} onChange={setTech} />
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
          <StatusSelect value={status} onChange={setStatus} />
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

/**
 * Reader pane component
 */
function ReaderPane({ question, questions, onNavigate, visited, read, onMarkRead }) {
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
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8 min-w-0">
      <article className="paper max-w-3xl mx-auto w-full min-w-0 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15),0_0_20px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5),0_0_20px_rgba(0,0,0,0.3)] p-4 sm:p-6 lg:p-8">
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
            {selectedIndex + 1} / {questions.length}
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
            <span className={`badge px-3 py-1 text-xs font-medium rounded-full ${
              question.tech === 'hld'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : question.tech === 'java'
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                : question.tech === 'node'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : question.tech === 'sql'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : question.tech === 'microservices'
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                : question.tech === 'design-patterns'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                : question.tech === 'kafka'
                ? 'bg-slate-200 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200'
                : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
            }`}>
              {question.tech === 'design-patterns' ? 'Design Patterns' : question.tech === 'hld' ? 'HLD' : question.tech.charAt(0).toUpperCase() + question.tech.slice(1)}
            </span>
            <span className="badge px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {question.category}
            </span>
            <span className={`badge px-3 py-1 text-xs font-medium rounded-full ${
              question.difficulty === 'Basic' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              question.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {question.difficulty}
            </span>
          </div>
          <h2 className="question-title text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Q{question.displayNumber}. {question.question}
          </h2>

          {/* Read status and Mark as Read button */}
          <div className="mt-4 flex items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
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
          </div>
        </header>

        <div className="answer-content">
          <Markdown text={question.answer} />
        </div>
      </article>
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
            Question {selectedIndex + 1} of {questions.length}
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

/**
 * Mobile sidebar toggle button
 */
function MobileMenuButton({ isOpen, onToggle }) {
  return (
    <button
      className="lg:hidden fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors touch-target"
      onClick={onToggle}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )}
    </button>
  )
}

/**
 * Mobile sidebar overlay - fixed positioned, content pushed by spacer in App
 */
function MobileSidebar({ isOpen, onClose, ...sidebarProps }) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - closes on click */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Fixed sidebar - overlays but content pushed by spacer in App */}
      <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-slate-950 shadow-xl lg:hidden transform transition-transform duration-300 ease-out translate-x-0">
        <Sidebar {...sidebarProps} isMobile={true} />
      </aside>
    </>
  )
}

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

  // Initialize visited/read from localStorage
  const [visited, setVisited] = useState(() => loadVisited())
  const [read, setRead] = useState(() => loadRead())

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
  const visible = questionsData
  const effectiveHasMore = hasMore

  // URL routing: the path is a question slug. Resolve it against loaded questions.
  const slug = path === '/' ? '' : decodeURIComponent(path.replace(/^\/+/, ''))
  const byId = filtered.find(q => q.id === selectedId)
  const bySlug = slug ? questionsData.find(q => slugify(q.question || q.title) === slug) : null
  // A real selection (byId) wins over the path, so clicking clears a stale/bad route.
  const selected = byId || bySlug || (slug ? null : (filtered[0] || questionsData[0]))
  // 404 only when a non-root path resolves to nothing (after data has loaded).
  const routeNotFound = !!slug && loaded && !selected

  // Deep link (URL -> state): select the question named in the URL once it's loaded.
  useEffect(() => {
    if (bySlug && bySlug.id !== selectedId) setSelectedId(bySlug.id)
  }, [bySlug?.id])

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

  const handleSelect = useCallback((id) => {
    setSelectedId(id)
    // Mark as visited
    setVisited(prev => {
      if (!prev.has(id)) {
        const next = new Set(prev)
        next.add(id)
        saveVisited(next)
        return next
      }
      return prev
    })
    setMobileMenuOpen(false)
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const handleNavigate = useCallback((id) => {
    setSelectedId(id)
    // Mark as visited
    setVisited(prev => {
      if (!prev.has(id)) {
        const next = new Set(prev)
        next.add(id)
        saveVisited(next)
        return next
      }
      return prev
    })
    setMobileMenuOpen(false)
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const handleMarkRead = useCallback((id) => {
    setRead(prev => {
      const next = new Set(prev)
      next.add(id)
      saveRead(next)
      return next
    })
    // Also mark as visited if not already
    setVisited(prev => {
      if (!prev.has(id)) {
        const next = new Set(prev)
        next.add(id)
        saveVisited(next)
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

  return (
    <div className="app-shell h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 flex">
      <Sidebar
        questions={questionsData}
        filtered={filtered}
        hasMore={effectiveHasMore}
        onLoadMore={handleLoadMore}
        loading={isLoading}
        selectedId={selectedId}
        query={query}
        setQuery={setQuery}
        tech={tech}
        setTech={handleTechChange}
        category={category}
        setCategory={setCategory}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        status={status}
        setStatus={setStatus}
        onSelect={handleSelect}
        onToggleDark={toggleDarkMode}
        isDark={isDark}
        sidebarWidth={sidebarWidth}
        questionListRef={questionListRef}
        visited={visited}
        read={read}
        categories={categories}
      />

      {/* Mobile sidebar spacer - pushes content when menu open */}
      {mobileMenuOpen && <div className="lg:hidden w-80 max-w-[85vw]" aria-hidden="true" />}

      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        questions={questionsData}
        filtered={filtered}
        hasMore={effectiveHasMore}
        onLoadMore={handleLoadMore}
        loading={isLoading}
        selectedId={selectedId}
        query={query}
        setQuery={setQuery}
        tech={tech}
        setTech={handleTechChange}
        category={category}
        setCategory={setCategory}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        status={status}
        setStatus={setStatus}
        onSelect={handleSelect}
        onToggleDark={toggleDarkMode}
        isDark={isDark}
        visited={visited}
        read={read}
        categories={categories}
      />

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
    </div>
  )
}

export default App