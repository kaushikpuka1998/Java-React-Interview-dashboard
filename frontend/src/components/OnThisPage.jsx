import { useEffect, useMemo, useState } from 'react'
import { slugifyHeading } from './Markdown.jsx'

/**
 * Section outline for the current answer.
 *
 * Design note: rather than a separate progress bar above a plain list, the rail
 * itself IS the progress indicator — it fills from the top as you scroll, and each
 * section is a node on that rail. Passed nodes are solid, the current one carries a
 * halo, upcoming ones stay hollow.
 */

// Pull headings out of the markdown, ignoring anything inside fenced code blocks.
function extractHeadings(md) {
  const out = []
  let inFence = false
  for (const line of String(md || '').split('\n')) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue
    const m = line.match(/^(#{1,4})\s+(.+?)\s*$/)
    if (!m) continue
    const level = m[1].length
    if (level > 3) continue                       // h4+ is too granular for an outline
    const label = m[2]
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    out.push({ level, label, id: slugifyHeading(m[2]) })
  }
  return out
}

export default function OnThisPage({ text, scrollRef }) {
  const headings = useMemo(() => extractHeadings(text), [text])
  const [activeId, setActiveId] = useState('')
  const [progress, setProgress] = useState(0)


  // Track scroll progress and which section is currently in view.
  useEffect(() => {
    const scroller = scrollRef?.current
    if (!scroller || headings.length === 0) return

    // Computed directly rather than throttled through requestAnimationFrame: with a
    // handful of headings the cost is trivial, and a rAF guard can stick permanently
    // if frames are paused (backgrounded tab) while a callback is still pending.
    const onScroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight
      setProgress(max > 0 ? Math.min(100, Math.max(0, (scroller.scrollTop / max) * 100)) : 0)

      // Active = last heading whose top has crossed a line ~1/3 down the viewport.
      const line = scroller.getBoundingClientRect().top + scroller.clientHeight * 0.33
      let current = ''
      for (const h of headings) {
        const el = document.getElementById(h.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= line) current = h.id
      }
      setActiveId(current || headings[0].id)
    }

    onScroll()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [headings, scrollRef, text])

  // Reset when the question changes.
  useEffect(() => { setActiveId(''); setProgress(0) }, [text])

  const jump = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
  }

  // Not worth the chrome for a short answer.
  if (headings.length < 3) return null

  const activeIndex = headings.findIndex(h => h.id === activeId)

  return (
    <nav
      aria-label="Sections in this answer"
      className="hidden xl:block w-56 flex-shrink-0 sticky top-6 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pl-2"
    >
      <div className="flex items-baseline justify-between mb-3 pr-1">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Sections
        </span>
        <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="relative">
        {/* the rail: a track with a fill that grows as you scroll */}
        <div className="absolute left-[5px] top-1 bottom-1 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
        <div
          className="absolute left-[5px] top-1 w-px bg-gradient-to-b from-blue-500 to-indigo-500 transition-[height] duration-150 ease-out"
          style={{ height: `calc(${progress}% - 0.25rem)` }}
          aria-hidden="true"
        />

        <ul className="space-y-1 relative">
          {headings.map((h, i) => {
            const isActive = h.id === activeId
            const isPassed = activeIndex > -1 && i < activeIndex
            return (
              <li key={h.id + i}>
                <button
                  onClick={() => jump(h.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`group w-full text-left flex items-start gap-2.5 rounded-md py-1 pr-1 transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : isPassed
                      ? 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {/* node on the rail */}
                  <span className="relative mt-[7px] flex-shrink-0" aria-hidden="true">
                    <span
                      className={`block rounded-full transition-all duration-150 ${
                        isActive
                          ? 'w-[11px] h-[11px] -ml-[3px] bg-blue-500 ring-4 ring-blue-500/20'
                          : isPassed
                          ? 'w-[5px] h-[5px] bg-indigo-400 dark:bg-indigo-500'
                          : 'w-[5px] h-[5px] bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400'
                      }`}
                    />
                  </span>
                  <span
                    className={`text-[13px] leading-snug transition-all ${
                      isActive ? 'font-semibold' : 'font-normal'
                    } ${h.level === 3 ? 'pl-2.5 text-[12px]' : ''}`}
                  >
                    {h.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
