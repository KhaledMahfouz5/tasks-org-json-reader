<script>
  import {
    backupData,
    activeFilter,
    editing,
    editingListId,
    confirmState,
    lang
  } from '@/lib/stores.js'
  import {
    isDone,
    isDeleted,
    hasSubtask,
    hasDueDate,
    dueLabel,
    recurrenceSummary,
    tagsFor,
    listOf,
    startOfToday
  } from '@/lib/backup.js'
  import { tr } from '@/lib/i18n.js'
  import {
    setTaskDone,
    softDeleteTask,
    restoreTask,
    toggleCollapsed
  } from '@/lib/stores.js'

  export let task
  export let depth = 0

  $: done = isDone(task)
  $: overdue = hasDueDate(task) && !done && task.dueDate < startOfToday()
  $: hasKids = hasSubtask(task, ($backupData && $backupData.tasks) || [])
  $: tags = $backupData ? tagsFor($backupData, task) : []
  $: listColor = $backupData ? (listOf($backupData, task.listKey) || {}).color : null
  $: trashView = $activeFilter === 'trash'

  function toggleDone() {
    if (task.read_only) return
    setTaskDone(task, !done)
  }

  function openEditor() {
    editing.set(task)
    editingListId.set(task.listKey || null)
  }

  function askDelete() {
    confirmState.set({
      title: tr($lang, 'confirmDeleteTitle'),
      message: tr($lang, 'confirmDeleteMsg'),
      onOk: () => softDeleteTask(task)
    })
  }

  function askRestore() {
    restoreTask(task)
  }

  function goTag(tagUid) {
    activeFilter.set(`tag:${tagUid}`)
  }

  function onKey(e) {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openEditor()
    }
  }

  const prioClass = {
    0: 'p-high',
    1: 'p-medium',
    2: 'p-low',
    3: 'p-none'
  }
</script>

<div
  class="task-item {prioClass[task.importance] || 'p-none'}"
  role="button"
  tabindex="0"
  aria-label={task.title || tr($lang, 'untitled')}
  on:click={openEditor}
  on:keydown={onKey}
  style="margin-inline-start:{depth * 20}px"
>
  <input
    type="checkbox"
    class="task-check"
    checked={done}
    disabled={task.read_only}
    aria-label={done ? tr($lang, 'open') : tr($lang, 'done')}
    on:click={(e) => e.stopPropagation()}
    on:change={toggleDone}
  />

  <div class="task-body">
    {#if hasKids}
      <button
        class="btn btn-icon"
        title={task.collapsed ? tr($lang, 'aria.expand') : tr($lang, 'aria.collapse')}
        aria-label={task.collapsed ? tr($lang, 'aria.expand') : tr($lang, 'aria.collapse')}
        style="width:26px;height:26px;padding:2px;float:inline-end"
        on:click|stopPropagation={() => toggleCollapsed(task)}
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;transform:{task.collapsed ? 'none' : 'rotate(90deg)'}">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    {/if}

    <div class="task-row">
      {#if listColor}
        <span class="nav-dot" style="background:{listColor}"></span>
      {/if}
      <span class="task-title" class:done>{task.title || tr($lang, 'untitled')}</span>
      {#if task.recurrence}
        <span
          class="chip"
          title={recurrenceSummary(task.recurrence, $lang)}
          aria-label={recurrenceSummary(task.recurrence, $lang)}
        >↻</span>
      {/if}
    </div>

    {#if task.notes}
      <p class="task-notes">{task.notes}</p>
    {/if}

    <div class="task-meta">
      {#if hasDueDate(task)}
        <span class="due-chip" class:danger={overdue}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {dueLabel(task, $lang)}
        </span>
      {/if}
      {#each tags as tag (tag.tagUid)}
        <button class="chip" on:click|stopPropagation={() => goTag(tag.tagUid)}>#{tag.name}</button>
      {/each}
    </div>
  </div>

  <div class="task-actions">
    {#if trashView}
      <button class="btn btn-icon" title={tr($lang, 'restore')} aria-label={tr($lang, 'restore')} on:click|stopPropagation={askRestore}>
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
        </svg>
      </button>
    {:else}
      <button class="btn btn-icon" title={tr($lang, 'aria.edit')} aria-label={tr($lang, 'aria.edit')} on:click|stopPropagation={openEditor}>
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 20h4L20 8l-4-4L4 16v4z" />
        </svg>
      </button>
      {#if !task.read_only}
        <button class="btn btn-icon" title={tr($lang, 'aria.delete')} aria-label={tr($lang, 'aria.delete')} on:click|stopPropagation={askDelete}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7h16" />
            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
          </svg>
        </button>
      {/if}
    {/if}
  </div>
</div>