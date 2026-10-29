// Custom test cases for coding problems, written LeetCode style: one field per parameter, e.g. root = [2,3,1,null,1].
// The drivers read a different layout (a tree or list as space-separated values, an int[] as a count line then
// a values line), so fields are converted both ways here.
//
// Parameter names and types come from the statement's generated "Input format" line, e.g.
// "line 1: the tree for root, given in level order ...; line 2: the integer k". Statements written by hand have
// no such line; paramsOf returns null for them and the case is one free-form input box.

const KINDS = [
  [/^the number of values, then the values for (\w+)/, 'int[]'],
  [/^the text for (\w+)/, 'string'],
  [/^the tree for (\w+)/, 'tree'],
  [/^the values of the linked list for (\w+)/, 'list'],
  [/^the integer (\w+)/, 'int'],
]

export function paramsOf(statement) {
  const m = /\*\*Input format:\*\*.*?in this order: (.*)\.\s*$/m.exec(statement || '')
  if (!m) return null
  const params = []
  for (const part of m[1].split(/(?:^|;\s*)line \d+: /).filter(Boolean)) {
    const kind = KINDS.find(([re]) => re.test(part))
    if (!kind) return null
    params.push({ name: kind[0].exec(part)[1], type: kind[1] })
  }
  return params.length ? params : null
}

// The statement's example as { input, expected }, or null.
export function exampleOf(statement) {
  const m = /\*\*Example\*\*\s*Input:\s*```\n([\s\S]*?)\n?```\s*Output:\s*```\n([\s\S]*?)\n?```/.exec(statement || '')
  return m ? { input: m[1], expected: m[2] } : null
}

const tokens = text => String(text || '').replace(/[[\]]/g, ' ').split(/[\s,]+/).filter(Boolean)
  .map(t => (/^(null|none|nil)$/i.test(t) ? 'null' : t))

// Driver input text -> one display field per parameter.
export function toFields(params, input) {
  if (!params) return [input]
  const lines = String(input || '').split('\n')
  let i = 0
  return params.map(({ type }) => {
    if (type === 'int[]') { i += 2; return `[${tokens(lines[i - 1]).join(',')}]` }
    const line = lines[i++] ?? ''
    return type === 'tree' || type === 'list' ? `[${tokens(line).join(',')}]` : line
  })
}

// Display fields -> driver input text. Accepts [1,2,null], 1,2,null or 1 2 null for trees, lists and arrays.
export function toStdin(params, fields) {
  if (!params) return fields[0] ?? ''
  return params.map(({ type }, i) => {
    const f = fields[i] ?? ''
    if (type === 'int[]') { const t = tokens(f); return `${t.length}\n${t.join(' ')}` }
    if (type === 'tree' || type === 'list') return tokens(f).join(' ')
    return type === 'int' ? f.trim() : f
  }).join('\n') + '\n'
}
