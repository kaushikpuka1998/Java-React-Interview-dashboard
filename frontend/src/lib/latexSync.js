// Keeps the form and the LaTeX in step for the simple fields. The generated LaTeX stores each one as
// a line such as \def\rName{Kaushik Ghosh}; editing a line in the LaTeX updates the form, and editing
// the form rewrites the line. Everything else in the LaTeX is left as it is.

export const VARS = ['rName', 'rHeadline', 'rLocation', 'rEmail', 'rPhone', 'rSummary']

const LATEX_OF = {
  '\\': '\\textbackslash{}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
  '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#', '_': '\\_', '{': '\\{', '}': '\\}',
}

// Form shorthand (**bold**, [label](url), ->) to LaTeX. Mirrors the server's renderer.
export function markupToLatex(text = '') {
  const plain = (t) => t.replace(/[\\~^&%$#_{}]/g, c => LATEX_OF[c]).split('->').join('$\\rightarrow$')
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*/g
  let out = '', last = 0, m
  while ((m = re.exec(text))) {
    out += plain(text.slice(last, m.index))
    out += m[1] !== undefined
      ? `\\href{${m[2].replace(/%/g, '\\%').replace(/#/g, '\\#')}}{${plain(m[1])}}`
      : `\\textbf{${plain(m[3])}}`
    last = re.lastIndex
  }
  return out + plain(text.slice(last))
}

// LaTeX text back to plain characters.
const unescape = (s) => s
  .replace(/\\textbackslash\{\}/g, '\\')
  .replace(/\\textasciitilde\{\}/g, '~')
  .replace(/\\textasciicircum\{\}/g, '^')
  .replace(/\$\\rightarrow\$/g, '->')
  .replace(/\\([&%$#_{}])/g, '$1')

// LaTeX back to the form's shorthand.
export function latexToMarkup(s) {
  return unescape(s
    .replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, (_, u, t) => `[${t}](${u})`)
    .replace(/\\textbf\{([^}]*)\}/g, '**$1**'))
}

// The six variables as LaTeX, from the form.
export function fieldsToLatex(d) {
  const h = (d && d.header) || {}
  const text = (v) => markupToLatex(v || '').replace(/\s*\n+\s*/g, ' ')
  const plainValue = (v) => (v || '').trim().replace(/%/g, '\\%').replace(/#/g, '\\#')
  return {
    rName: text(h.name), rHeadline: text(h.headline), rLocation: text(h.location),
    rEmail: plainValue(h.email), rPhone: plainValue(h.phone), rSummary: text(d && d.summary),
  }
}

// The variables as they are written in a LaTeX text (only those present).
export function readFields(latex) {
  const out = {}
  for (const v of VARS) {
    const m = latex.match(new RegExp('^\\\\def\\\\' + v + '\\{(.*)\\}\\s*$', 'm'))
    if (m) out[v] = m[1]
  }
  return out
}

// Writes the variables into a LaTeX text: replaces each line, or adds it after \begin{document}.
export function writeFields(latex, fields) {
  let out = latex
  for (const v of VARS) {
    const line = '\\def\\' + v + '{' + fields[v] + '}'
    const re = new RegExp('^\\\\def\\\\' + v + '\\{.*\\}\\s*$', 'm')
    if (re.test(out)) out = out.replace(re, () => line)
    else out = out.replace(/\\begin\{document\}/, m => m + '\n' + line)
  }
  return out
}

// A variable's LaTeX value as the form stores it.
export function fromLatexValue(v, raw) {
  return v === 'rEmail' || v === 'rPhone' ? unescape(raw) : latexToMarkup(raw)
}

// Applies variable values to the resume details.
export function applyFields(d, values) {
  const next = { ...d, header: { ...(d.header || {}) } }
  for (const [v, value] of Object.entries(values)) {
    if (v === 'rSummary') next.summary = value
    else next.header[{ rName: 'name', rHeadline: 'headline', rLocation: 'location', rEmail: 'email', rPhone: 'phone' }[v]] = value
  }
  return next
}
