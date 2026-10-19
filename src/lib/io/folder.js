import { fsRoot, syncPath } from '../state.js'

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
