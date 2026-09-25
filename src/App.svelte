<script>
  import { onMount, onDestroy } from 'svelte'
  import { writable } from 'svelte/store'
  import Header from './components/Header.svelte'
  import Sidebar from './components/Sidebar.svelte'
  import DropZone from './components/DropZone.svelte'
  import EmptyState from './components/EmptyState.svelte'
  import TaskList from './components/TaskList.svelte'
  import TaskEditor from './components/TaskEditor.svelte'
  import {
    lang,
    theme,
    backupData,
    syncOpen,
    confirmState,
    toast,
    sidebarOpen,
    syncPath,
    autoSave,
    notify,
    saveBackupFile,
    applyBackup,
    readAsText,
    autoSaveNow,
    pickSyncFolder
  } from '@/lib/stores.js'
  import { tr, dirFor } from '@/lib/i18n.js'

  const osDark = writable(false)

  let importInput
  let dragging = false
  let dragDepth = 0
  let autoTimer = null
  let cleanupFns = []

  $: resolvedTheme = $theme === 'system' ? ($osDark ? 'dark' : 'light') : $theme

  $: if (typeof document !== 'undefined') {
    document.documentElement.lang = $lang
    document.documentElement.dir = dirFor($lang)
    document.documentElement.dataset.theme = resolvedTheme
  }

  $: if ($backupData) {
    clearTimeout(autoTimer)
    autoTimer = setTimeout(() => autoSaveNow(), 500)
  }

  async function handleImportFile(file) {
    if (!file) return
    try {
      const text = await readAsText(file)
      applyBackup(text, file.name)
    } catch {
      notify(tr($lang, 'fileReadError'), 'err')
    } finally {
      if (importInput) importInput.value = ''
    }
  }

  function onKey(e) {
    const mod = e.ctrlKey || e.metaKey
    if (mod && (e.key === 'o' || e.key === 'O')) {
      e.preventDefault()
      if (importInput) importInput.click()
    }
    if (mod && (e.key === 's' || e.key === 'S')) {
      e.preventDefault()
      saveBackupFile()
    }
  }

  function closeConfirm() {
    confirmState.set(null)
  }

  function backdropClose(fn) {
    return (e) => {
      if (e.target === e.currentTarget) {
        fn()
      }
    }
  }

  function doConfirm() {
    const c = $confirmState
    if (c && typeof c.onOk === 'function') c.onOk()
    closeConfirm()
  }

  onMount(() => {
    const onEnter = (e) => {
      e.preventDefault()
      dragDepth += 1
      dragging = true
    }
    const onOver = (e) => e.preventDefault()
    const onLeave = () => {
      dragDepth = Math.max(0, dragDepth - 1)
      if (dragDepth === 0) dragging = false
    }
    const onDrop = (e) => {
      e.preventDefault()
      dragDepth = 0
      dragging = false
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
      if (f) handleImportFile(f)
    }
    const onMq = (ev) => osDark.set(ev.matches)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    osDark.set(mq.matches)
    if (mq.addEventListener) mq.addEventListener('change', onMq)
    else mq.addListener(onMq)

    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragover', onOver)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('drop', onDrop)
    window.addEventListener('keydown', onKey)

    if (import.meta.env.MODE === 'test') {
      fetch('/Tasks-backups/tasks-backup.json')
        .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
        .then((text) => applyBackup(text, 'tasks-backup.json'))
        .catch(() => {})
    }

    cleanupFns = [
      () => {
        if (mq.removeEventListener) mq.removeEventListener('change', onMq)
        else mq.removeListener(onMq)
      },
      () => window.removeEventListener('dragenter', onEnter),
      () => window.removeEventListener('dragover', onOver),
      () => window.removeEventListener('dragleave', onLeave),
      () => window.removeEventListener('drop', onDrop),
      () => window.removeEventListener('keydown', onKey)
    ]
  })

  onDestroy(() => {
    cleanupFns.forEach((fn) => fn())
  })
</script>

<input
  bind:this={importInput}
  type="file"
  accept=".json,application/json"
  style="display:none"
  on:change={(e) => handleImportFile(e.target.files[0])}
  tabindex="-1"
/>

{#if $backupData}
  <div class="app">
    <Sidebar />
    <div class="main">
      <Header />
      <main class="content">
        <TaskList />
      </main>
      <footer class="footer">
        <span>{tr($lang, 'footer')}</span>
        <a href="https://tasks.org" target="_blank" rel="noopener">{tr($lang, 'openTasksOrg')}</a>
        <span class="kbd-hint">{tr($lang, 'kbdImport')} · {tr($lang, 'kbdSave')}</span>
      </footer>
    </div>
  </div>
{:else}
  <main class="content">
    <EmptyState />
  </main>
{/if}

<TaskEditor />

{#if dragging}
  <div class="modal-backdrop">
    <div style="width:min(560px,100%)"><DropZone /></div>
  </div>
{/if}

{#if $confirmState}
  <div
    class="modal-backdrop"
    role="button"
    tabindex="-1"
    aria-label={tr($lang, 'close')}
    on:click={backdropClose(closeConfirm)}
    on:keydown={backdropClose(closeConfirm)}
  >
    <div class="modal" role="alertdialog" aria-modal="true">
      <h2>{$confirmState.title}</h2>
      <p class="muted">{#if $confirmState.message}{$confirmState.message}{/if}</p>
      <div class="form-actions">
        <button class="btn" on:click={closeConfirm}>{tr($lang, 'cancel')}</button>
        <button class="btn btn-primary danger-ok" on:click={doConfirm}>
          {$confirmState.okLabel || tr($lang, 'delete')}
        </button>
      </div>
    </div>
  </div>
{/if}

{#if $syncOpen}
  <div
    class="modal-backdrop"
    role="button"
    tabindex="-1"
    aria-label={tr($lang, 'close')}
    on:click={backdropClose(() => syncOpen.set(false))}
    on:keydown={backdropClose(() => syncOpen.set(false))}
  >
    <div class="modal" role="dialog" aria-modal="true">
      <h2>{tr($lang, 'syncTitle')}</h2>
      <ol>
        <li>{tr($lang, 'syncStep1')}</li>
        <li>{tr($lang, 'syncStep2')}</li>
        <li>{tr($lang, 'syncStep3')}</li>
      </ol>

      <div class="field">
        <label for="sync-path">{tr($lang, 'syncFolder')}</label>
        <div style="display:flex;gap:8px">
          <input id="sync-path" class="input" type="text" bind:value={$syncPath} placeholder={tr($lang, 'folderPath')} />
          <button class="btn" on:click={() => pickSyncFolder()}>{tr($lang, 'browse')}</button>
        </div>
        <p class="small muted" style="margin:6px 0 0">{tr($lang, 'syncPathHint')}</p>
      </div>

      <label class="switch-row" style="margin-block-end:16px">
        <span>{tr($lang, 'autoSave')}</span>
        <span class="switch">
          <input type="checkbox" bind:checked={$autoSave} />
          <span class="track"></span>
        </span>
      </label>

      <div class="form-actions">
        <button class="btn btn-primary" on:click={() => syncOpen.set(false)}>{tr($lang, 'close')}</button>
      </div>
    </div>
  </div>
{/if}

{#if $toast}
  <div class="toast {$toast.type}" role="status">
    {#if $toast.type === 'ok'}
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    {:else}
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:16px;height:16px">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 15.5v.5" />
      </svg>
    {/if}
    <span>{$toast.msg}</span>
  </div>
{/if}