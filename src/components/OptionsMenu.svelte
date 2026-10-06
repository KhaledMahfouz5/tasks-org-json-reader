<script>
  import { tr } from '@/lib/i18n.js'
  import {
    groupBy,
    groupDir,
    sortBy,
    sortDir,
    showNotStarted,
    optionsOpen,
    lang
  } from '@/lib/state.js'

  const FIELDS = ['nothing', 'deadline', 'start', 'priority', 'modified', 'created', 'list']

  function close() {
    optionsOpen.set(false)
  }

  function setGroup(field) {
    groupBy.set(field)
  }

  function setSort(field) {
    sortBy.set(field)
  }

  function toggleGroupDir() {
    groupDir.update((d) => (d === 'asc' ? 'desc' : 'asc'))
  }

  function toggleSortDir() {
    sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'))
  }

  function toggleNotStarted() {
    showNotStarted.update((v) => !v)
  }

  function fieldLabel(f) {
    return tr($lang, `groupField.${f}`)
  }
</script>

{#if $optionsOpen}
  <div
    class="modal-backdrop"
    role="button"
    tabindex="-1"
    aria-label={tr($lang, 'close')}
    on:click={(e) => {
      if (e.target === e.currentTarget) close()
    }}
    on:keydown={(e) => {
      if (e.key === 'Escape') close()
    }}
  >
    <div class="modal options-modal" role="dialog" aria-modal="true" aria-label={tr($lang, 'optionsTitle')}>
      <header class="modal-head">
        <h2>{tr($lang, 'optionsTitle')}</h2>
        <button class="btn btn-icon" aria-label={tr($lang, 'close')} on:click={close}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </header>

      <section class="opt-section">
        <div class="opt-label">{tr($lang, 'groupByLabel')}</div>
        <div class="opt-chips">
          {#each FIELDS as f (f)}
            <button
              class="opt-chip"
              class:active={$groupBy === f}
              on:click={() => setGroup(f)}
              type="button"
            >{fieldLabel(f)}</button>
          {/each}
        </div>
        <button class="opt-dir" on:click={toggleGroupDir} type="button" aria-label={$groupDir}>
          {$groupDir === 'asc' ? '↑ ' + tr($lang, 'ascending') : '↓ ' + tr($lang, 'descending')}
        </button>
      </section>

      <section class="opt-section">
        <div class="opt-label">{tr($lang, 'sortByLabel')}</div>
        <div class="opt-chips">
          {#each FIELDS as f (f)}
            <button
              class="opt-chip"
              class:active={$sortBy === f}
              on:click={() => setSort(f)}
              type="button"
            >{fieldLabel(f)}</button>
          {/each}
        </div>
        <button class="opt-dir" on:click={toggleSortDir} type="button" aria-label={$sortDir}>
          {$sortDir === 'asc' ? '↑ ' + tr($lang, 'ascending') : '↓ ' + tr($lang, 'descending')}
        </button>
      </section>

      <section class="opt-section opt-switch-row">
        <label class="switch-row" for="opt-notstarted">
          <span>{tr($lang, 'showNotStarted')}</span>
          <span class="switch">
            <input
              id="opt-notstarted"
              type="checkbox"
              checked={$showNotStarted}
              on:change={toggleNotStarted}
            />
            <span class="track"></span>
          </span>
        </label>
      </section>

      <div class="form-actions">
        <button class="btn btn-primary" on:click={close}>{tr($lang, 'close')}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 8px;
  }
  .modal-head h2 {
    margin: 0;
    font-size: 18px;
  }
  .opt-section {
    margin-block: 14px;
  }
  .opt-label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    margin-block-end: 8px;
  }
  .opt-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .opt-chip {
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    cursor: pointer;
    font-size: 13px;
    transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
  }
  .opt-chip:hover {
    border-color: var(--primary);
  }
  .opt-chip.active {
    background: color-mix(in srgb, var(--primary) 14%, transparent);
    border-color: var(--primary);
    color: var(--primary);
    font-weight: 600;
  }
  .opt-dir {
    margin-block-start: 8px;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
    font-size: 12px;
  }
  .opt-dir:hover {
    color: var(--primary);
    border-color: var(--primary);
  }
  .opt-switch-row {
    padding-block: 6px;
  }
</style>
