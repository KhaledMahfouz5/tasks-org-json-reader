import { translations, tr } from './i18n.js'

export const DAY = 24 * 60 * 60 * 1000

export const PRIORITIES = [
  { value: 0, key: 'importance.high' },
  { value: 1, key: 'importance.medium' },
  { value: 2, key: 'importance.low' },
  { value: 3, key: 'importance.none' }
]

export const LEGACY_TASK = {
  id: 0,
  title: '',
  importance: 3,
  dueDate: 0,
  hideUntil: 0,
  created: 0,
  modified: 0,
  completed: 0,
  deleted: 0,
  notes: '',
  estimatedSeconds: 0,
  elapsedSeconds: 0,
  timerStart: 0,
  ringFlags: 0,
  lastNotified: 0,
  recurrence: '',
  repeatFrom: 0,
  calendarUri: '',
  remoteId: '',
  collapsed: false,
  parent: 0,
  order: 0,
  read_only: false,
  listKey: null
}

export const DEFAULT_TASK = LEGACY_TASK

// real (Tasks.org) task entity field name -> internal name
const REAL_FIELD = {
  title: 'title',
  priority: 'importance',
  dueDate: 'dueDate',
  hideUntil: 'hideUntil',
  creationDate: 'created',
  modificationDate: 'modified',
  completionDate: 'completed',
  deletionDate: 'deleted',
  notes: 'notes',
  estimatedSeconds: 'estimatedSeconds',
  elapsedSeconds: 'elapsedSeconds',
  timerStart: 'timerStart',
  ringFlags: 'ringFlags',
  reminderLast: 'lastNotified',
  recurrence: 'recurrence',
  repeatFrom: 'repeatFrom',
  calendarURI: 'calendarUri',
  remoteId: 'remoteId',
  isCollapsed: 'collapsed',
  parent: 'parent',
  order: 'order',
  readOnly: 'read_only'
}

const REAL_DEFAULTS = {
  title: null,
  priority: 3,
  dueDate: 0,
  hideUntil: 0,
  creationDate: 0,
  modificationDate: 0,
  completionDate: 0,
  deletionDate: 0,
  notes: null,
  estimatedSeconds: 0,
  elapsedSeconds: 0,
  timerStart: 0,
  ringFlags: 0,
  reminderLast: 0,
  recurrence: null,
  repeatFrom: 0,
  calendarURI: null,
  remoteId: null,
  isCollapsed: false,
  parent: 0,
  order: null,
  readOnly: false
}

const ROW_KEYS = [
  'alarms',
  'geofences',
  'tags',
  'comments',
  'attachments',
  'caldavTasks',
  'vtodo',
  'dirtyVersion',
  'syncedVersion'
]

const DATA_KEYS = [
  'tasks',
  'places',
  'tags',
  'filters',
  'caldavAccounts',
  'caldavCalendars',
  'taskListMetadata',
  'taskAttachments',
  'intPrefs',
  'longPrefs',
  'stringPrefs',
  'boolPrefs',
  'setPrefs'
]

const DEFAULT_COLORS = ['#6C63F6', '#4CAF50', '#FF7043', '#1E88E5', '#FDD835', '#8E24AA', '#00ACC1', '#E53935']

function emptyId(t) {
  return !t || typeof t !== 'object'
}

function num(v, fb) {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  return fb
}

function str(v, fb) {
  if (typeof v === 'string') return v
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  if (typeof v === 'boolean') return String(v)
  return fb
}

function bool(v, fb) {
  return typeof v === 'boolean' ? v : fb
}

function clampImportance(v) {
  const n = num(v, 3)
  if (n !== n) return 3
  return Math.min(3, Math.max(0, n))
}

export function isRealBackup(raw) {
  return (
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    raw.data &&
    typeof raw.data === 'object' &&
    Array.isArray(raw.data.tasks) &&
    (raw.data.tasks.length === 0 || (raw.data.tasks[0] && typeof raw.data.tasks[0] === 'object' && 'task' in raw.data.tasks[0]))
  )
}

/** New numeric-string id in the style Tasks.org uses for remoteId/tagUid. */
export function newRemoteId() {
  return String(Math.floor(Math.random() * 9e15) + 1e15)
}

function keepExtras(source, out, internalKeys) {
  for (const k of Object.keys(source)) {
    if (!internalKeys.has(k)) out[k] = source[k]
  }
}

const LEGACY_KEYS = new Set(Object.keys(LEGACY_TASK))

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

