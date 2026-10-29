import { useLayoutEffect, useRef } from 'react'
// Draws a binary tree given in level order, e.g. [1, null, 2, 3]: the root first, then each level left to right.
// A null marks a missing child, and a missing node has no children listed (LeetCode style), so the tree is
// rebuilt with a queue rather than by array index. Each node's x is its inorder position and y its depth,
// so subtrees never overlap however lopsided the tree is.
const RADIUS = 18
const LEVEL_GAP = 60
const X_GAP = 44
const MIN_SCALE = 0.5
const MAX_DRAWN = 1000   // ponytail: SVG cost grows with nodes; past this, a picture of 20000 nodes helps nobody

// Accepts "1 2 null", "1,2,null" or "[1, 2, null]".
export function parseTreeInput(text) {
  return String(text || '').replace(/[[\]]/g, ' ').split(/[\s,]+/).filter(Boolean)
    .map(t => (/^(null|none|nil)$/i.test(t) ? null : Number(t)))
}

function build(values) {
  if (!values.length || values[0] === null) return null
  const root = { v: values[0], left: null, right: null }
  const q = [root]
  let i = 1
  for (let h = 0; h < q.length && i < values.length; h++) {
    for (const side of ['left', 'right']) {
      if (i >= values.length) break
      const v = values[i++]
      if (v !== null) { q[h][side] = { v, left: null, right: null }; q.push(q[h][side]) }
    }
  }
  return root
}

const Empty = ({ text }) => <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>

export default function TreeDiagram({ values }) {
  // A tree wider than its box opens scrolled so the root is in the middle, as LeetCode does.
  const boxRef = useRef(null)
  const rootAt = useRef(0)   // root's x as a fraction of the drawing's width, set below
  const shape = (values || []).join(',')
  useLayoutEffect(() => {
    const b = boxRef.current
    if (b && b.scrollWidth > b.clientWidth) b.scrollLeft = rootAt.current * b.scrollWidth - b.clientWidth / 2
  }, [shape])
  const root = build(values || [])
  if (!root) return <Empty text="Empty tree." />
  const count = values.filter(v => v !== null).length
  if (count > MAX_DRAWN) return <Empty text={`${count} nodes — too many to draw (up to ${MAX_DRAWN}).`} />
  const nodes = []
  const edges = []
  let x = 0
  const walk = (n, depth) => {
    if (!n) return null
    const l = walk(n.left, depth + 1)
    const me = { id: nodes.length, v: n.v, x: x++ * X_GAP + RADIUS + 4, y: depth * LEVEL_GAP + RADIUS + 4 }
    nodes.push(me)
    const r = walk(n.right, depth + 1)
    for (const c of [l, r]) if (c) edges.push({ key: `${me.id}-${c.id}`, x1: me.x, y1: me.y, x2: c.x, y2: c.y })
    return me
  }
  const top = walk(root, 0)
  const width = x * X_GAP + 8
  rootAt.current = top.x / width
  const height = Math.max(...nodes.map(n => n.y)) + RADIUS + 6
  return (
    // Shrinks to fit the box, but never below MIN_SCALE so values stay readable: a big tree then scrolls
    // inside a capped box, LeetCode style. It never grows past its natural size.
    <div ref={boxRef} className="max-h-[420px] overflow-auto">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width, minWidth: width * MIN_SCALE }} className="mx-auto block h-auto" role="img" aria-label={`Tree with ${nodes.length} nodes`}>
        {edges.map(e => <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={2} />)}
        {nodes.map(n => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={RADIUS} className="fill-white dark:fill-slate-900" />
            <circle cx={n.x} cy={n.y} r={RADIUS} className="fill-blue-100 stroke-blue-500 dark:fill-blue-900/40 dark:stroke-blue-400" strokeWidth={2} />
            <text x={n.x} y={n.y + 5} textAnchor="middle" className="fill-slate-900 font-semibold dark:fill-slate-100" fontSize="14">{Number.isNaN(n.v) ? '?' : n.v}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// Draws a singly linked list, e.g. [1,2,3], as boxes joined by arrows and ending in null.
export function ListDiagram({ values }) {
  const vals = (values || []).filter(v => v !== null)
  if (!vals.length) return <Empty text="Empty list (null)." />
  if (vals.length > MAX_DRAWN) return <Empty text={`${vals.length} nodes — too many to draw (up to ${MAX_DRAWN}).`} />
  return (
    <div className="flex flex-wrap items-center gap-1 py-1" role="img" aria-label={`Linked list with ${vals.length} nodes`}>
      {vals.map((v, i) => (
        <div key={i} className="flex shrink-0 items-center gap-1">
          <span className="flex h-9 min-w-9 items-center justify-center rounded-lg border-2 border-blue-500 bg-blue-100 px-2 text-sm font-semibold text-slate-900 dark:border-blue-400 dark:bg-blue-900/40 dark:text-slate-100">
            {Number.isNaN(v) ? '?' : v}
          </span>
          <span aria-hidden="true" className="text-slate-400 dark:text-slate-500">→</span>
        </div>
      ))}
      <span className="shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">null</span>
    </div>
  )
}
