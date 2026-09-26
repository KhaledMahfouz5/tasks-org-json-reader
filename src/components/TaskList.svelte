<script>
  import {
    backupData,
    activeFilter,
    searchQuery,
    lang,
    editing,
    editingListId
  } from '@/lib/state.js'
  import { tr } from '@/lib/i18n.js'
  import {
    newTask,
    isDone,
    isDeleted,
    hasDueDate,
    sortTasks,
    startOfToday,
    tagsFor,
    listOf,
    uniqueTags,
    DAY
  } from '@/lib/backup.js'
  import TaskItem from './TaskItem.svelte'

  $: data = $backupData
  $: tasks = (data && data.tasks) || []
  $: filter = $activeFilter
  $: query = $searchQuery.trim().toLowerCase()
  $: todayStart = startOfToday()

  function open(t) {
    return !isDone(t)
  }

  function match(t) {
    if (!query) return true
    return `${t.title || ''} ${t.notes || ''}`.toLowerCase().includes(query)
  }

  $: filtered = (() => {
    if (!data) return []
    if (filter === 'trash') return tasks.filter((t) => isDeleted(t) && match(t))
    const live = tasks.filter((t) => !isDeleted(t) && match(t))
    if (filter === 'completed') return live.filter(isDone)
    if (filter === 'important') return live.filter((t) => open(t) && t.importance < 3)
    if (filter === 'today')
      return live.filter((t) => open(t) && t.dueDate >= todayStart && t.dueDate < todayStart + DAY)
    if (filter === 'overdue') return live.filter((t) => open(t) && t.dueDate > 0 && t.dueDate < todayStart)
    if (filter === 'all') return live.filter(open)
    if (filter.startsWith('list:'))
      return live.filter((t) => open(t) && String(t.listKey) === filter.slice(5))
    if (filter.startsWith('tag:'))
      return live.filter((t) =>
        open(t) && tagsFor(data, t).some((k) => k.tagUid === filter.slice(4))
      )
    return []
  })()

  $: tree = filter === 'all' && !query && filtered.some((t) => t.parent && filtered.some((p) => p.id === t.parent))

  function nodeRows(list) {
    const byParent = new Map()
    const ids = new Set(list.map((t) => t.id))
    for (const t of list) {
      const key = t.parent && ids.has(t.parent) ? t.parent : 0
      if (!byParent.has(key)) byParent.set(key, [])
      byParent.get(key).push(t)
    }
    const out = []
    const walk = (pid, depth) => {
      for (const row of sortTasks(byParent.get(pid) || [])) {
        out.push({ t: row, depth })
        if (!row.collapsed) walk(row.id, depth + 1)
      }
    }
    walk(0, 0)
    return out
  }

  $: rows = tree ? nodeRows(filtered) : sortTasks(filtered).map((t) => ({ t, depth: 0 }))

  function bucket(t) {
    if (!hasDueDate(t)) return 'someday'
    if (t.dueDate < todayStart) return 'overdue'
    if (t.dueDate < todayStart + DAY) return 'today'
    return 'upcoming'
  }

  $: singleLabel = (() => {
    if (filter === 'all') return ''
    if (filter.startsWith('list:')) {
      const l = listOf(data, filter.slice(5))
      return l ? l.name : ''
    }
    if (filter.startsWith('tag:')) {
      const k = (uniqueTags(data) || []).find((x) => x.tagUid === filter.slice(4))
      return k ? k.name : ''
    }
    return tr($lang, filter)
  })()

  $: groups = (() => {
    if (tree || !filtered.length) return []
    if (filter === 'all') {
      const map = { overdue: [], today: [], upcoming: [], someday: [] }
      for (const t of filtered) map[bucket(t)].push(t)
      return ['overdue', 'today', 'upcoming', 'someday']
        .map((key) => {
          const items = sortTasks(map[key])
          return { key, label: tr($lang, `group.${key}`), items, rows: nodeRows(items) }
        })
        .filter((g) => g.items.length)
    }
    const items = sortTasks(filtered)
    return [{ key: filter, label: singleLabel || tr($lang, filter), items, rows: nodeRows(items) }]
  })()

  function currentListKey() {
    return filter.startsWith('list:') ? filter.slice(5) : null
  }

  function addTask() {
    editingListId.set(currentListKey())
    editing.set(newTask(data && data.format))
  }
</script>

{#if tree}
  <div class="task-list">
    {#each rows as { t, depth } (t.remoteId || t.id)}
      <TaskItem task={t} {depth} />
    {/each}
  </div>
{:else if groups.length}
  {#each groups as g (g.key)}
    <div class="group-title">
      <span>{g.label}</span>
      <span class="nav-count">{g.items.length}</span>
    </div>
    <div class="task-list">
      {#each g.rows as { t, depth } (t.remoteId || t.id)}
        <TaskItem task={t} {depth} />
      {/each}
    </div>
  {/each}
{:else}
  <div class="empty">
    <p style="margin:0 0 6px"><strong>{tr($lang, 'noTasks')}</strong></p>
    <p class="muted small" style="margin:0">{query ? tr($lang, 'noResults') : tr($lang, 'noTasksHint')}</p>
  </div>
{/if}

<button class="fab" on:click={addTask} title={tr($lang, 'addTask')} aria-label={tr($lang, 'addTask')}>
  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
</button>