/**
 * Fuzzy match a task against a query.
 *
 * Strategy (no external dep):
 *   1. Substring match in haystack (cheap, ranked highest).
 *   2. Subsequence match — every query char appears in haystack in order.
 *   3. Word-prefix bias — bonuses for matching at a word start.
 *
 * Returns null when no match, otherwise a numeric score (lower = better).
 * Operates on lowercased inputs; pre-lowercasing is the caller's job so we
 * don't pay the cost per task per keystroke.
 */

function buildWordStarts(haystack) {
  const set = new Uint8Array(haystack.length)
  for (let i = 0; i < haystack.length; i++) {
    const c = haystack.charCodeAt(i)
    if (i === 0) {
      set[i] = 1
      continue
    }
    const prev = haystack.charCodeAt(i - 1)
    // Word starts at whitespace → non-whitespace transitions.
    if ((prev === 32 || prev === 9 || prev === 10) && !(c === 32 || c === 9 || c === 10)) {
      set[i] = 1
    }
  }
  return set
}

function subsequenceScore(haystack, starts, needle) {
  let hi = 0
  let score = 0
  let lastMatch = -2
  let run = 0
  for (let ni = 0; ni < needle.length; ni++) {
    const nc = needle.charCodeAt(ni)
    let found = -1
    for (let j = hi; j < haystack.length; j++) {
      if (haystack.charCodeAt(j) !== nc) continue
      const gap = j - lastMatch - 1
      let local = gap
      if (starts[j]) local -= 5 // word-start bonus
      if (j > 0 && haystack.charCodeAt(j - 1) === nc) {
        run++
        local -= 2 * run // consecutive run bonus
      } else {
        run = 0
      }
      if (found === -1 || local < 0) {
        found = j
        score += Math.max(local, 0)
      }
      // Always advance to find the earliest match
      break
    }
    if (found === -1) return Infinity
    score += found - hi
    hi = found + 1
    lastMatch = found
  }
  return score
}

export function fuzzyMatch(haystack, needle) {
  if (!needle) return 0
  if (!haystack) return Infinity
  const idx = haystack.indexOf(needle)
  if (idx === 0) return -100 // exact prefix — best
  if (idx > 0) return idx - 50 // substring — better than subsequence
  return subsequenceScore(haystack, buildWordStarts(haystack), needle) + 1000
}

export function searchTasks(tasks, query, fields) {
  const q = query.trim().toLowerCase()
  if (!q) return tasks.map((t) => ({ task: t, score: 0 }))
  const out = []
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i]
    if (!t) continue
    let best = Infinity
    for (let k = 0; k < fields.length; k++) {
      const v = t[fields[k]]
      if (typeof v !== 'string') continue
      const s = fuzzyMatch(v.toLowerCase(), q)
      if (s < best) best = s
    }
    if (best !== Infinity) out.push({ task: t, score: best })
  }
  out.sort((a, b) => a.score - b.score)
  return out
}
