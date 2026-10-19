import { get } from 'svelte/store'
import { serializeBackup } from '../backup/io.js'
import { backupData, originalFileName, currentFileHandle } from '../state.js'

/* ---------- save strategies (mechanisms) ----------
 * Each returns a tagged result:
 *   { ok: true }                       — wrote
 *   { ok: false, reason: 'cancelled' } — user cancelled
 *   { ok: false, error }               — anything else
 *   null                                — strategy did not apply
 */

export async function writeThroughHandle(handle, text) {
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
