// Line-level diff for reviewing suggested edits: which lines were removed (red)
// and which were added (green).

/**
 * @returns {{type: 'same'|'add'|'del', text: string}[]} in output order.
 */
export function diffLines(before = '', after = '') {
  const a = String(before).replace(/\r\n/g, '\n').split('\n')
  const b = String(after).replace(/\r\n/g, '\n').split('\n')

  // Most edits touch a handful of lines, so trim the identical head and tail
  // first and run the expensive part only on the middle.
  let head = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head++
  let tail = 0
  while (tail < a.length - head && tail < b.length - head
         && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++

  const am = a.slice(head, a.length - tail)
  const bm = b.slice(head, b.length - tail)
  const out = []

  for (let i = 0; i < head; i++) out.push({ type: 'same', text: a[i] })

  // ponytail: O(n*m) LCS over the changed middle. Past ~800x800 lines it degrades
  // to "whole block replaced" so a full rewrite can't lock the tab; swap in a
  // Myers diff if that limit ever starts mattering.
  const m = am.length, n = bm.length
  if (m * n > 640000) {
    am.forEach((t) => out.push({ type: 'del', text: t }))
    bm.forEach((t) => out.push({ type: 'add', text: t }))
  } else {
    const dp = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1))
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        dp[i][j] = am[i] === bm[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
    let i = 0, j = 0
    while (i < m && j < n) {
      if (am[i] === bm[j]) { out.push({ type: 'same', text: am[i] }); i++; j++ }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', text: am[i] }); i++ }
      else { out.push({ type: 'add', text: bm[j] }); j++ }
    }
    while (i < m) out.push({ type: 'del', text: am[i++] })
    while (j < n) out.push({ type: 'add', text: bm[j++] })
  }

  for (let i = a.length - tail; i < a.length; i++) out.push({ type: 'same', text: a[i] })
  return out
}

/** Counts for the "+N / −N" summary. */
export function diffStats(rows) {
  return {
    added: rows.filter((r) => r.type === 'add').length,
    removed: rows.filter((r) => r.type === 'del').length,
  }
}
