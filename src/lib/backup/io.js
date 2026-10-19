// Backup data pipeline: JSON in/out (parse/serialize) and the shape coercers
// (normalize, plus the small `num/str/bool` primitives they use).
//
//   parseBackup(text)            → { ok, data, warnings, error }
//   serializeBackup(backup)       → { data, warnings, error }
//   normalizeTask / normalizeRealTask  — exposed for symmetry, used internally
//   isRealBackup(root)           — format detector
//   newTask(format)              — construct a new task in the right format
//   maxTaskId(data)              — max numeric id in a backup
//
// `num/str/bool/emptyId/clampImportance/keepExtras` are re-exported so query.js
// (e.g. maxTaskId's `num`) can share them without duplicating copies.

import {
  LEGACY_TASK,
  REAL_FIELD,
  REAL_FIELDS,
  ROW_KEYS,
  DATA_KEYS,
  LEGACY_KEYS,
  REAL_EXTRA_SKIP,
  newRemoteId,
  emptyData
} from './schema.js'

// -------- coercion primitives --------

export function emptyId(t) {
  return !t || typeof t !== 'object'
}

export function num(v, fb) {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  return fb
}

export function str(v, fb) {
  if (typeof v === 'string') return v
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  if (typeof v === 'boolean') return String(v)
  return fb
}

export function bool(v, fb) {
  return typeof v === 'boolean' ? v : fb
}

export function clampImportance(v) {
  const n = num(v, 3)
  if (n !== n) return 3
  return Math.min(3, Math.max(0, n))
}

function keepExtras(source, out, internalKeys) {
  for (const k of Object.keys(source)) {
    if (!internalKeys.has(k)) out[k] = source[k]
  }
}

export function shouldOmit(spec, v) {
  if (v == null) return true
  switch (spec.omit) {
    case 'zero':
      return v === 0
    case 'truthy':
      return !v
    default: {
      const m = /^default:(.+)$/.exec(spec.omit)
      return m ? v === JSON.parse(m[1]) : false
    }
  }
}

// -------- format detection --------

export function isRealBackup(raw) {
  return (
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    raw.data &&
    typeof raw.data === 'object' &&
    Array.isArray(raw.data.tasks) &&
    (raw.data.tasks.length === 0 ||
      (raw.data.tasks[0] &&
        typeof raw.data.tasks[0] === 'object' &&
        'task' in raw.data.tasks[0]))
  )
}

// -------- normalization --------

/** Coerce a legacy (flat) task — the shape the app once emitted and simple fixtures use. */
export function normalizeTask(t) {
  if (emptyId(t)) t = {}
  const out = {
    id: num(t.id, 0),
    title: str(t.title, ''),
    importance: clampImportance(t.importance),
    dueDate: num(t.dueDate, 0),
    hideUntil: num(t.hideUntil, 0),
    created: num(t.created, 0),
    modified: num(t.modified, 0),
    completed: num(t.completed, 0),
    deleted: num(t.deleted, 0),
    notes: str(t.notes, ''),
    estimatedSeconds: num(t.estimatedSeconds, 0),
    elapsedSeconds: num(t.elapsedSeconds, 0),
    timerStart: num(t.timerStart, 0),
    ringFlags: num(t.ringFlags, 0),
    lastNotified: num(t.lastNotified, 0),
    recurrence: str(t.recurrence, ''),
    repeatFrom: num(t.repeatFrom, 0),
    calendarUri: str(t.calendarUri, ''),
    remoteId: str(t.remoteId, ''),
    collapsed: bool(t.collapsed, false),
    parent: num(t.parent, 0),
    order: num(t.order, 0),
    read_only: bool(t.read_only, false),
    listKey: t.listId != null ? String(t.listId) : null
  }
  keepExtras(t, out, LEGACY_KEYS)
  return out
}

/** Coerce a real Tasks.org task entity (data.tasks[i].task) into internal form. */
export function normalizeRealTask(t, idx) {
  if (emptyId(t)) t = {}
  const out = {
    id: idx,
    title: str(t.title, ''),
    importance: clampImportance(t.priority),
    dueDate: num(t.dueDate, 0),
    hideUntil: num(t.hideUntil, 0),
    created: num(t.creationDate, 0),
    modified: num(t.modificationDate, 0),
    completed: num(t.completionDate, 0),
    deleted: num(t.deletionDate, 0),
    notes: str(t.notes, ''),
    estimatedSeconds: num(t.estimatedSeconds, 0),
    elapsedSeconds: num(t.elapsedSeconds, 0),
    timerStart: num(t.timerStart, 0),
    ringFlags: num(t.ringFlags, 0),
    lastNotified: num(t.reminderLast, num(t.lastNotified, 0)),
    recurrence: str(t.recurrence, ''),
    repeatFrom: num(t.repeatFrom, 0),
    calendarUri: str(t.calendarURI, ''),
    remoteId: str(t.remoteId, '0'),
    collapsed: bool(t.isCollapsed, false),
    parent: num(t.parent, 0),
    order: num(t.order, 0),
    read_only: bool(t.readOnly, false),
    listKey: null
  }
  if (!out.remoteId) out.remoteId = newRemoteId()
  keepExtras(t, out, REAL_EXTRA_SKIP)
  return out
}

