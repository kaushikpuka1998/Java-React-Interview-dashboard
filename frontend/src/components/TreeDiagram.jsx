// Draws a binary tree given in level order, e.g. [1, null, 2, 3]: the root first, then each level left to right.
// A null marks a missing node. Each node is joined to its parent, so the picture matches the input exactly.
const RADIUS = 18
const LEVEL_GAP = 60

export function parseTreeInput(text) {
  const tokens = String(text || '').trim().split(/\s+/).filter(Boolean)
  return tokens.map(t => (t === 'null' ? null : Number(t)))
}

export default function TreeDiagram({ values }) {
  if (!values || values.length === 0 || values[0] === null) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Empty tree.</p>
  }
  const levels = Math.floor(Math.log2(values.length)) + 1
  const width = Math.max(200, Math.pow(2, levels - 1) * 44)
  const height = levels * LEVEL_GAP
  const pos = i => {
    const depth = Math.floor(Math.log2(i + 1))
    const slot = i + 1 - Math.pow(2, depth)
    const slots = Math.pow(2, depth)
    return { x: ((slot + 0.5) / slots) * width, y: depth * LEVEL_GAP + RADIUS + 4, depth }
  }
  const nodes = []
  const edges = []
  values.forEach((v, i) => {
    if (v === null || v === undefined) return
    const p = pos(i)
    nodes.push({ i, v, ...p })
    for (const c of [2 * i + 1, 2 * i + 2]) {
      if (c < values.length && values[c] !== null && values[c] !== undefined) {
        const q = pos(c)
        edges.push({ key: `${i}-${c}`, x1: p.x, y1: p.y, x2: q.x, y2: q.y })
      }
    }
  })
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-w-xl" role="img" aria-label={`Tree with ${nodes.length} nodes`}>
      {edges.map(e => <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={2} />)}
      {nodes.map(n => (
        <g key={n.i}>
          <circle cx={n.x} cy={n.y} r={RADIUS} className="fill-blue-100 stroke-blue-500 dark:fill-blue-900/40 dark:stroke-blue-400" strokeWidth={2} />
          <text x={n.x} y={n.y + 5} textAnchor="middle" className="fill-slate-900 text-sm font-semibold dark:fill-slate-100" fontSize="14">{n.v}</text>
        </g>
      ))}
    </svg>
  )
}
