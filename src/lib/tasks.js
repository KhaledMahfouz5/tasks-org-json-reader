import { get } from 'svelte/store'
import { backupData } from './state.js'
import { maxTaskId, buildRowTags } from './backup/query.js'
import { newRemoteId } from './backup/schema.js'

// Match predicate: same logical task by remoteId, else by numeric id (id 0 = unsaved).
// Returned as a factory so .findIndex / .map can reuse it without re-creating closures.
export function matchesTask(target) {
  return (t) =>
    (target.remoteId && t.remoteId === target.remoteId) ||
    (target.id !== undefined && target.id !== 0 && t.id === target.id)
}

function patchMatching(tasks, target, transform) {
  const match = matchesTask(target)
  return tasks.map((t) => (match(t) ? transform(t) : t))
}

export function updateTasks(fn) {
  backupData.update((d) => (d ? { ...d, tasks: fn([...(d.tasks || [])]) } : d))
}

export function setTaskDone(task, done) {
  if (!task || task.read_only) return false
  const stamp = Date.now()
  backupData.update((d) =>
    d
      ? {
          ...d,
          tasks: patchMatching(d.tasks, task, (t) => ({
            ...t,
            completed: done ? stamp : 0,
            modified: stamp
          }))
        }
      : d
  )
  return true
}

export function softDeleteTask(task) {
  if (!task || task.read_only) return false
  const stamp = Date.now()
  backupData.update((d) =>
    d
      ? {
          ...d,
          tasks: patchMatching(d.tasks, task, (t) => ({ ...t, deleted: stamp, modified: stamp }))
        }
      : d
  )
  return true
}

export function restoreTask(task) {
  if (!task) return false
  const stamp = Date.now()
  backupData.update((d) =>
    d ? { ...d, tasks: patchMatching(d.tasks, task, (t) => ({ ...t, deleted: 0, modified: stamp })) } : d
  )
  return true
}

export function toggleCollapsed(task) {
  if (!task) return false
  backupData.update((d) =>
    d
      ? {
          ...d,
          tasks: patchMatching(d.tasks, task, (t) => ({ ...t, collapsed: !t.collapsed }))
        }
      : d
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

    const idx = tasks.findIndex(matchesTask(finalTask))
    if (idx >= 0) tasks[idx] = finalTask
    else tasks.push(finalTask)

    const next = { ...d, tasks }
    return d.format === 'real'
      ? commitRealRecord(next, finalTask, listId, tagNames)
      : commitLegacyRecord(next, finalTask, listId, tagNames)
  })
  return task
}
