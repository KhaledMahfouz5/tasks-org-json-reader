import { get } from 'svelte/store'
import { parseBackup, serializeBackup } from './backup.js'
import {
  backupData,
  originalFileName,
  currentFileHandle,
  fsRoot,
  syncPath,
  autoSave
} from './state.js'

/* ---------- parsers / serializers (pure, no I/O) ---------- */

export function parseBackupText(text) {
  return parseBackup(text)
}

/* ---------- file import ---------- */

export function applyBackup(text, fileName) {
  const res = parseBackup(text)
  if (!res.ok) {
    return { ok: false, error: res.error, warnings: res.warnings || [] }
  }
  backupData.set(res.data)
  if (fileName) originalFileName.set(fileName)
  return { ok: true, count: res.data.tasks.length, warnings: res.warnings || [] }
}

export function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/* ---------- save strategies (mechanisms) ----------
 * Each returns a tagged result:
 *   { ok: true }                       — wrote
 *   { ok: false, reason: 'cancelled' } — user cancelled
 *   { ok: false, error }               — anything else
 *   null                                — strategy did not apply
 */

async function writeThroughHandle(handle, text) {
  const w = await handle.createWritable()
  await w.write(text)
  await w.close()
}

async function writeToExistingHandle(text) {
  const handle = get(currentFileHandle)
  if (!handle || !handle.createWritable) return null
  try {
    await writeThroughHandle(handle, text)
    return { ok: true }
  } catch (e) {
    console.warn('existing-handle write failed; falling through:', e)
    return { ok: false, error: e }
  }
}

async function writeViaSavePicker(text, suggestedName) {
  if (typeof window === 'undefined' || !window.showSaveFilePicker) return null
  try {
    const fh = await window.showSaveFilePicker({
      suggestedName,
      types: [{ description: 'Tasks.org backup', accept: { 'application/json': ['.json'] } }]
    })
    await writeThroughHandle(fh, text)
    currentFileHandle.set(fh)
    return { ok: true }
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: false, reason: 'cancelled' }
    return { ok: false, error: e }
  }
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
  return { ok: true, via: 'download' }
}

function defaultName(data) {
  if (get(originalFileName)) return get(originalFileName)
  return data.format === 'real' ? 'tasks-org-backup.json' : 'tasks-backup.json'
}

/**
 * Try the strategies in order; first one that applies wins.
 * Returns `{ ok, via?, reason?, error? }`.
 */
export async function saveBackupFile() {
  const data = get(backupData)
  if (!data) return { ok: false, reason: 'no-data' }

  const ser = serializeBackup(data)
  if (ser.error) return { ok: false, error: new Error(ser.error) }

  const text = ser.data
  const name = defaultName(data)

  return (
    (await writeToExistingHandle(text)) ||
    (await writeViaSavePicker(text, name)) ||
    downloadText(text, name)
  )
}

/* ---------- folder picker (Syncthing) ---------- */

export function supportsFolderPicker() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

export async function pickSyncFolder() {
  if (typeof window === 'undefined') return { ok: false, reason: 'no-window' }
  if (window.showDirectoryPicker) {
    try {
      const dir = await window.showDirectoryPicker({ mode: 'readwrite' })
      fsRoot.set(dir)
      syncPath.set(dir.name)
      return { ok: true, name: dir.name }
    } catch (e) {
      if (e && e.name === 'AbortError') return { ok: false, reason: 'cancelled' }
      return { ok: false, error: e }
    }
  }
  return pickSyncFolderLegacy()
}

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
        return resolve({ ok: true, name: folder, via: 'webkitdirectory' })
      }
      resolve({ ok: false, reason: 'no-folder' })
    })
    input.addEventListener('cancel', () => {
      cleanup()
      resolve({ ok: false, reason: 'cancelled' })
    })
    document.body.appendChild(input)
    input.click()
    setTimeout(cleanup, 60000)
  })
}

/* ---------- auto-save ---------- */

let dirPrompted = false
let nonFsaWarned = false

async function promptForDirIfNeeded() {
  if (get(fsRoot)) return get(fsRoot)
  if (typeof window === 'undefined' || !window.showDirectoryPicker) return null
  if (dirPrompted) return null
  dirPrompted = true
  try {
    const dir = await window.showDirectoryPicker({ mode: 'readwrite' })
    fsRoot.set(dir)
    syncPath.set(dir.name)
    return dir
  } catch (e) {
    if (!e || e.name !== 'AbortError') console.warn('directory picker failed:', e)
    return null
  }
}

export async function autoSaveNow() {
  const data = get(backupData)
  if (!data || !get(autoSave) || !get(syncPath)) return { ok: false, reason: 'not-configured' }

  const ser = serializeBackup(data)
  if (ser.error) return { ok: false, error: new Error(ser.error) }

  const dir = get(fsRoot)
  if (dir && dir.kind === 'files') {
    if (!nonFsaWarned) {
      nonFsaWarned = true
      return { ok: false, reason: 'unsupported', error: new Error('folder-only browser') }
    }
    return { ok: false, reason: 'unsupported' }
  }

  const target = dir || (await promptForDirIfNeeded())
  if (!target) {
    return saveBackupFile()
  }

  const name = get(originalFileName) || 'tasks-org-backup.json'
  try {
    const fh = await target.getFileHandle(name, { create: true })
    await writeThroughHandle(fh, ser.data)
    currentFileHandle.set(fh)
    return { ok: true }
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: false, reason: 'cancelled' }
    return { ok: false, error: e }
  }
}
