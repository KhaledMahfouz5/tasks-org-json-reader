// Backup-format schema: constants, field maps, and small primitives that
// describe the file shape and the in-memory model.
// Only this module knows the format details; everything else builds on them.

export const DAY = 24 * 60 * 60 * 1000

export const PRIORITIES = [
  { value: 0, key: 'importance.high' },
  { value: 1, key: 'importance.medium' },
  { value: 2, key: 'importance.low' },
  { value: 3, key: 'importance.none' }
]

export const LEGACY_TASK = {
  id: 0,
  title: '',
  importance: 3,
  dueDate: 0,
  hideUntil: 0,
  created: 0,
  modified: 0,
  completed: 0,
  deleted: 0,
  notes: '',
  estimatedSeconds: 0,
  elapsedSeconds: 0,
  timerStart: 0,
  ringFlags: 0,
  lastNotified: 0,
  recurrence: '',
  repeatFrom: 0,
  calendarUri: '',
  remoteId: '',
  collapsed: false,
  parent: 0,
  order: 0,
  read_only: false,
  listKey: null
}

export const DEFAULT_TASK = LEGACY_TASK

// real (Tasks.org) task entity field name -> internal name
export const REAL_FIELD = {
  title: 'title',
  priority: 'importance',
  dueDate: 'dueDate',
  hideUntil: 'hideUntil',
  creationDate: 'created',
  modificationDate: 'modified',
  completionDate: 'completed',
  deletionDate: 'deleted',
  notes: 'notes',
  estimatedSeconds: 'estimatedSeconds',
  elapsedSeconds: 'elapsedSeconds',
  timerStart: 'timerStart',
  ringFlags: 'ringFlags',
  reminderLast: 'lastNotified',
  recurrence: 'recurrence',
  repeatFrom: 'repeatFrom',
  calendarURI: 'calendarUri',
  remoteId: 'remoteId',
  isCollapsed: 'collapsed',
  parent: 'parent',
  order: 'order',
  readOnly: 'read_only'
}

const REAL_DEFAULTS = {
  title: null,
  priority: 3,
  dueDate: 0,
  hideUntil: 0,
  creationDate: 0,
  modificationDate: 0,
  completionDate: 0,
  deletionDate: 0,
  notes: null,
  estimatedSeconds: 0,
  elapsedSeconds: 0,
  timerStart: 0,
  ringFlags: 0,
  reminderLast: 0,
  recurrence: null,
  repeatFrom: 0,
  calendarURI: null,
  remoteId: null,
  isCollapsed: false,
  parent: 0,
  order: null,
  readOnly: false
}

export const REAL_FIELDS = [
  { internal: 'title', rename: 'title', omit: 'default:null' },
  { internal: 'importance', rename: 'priority', omit: 'default:3' },
  { internal: 'dueDate', rename: 'dueDate', omit: 'zero' },
  { internal: 'hideUntil', rename: 'hideUntil', omit: 'zero' },
  { internal: 'created', rename: 'creationDate', omit: 'zero' },
  { internal: 'modified', rename: 'modificationDate', omit: 'zero' },
  { internal: 'completed', rename: 'completionDate', omit: 'zero' },
  { internal: 'deleted', rename: 'deletionDate', omit: 'zero' },
  { internal: 'notes', rename: 'notes', omit: 'truthy' },
  { internal: 'estimatedSeconds', omit: 'truthy' },
  { internal: 'elapsedSeconds', omit: 'truthy' },
  { internal: 'timerStart', rename: 'timerStart', omit: 'zero' },
  { internal: 'ringFlags', rename: 'ringFlags', omit: 'truthy' },
  { internal: 'lastNotified', rename: 'reminderLast', omit: 'zero' },
  { internal: 'recurrence', rename: 'recurrence', omit: 'truthy' },
  { internal: 'repeatFrom', rename: 'repeatFrom', omit: 'truthy' },
  { internal: 'calendarUri', rename: 'calendarURI', omit: 'truthy' },
  { internal: 'remoteId', rename: 'remoteId', omit: 'default:null' },
  { internal: 'collapsed', rename: 'isCollapsed', omit: 'truthy' },
  { internal: 'parent', rename: 'parent', omit: 'zero' },
  { internal: 'order', rename: 'order', omit: 'truthy' },
  { internal: 'read_only', rename: 'readOnly', omit: 'truthy' }
]

export const ROW_KEYS = [
  'alarms',
  'geofences',
  'tags',
  'comments',
  'attachments',
  'caldavTasks',
  'vtodo',
  'dirtyVersion',
  'syncedVersion'
]

export const DATA_KEYS = [
  'tasks',
  'places',
  'tags',
  'filters',
  'caldavAccounts',
  'caldavCalendars',
  'taskListMetadata',
  'taskAttachments',
  'intPrefs',
  'longPrefs',
  'stringPrefs',
  'boolPrefs',
  'setPrefs'
]

export const DEFAULT_COLORS = [
  '#6C63F6',
  '#4CAF50',
  '#FF7043',
  '#1E88E5',
  '#FDD835',
  '#8E24AA',
  '#00ACC1',
  '#E53935'
]

export const LEGACY_KEYS = new Set(Object.keys(LEGACY_TASK))
const INTERNAL_KEYS = new Set([...Object.keys(LEGACY_TASK), 'listKey'])
const REAL_NAMES = new Set([...Object.keys(REAL_FIELD), 'id', 'listKey'])
export const REAL_EXTRA_SKIP = new Set([...INTERNAL_KEYS, ...REAL_NAMES])

/** New numeric-string id in the style Tasks.org uses for remoteId/tagUid. */
export function newRemoteId() {
  return String(Math.floor(Math.random() * 9e15) + 1e15)
}

export function emptyData() {
  return {
    tasks: [],
    places: [],
    tags: [],
    filters: [],
    caldavAccounts: [],
    caldavCalendars: [],
    taskListMetadata: [],
    taskAttachments: [],
    intPrefs: {},
    longPrefs: {},
    stringPrefs: {},
    boolPrefs: {},
    setPrefs: {}
  }
}
