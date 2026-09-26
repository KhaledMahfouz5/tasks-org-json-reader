<script>
  import { sidebarOpen, syncOpen, lang, theme, searchQuery } from '@/lib/state.js'
  import { tr } from '@/lib/i18n.js'

  function toggleLang() {
    lang.set($lang === 'ar' ? 'en' : 'ar')
  }

  function cycleTheme() {
    const order = ['system', 'light', 'dark']
    const idx = order.indexOf($theme)
    theme.set(order[(idx + 1) % order.length])
  }
</script>

<header class="header">
  <button
    class="btn btn-icon hamburger"
    aria-label={tr($lang, 'aria.menu')}
    title={tr($lang, 'aria.menu')}
    on:click={() => sidebarOpen.set(!$sidebarOpen)}
  >
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  <div class="header-title">
    <img class="header-logo" src="/favicon.svg" alt="" />
    <span>{tr($lang, 'appName')}</span>
  </div>

  <div class="header-search">
    <input
      class="input"
      type="search"
      bind:value={$searchQuery}
      placeholder={tr($lang, 'searchPlaceholder')}
      aria-label={tr($lang, 'search')}
    />
  </div>

  <div class="header-actions">
    <button
      class="btn btn-icon"
      on:click={cycleTheme}
      title={tr($lang, 'aria.theme')}
      aria-label={tr($lang, 'aria.theme')}
    >
      {#if $theme === 'dark'}
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </svg>
      {:else}
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      {/if}
    </button>

    <button class="btn lang-pill" on:click={toggleLang} title={tr($lang, 'aria.lang')}>
      {$lang === 'en' ? 'ع' : 'EN'}
    </button>

    <button
      class="btn btn-icon"
      on:click={() => syncOpen.set(true)}
      title={tr($lang, 'sync')}
      aria-label={tr($lang, 'sync')}
    >
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 11A8 8 0 1 0 18 17" />
        <path d="M20 4v6h-6" />
      </svg>
    </button>
  </div>
</header>