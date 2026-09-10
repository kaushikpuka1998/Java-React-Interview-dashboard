// Run: node frontend/src/lib/diff.test.mjs
import assert from 'node:assert/strict'
import { diffLines, diffStats } from './diff.js'

const render = (rows) => rows.map((r) => ({ same: ' ', add: '+', del: '-' }[r.type] + r.text)).join('\n')

// identical text -> no changes
assert.deepEqual(diffStats(diffLines('a\nb', 'a\nb')), { added: 0, removed: 0 })

// one line replaced in the middle: head/tail stay untouched
assert.equal(render(diffLines('a\nb\nc', 'a\nB\nc')), ' a\n-b\n+B\n c')

// pure insertion
assert.equal(render(diffLines('a\nc', 'a\nb\nc')), ' a\n+b\n c')

// pure deletion
assert.equal(render(diffLines('a\nb\nc', 'a\nc')), ' a\n-b\n c')

// moved line is reported as one delete + one add, not a mangled interleave
assert.deepEqual(diffStats(diffLines('a\nb\nc', 'b\nc\na')), { added: 1, removed: 1 })

// empty sides — '' splits to one empty line, so it reads as that line being replaced
assert.deepEqual(diffStats(diffLines('', 'x')), { added: 1, removed: 1 })
assert.deepEqual(diffStats(diffLines('x', '')), { added: 1, removed: 1 })

// CRLF is normalised, not reported as a change
assert.deepEqual(diffStats(diffLines('a\r\nb', 'a\nb')), { added: 0, removed: 0 })

console.log('diff.js ok')
