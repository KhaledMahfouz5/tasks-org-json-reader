import { readAsText, applyBackup } from './io.js'

/**
 * Read a File and apply it as a backup. Returns `{ ok, error?, warnings?, count? }`.
 * The caller decides how to surface success/failure (toasts, notifications, etc.).
 */
export async function importFile(file) {
  if (!file) return { ok: false, error: new Error('no-file') }
  try {
    const text = await readAsText(file)
    return applyBackup(text, file.name)
  } catch (e) {
    return { ok: false, error: e }
  }
}