const INTERNAL_KEYS = new Set([...Object.keys(LEGACY_TASK), 'listKey'])
const REAL_NAMES = new Set([...Object.keys(REAL_FIELD), 'id', 'listKey'])
const REAL_EXTRA_SKIP = new Set([...INTERNAL_KEYS, ...REAL_NAMES])

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
  const put = (internal, real, ndef) => {
    const v = e[internal]
    if (v !== undefined && v !== ndef) out[real] = v
  }
  const is0 = (v) => v == null || v === 0
  put('title', 'title', null)
  put('importance', 'priority', 3)
  if (!is0(e.dueDate)) out.dueDate = e.dueDate
  if (!is0(e.hideUntil)) out.hideUntil = e.hideUntil
  if (!is0(e.created)) out.creationDate = e.created
  if (!is0(e.modified)) out.modificationDate = e.modified
  if (!is0(e.completed)) out.completionDate = e.completed
  if (!is0(e.deleted)) out.deletionDate = e.deleted
  if (e.notes) out.notes = e.notes
  if (e.estimatedSeconds) out.estimatedSeconds = e.estimatedSeconds
  if (e.elapsedSeconds) out.elapsedSeconds = e.elapsedSeconds
  if (!is0(e.timerStart)) out.timerStart = e.timerStart
  if (e.ringFlags) out.ringFlags = e.ringFlags
  if (!is0(e.lastNotified)) out.reminderLast = e.lastNotified
  if (e.recurrence) out.recurrence = e.recurrence
  if (e.repeatFrom) out.repeatFrom = e.repeatFrom
  if (e.calendarUri) out.calendarURI = e.calendarUri
  put('remoteId', 'remoteId', null)
  if (e.collapsed) out.isCollapsed = true
  if (!is0(e.parent)) out.parent = e.parent
  if (e.order) out.order = e.order
  if (e.read_only) out.readOnly = e.read_only
  for (const k of Object.keys(e)) {
    if (!REAL_EXTRA_SKIP.has(k)) out[k] = e[k]
  }
  return out
}

function emptyData() {
  return {
    tasks: [],
    places: [],
    tags: [],
    filters: [],
    caldavAccounts: [],
    caldavCalendars: [],
    taskListMetadata: [],
    taskAttachments: [],
    intPrefs: {},
    longPrefs: {},
    stringPrefs: {},
    boolPrefs: {},
    setPrefs: {}
  }
}

/**
 * Parse a Tasks.org backup JSON string. Handles the real format
 * `{version, timestamp, data:{tasks:[{task,…}], tags:[…], …}}` (Tasks.org >= ~15.000)
 * and the legacy flat `{tasks:[…]}` shape. Returns `{ ok, data, warnings, error }`.
 */
export function parseBackup(text) {
  const warnings = []
  let root
  try {
    root = JSON.parse(text)
  } catch (e) {
    return { ok: false, data: null, warnings, error: `Invalid JSON — ${e.message}` }
  }
  if (!root || typeof root !== 'object' || Array.isArray(root)) {
    return { ok: false, data: null, warnings, error: 'Backup root must be a JSON object' }
  }

  if (isRealBackup(root)) {
    const data = root.data
    const defs = emptyData()
    const unknownTop = {}
    for (const t of ['tasks', 'places', 'tags', 'filters', 'caldavAccounts', 'caldavCalendars', 'taskListMetadata', 'taskAttachments']) {
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
      entity.listKey = Array.isArray(row.caldavTasks) && row.caldavTasks[0] ? String(row.caldavTasks[0].calendar || '') || null : null
      tasks.push(entity)
      const r = {}
      for (const k of ROW_KEYS) {
        if (k in row) r[k] = row[k]
      }
      rows[entity.remoteId] = r
    })

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

  // legacy simple backup `{ version, tasks, lists, tags, places, alarms, ... }`
  const unknownTop = {}
  for (const k of Object.keys(root)) {
    if (!['version', 'tasks', 'lists', 'tags'].includes(k)) unknownTop[k] = root[k]
  }
  if (num(root.version, 1) <= 0) warnings.push('Missing or invalid "version"; defaulted to 1')
  const seen = new Set()
  const tasks = (Array.isArray(root.tasks) ? root.tasks : []).map((t, i) => {
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
  }).filter(Boolean)

  const defs = {
    lists: (Array.isArray(root.lists) ? root.lists : []).map((l) => (emptyId(l) ? null : { ...l })).filter(Boolean),
    tags: (Array.isArray(root.tags) ? root.tags : []).map((k) => (emptyId(k) ? null : { ...k })).filter(Boolean)
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
 * Serialize a backup object back to JSON. Preserves unknown keys (round-trip safe).
 * Returns `{ data, warnings, error }`.
 */
export function serializeBackup(backup) {
  const warnings = []
  try {
    if (backup && backup.format === 'real') {
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
        timestamp: num(backup.timestamp, Date.now()),
        data
      }
      if (backup.unknownTop) {
        for (const k of Object.keys(backup.unknownTop)) root[k] = backup.unknownTop[k]
      }
      return { data: JSON.stringify(root, null, 2), warnings, error: null }
    }

    // legacy serialize
    const out =
      backup && typeof backup === 'object' && !Array.isArray(backup)
        ? { ...backup }
        : { version: 1 }
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
    return { data: JSON.stringify(out, null, 2), warnings, error: null }
  } catch (e) {
    return { data: null, warnings, error: e.message }
  }
}

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

export function maxTaskId(data) {
  if (!data || !Array.isArray(data.tasks)) return 0
  return data.tasks.reduce((m, t) => (t && num(t.id, 0) > m ? t.id : m), 0)
}

export function isDone(t) {
  return !!t && t.completed > 0
}

export function isDeleted(t) {
  return !!t && t.deleted > 0
}

export function hasDueDate(t) {
  return !!t && t.dueDate > 0
}

export function hasSubtask(t, tasks) {
  if (!t || !Array.isArray(tasks)) return false
  return tasks.some((c) => c && c.parent === t.id)
}

export function hasDueTime(t) {
  // Tasks.org encodes time when the millis are not on a whole minute
  return !!t && t.dueDate > 0 && t.dueDate % 60000 > 0
}

export function priorityLabel(p, lang) {
  const entry = PRIORITIES.find((x) => x.value === clampImportance(p))
  return tr(lang, entry.key)
}

export function priorityColor(p) {
  const names = { 0: 'high', 1: 'medium', 2: 'low', 3: 'none' }
  return `var(--p-${names[clampImportance(p)]})`
}

export function startOfToday() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()
}

