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
 * Markdown renderer with support for:
 * - Headers (h1-h3)
 * - Code blocks with language
 * - Inline code
 * - Bold/italic
 * - Lists (unordered)
 * - Tables
 * - Blockquotes
 */
export default function Markdown({ text }) {
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
