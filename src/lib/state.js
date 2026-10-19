import { writable } from 'svelte/store'

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
// `searchDraft` mirrors the input field; `searchCommitted` is only updated
// when the user presses Enter (or clears the search), so the task list
// doesn't re-render on every keystroke.
export const searchDraft = writable('')
export const searchCommitted = writable('')
export const editing = writable(null)
export const editingListId = writable(null)
export const sidebarOpen = writable(false)
export const confirmState = writable(null)
export const syncOpen = writable(false)
export const optionsOpen = writable(false)

const GROUP_FIELDS = ['nothing', 'deadline', 'start', 'priority', 'modified', 'created', 'list']
const DIRECTIONS = ['asc', 'desc']

export const groupBy = persisted('taskorg:groupBy', 'deadline', (v) =>
  GROUP_FIELDS.includes(v) ? v : 'deadline'
)
export const groupDir = persisted('taskorg:groupDir', 'asc', (v) =>
  DIRECTIONS.includes(v) ? v : 'asc'
)
export const sortBy = persisted('taskorg:sortBy', 'deadline', (v) =>
  GROUP_FIELDS.includes(v) ? v : 'deadline'
)
export const sortDir = persisted('taskorg:sortDir', 'asc', (v) =>
  DIRECTIONS.includes(v) ? v : 'asc'
)
export const showNotStarted = persisted('taskorg:showNotStarted', false, (v) => Boolean(v))

export const fsRoot = writable(null)
export const currentFileHandle = writable(null)
