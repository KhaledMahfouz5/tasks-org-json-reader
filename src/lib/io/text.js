import { parseBackup } from '../backup/io.js'
import { backupData, originalFileName } from '../state.js'

export function parseBackupText(text) {
  return parseBackup(text)
}

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
