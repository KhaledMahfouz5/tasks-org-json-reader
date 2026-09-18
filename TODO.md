# TODO — Tasks.org Backup Webapp

Complete. See `README.md` for usage, format details and the ownership notes below.

## Living Roadmap

- [x] Config fix: drop `runes` from svelte.config.js
- [x] `npm install` green (Svelte 4.2.20, Vite 5.4, plugin-svelte 3)
- [x] `src/lib/backup.js` — parse/serialize/helpers + round-trip tests
- [x] `src/lib/i18n.js` — EN/AR strings + dirFor
- [x] `src/lib/stores.js` — lang/theme/backupData/filters/toast stores + file IO
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
- `main.js` was already Svelte-5-style (`mount`); Svelte 4 has no `mount`, so rewritten to
  `new App({ target })`.
- Automated browser tests: limited to flows reachable before file-upload (see
  `testsprite_tests/`). File import verified programmatically (parse→serialize→re-parse =
  0 warnings, unknown fields intact).