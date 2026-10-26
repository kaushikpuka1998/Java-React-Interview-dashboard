import { useRef } from 'react'
// A small code editor: line numbers, Tab indents by four spaces, and keyword/string/comment highlighting.
const KEYWORDS = {
  java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends false final finally float for if implements import instanceof int interface long new null package private protected public return short static super switch this throw throws true try void volatile while var record',
  cpp: 'auto bool break case catch char class const continue default delete do double else enum explicit extern false float for friend if include inline int long namespace new nullptr private protected public return short signed sizeof static struct switch template this throw true try typedef typename union unsigned using virtual void volatile while',
  c: 'auto break case char const continue default do double else enum extern false float for goto if include inline int long register return short signed sizeof static struct switch true typedef union unsigned void volatile while',
  python: 'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass print raise return True try while with yield',
  go: 'break case chan const continue default defer else fallthrough false for func go goto if import interface map nil package range return select struct switch true type var',
  ruby: 'alias and begin break case class def do else elsif end ensure false for if in module next nil not or puts require return self super then true undef unless until when while yield',
  rust: 'as async await break const continue crate else enum extern false fn for if impl in let loop match mod move mut println pub ref return self Self static struct super trait true type unsafe use where while',
  kotlin: 'abstract as break class continue do else enum false fun if in interface is null object override package println return super this throw true try val var when while',
  csharp: 'abstract as base bool break byte case catch char class const continue decimal default do double else enum false float for foreach if in int interface long namespace new null object out override private protected public readonly ref return static string struct switch this throw true try typeof using var virtual void while Console',
  php: 'abstract and array as break case catch class const continue default do echo else elseif extends false final for foreach function if implements include namespace new null or private protected public return static switch this throw true try use var while',
  swift: 'let var func class struct enum protocol if else for while return import guard switch case default true false nil self in print init',
}
const HASH_COMMENTS = ['python', 'ruby', 'php']

const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Returns highlighted HTML for the code. Every piece of text is escaped before it is returned.
function highlight(code, language) {
  const words = new Set((KEYWORDS[language] || '').split(' '))
  const hash = HASH_COMMENTS.includes(language) ? '|#[^\\n]*' : ''
  const pattern = new RegExp(`/\\*[\\s\\S]*?\\*/|//[^\\n]*${hash}|"(?:\\\\.|[^"\\\\\\n])*"|'(?:\\\\.|[^'\\\\\\n])*'|\\b\\d+(?:\\.\\d+)?\\b|\\b[A-Za-z_]\\w*\\b`, 'g')
  let out = ''
  let last = 0
  let m
  while ((m = pattern.exec(code)) !== null) {
    out += escapeHtml(code.slice(last, m.index))
    const t = m[0]
    let cls = ''
    if (t.startsWith('/*') || t.startsWith('//') || t.startsWith('#')) cls = 'text-slate-500 italic'
    else if (t[0] === '"' || t[0] === "'") cls = 'text-emerald-300'
    else if (/^\d/.test(t)) cls = 'text-amber-300'
    else if (words.has(t)) cls = 'text-sky-300'
    out += cls ? `<span class="${cls}">${escapeHtml(t)}</span>` : escapeHtml(t)
    last = m.index + t.length
  }
  return out + escapeHtml(code.slice(last)) + '\n'
}

const SHARED = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13, lineHeight: '20px', padding: '12px 12px 12px 52px', tabSize: 4, margin: 0, whiteSpace: 'pre', letterSpacing: 0 }

export default function CodeEditor({ value, onChange, language }) {
  const area = useRef(null)
  const overlay = useRef(null)
  const gutter = useRef(null)
  const lines = value.split('\n').length

  const sync = () => {
    const t = area.current
    if (!t) return
    if (overlay.current) { overlay.current.scrollTop = t.scrollTop; overlay.current.scrollLeft = t.scrollLeft }
    if (gutter.current) gutter.current.scrollTop = t.scrollTop
  }

  const onKeyDown = e => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const t = e.target
    const s = t.selectionStart
    const next = value.slice(0, s) + '    ' + value.slice(t.selectionEnd)
    onChange(next)
    requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 4 })
  }

  return (
    <div className="relative h-[340px] overflow-hidden rounded-lg border border-slate-700 bg-slate-950 focus-within:ring-2 focus-within:ring-blue-500">
      <div ref={gutter} aria-hidden="true" className="absolute inset-y-0 left-0 w-11 select-none overflow-hidden bg-slate-900 pt-3 text-right font-mono text-[13px] leading-[20px] text-slate-500" style={{ paddingRight: 8 }}>
        {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
      </div>
      <pre ref={overlay} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden text-slate-100" style={SHARED} dangerouslySetInnerHTML={{ __html: highlight(value, language) }} />
      <textarea
        ref={area}
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={sync}
        onKeyDown={onKeyDown}
        spellCheck={false}
        wrap="off"
        aria-label="Code"
        className="absolute inset-0 h-full w-full resize-none bg-transparent text-transparent outline-none"
        style={{ ...SHARED, caretColor: '#f8fafc' }}
      />
    </div>
  )
}