/** Internal field to a real Tasks.org task object. Omitted keys stay at schema defaults. */
function toRealEntity(e) {
  const out = {}
  for (const spec of REAL_FIELDS) {
    const v = e[spec.internal]
    if (shouldOmit(spec, v)) continue
    out[spec.rename || spec.internal] = v
  }
  for (const k of Object.keys(e)) {
    if (!REAL_EXTRA_SKIP.has(k)) out[k] = e[k]
  }
  return out
}

// -------- task construction / inspection --------

export function newTask(format) {
  const now = Date.now()
  const base = { ...LEGACY_TASK, created: now, modified: now }
  if (format === 'real') {
    base.remoteId = newRemoteId()
  } else {
    base.remoteId = `urn:uuid:${crypto.randomUUID()}`
  }
  return base
}

// -------- parse --------

function parseReal(root) {
  const warnings = []
  const data = root.data
  const defs = emptyData()
  const unknownTop = {}
  for (const t of [
    'tasks',
    'places',
    'tags',
    'filters',
    'caldavAccounts',
    'caldavCalendars',
    'taskListMetadata',
    'taskAttachments'
  ]) {
    defs[t] = Array.isArray(data[t]) ? data[t] : []
  }
  for (const p of ['intPrefs', 'longPrefs', 'stringPrefs', 'boolPrefs', 'setPrefs']) {
    defs[p] = data[p] && typeof data[p] === 'object' && !Array.isArray(data[p]) ? data[p] : {}
  }
  for (const k of Object.keys(data)) {
    if (!DATA_KEYS.includes(k)) defs.other[k] = data[k] == null ? null : data[k]
  }
  if (!defs.other) defs.other = {}
  for (const k of Object.keys(root)) {
    if (!['version', 'timestamp', 'data'].includes(k)) unknownTop[k] = root[k]
  }

  const tasks = []
  const rows = {}
  const seenRid = new Set()
  defs.tasks.forEach((row, i) => {
    if (!row || typeof row !== 'object') {
      warnings.push(`task #${i + 1} is not an object; skipped`)
      return
    }
    if (!('task' in row)) {
      warnings.push(`task #${i + 1} has no "task" object; skipped`)
      return
    }
    const raw = row.task && typeof row.task === 'object' ? row.task : {}
    if (raw.title === undefined) warnings.push(`task #${i + 1} missing title`)
    const entity = normalizeRealTask(raw, i + 1)
    if (seenRid.has(entity.remoteId)) warnings.push(`task #${i + 1} has duplicate remoteId`)
    seenRid.add(entity.remoteId)
    entity.listKey =
      Array.isArray(row.caldavTasks) && row.caldavTasks[0]
        ? String(row.caldavTasks[0].calendar || '') || null
        : null
    tasks.push(entity)
    const r = {}
    for (const k of ROW_KEYS) {
      if (k in row) r[k] = row[k]
    }
    rows[entity.remoteId] = r
  })

  // Resolve CalDAV parent links: a child's caldavTasks[0].remoteParent holds the
  // parent's CalDAV remoteId. Set entity.parent to the parent's internal id so
  // the existing tree / hasSubtask logic can find children — only when the
  // parent is present in this same backup, otherwise the link is dangling.
  const calRidToTask = new Map()
  for (const t of tasks) {
    const r = rows[t.remoteId]
    const cals = r && Array.isArray(r.caldavTasks) ? r.caldavTasks : []
    const calRid = cals[0] && cals[0].remoteId
    if (calRid) calRidToTask.set(String(calRid), t)
  }
  for (const t of tasks) {
    if (t.parent) continue
    const r = rows[t.remoteId]
    const cals = r && Array.isArray(r.caldavTasks) ? r.caldavTasks : []
    const parentCalRid = cals[0] && cals[0].remoteParent
    if (!parentCalRid) continue
    const parent = calRidToTask.get(String(parentCalRid))
    if (parent) t.parent = parent.id
  }

  return {
    ok: true,
    data: {
      format: 'real',
      version: num(root.version, 1),
      timestamp: num(root.timestamp, 0),
      tasks,
      rows,
      defs,
      unknownTop
    },
    warnings
  }
}

