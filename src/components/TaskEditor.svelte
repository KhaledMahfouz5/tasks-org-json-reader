<script>
  import { onMount, onDestroy, tick } from 'svelte'
  import {
    editing,
    editingListId,
    backupData,
    lang,
    confirmState,
    notify
  } from '@/lib/stores.js'
  import { commitTask, softDeleteTask, nextFreeId } from '@/lib/stores.js'
  import { tr } from '@/lib/i18n.js'
  import {
    PRIORITIES,
    tagsFor,
    listsOf,
    recurrenceSummary
  } from '@/lib/backup.js'

  $: task = $editing
  $: data = $backupData

  let form = { synced: null, title: '', notes: '', hasDue: false, dueDate: '', dueTime: '', priority: 3, done: false, tags: [], tagInput: '', recurrence: '', listId: '' }
  let titleEl

  $: if (task && (form.synced !== task.remoteId || form.modified !== task.modified)) {
    syncForm(task)
    tick().then(() => {
      if (titleEl) titleEl.focus()
    })
  }

  function syncForm(t) {
    form = {
      synced: t.remoteId,
      modified: t.modified,
      title: t.title || '',
      notes: t.notes || '',
      hasDue: t.dueDate > 0,
      dueDate: toDateInput(t.dueDate),
      dueTime: toTimeInput(t.dueDate),
      priority: t.importance != null ? t.importance : 3,
      done: t.completed > 0,
      tags: tagsFor(data, t).map((k) => k.name),
      tagInput: '',
      recurrence: t.recurrence || '',
      listId: $editingListId || t.listKey || ''
    }
  }

  function pad(n) {
    return String(n).padStart(2, '0')
  }

  function toDateInput(ms) {
    if (!ms) return ''
    const d = new Date(ms)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  function toTimeInput(ms) {
    if (!ms) return ''
    const d = new Date(ms)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function computedDue() {
    if (!form.hasDue) return 0
    const dateStr = form.dueDate || toDateInput(Date.now())
    if (!form.dueTime) return new Date(`${dateStr}T00:00:00`).getTime()
    return new Date(`${dateStr}T${form.dueTime}`).getTime()
  }

  function addTag() {
    const name = form.tagInput.trim()
    if (name && !form.tags.includes(name)) form.tags = [...form.tags, name]
    form.tagInput = ''
  }

  function removeTag(name) {
    form.tags = form.tags.filter((x) => x !== name)
  }

  function save() {
    if (!task) return
    const stamp = Date.now()
    const already = task.id !== 0
    const t = {
      ...task,
      id: task.id,
      title: form.title.trim(),
      notes: form.notes,
      importance: form.priority,
      completed: form.done ? (task.completed || stamp) : 0,
      dueDate: computedDue(),
      recurrence: form.recurrence,
      modified: stamp,
      created: task.created || stamp
    }
    if (!already) t.id = nextFreeId()
    const listId = form.listId ? String(form.listId) : null
    commitTask(t, listId, form.tags)
    notify(tr($lang, 'saved'), 'ok')
    close()
  }

  function askDelete() {
    confirmState.set({
      title: tr($lang, 'confirmDeleteTitle'),
      message: tr($lang, 'confirmDeleteMsg'),
      onOk: () => {
        softDeleteTask(task)
        editing.set(null)
      }
    })
  }

  function close() {
    form.synced = null
    editing.set(null)
    editingListId.set(null)
  }

  function backdropKey(e) {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      close()
    }
  }

  function backdropClick(e) {
    if (e.target === e.currentTarget) close()
  }

  function onEsc(e) {
    if (e.key === 'Escape') close()
  }

  onMount(() => {
    window.addEventListener('keydown', onEsc)
  })

  onDestroy(() => {
    window.removeEventListener('keydown', onEsc)
  })

  $: recPreview = recurrenceSummary(form.recurrence, $lang)
  $: isNew = task && task.id === 0
  $: readonly = !!(task && task.read_only)
</script>

{#if task}
  <div
    class="modal-backdrop"
    style="align-items:flex-end"
    role="button"
    tabindex="-1"
    aria-label={tr($lang, 'close')}
    on:click={backdropClick}
    on:keydown={backdropKey}
  >
    <div class="editor-sheet" role="dialog" aria-modal="true" aria-label={isNew ? tr($lang, 'addTask') : tr($lang, 'editTask')}>
      <div class="editor-title">
        <span>{isNew ? tr($lang, 'addTask') : tr($lang, 'editTask')}</span>
        <button class="btn btn-icon" on:click={close} aria-label={tr($lang, 'close')} title={tr($lang, 'close')}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {#if readonly}
        <p class="small muted" style="margin:0 0 12px">{tr($lang, 'readOnlyNotice')}</p>
      {/if}

      <div class="field">
        <label for="ed-title">{tr($lang, 'taskTitle')}</label>
        <input
          id="ed-title"
          class="input"
          type="text"
          bind:this={titleEl}
          bind:value={form.title}
          disabled={readonly}
          placeholder={tr($lang, 'taskTitle')}
        />
      </div>

      <div class="field">
        <label for="ed-notes">{tr($lang, 'taskNotes')}</label>
        <textarea
          id="ed-notes"
          class="textarea"
          bind:value={form.notes}
          disabled={readonly}
        ></textarea>
      </div>

      <div class="field">
        <span class="switch-row" style="justify-content:space-between">
          <label for="ed-due" class="small" style="font-weight:600;color:var(--muted)">{tr($lang, 'dueDate')}</label>
          <button class="btn btn-icon" title={tr($lang, 'clearDue')} on:click={() => (form.hasDue = false)} disabled={!form.hasDue || readonly}>
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
        {#if form.hasDue}
          <div class="form-row-2">
            <input id="ed-due" class="input" type="date" bind:value={form.dueDate} disabled={readonly} />
            <input class="input" type="time" bind:value={form.dueTime} disabled={readonly} />
          </div>
        {:else}
          <button class="btn" on:click={() => (form.hasDue = true)} disabled={readonly}>
            {tr($lang, 'dueDate')}
          </button>
        {/if}
      </div>

      <div class="field">
        <span class="small" style="font-weight:600;color:var(--muted)">{tr($lang, 'priority')}</span>
        <div class="prio-chips">
          {#each PRIORITIES as p (p.value)}
            <button
              class="prio-chip"
              class:active={form.priority === p.value}
              on:click={() => (form.priority = p.value)}
              disabled={readonly}
            >
              {tr($lang, p.key)}
            </button>
          {/each}
        </div>
      </div>

      <div class="field">
        <label class="switch-row">
          <span>{tr($lang, 'done')}</span>
          <input type="checkbox" class="checkbox" bind:checked={form.done} disabled={readonly} />
        </label>
      </div>

      <div class="field">
        <label for="ed-list">{tr($lang, 'list')}</label>
        <select id="ed-list" class="select" bind:value={form.listId} disabled={readonly}>
          <option value="">—</option>
          {#each listsOf(data) as list (list.key)}
            <option value={list.key}>{list.name || tr($lang, 'untitled')}</option>
          {/each}
        </select>
      </div>

      <div class="field">
        <span class="small" style="font-weight:600;color:var(--muted)">{tr($lang, 'tags')}</span>
        {#if form.tags.length}
          <div class="tag-cloud">
            {#each form.tags as name (name)}
              <span class="tag-token">
                {name}
                <button on:click={() => removeTag(name)} aria-label={tr($lang, 'close')}>&times;</button>
              </span>
            {/each}
          </div>
        {/if}
        <input
          class="input"
          type="text"
          bind:value={form.tagInput}
          placeholder={tr($lang, 'tagPlaceholder')}
          disabled={readonly}
          on:keydown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            } else if (e.key === 'Backspace' && !form.tagInput && form.tags.length) {
              form.tags = form.tags.slice(0, -1)
            }
          }}
          on:blur={addTag}
        />
      </div>

      <div class="field">
        <label for="ed-rec">{tr($lang, 'recurrence')}</label>
        <input id="ed-rec" class="input" type="text" bind:value={form.recurrence} disabled={readonly} placeholder="RRULE:FREQ=WEEKLY;BYDAY=MO,WE" />
        {#if recPreview}
          <p class="small muted" style="margin:6px 0 0">{tr($lang, 'recurrencePreview', { summary: recPreview })}</p>
        {/if}
      </div>

      <div class="form-actions">
        {#if !isNew && !readonly}
          <button class="btn btn-danger-text" on:click={askDelete}>
            {tr($lang, 'delete')}
          </button>
        {/if}
        <button class="btn" on:click={close}>{tr($lang, 'cancel')}</button>
        <button class="btn btn-primary" on:click={save} disabled={readonly}>
          {tr($lang, 'save')}
        </button>
      </div>
    </div>
  </div>
{/if}