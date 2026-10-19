// Reads over the in-memory backup model: predicates, lists, tags, counts, sorting.
// Pure (no JSON I/O). Locale text comes via `tr()` from i18n.js.

import { tr } from '../i18n.js'
import { DEFAULT_COLORS, DAY, newRemoteId } from './schema.js'
import { num } from './io.js'

// -------- predicates --------

export function isDone(t) {
  return !!t && t.completed > 0
}

export function isDeleted(t) {
  return !!t && t.deleted > 0
}

export function hasDueDate(t) {
  return !!t && t.dueDate > 0
}

// Tasks.org encodes time when the millis are not on a whole minute
export function hasDueTime(t) {
  return !!t && t.dueDate > 0 && t.dueDate % 60000 > 0
}

export function hasSubtask(t, tasks) {
  if (!t || !Array.isArray(tasks)) return false
  return tasks.some((c) => c && c.parent === t.id)
}

export function childrenOf(t, tasks) {
  if (!t || !Array.isArray(tasks)) return []
  return tasks.filter((c) => c && c.parent === t.id)
}

export function parentOf(t, tasks) {
  if (!t || !Array.isArray(tasks) || !t.parent) return null
  return tasks.find((p) => p && p.id === t.parent) || null
}

export function sortTasks(arr) {
  const list = Array.isArray(arr) ? arr : []
  return [...list].sort((a, b) => {
    const oa = a && a.order != null ? a.order : Infinity
    const ob = b && b.order != null ? b.order : Infinity
    if (oa !== ob) return oa - ob
    const da = a ? a.dueDate || 0 : 0
    const db = b ? b.dueDate || 0 : 0
    if (da !== db) return da - db
    return (a ? a.parent || 0 : 0) - (b ? b.parent || 0 : 0)
  })
}

export function maxTaskId(data) {
  if (!data || !Array.isArray(data.tasks)) return 0
  return data.tasks.reduce((m, t) => (t && num(t.id, 0) > m ? t.id : m), 0)
}

// -------- time helpers --------

export function startOfToday() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()
}

// -------- color --------

export function argbToCss(v, fallback) {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback || null
  const n = v >>> 0
  return `#${[16, 8, 0]
    .map((s) => ((n >> s) & 255).toString(16).padStart(2, '0'))
    .join('')}`
}

// -------- list / tag queries --------

/** List objects usable across the UI: [{key, name, color}]. */
export function listsOf(b) {
  if (!b || !b.defs) return []
  if (b.format === 'real') {
    const cals = b.defs.caldavCalendars || []
    const defs = b.defs.filters || []
    const src = defs.length ? defs : cals
    return src
      .filter((x) => x && typeof x === 'object')
      .map((x, i) => ({
        key: String(x.remoteId ?? x.uuid ?? x.id ?? i),
        name: x.name || tr('en', 'untitled'),
        color: argbToCss(x.color, DEFAULT_COLORS[i % DEFAULT_COLORS.length])
      }))
  }
  return (b.defs.lists || []).map((l, i) => ({
    key: String(l.id),
    name: l.name || tr('en', 'untitled'),
    color: argbToCss(l.color, l.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length])
  }))
}

export function listOf(b, key) {
  return listsOf(b).find((l) => l.key === String(key)) || null
}

/** A task's own tag attachments: [{name, tagUid}]. */
export function tagsFor(b, task) {
  if (!b || !task) return []
  if (b.format === 'real') {
    const row = b.rows && b.rows[task.remoteId]
    return Array.isArray(row && row.tags) ? row.tags : []
  }
  return (b.defs.tags || []).filter(
    (k) => k && (k.taskUid === task.remoteId || k.taskUid === task.id)
  )
}

/** Unique tags with name + uid + count of tasks using each. */
export function uniqueTags(b) {
  if (!b || !b.defs) return []
  if (b.format === 'real') {
    const defs = b.defs.tags || []
    const uidOf = (row) =>
      (b.rows && row && b.rows[row.remoteId] && b.rows[row.remoteId].tags) || []
    const counts = {}
    for (const t of b.tasks) {
      for (const tag of uidOf(t)) {
        if (tag && tag.tagUid) counts[tag.tagUid] = (counts[tag.tagUid] || 0) + 1
      }
    }
    return defs
      .filter((d) => d && typeof d === 'object')
      .map((d, i) => ({
        name: d.name || tr('en', 'untitled'),
        tagUid: String(d.remoteId),
        color: argbToCss(d.color, DEFAULT_COLORS[i % DEFAULT_COLORS.length]),
        count: counts[d.remoteId] || 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
  return (b.defs.tags || [])
    .map((k) => k && { name: k.name, tagUid: k.tagUid })
    .filter(Boolean)
}

/** Rebuild a task's row `tags` list + tag defs for the given plain names. */
export function buildRowTags(b, names) {
  const list = names || []
  const defs = (b && b.defs && b.defs.tags) || []
  const byName = new Map()
  for (const d of defs) {
    if (d && d.name) byName.set(String(d.name).trim(), String(d.remoteId || d.tagUid || ''))
  }
  const out = []
  const newDefs = []
  for (const raw of list) {
    const name = String(raw).trim()
    if (!name) continue
    let uid = byName.get(name)
    if (!uid) {
      uid = newRemoteId()
      byName.set(name, uid)
      newDefs.push({ remoteId: uid, name, color: -7829368 })
    }
    out.push({ name, tagUid: uid })
  }
  return { tags: out, newDefs }
}

export function byList(backup, listKey) {
  return (backup && backup.tasks || []).filter(
    (t) => t && !isDeleted(t) && String(t.listKey) === String(listKey)
  )
}

export function taskCounts(b) {
  if (!b || !b.tasks) {
    return {
      all: 0,
      important: 0,
      today: 0,
      overdue: 0,
      completed: 0,
      trash: 0,
      byList: {},
      byTag: {}
    }
  }
  const today = startOfToday()
  const counts = {
    all: 0,
    important: 0,
    today: 0,
    overdue: 0,
    completed: 0,
    trash: 0,
    byList: {},
    byTag: {}
  }
  for (const t of b.tasks) {
    if (!t) continue
    if (isDeleted(t)) {
      counts.trash++
      continue
    }
    const done = isDone(t)
    const due = t.dueDate || 0
    if (!done) {
      counts.all++
      if (t.importance < 3) counts.important++
      if (due > 0 && due >= today && due < today + DAY) counts.today++
      if (due > 0 && due < today) counts.overdue++
      if (t.listKey) counts.byList[t.listKey] = (counts.byList[t.listKey] || 0) + 1
      for (const tag of tagsFor(b, t)) {
        if (tag && tag.tagUid) counts.byTag[tag.tagUid] = (counts.byTag[tag.tagUid] || 0) + 1
      }
    } else {
      counts.completed++
    }
  }
  return counts
}
