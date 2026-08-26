import { useEffect, useRef, useState } from 'react'

// ponytail: mermaid is ~500KB, so it is dynamically imported — Vite splits it into
// its own chunk that only downloads when a question actually contains a diagram.
let mermaidPromise = null
function loadMermaid(dark) {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => {
      const m = mod.default
      m.initialize({
        startOnLoad: false,
        securityLevel: 'strict',   // no click handlers / raw HTML injection from diagram text
        theme: dark ? 'dark' : 'default',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        // Scale diagrams down to fit the container so nothing is ever cut off,
        // and tighten the default spacing so they do not waste horizontal room.
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          padding: 8,
          nodeSpacing: 30,      // default 50
          rankSpacing: 40,      // default 50
          curve: 'basis',
        },
        sequence: {
          useMaxWidth: true,
          diagramMarginX: 8,
          diagramMarginY: 8,
          boxMargin: 6,
          actorMargin: 40,      // default 50
        },
        gantt: { useMaxWidth: true },
        er: { useMaxWidth: true },
        journey: { useMaxWidth: true },
        class: { useMaxWidth: true },
        state: { useMaxWidth: true },
      })
      return m
    })
  }
  return mermaidPromise
}

let idCounter = 0

export default function Mermaid({ code }) {
  const ref = useRef(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const dark = document.documentElement.classList.contains('dark')

    loadMermaid(dark)
      .then(async (mermaid) => {
        const id = `mermaid-${++idCounter}`
        try {
          // parse first so a syntax error does not leave a stray error node in the DOM
          await mermaid.parse(code)
          const { svg } = await mermaid.render(id, code)
          if (!cancelled) { setSvg(svg); setError('') }
        } catch (e) {
          if (!cancelled) setError(e?.message || 'Invalid diagram syntax')
          document.getElementById(`d${id}`)?.remove()   // mermaid leaves a temp node on failure
        }
      })
      .catch(() => { if (!cancelled) setError('Could not load the diagram renderer') })

    return () => { cancelled = true }
  }, [code])

  // Failed to parse/render: fall back to the source so no content is ever lost.
  if (error) {
    return (
      <div className="my-4 -mx-4 sm:mx-0">
        <div className="px-3 sm:px-4 py-1 text-[11px] font-mono uppercase tracking-wide text-amber-400 bg-slate-800 border border-b-0 border-slate-700/50 rounded-t-lg">
          mermaid — {error}
        </div>
        <pre className="bg-slate-900 rounded-b-lg p-3 sm:p-4 text-[12px] sm:text-sm overflow-x-auto max-w-full border border-slate-700/50">
          <code className="text-slate-100 leading-relaxed font-mono whitespace-pre">{code}</code>
        </pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="my-4 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 py-10 text-sm text-slate-400">
        Rendering diagram…
      </div>
    )
  }

  return (
    <div
      ref={ref}
      // The SVG scales to fit the container width (never cut off) and keeps its
      // aspect ratio, so the box hugs the diagram instead of leaving dead space.
      className="mermaid-diagram my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-2 sm:p-3 [&>svg]:mx-auto [&>svg]:block [&>svg]:h-auto [&>svg]:max-w-full"
      // mermaid output is generated from the diagram source with securityLevel: 'strict'
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
