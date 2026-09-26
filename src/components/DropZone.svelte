<script>
  import { lang } from '@/lib/state.js'
  import { notify } from '@/lib/notify.js'
  import { tr } from '@/lib/i18n.js'
  import { importFile } from '@/lib/file-import.js'

  let fileInput
  let busy = false
  let over = false
  let dragDepth = 0

  async function handleFile(file) {
    if (!file || busy) return
    busy = true
    try {
      const res = await importFile(file)
      if (!res.ok) notify(tr($lang, 'invalidJson', { error: res.error?.message || res.error }), 'err')
      else notify(tr($lang, 'importSuccess', { count: res.count }), 'ok')
    } finally {
      busy = false
      if (fileInput) fileInput.value = ''
    }
  }

  function onPick() {
    if (fileInput) fileInput.click()
  }

  function onDrop(e) {
    e.preventDefault()
    dragDepth = 0
    over = false
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onOver(e) {
    e.preventDefault()
    dragDepth += 1
    over = true
  }

  function onOut() {
    dragDepth = Math.max(0, dragDepth - 1)
    if (dragDepth === 0) over = false
  }

  function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPick()
    }
  }
</script>

<input
  bind:this={fileInput}
  type="file"
  accept=".json,application/json"
  style="display:none"
  on:change={(e) => handleFile(e.target.files[0])}
/>

<div
  class="dropzone"
  class:dragover={over}
  role="button"
  tabindex="0"
  aria-label={tr($lang, 'importCta')}
  on:click={onPick}
  on:keydown={onKey}
  on:dragover={onOver}
  on:dragleave={onOut}
  on:drop={onDrop}
>
  <div class="dropzone-main">
    {#if busy}
      <svg class="drop-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M12 3v4M12 3l-2 2M12 3l2 2" />
        <path d="M4 11a8 8 0 0 1 16 0" />
        <path d="M5 11h14l1.5 9h-17z" />
      </svg>
      <p>{tr($lang, 'importProgress')}</p>
    {:else}
      <svg class="drop-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
        <path d="M12 3v13" />
        <path d="M7 8l5-5 5 5" />
      </svg>
      <p>{tr($lang, 'importCta')}</p>
    {/if}
  </div>
</div>