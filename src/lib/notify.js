import { writable } from 'svelte/store'

let toastTimer = null

export const toast = writable(null)

export function notify(msg, type) {
  toast.set({ msg, type: type || 'ok', id: Date.now() })
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.set(null), 2500)
}
