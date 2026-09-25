import { writable, get } from 'svelte/store'
import { parseBackup, serializeBackup, maxTaskId, buildRowTags, newRemoteId } from './backup.js'
import { tr } from './i18n.js'

let toastTimer = null

function persisted(key, fallback, validate) {
  let initial = fallback
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key)
      if (raw != null) {
        const v = JSON.parse(raw)
        initial = validate ? validate(v) : v
      }
    }
  } catch {
    // corrupted storage: start over
  }
  const store = writable(initial)
  store.subscribe((value) => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = JSON.stringify(value)
        if (raw !== undefined) localStorage.setItem(key, raw)
        else localStorage.removeItem(key)
      }
    } catch {
      // quota exceeded: keep in memory only
    }
  })
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
export const toast = writable(null)

export const fsRoot = writable(null)
export const currentFileHandle = writable(null)

export function notify(msg, type) {
  toast.set({ msg, type: type || 'ok', id: Date.now() })
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.set(null), 2500)
}

// ----- data mutations -----

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
  if (!task || task.read_only) return
  const stamp = Date.now()
  patchTask(task, { completed: done ? stamp : 0, modified: stamp })
}

export function softDeleteTask(task) {
  if (!task || task.read_only) return
  patchTask(task, { deleted: Date.now(), modified: Date.now() })
}

export function restoreTask(task) {
  patchTask(task, { deleted: 0, modified: Date.now() })
}

export function toggleCollapsed(task) {
  updateTasks((tasks) =>
    tasks.map((t) => (findIndexById([t], task) === 0 ? { ...t, collapsed: !t.collapsed } : t))
  )
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
  if (!task) return
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

// ----- import / export IO -----

export function applyBackup(text, fileName) {
  const res = parseBackup(text)
  if (!res.ok) {
    notify(tr(get(lang), 'invalidJson', { error: res.error }), 'err')
    return false
  }
  backupData.set(res.data)
  if (fileName) originalFileName.set(fileName)
  notify(tr(get(lang), 'importSuccess', { count: res.data.tasks.length }), 'ok')
  return true
}

function downloadText(text, name) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export async function saveBackupFile() {
  const data = get(backupData)
  if (!data) return false
  const name = get(originalFileName) || (data.format === 'real' ? 'tasks-org-backup.json' : 'tasks-backup.json')
  const ser = serializeBackup(data)
  if (ser.error) {
    notify(tr(get(lang), 'exportFailed', { error: ser.error }), 'err')
    return false
  }
  const handle = get(currentFileHandle)
  if (handle && handle.createWritable) {
    try {
      const w = await handle.createWritable()
      await w.write(ser.data)
      await w.close()
      notify(tr(get(lang), 'saved'), 'ok')
      return true
    } catch {
      // fall through to picker / download
    }
  }
  if (typeof window !== 'undefined' && window.showSaveFilePicker) {
    try {
      const fh = await window.showSaveFilePicker({
        suggestedName: name,
        types: [{ description: 'Tasks.org backup', accept: { 'application/json': ['.json'] } }]
      })
      const w = await fh.createWritable()
      await w.write(ser.data)
      await w.close()
      currentFileHandle.set(fh)
      notify(tr(get(lang), 'exportSuccess'), 'ok')
      return true
    } catch (e) {
      if (e && e.name === 'AbortError') return false
    }
  }
  downloadText(ser.data, name)
  notify(tr(get(lang), 'exportDownload'), 'ok')
  return true
}

let dirPrompted = false
let nonFsaWarned = false

export async function autoSaveNow() {
  const data = get(backupData)
  if (!data || !get(autoSave) || !get(syncPath)) return
  const ser = serializeBackup(data)
  if (ser.error) return
  const name = get(originalFileName) || 'tasks-org-backup.json'
  let dir = get(fsRoot)
  if (dir && dir.kind === 'files') {
    if (!nonFsaWarned) {
      nonFsaWarned = true
      notify(tr(get(lang), 'autoSaveUnsupported'), 'err')
    }
    return
  }
  try {
    if (!dir && typeof window !== 'undefined' && window.showDirectoryPicker && !dirPrompted) {
      dirPrompted = true
      dir = await window.showDirectoryPicker({ mode: 'readwrite' })
      fsRoot.set(dir)
      syncPath.set(dir.name)
    }
    if (!dir) {
      // no usable folder handle: fall back to a normal save
      await saveBackupFile()
      return
    }
    const fh = await dir.getFileHandle(name, { create: true })
    const w = await fh.createWritable()
    await w.write(ser.data)
    await w.close()
    currentFileHandle.set(fh)
    notify(tr(get(lang), 'saved'), 'ok')
  } catch (e) {
    if (e && e.name === 'AbortError') return // user cancelled the picker
    notify(tr(get(lang), 'autoSaveFailed', { error: e && e.message ? e.message : '…' }), 'err')
  }
}

export function supportsFolderPicker() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

export async function pickSyncFolder() {
  if (typeof window === 'undefined') return false
  if (window.showDirectoryPicker) {
    try {
      const dir = await window.showDirectoryPicker({ mode: 'readwrite' })
      fsRoot.set(dir)
      syncPath.set(dir.name)
      notify(tr(get(lang), 'folderPicked', { name: dir.name }), 'ok')
      return true
    } catch (e) {
      if (e && e.name === 'AbortError') return false
      throw e
    }
  }
  return pickSyncFolderLegacy()
}

/** Folder chooser fallback (Firefox, non-secure contexts) via a folder file input. */
function pickSyncFolderLegacy() {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.setAttribute('webkitdirectory', '')
    input.multiple = true
    input.style.display = 'none'
    const cleanup = () => setTimeout(() => input.remove(), 0)
    input.addEventListener('change', () => {
      const f = input.files && input.files[0]
      let folder = f && f.webkitRelativePath ? f.webkitRelativePath.split('/')[0] : null
      folder = folder || (f && f.name) || ''
      cleanup()
      if (folder) {
        syncPath.set(folder)
        fsRoot.set({ name: folder, kind: 'files' })
        notify(tr(get(lang), 'folderPicked', { name: folder }), 'ok')
        resolve(true)
      } else {
        resolve(false)
      }
    })
    input.addEventListener('cancel', () => {
      cleanup()
      resolve(false)
    })
    document.body.appendChild(input)
    input.click()
    setTimeout(cleanup, 60000)
  })
}

export function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}