export function dueLabel(t, lang) {
  if (!hasDueDate(t)) return ''
  const locale = lang === 'ar' ? 'ar' : 'en'
  const today = startOfToday()
  const due = new Date(t.dueDate)
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime()
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
  const time = hasDueTime(t) ? ` · ${timeFmt.format(due)}` : ''
  if (dueStart < today) return tr(lang, 'due.overdue') + time
  if (dueStart === today) return tr(lang, 'due.today') + time
  if (dueStart === today + DAY) return tr(lang, 'due.tomorrow') + time
  const dateFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' })
  return dateFmt.format(due) + time
}

const WEEKDAY_LETTERS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
const MONDAY_BASE = new Date(2026, 8, 14).getTime()

function weekdayNames(locale) {
  const dtf = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  return WEEKDAY_LETTERS.map((_, i) => dtf.format(new Date(MONDAY_BASE + i * DAY)))
}

export function recurrenceSummary(rrule, lang) {
  if (!rrule || typeof rrule !== 'string') return ''
  const raw = rrule.trim()
  if (!raw) return ''
  const body = raw.replace(/^RRULE:/i, '')
  if (!/^FREQ=/i.test(body)) return raw
  const parts = {}
  for (const p of body.split(';')) {
    const idx = p.indexOf('=')
    if (idx > 0) parts[p.slice(0, idx).toUpperCase()] = p.slice(idx + 1)
  }
  const freq = String(parts.FREQ || '').toUpperCase()
  const interval = num(parts.INTERVAL, 1)
  const byday = parts.BYDAY ? parts.BYDAY.split(',') : []
  const locale = lang === 'ar' ? 'ar' : 'en'
  const freqParts = {
    DAILY: [tr(lang, 'recur.day'), tr(lang, 'recur.days')],
    WEEKLY: [tr(lang, 'recur.week'), tr(lang, 'recur.weeks')],
    MONTHLY: [tr(lang, 'recur.month'), tr(lang, 'recur.months')],
    YEARLY: [tr(lang, 'recur.year'), tr(lang, 'recur.years')]
  }
  const pair = freqParts[freq]
  if (!pair) return raw
  const every = tr(lang, 'recur.every')
  const intervalText = new Intl.NumberFormat(lang === 'ar' ? 'ar' : 'en').format(interval)
  const base =
    interval === 1 ? `${every} ${pair[0]}` : `${every} ${intervalText} ${pair[1]}`
  if (freq === 'WEEKLY' && byday.length) {
    const order = byday
      .map((d) => WEEKDAY_LETTERS.indexOf(String(d).toUpperCase().replace(',', '')))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b)
    const names = weekdayNames(locale)
    const days = order.map((i) => names[i])
    if (days.length) return `${base} · ${days.join(', ')}`
  }
  return base
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

export function argbToCss(v, fallback) {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback || null
  const n = v >>> 0
  return `#${[16, 8, 0].map((s) => ((n >> s) & 255).toString(16).padStart(2, '0')).join('')}`
}

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
    return { all: 0, important: 0, today: 0, overdue: 0, completed: 0, trash: 0, byList: {}, byTag: {} }
  }
  const today = startOfToday()
  const counts = { all: 0, important: 0, today: 0, overdue: 0, completed: 0, trash: 0, byList: {}, byTag: {} }
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