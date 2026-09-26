// Thin re-export shim: the previous monolithic stores.js has been split into
// focused modules (state, io, notify). Components should keep importing from
// here; new code may import directly from the focused modules.

export * from './state.js'
export {
  readAsText,
  applyBackup,
  saveBackupFile,
  autoSaveNow,
  pickSyncFolder,
  supportsFolderPicker,
  parseBackupText
} from './io.js'
export { notify, toast } from './notify.js'