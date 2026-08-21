import { useMemo, useState, useCallback } from 'react'
import questionsData from './data/questions.json'

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
            <pre key={index} className="bg-slate-900 rounded-lg p-4 overflow-x-auto border border-slate-700/50">
              <code className="text-slate-100 text-sm leading-relaxed font-mono">{highlightCode(part.trim())}</code>
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
              <div key={key} className="overflow-x-auto my-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      {head.map((cell, ci) => (
                        <th key={ci} className="px-4 py-2.5 text-left font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">{formatInline(cell)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((cells, ri) => (
                      <tr key={ri} className="even:bg-slate-50 dark:even:bg-slate-800/40">
                        {cells.map((cell, ci) => (
                          <td key={ci} className="px-4 py-2.5 align-top text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">{formatInline(cell)}</td>
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
 * Question item in sidebar
 */
function QuestionLink({ question, isActive, onClick }) {
  return (
    <button
      className={`question-link w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <span className="qnum flex-shrink-0 text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mt-0.5">
          Q{question.displayNumber}
        </span>
        <span className="text-sm leading-relaxed truncate">{question.question}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className={`badge px-2 py-0.5 text-xs rounded-full ${
          question.tech === 'java' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
          question.tech === 'node' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
          question.tech === 'sql' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
          'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
        }`}>
          {question.tech.toUpperCase()}
        </span>
        <span className="badge px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
          {question.difficulty}
        </span>
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
 * Tech filter segmented control
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
      // coffee cup (Java)
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h1a3 3 0 010 6h-1.17A5 5 0 0113 18H8a5 5 0 01-5-5V7a1 1 0 011-1h13a1 1 0 011 1v1zm0 2v2h1a1 1 0 000-2h-1zM6 3a1 1 0 012 0v1a1 1 0 01-2 0V3zm4 0a1 1 0 012 0v1a1 1 0 01-2 0V3zM4 20h14v2H4v-2z"/></svg>,
    },
    {
      value: 'react', label: 'React',
      active: 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/30',
      // atom (React)
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="10" ry="4.2" strokeWidth={1.5}/><ellipse cx="12" cy="12" rx="10" ry="4.2" strokeWidth={1.5} transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" strokeWidth={1.5} transform="rotate(120 12 12)"/></svg>,
    },
    {
      value: 'node', label: 'Node',
      active: 'bg-green-500 text-white shadow-sm shadow-green-500/30',
      // hexagon (Node)
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2zm0 4.2L7.5 8.8v6.4L12 17.8l4.5-2.6V8.8L12 6.2z"/></svg>,
    },
    {
      value: 'sql', label: 'SQL',
      active: 'bg-purple-500 text-white shadow-sm shadow-purple-500/30',
      // database cylinder (SQL)
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-4.42 0-8 1.34-8 3v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5c0-1.66-3.58-3-8-3zm6 17c0 .3-2.13 1.5-6 1.5S6 19.3 6 19v-2.23c1.5.77 3.72 1.23 6 1.23s4.5-.46 6-1.23V19zm0-4.5c0 .3-2.13 1.5-6 1.5s-6-1.2-6-1.5v-2.23c1.5.77 3.72 1.23 6 1.23s4.5-.46 6-1.23v2.23zM12 8.5C8.13 8.5 6 7.3 6 7s2.13-1.5 6-1.5S18 6.7 18 7s-2.13 1.5-6 1.5z"/></svg>,
    },
  ]

  return (
    <div className="segmented flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg" role="group" aria-label="Filter by technology">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`flex flex-1 min-w-[68px] items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
            value === opt.value
              ? opt.active
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          <span className="flex-shrink-0" aria-hidden="true">{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Category dropdown
 */
function CategorySelect({ value, onChange, options, disabled }) {
  if (disabled || options.length === 0) return null

  return (
    <select
      className="select w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label="Filter by category"
    >
      <option value="all">All categories</option>
      {options.map(cat => <option key={cat} value={cat}>{cat}</option>)}
    </select>
  )
}

/**
 * Difficulty filter dropdown
 */
function DifficultySelect({ value, onChange }) {
  const difficulties = ['Basic', 'Intermediate', 'Advanced', 'Experienced']

  return (
    <select
      className="select w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label="Filter by difficulty"
    >
      <option value="all">All difficulties</option>
      {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
    </select>
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
function Sidebar({ questions, filtered, selectedId, query, setQuery, tech, setTech, category, setCategory, difficulty, setDifficulty, onSelect, onToggleDark, isDark, className = '', isMobile = false }) {
  const categories = useMemo(() =>
    [...new Set(questions.filter(q => tech === 'all' || q.tech === tech).map(q => q.category))].sort(),
    [tech, questions]
  )

  return (
    <aside className={`sidebar sidebar-responsive h-full flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 ${isMobile ? '' : 'hidden lg:flex'} ${className}`}>
      <div className="brand p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="logo w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
              JR
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

      <div className="p-4 space-y-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <SearchInput value={query} onChange={setQuery} placeholder="Search questions..." />

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
        />

        <QuestionCount count={filtered.length} total={questions.length} />
      </div>

      <nav className="question-list flex-1 overflow-y-auto p-3 space-y-1" aria-label="Question list">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No questions match your filters</p>
          </div>
        ) : (
          filtered.map(q => (
            <QuestionLink
              key={q.id}
              question={q}
              isActive={selectedId === q.id}
              onClick={() => onSelect(q.id)}
            />
          ))
        )}
      </nav>
    </aside>
  )
}

/**
 * Reader pane component
 */
function ReaderPane({ question, questions, onNavigate }) {
  if (!question) {
    return (
      <main className="reader flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center p-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Select a question</h2>
          <p className="text-slate-500 dark:text-slate-400">Choose from the sidebar to start reading</p>
        </div>
      </main>
    )
  }

  const selectedIndex = questions.findIndex(q => q.id === question.id)
  const prev = questions[selectedIndex - 1]
  const next = questions[selectedIndex + 1]

  return (
    <main className="reader flex-1 h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col">
      <article className="paper flex-1 overflow-y-auto p-6 lg:p-8 max-w-3xl mx-auto w-full">
        <header className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="badges flex flex-wrap gap-2 mb-4">
            <span className={`badge px-3 py-1 text-xs font-medium rounded-full ${
              question.tech === 'java'
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                : question.tech === 'node'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : question.tech === 'sql'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
            }`}>
              {question.tech.toUpperCase()}
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
          <h2 className="question-title text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Q{question.displayNumber}. {question.question}
          </h2>
        </header>

        <div className="answer-content">
          <Markdown text={question.answer} />
        </div>
      </article>

      <footer className="pager flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
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
            Question {question.displayNumber} of {questions.length}
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
 * Mobile sidebar overlay
 */
function MobileSidebar({ isOpen, onClose, ...sidebarProps }) {
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-slate-950 shadow-xl lg:hidden transform transition-transform duration-200 ease-out">
        <Sidebar {...sidebarProps} isMobile={true} />
      </aside>
    </>
  )
}

function App() {
  const [selectedId, setSelectedId] = useState(questionsData[0]?.id)
  const [query, setQuery] = useState('')
  const [tech, setTech] = useState('all')
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const theme = localStorage.getItem('theme')
      if (theme) return theme === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return questionsData.filter(item => {
      const matchesTech = tech === 'all' || item.tech === tech
      const matchesCategory = category === 'all' || item.category === category
      const matchesDifficulty = difficulty === 'all' || item.difficulty === difficulty
      const text = `q${item.displayNumber} ${item.question} ${item.answer} ${item.category}`.toLowerCase()
      return matchesTech && matchesCategory && matchesDifficulty && (!q || text.includes(q))
    })
  }, [query, tech, category, difficulty])

  const selected = filtered.find(q => q.id === selectedId) || filtered[0] || questionsData[0]

  const toggleDarkMode = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }, [])

  const handleSelect = useCallback((id) => {
    setSelectedId(id)
    setMobileMenuOpen(false)
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const handleNavigate = useCallback((id) => {
    setSelectedId(id)
    setMobileMenuOpen(false)
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const handleTechChange = useCallback((value) => {
    setTech(value)
    setCategory('all')
  }, [])

  return (
    <div className="app-shell h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar
        questions={questionsData}
        filtered={filtered}
        selectedId={selectedId}
        query={query}
        setQuery={setQuery}
        tech={tech}
        setTech={handleTechChange}
        category={category}
        setCategory={setCategory}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onSelect={handleSelect}
        onToggleDark={toggleDarkMode}
        isDark={isDark}
      />

      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        questions={questionsData}
        filtered={filtered}
        selectedId={selectedId}
        query={query}
        setQuery={setQuery}
        tech={tech}
        setTech={handleTechChange}
        category={category}
        setCategory={setCategory}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onSelect={handleSelect}
        onToggleDark={toggleDarkMode}
        isDark={isDark}
      />

      <MobileMenuButton isOpen={mobileMenuOpen} onToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <ReaderPane
        question={selected}
        questions={questionsData}
        onNavigate={handleNavigate}
      />
    </div>
  )
}

export default App