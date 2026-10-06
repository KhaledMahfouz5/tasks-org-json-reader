<script>
  import {
    backupData,
    activeFilter,
    searchQuery,
    lang,
    editing,
    editingListId,
    groupBy,
    groupDir,
    sortBy,
    sortDir,
    showNotStarted
  } from '@/lib/state.js'
  import { tr } from '@/lib/i18n.js'
  import {
    newTask,
    isDone,
    isDeleted,
    hasDueDate,
    startOfToday,
    tagsFor,
    listOf,
    uniqueTags,
    listsOf,
    DAY
  } from '@/lib/backup.js'
  import TaskItem from './TaskItem.svelte'

  $: data = $backupData
  $: tasks = (data && data.tasks) || []
  $: filter = $activeFilter
  $: query = $searchQuery.trim().toLowerCase()
  $: todayStart = startOfToday()
  $: gBy = $groupBy
  $: gDir = $groupDir
  $: sBy = $sortBy
  $: sDir = $sortDir
  $: notStarted = $showNotStarted

  function open(t) {
    return !isDone(t)
  }

  function started(t) {
    return t && (t.completed > 0 || t.modified > t.created)
  }

  function match(t) {
    if (!query) return true
    return `${t.title || ''} ${t.notes || ''}`.toLowerCase().includes(query)
  }

  function getStart(t) {
    return t && (t.hideUntil || t.created || 0)
  }

  function valueOf(t, field) {
    if (!t) return 0
    if (field === 'nothing') return 0
    if (field === 'deadline') return t.dueDate || 0
    if (field === 'start') return getStart(t)
    if (field === 'priority') return t.importance == null ? 3 : t.importance
    if (field === 'modified') return t.modified || 0
    if (field === 'created') return t.created || 0
    if (field === 'list') return String(t.listKey || '')
    return 0
  }

  function compareBy(field) {
    if (field === 'list') {
      return (a, b) => String(valueOf(a, field)).localeCompare(String(valueOf(b, field)))
    }
    if (field === 'priority') {
      // importance: 0=high,1=med,2=low,3=none — asc puts high first
      return (a, b) => (valueOf(a, field) || 3) - (valueOf(b, field) || 3)
    }
    return (a, b) => (valueOf(a, field) || 0) - (valueOf(b, field) || 0)
  }

  function sortList(list) {
    const cmp = compareBy(sBy)
    const sign = sDir === 'desc' ? -1 : 1
    return [...list].sort((a, b) => {
      const r = cmp(a, b)
      if (r !== 0) return r * sign
      return (a.order || 0) - (b.order || 0)
    })
  }

  $: filtered = (() => {
    if (!data) return []
    if (filter === 'trash') return tasks.filter((t) => isDeleted(t) && match(t))
    const live = tasks.filter((t) => !isDeleted(t) && match(t))
    const live2 = notStarted ? live : live.filter((t) => started(t))
    if (filter === 'completed') return live2.filter(isDone)
    if (filter === 'important') return live2.filter((t) => open(t) && t.importance < 3)
    if (filter === 'today')
      return live2.filter((t) => open(t) && t.dueDate >= todayStart && t.dueDate < todayStart + DAY)
    if (filter === 'overdue') return live2.filter((t) => open(t) && t.dueDate > 0 && t.dueDate < todayStart)
    if (filter === 'all') return live2.filter(open)
    if (filter.startsWith('list:'))
      return live2.filter((t) => open(t) && String(t.listKey) === filter.slice(5))
    if (filter.startsWith('tag:'))
      return live2.filter((t) =>
        open(t) && tagsFor(data, t).some((k) => k.tagUid === filter.slice(4))
      )
    return []
  })()

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
      for (const row of sortList(byParent.get(pid) || [])) {
        out.push({ t: row, depth })
        if (!row.collapsed) walk(row.id, depth + 1)
      }
    }
    walk(0, 0)
    return out
  }

  function deadlineBucket(t) {
    if (!hasDueDate(t)) return 'someday'
    if (t.dueDate < todayStart) return 'overdue'
    if (t.dueDate < todayStart + DAY) return 'today'
    return 'upcoming'
  }

  function groupKey(t) {
    if (gBy === 'nothing') return 'all'
    if (gBy === 'list') {
      const l = listOf(data, t.listKey)
      return l ? l.name || tr($lang, 'untitled') : tr($lang, 'untitled')
    }
    if (gBy === 'priority') {
      return `p${t.importance == null ? 3 : t.importance}`
    }
    if (gBy === 'deadline') return deadlineBucket(t)
    return String(valueOf(t, gBy) || 0)
  }

  function groupLabel(key, items) {
    if (gBy === 'nothing') return ''
    if (gBy === 'list') return key
    if (gBy === 'priority') return tr($lang, `importance.${['high', 'medium', 'low', 'none'][parseInt(key.slice(1), 10) || 3]}`)
    if (gBy === 'deadline') return tr($lang, `group.${key}`)
    return ''
  }

  // Fixed order for groups based on field type
  function groupOrder(key) {
    if (gBy === 'deadline') {
      return { overdue: 0, today: 1, upcoming: 2, someday: 3 }[key] ?? 99
    }
    if (gBy === 'priority') {
      // 0=high first when asc
      const n = parseInt(String(key).slice(1), 10)
      return Number.isFinite(n) ? n : 99
    }
    return 0
  }

  function groupAccent(key) {
    if (gBy !== 'deadline') return ''
    if (key === 'overdue') return 'overdue'
    if (key === 'today') return 'today'
    return ''
  }

  $: groups = (() => {
    if (!filtered.length) return []
    if (filter !== 'all' && !gBy.startsWith?.('list') /* still allow */) {
      // Non-'all' filters render as a single labelled group so existing UX is preserved
      if (filter !== 'all') {
        const items = sortList(filtered)
        const singleLabel = (() => {
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
        return [
          { key: filter, label: singleLabel || tr($lang, filter), items, rows: nodeRows(items) }
        ]
      }
    }
    // 'all' filter — honor groupBy
    if (gBy === 'nothing') {
      const items = sortList(filtered)
      return [{ key: 'all', label: '', items, rows: nodeRows(items) }]
    }
    const map = new Map()
    for (const t of filtered) {
      const k = groupKey(t)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(t)
    }
    const sign = gDir === 'desc' ? -1 : 1
    const ordered = Array.from(map.entries()).sort((a, b) => {
      const oa = groupOrder(a[0])
      const ob = groupOrder(b[0])
      if (oa !== ob) return (oa - ob) * sign
      return String(a[0]).localeCompare(String(b[0]))
    })
    return ordered
      .map(([key, items]) => ({
        key: `${gBy}:${key}`,
        label: groupLabel(key, items),
        accent: groupAccent(key),
        items: sortList(items),
        rows: nodeRows(items)
      }))
      .filter((g) => g.items.length)
  })()

  function currentListKey() {
    return filter.startsWith('list:') ? filter.slice(5) : null
  }

  function addTask() {
    editingListId.set(currentListKey())
    editing.set(newTask(data && data.format))
  }
</script>

{#if groups.length}
  {#each groups as g (g.key)}
    {#if g.label}
      <div class="group-title" class:overdue={g.accent === 'overdue'} class:today={g.accent === 'today'}>
        <span>{g.label}</span>
        <span class="nav-count">{g.items.length}</span>
      </div>
    {/if}
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