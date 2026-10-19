# TODO — Tasks.org Backup Webapp

Complete. See `README.md` for usage, format details and the ownership notes below.

## Living Roadmap

- [x] Config fix: drop `runes` from svelte.config.js
- [x] `npm install` green (Svelte 5.57.2, Vite 8.3.4, plugin-svelte 7.3.1)
- [x] `src/lib/backup/schema.js` — format constants + id generator
- [x] `src/lib/backup/io.js` — parseBackup / serializeBackup + normalize + coerce helpers
- [x] `src/lib/backup/query.js` — predicates + lists/tags/counts/sort
- [x] `src/lib/backup/format.js` — locale-aware UI formatters
- [x] `src/lib/i18n.js` — EN/AR strings + dirFor
- [x] `src/lib/state.js` — reactive state + localStorage persistence
- [x] `src/lib/tasks.js` — task-domain mutations on the backup store
- [x] `src/lib/io/text.js` — readAsText, applyBackup (file-input → store flow)
- [x] `src/lib/io/save.js` — three save strategies (handle / picker / download) chained by `saveBackupFile`
- [x] `src/lib/io/folder.js` — folder picker (modern `showDirectoryPicker` + `webkitdirectory` fallback)
- [x] `src/lib/io/auto-save.js` — auto-save orchestrator on top of `save.js` + `folder.js`
- [x] `src/lib/file-import.js`, `src/lib/notify.js`, `src/lib/search.js` — focused helpers
- [x] `src/styles.css` — tokens, light/dark, RTL, responsive primitives
- [x] Components: Header, Sidebar, DropZone, EmptyState, TaskList, TaskItem, TaskEditor
- [x] `src/App.svelte` — shell, sync modal, toasts, kbd shortcuts
- [x] `public/favicon.svg`
- [x] `sample-backup.json` fixture
- [x] `README.md` (usage + Syncthing setup)
- [x] `npm run dev` + `npm run build` verified; round-trip browser flow documented

## Open design decisions — resolved

**Backup schema (corrected).** The simplified schema in the original brief was wrong for real
Tasks.org backups. Verified against source (`Task.kt`, `TasksJsonExporter.kt`) and real exported
files: the actual format is `{version, timestamp, data:{tasks:[{task, alarms, geofences, tags,
comments, attachments, caldavTasks, …}], tags:[{remoteId,name,color,icon}], filters, caldavCalendars,
…prefs}}`. `backup.js` parses/serializes this real format round-trip-safely (0 warnings on all 6
user backups), with the legacy flat shape still accepted/emitted for compatibility.

**Lists.** Tasks.org stores a task's list as `caldavTasks[0].calendar` UUID → `caldavCalendars`
(name/icon). Lists are derived from that mapping automatically; the editor writes back
`caldavTasks`. The earlier `taskListMap` override layer was removed.

**Priority.** Real enum confirmed `0=HIGH, 1=MEDIUM, 2=LOW, 3=NONE`; out-of-range values clamp to NONE.

**Sync "Browse".** Pick a folder via `showDirectoryPicker` (Chromium) with a `webkitdirectory`
folder-menu fallback for Firefox/non-secure contexts. In-place auto-save requires Chromium; other
browsers can choose the folder (reference) and save via Export.

## Deliberate scope notes

- File System Access handles are in-memory; desktop folders are re-picked per session
  (browser permission model). Documented in README.
- `src/main.js` mounts the root component via `mount(App, { target })` from `svelte/`
  (Svelte 5 runtime API). All `.svelte` files keep their legacy Svelte 4 syntax — Svelte 5
  supports it natively per the [official migration guide](https://svelte.dev/docs/svelte/v5-migration-guide),
  so every component renders unchanged. The one-line migration back to `mount(...)` from
  `new App({ target })` cleared 7 `npm audit` advisories (svelte SSR XSS / source-map-js /
  esbuild dev-server SSRF).
- Automated browser tests: limited to flows reachable before file-upload (see
  `testsprite_tests/`). File import verified programmatically (parse→serialize→re-parse =
  0 warnings, unknown fields intact).