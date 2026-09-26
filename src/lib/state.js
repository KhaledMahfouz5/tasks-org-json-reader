import { writable, get } from 'svelte/store'
import { maxTaskId, buildRowTags, newRemoteId } from './backup.js'

function loadPersisted(key, fallback, validate) {
  let initial = fallback
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key)
      if (raw != null) {
        const v = JSON.parse(raw)
        initial = validate ? validate(v) : v
      }
    }
  } catch (e) {
    console.warn(`localStorage read failed for ${key}:`, e)
  }
  return initial
}

function persistOn(settable, key) {
  settable.subscribe((value) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (e) {
      console.warn(`localStorage write failed for ${key}:`, e)
    }
  })
}

function persisted(key, fallback, validate) {
  const store = writable(loadPersisted(key, fallback, validate))
  persistOn(store, key)
  return store
}

const initialLang = () =>
  typeof navigator !== 'undefined' && /^ar\b/.test(navigator.language || '') ? 'ar' : 'en'

export const lang = persisted('taskorg:lang', initialLang(), (v) =>
  ['en', 'ar'].includes(v) ? v : 'en'
)
export const theme = persisted('taskorg:theme', 'system', (v) =>
  ['light', 'dark', 'system'].includes(v) ? v : 'system'
)
export const backupData = persisted('taskorg:backup', null, (v) =>
  v && typeof v === 'object' ? v : null
)
export const originalFileName = writable('')
export const syncPath = persisted('taskorg:syncpath', '', (v) => String(v || ''))
export const autoSave = persisted('taskorg:autosave', false, (v) => Boolean(v))
export const activeFilter = writable('all')
export const searchQuery = writable('')
export const editing = writable(null)
export const editingListId = writable(null)
export const sidebarOpen = writable(false)
export const confirmState = writable(null)
export const syncOpen = writable(false)

export const fsRoot = writable(null)
export const currentFileHandle = writable(null)

export function updateTasks(fn) {
  backupData.update((d) => {
    if (!d) return d
    return { ...d, tasks: fn([...(d.tasks || [])]) }
  })
}

function findIndexById(tasks, task) {
  return tasks.findIndex(
    (t) =>
      (t.remoteId && task.remoteId && t.remoteId === task.remoteId) ||
      (t.id !== undefined && task.id !== undefined && t.id !== 0 && t.id === task.id)
  )
}

function patchTask(task, patch) {
  updateTasks((tasks) =>
    tasks.map((t) => (findIndexById([t], task) === 0 ? { ...t, ...patch } : t))
  )
}

export function setTaskDone(task, done) {
  if (!task || task.read_only) return false
  const stamp = Date.now()
  patchTask(task, { completed: done ? stamp : 0, modified: stamp })
  return true
}

export function softDeleteTask(task) {
  if (!task || task.read_only) return false
  const stamp = Date.now()
  patchTask(task, { deleted: stamp, modified: stamp })
  return true
}

export function restoreTask(task) {
  if (!task) return false
  patchTask(task, { deleted: 0, modified: Date.now() })
  return true
}

export function toggleCollapsed(task) {
  if (!task) return false
  updateTasks((tasks) =>
    tasks.map((t) => (findIndexById([t], task) === 0 ? { ...t, collapsed: !t.collapsed } : t))
  )
  return true
}

export function nextFreeId() {
  const d = get(backupData)
  return d ? maxTaskId(d) + 1 : 1
}

function stubRow() {
  return { alarms: [], geofences: [], tags: [], comments: [], attachments: [], caldavTasks: [] }
}

function commitRealRecord(next, task, listId, tagNames) {
  const rows = { ...(next.rows || {}) }
  const row = { ...stubRow(), ...(rows[task.remoteId] || {}) }
  if (Array.isArray(tagNames)) {
    const built = buildRowTags(next, tagNames)
    row.tags = built.tags
    if (built.newDefs.length) {
      const tagsDefs = [...(next.defs.tags || []), ...built.newDefs]
      next.defs = { ...next.defs, tags: tagsDefs }
    }
  }
  if (listId != null) {
    const current = Array.isArray(row.caldavTasks) ? row.caldavTasks[0] : null
    row.caldavTasks = [
      { calendar: String(listId), remoteId: (current && current.remoteId) || newRemoteId() }
    ]
  }
  rows[task.remoteId] = row
  next.rows = rows
  return next
}

function commitLegacyRecord(next, task, listId, tagNames) {
  if (Array.isArray(tagNames)) {
    const others = (next.defs.tags || []).filter((k) => k.taskUid !== task.remoteId)
    const byName = new Map(others.map((k) => [k.name, k.tagUid]))
    let nextId = others.reduce((m, k) => Math.max(m, k.id || 0), 0)
    const made = []
    for (const raw of tagNames) {
      const name = String(raw).trim()
      if (!name) continue
      let uid = byName.get(name)
      if (!uid) {
        uid = newRemoteId()
        byName.set(name, uid)
      }
      nextId += 1
      made.push({ id: nextId, name, tagUid: uid, taskUid: task.remoteId })
    }
    next.defs = { ...next.defs, tags: [...others, ...made] }
  }
  if (listId != null) {
    task.listId = listId
    next.tasks = [...next.tasks]
  }
  return next
}

/**
 * Save a task (create or update). Also applies the chosen list and tag names:
 * real backups keep tags in the task row and the list in its caldavTasks entry,
 * preserving everything else in the row for round-trip.
 */
export function commitTask(task, listId, tagNames) {
  if (!task) return null
  backupData.update((d) => {
    if (!d) return d
    const tasks = [...d.tasks]
    const finalTask = { ...task }
    if (d.format === 'legacy' && finalTask.id === 0) {
      finalTask.id = maxTaskId(d) + 1
    }
    if (!finalTask.remoteId) finalTask.remoteId = newRemoteId()
    finalTask.listKey = listId != null ? String(listId) : finalTask.listKey
    finalTask.modified = Date.now()

    const idx = findIndexById(tasks, finalTask)
    if (idx >= 0) tasks[idx] = finalTask
    else tasks.push(finalTask)

    const next = { ...d, tasks }
    return d.format === 'real'
      ? commitRealRecord(next, finalTask, listId, tagNames)
      : commitLegacyRecord(next, finalTask, listId, tagNames)
  })
  return task
}
