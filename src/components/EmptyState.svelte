<script>
  import { lang } from '@/lib/state.js'
  import { notify } from '@/lib/notify.js'
  import { tr } from '@/lib/i18n.js'
  import { importFile } from '@/lib/file-import.js'

  let fileInput
  let busy = false

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
</script>

<input
  bind:this={fileInput}
  type="file"
  accept=".json,application/json"
  style="display:none"
  on:change={(e) => handleFile(e.target.files[0])}
/>

<div class="content-empty">
  <svg class="drop-illustration" viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <rect x="14" y="20" width="52" height="60" rx="10" fill="var(--surface)" stroke="var(--primary)" stroke-width="3" />
    <rect x="30" y="80" width="52" height="8" rx="4" fill="var(--primary)" opacity="0.35" />
    <path d="M26 36h28M26 46h28M26 56h18" stroke="var(--primary)" stroke-width="4" stroke-linecap="round" />
    <circle cx="66" cy="62" r="14" fill="var(--primary)" />
    <path d="M60 62l4 4 8-8" stroke="var(--on-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </svg>

  <h2 style="margin:0">{tr($lang, 'emptyStateTitle')}</h2>
  <p class="muted" style="margin:0">{tr($lang, 'emptyStateText')}</p>

  <button class="btn btn-primary" style="align-self:center" on:click={() => fileInput && fileInput.click()} disabled={busy}>
    {busy ? tr($lang, 'importProgress') : tr($lang, 'emptyStateCta')}
  </button>

  <p class="small muted" style="margin:8px 0 0">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;vertical-align:-2px">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
    {tr($lang, 'privacy')}
  </p>
</div>