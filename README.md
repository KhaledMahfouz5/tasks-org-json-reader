# Tasks.org Backup Viewer

A 100% client-side web viewer/editor for [Tasks.org](https://tasks.org) Android backup `.json` files.

Import a backup, browse tasks, edit/create/delete them, and export back to a compatible file — all in the browser. No server, no telemetry, nothing leaves your device.

## Features

- **Import / export Tasks.org `.json` backups** via `File System Access API` (`showOpenFilePicker`/`showSaveFilePicker`) with classic `<input type=file>` / download fallbacks for other browsers
- **Full editing**: create, edit, soft-delete (Trash), restore, mark done, priorities, due dates (+ time), lists, tags, recurrence (RRULE)
- **Round-trip safe**: unknown/extra task fields are preserved verbatim; `id`/`remoteId` are never regenerated for existing tasks; exports re-parse with 0 warnings
- **Subtasks**: rendered indented with collapse/expand; parent id stored via `parent`
- **Filters**: All / Important / Today / Overdue / Completed / Trash, per-list and per-tag views
- **Light & dark themes** (system-detected default), **English + Arabic** with automatic RTL (`dir` attribute)
- **Mobile-first responsive** layout — sidebar becomes a slide-in drawer at ≤768px
- **Syncthing-friendly**: set a sync folder, enable **auto-save**, and every edit is written back to the backup file automatically
- **Offline-first**: state mirrors to `localStorage` (`taskorg:*` keys) so nothing is lost on reload
- Keyboard: `Ctrl/Cmd+O` import, `Ctrl/Cmd+S` save

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

## License

GNU General Public License v3.0 **only** — see [LICENSE](LICENSE).

## Using it with Tasks.org

1. **Export on your phone**: Tasks.org → menu → Settings → Backups → **Export tasks**.
2. **Import here**: drag the exported file onto the app, or use the "Import" / `Ctrl+O`.
3. **Edit**: click a task to edit, use the `+` button to add one.
4. **Export**: pick **Export** in the sidebar (or `Ctrl+S`). If the browser supports it (Chromium on desktop), you get a native save dialog; otherwise a download starts.

## Syncthing (two-minute setup)

1. Install [Syncthing](https://syncthing.net) on the phone and PC, create a shared folder, and put the app's backup folder inside it.
2. On the phone: Tasks.org → Backups → *Backup location* → point at that folder.
3. In this app: open **Sync** (top-right), press **Browse…** and select the same folder. Toggle **Auto-save to file**.
4. From now on every edit is written straight into that folder's backup file. On your phone, Tasks.org → Backups → **Import** the file after Syncthing syncs it.

> Desktop browsers are sandboxed: the app remembers the picked folder only for the current session (browser permission model). If there's no persisted folder handle, the first auto-save asks you to pick the folder again.

## Privacy

Everything runs in your browser tab. The app never uploads data — imports, edits and exports are local to your device. Data survives reloads via `localStorage`.

## Backup format

The app reads and writes the **real Tasks.org backup format** (as produced by in-app
`Settings → Backups → Export tasks`), verified against current Tasks.org source
(`data/src/commonMain/kotlin/org/tasks/data/entity/Task.kt`, `TasksJsonExporter.kt`):

```json
{
  "version": 151002,
  "timestamp": 1789708578920,
  "data": {
    "tasks": [
      {
        "task": {
          "title": "Buy groceries",
          "priority": 2,
          "notes": "…",
          "creationDate": 1789032600000,
          "modificationDate": 1789032600000,
          "dueDate": 1789808400000,
          "completionDate": 0,
          "deletionDate": 0,
          "recurrence": "RRULE:FREQ=WEEKLY;BYDAY=MO,WE",
          "calendarURI": "",
          "remoteId": "4144830798578906683",
          "isCollapsed": false,
          "order": 1,
          "readOnly": false
        },
        "alarms": [],
        "geofences": [],
        "tags": [{ "name": "groceries", "tagUid": "370295946272310178" }],
        "comments": [],
        "attachments": [],
        "caldavTasks": [{ "calendar": "716373021319801813", "remoteId": "558823063848684661" }]
      }
    ],
    "places": [],
    "tags": [{ "remoteId": "…", "name": "groceries", "color": -8522750, "icon": "shopping_cart" }],
    "filters": [],
    "caldavAccounts": [{ "uuid": "…", "accountType": 2 }],
    "caldavCalendars": [{ "account": "…", "uuid": "…", "name": "main", "icon": "check_circle" }],
    "taskListMetadata": [],
    "taskAttachments": [],
    "intPrefs": { },
    "longPrefs": { },
    "stringPrefs": { },
    "boolPrefs": { },
    "setPrefs": { }
  }
}
```

| Task field (real) | Meaning |
| --- | --- |
| `priority` | 0=HIGH, 1=MEDIUM, 2=LOW, 3=NONE (matches Tasks.org `Task.Priority`) |
| `dueDate` / `creationDate` / `modificationDate` / `completionDate` / `deletionDate` | epoch millis; `0` = none; `completionDate>0` = done; `deletionDate>0` = trashed |
| `recurrence` | RRULE string, kept verbatim |
| `remoteId` | stable string id — **never regenerated** for existing tasks; new tasks get a fresh numeric id |
| `isCollapsed` | collapsed subtask tree |
| `order` | manual sort order |
| `readOnly` | read-only task |
| *any other key* | preserved and re-serialized unchanged |

Round-trip rules: keys with default values are omitted on export (like Tasks.org does);
extra/unknown fields — on tasks, rows (e.g. `vtodo`, `dirtyVersion`, `syncedVersion`) or the
`data` object — are kept verbatim. Re-importing an exported file parses with 0 warnings.

A **legacy simplified shape** (`{ version, tasks, lists, tags }` with `importance`/`created`/`id`…)
is still accepted and re-emitted for convenience — it is the format of `sample-backup.json`.
`sample-backup-real.json` is the genuine Tasks.org format and is the recommended base for tests.

### Lists

Tasks.org stores a task's list as its `caldavTasks[0].calendar` UUID, which resolves to an entry
in `caldavCalendars` (the visible list name/icon). This app derives the sidebar lists and each
task's list from that mapping automatically — no separate bookkeeping. Switching a task's list in
the editor updates `caldavTasks` so the change survives the round-trip. In backups that store
`filters` (ListFilter entities), those are used as list definitions instead.

## Project tree

```
├── index.html
├── package.json
├── public/favicon.svg
├── sample-backup.json       # (legacy simplified format fixture)
├── sample-backup-real.json  # real Tasks.org format fixture
├── src/
│   ├── main.js
│   ├── App.svelte
│   ├── styles.css
│   ├── lib/
│   │   ├── backup.js   # parse/serialize/helpers
│   │   ├── i18n.js     # EN/AR strings
│   │   └── stores.js   # state + persistence + file IO
│   └── components/
│       ├── Header.svelte
│       ├── Sidebar.svelte
│       ├── DropZone.svelte
│       ├── EmptyState.svelte
│       ├── TaskList.svelte
│       ├── TaskItem.svelte
│       └── TaskEditor.svelte
└── vite.config.js
```