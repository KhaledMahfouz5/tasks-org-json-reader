import { get } from 'svelte/store'
import { serializeBackup } from '../backup/io.js'
import {
  backupData,
  syncPath,
  autoSave,
  fsRoot,
  currentFileHandle,
  originalFileName
} from '../state.js'
import { saveBackupFile, writeThroughHandle } from './save.js'

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