function parseLegacy(root) {
  // legacy simple backup `{ version, tasks, lists, tags, places, alarms, ... }`
  const warnings = []
  const unknownTop = {}
  for (const k of Object.keys(root)) {
    if (!['version', 'tasks', 'lists', 'tags'].includes(k)) unknownTop[k] = root[k]
  }
  if (num(root.version, 1) <= 0) warnings.push('Missing or invalid "version"; defaulted to 1')
  const seen = new Set()
  const tasks = (Array.isArray(root.tasks) ? root.tasks : [])
    .map((t, i) => {
      if (emptyId(t)) {
        warnings.push(`task #${i + 1} is not an object; skipped`)
        return null
      }
      if (t.title === undefined || t.title === null) warnings.push(`task #${i + 1} missing title`)
      const n = normalizeTask(t)
      if (n.id !== 0 && n.id != null) {
        if (seen.has(n.id)) warnings.push(`task #${i + 1} has duplicate id ${n.id}`)
        seen.add(n.id)
      }
      return n
    })
    .filter(Boolean)

  const defs = {
    lists: (Array.isArray(root.lists) ? root.lists : [])
      .map((l) => (emptyId(l) ? null : { ...l }))
      .filter(Boolean),
    tags: (Array.isArray(root.tags) ? root.tags : [])
      .map((k) => (emptyId(k) ? null : { ...k }))
      .filter(Boolean)
  }

  return {
    ok: true,
    data: {
      format: 'legacy',
      version: num(root.version, 1),
      timestamp: num(root.timestamp, 0),
      tasks,
      defs,
      unknownTop
    },
    warnings
  }
}

/**
 * Parse a Tasks.org backup JSON string. Handles the real format
 * `{version, timestamp, data:{tasks:[{task,…}], tags:[…], …}}` (Tasks.org >= ~15.000)
 * and the legacy flat `{tasks:[…]}` shape. Returns `{ ok, data, warnings, error }`.
 */
export function parseBackup(text) {
  let root
  try {
    root = JSON.parse(text)
  } catch (e) {
    return { ok: false, data: null, warnings: [], error: `Invalid JSON — ${e.message}` }
  }
  if (!root || typeof root !== 'object' || Array.isArray(root)) {
    return { ok: false, data: null, warnings: [], error: 'Backup root must be a JSON object' }
  }
  return isRealBackup(root) ? parseReal(root) : parseLegacy(root)
}

// -------- serialize --------

function serializeReal(backup) {
  const defs = backup.defs || emptyData()
  const rows = backup.rows || {}
  const data = { ...emptyData() }
  for (const k of Object.keys(defs)) {
    if (k === 'other') continue
    data[k] = defs[k] == null ? [] : defs[k]
  }
  if (defs.other) {
    for (const k of Object.keys(defs.other)) data[k] = defs.other[k]
  }
  data.tasks = (backup.tasks || []).map((e) => {
    const row = rows[e.remoteId] || {}
    const out = { task: toRealEntity(e) }
    for (const k of ROW_KEYS) {
      if (k in row) out[k] = row[k]
    }
    for (const k of ['alarms', 'geofences', 'tags', 'comments', 'attachments', 'caldavTasks']) {
      if (!(k in out)) out[k] = row[k] || []
    }
    return out
  })
  const root = {
    version: num(backup.version, 1),
    timestamp: num(backup.timestamp, Date.now())
  }
  if (backup.unknownTop) {
    for (const k of Object.keys(backup.unknownTop)) root[k] = backup.unknownTop[k]
  }
  root.data = data
  return JSON.stringify(root, null, 2)
}

function serializeLegacy(backup) {
  const out =
    backup && typeof backup === 'object' && !Array.isArray(backup) ? { ...backup } : { version: 1 }
  delete out.format
  delete out.rows
  delete out.unknownTop
  const defs = (backup && backup.defs) || {}
  out.version = num(out.version, 1)
  out.tasks = (backup.tasks || []).map((t) => normalizeTask(t))
  out.lists = Array.isArray(defs.lists) ? defs.lists : Array.isArray(out.lists) ? out.lists : []
  out.tags = Array.isArray(defs.tags) ? defs.tags : Array.isArray(out.tags) ? out.tags : []
  if (out.unknownTop) delete out.unknownTop
  if (backup && backup.unknownTop) {
    for (const k of Object.keys(backup.unknownTop)) out[k] = backup.unknownTop[k]
  }
  return JSON.stringify(out, null, 2)
}

/**
 * Serialize a backup object back to JSON. Preserves unknown keys (round-trip safe).
 * Returns `{ data, warnings, error }`.
 */
export function serializeBackup(backup) {
  try {
    const data = backup && backup.format === 'real' ? serializeReal(backup) : serializeLegacy(backup)
    return { data, warnings: [], error: null }
  } catch (e) {
    return { data: null, warnings: [], error: e.message }
  }
}
