<script>
  import {
    backupData,
    activeFilter,
    sidebarOpen,
    syncPath,
    autoSave,
    lang
  } from '@/lib/state.js'
  import { notify } from '@/lib/notify.js'
  import { tr } from '@/lib/i18n.js'
  import { taskCounts, uniqueTags, listsOf } from '@/lib/backup.js'
  import { saveBackupFile } from '@/lib/io.js'

  $: data = $backupData
  $: counts = data ? taskCounts(data) : null
  $: lists = data ? listsOf(data) : []
  $: tags = data ? uniqueTags(data) : []

  function countOf(value) {
    if (!counts) return 0
    if (value.startsWith('list:')) return counts.byList[value.slice(5)] || 0
    if (value.startsWith('tag:')) return counts.byTag[value.slice(4)] || 0
    return counts[value] || 0
  }

  function setFilter(value) {
    activeFilter.set(value)
    sidebarOpen.set(false)
  }

  async function onExport() {
    const res = await saveBackupFile()
    if (!res.ok) notify(tr($lang, 'exportFailed', { error: res.error?.message || res.reason || '…' }), 'err')
    else notify(tr($lang, res.via === 'download' ? 'exportDownload' : 'exportSuccess'), 'ok')
  }
</script>

<nav class="sidebar" class:open={$sidebarOpen} aria-label={tr($lang, 'filters')}>
  <div class="sidebar-sect">{tr($lang, 'filters')}</div>
  {#each [
    ['all', 'all'],
    ['important', 'important'],
    ['today', 'today'],
    ['overdue', 'overdue'],
    ['completed', 'completed'],
    ['trash', 'trash']
  ] as [key, value] (key)}
    <button class="nav-item" class:active={$activeFilter === value} on:click={() => setFilter(value)}>
      <span>{tr($lang, key)}</span>
      <span class="nav-count">{countOf(value)}</span>
    </button>
  {/each}

  {#if lists.length}
    <div class="sidebar-sect">{tr($lang, 'lists')}</div>
    {#each lists as list (list.key)}
      <button
        class="nav-item"
        class:active={$activeFilter === `list:${list.key}`}
        on:click={() => setFilter(`list:${list.key}`)}
      >
        <span class="nav-dot" style="background:{list.color || 'var(--p-none)'}"></span>
        <span>{list.name || tr($lang, 'untitled')}</span>
        <span class="nav-count">{countOf(`list:${list.key}`)}</span>
      </button>
    {/each}
  {/if}

  {#if tags.length}
    <div class="sidebar-sect">{tr($lang, 'tags')}</div>
    {#each tags as tag (tag.tagUid)}
      <button
        class="nav-item"
        class:active={$activeFilter === `tag:${tag.tagUid}`}
        on:click={() => setFilter(`tag:${tag.tagUid}`)}
      >
        <span># {tag.name}</span>
        <span class="nav-count">{countOf(`tag:${tag.tagUid}`)}</span>
      </button>
    {/each}
  {/if}

  <div class="sidebar-foot">
    {#if $syncPath}
      <span class="sync-status">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px">
          <path d="M20 11A8 8 0 1 0 18 17" />
          <path d="M20 4v6h-6" />
        </svg>
        <span title={$syncPath}>{$syncPath}</span>
      </span>
    {:else}
      <span class="sync-status">{tr($lang, 'syncNotSet')}</span>
    {/if}

    <label class="switch-row">
      <span>{tr($lang, 'autoSave')}</span>
      <span class="switch">
        <input type="checkbox" bind:checked={$autoSave} />
        <span class="track"></span>
      </span>
    </label>

    <button class="btn btn-primary" on:click={onExport}>
      {tr($lang, 'export')}
    </button>
  </div>
</nav>

<div
  class="scrim"
  class:show={$sidebarOpen}
  role="button"
  tabindex="-1"
  aria-label={tr($lang, 'aria.close')}
  on:click={() => sidebarOpen.set(false)}
  on:keydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      sidebarOpen.set(false)
    }
  }}
></div>