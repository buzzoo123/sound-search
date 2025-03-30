<script lang="ts">
  import { onMount } from 'svelte'
  import Onboarding from './components/Onboarding.svelte'
  import SearchInterface from './components/SearchInterface.svelte'

  let hasEmbeddings = false
  let loading = true

  async function checkEmbeddings() {
    const stats = await window.api.getEmbeddingStats()
    hasEmbeddings = stats.count > 0 && stats.hasIndex
    loading = false
  }

  onMount(() => {
    checkEmbeddings()
  })
</script>

{#if loading}
  <div class="loading-container">
    <div class="spinner"></div>
    <div class="loading-text">
      Loading Sound Sift<span class="dot-one">.</span><span class="dot-two">.</span><span class="dot-three">.</span>
    </div>
  </div>
{:else if !hasEmbeddings}
  <div>
    <Onboarding on:ready={() => (hasEmbeddings = true)} />
  </div>
{:else}
  <div>
    <SearchInterface />
  </div>
{/if}

<style>
  /* In App.svelte, make sure there are no width restrictions */
  :global(body) {
    margin: 0;
    padding: 0;
    background: linear-gradient(125deg, #0f0f1a, #1a1a2d);
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    color: white;
    height: 100vh;
    width: 100vw; /* Make sure body uses full width */
    overflow: hidden;
  }

  /* If you have any container divs in App.svelte, ensure they're not width-restricted */
  div {
    width: 100%;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    gap: 1.5rem;
  }

  .loading-text {
    font-size: 1.25rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: rgba(255, 255, 255, 0.85);
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #4c6be0;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .dot-one, .dot-two, .dot-three {
    animation: pulse 1.4s infinite;
    opacity: 0;
  }

  .dot-one {
    animation-delay: 0.2s;
  }

  .dot-two {
    animation-delay: 0.4s;
  }

  .dot-three {
    animation-delay: 0.6s;
  }

  @keyframes pulse {
    0% { opacity: 0; }
    20% { opacity: 1; }
    100% { opacity: 0; }
  }
</style>