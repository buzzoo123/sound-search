<script lang="ts">
  import { onMount } from 'svelte'
  
  let samplesDirectory: string = ''
  let samples: Array<{ name: string; path: string; directory: string; extension: string }> = []
  let isLoading: boolean = false
  let searchQuery: string = ''
  
  // Filtered samples based on search query
  $: filteredSamples = samples.filter(sample => 
    sample.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  async function selectDirectory() {
     // Check if the API is available
    if (!window.api || !window.api.selectSamplesDirectory) {
        console.error('API not available: window.api.selectSamplesDirectory is undefined');
        return;
    }
    const selectedDir = await window.api.selectSamplesDirectory()
    if (selectedDir) {
      samplesDirectory = selectedDir
      loadSamples()
    }
  }
  
  async function loadSamples() {
    if (!samplesDirectory) return
    
    isLoading = true
    samples = await window.api.scanSamples(samplesDirectory)
    isLoading = false
  }
  
  function handleSampleClick(samplePath: string) {
    // You can implement audio playback here in the future
    console.log('Sample clicked:', samplePath)
  }
  
  onMount(() => {
    // You could load the last selected directory from localStorage here
  })
</script>

<div class="samples-browser">
  <div class="controls">
    <button class="select-button" on:click={selectDirectory}>
      {samplesDirectory ? 'Change Samples Folder' : 'Select Samples Folder'}
    </button>
    
    {#if samplesDirectory}
      <div class="directory-info">
        <span>Selected directory: {samplesDirectory}</span>
        <span>Total samples: {samples.length}</span>
      </div>
      
      <div class="search-container">
        <input 
          type="text" 
          placeholder="Search samples..." 
          bind:value={searchQuery}
          class="search-input"
        />
      </div>
    {/if}
  </div>
  
  {#if isLoading}
    <div class="loading">Loading samples...</div>
  {:else if samples.length > 0}
    <div class="samples-list">
      {#each filteredSamples as sample (sample.path)}
        <div 
          class="sample-item"
          on:click={() => handleSampleClick(sample.path)}
        >
          <div class="sample-name">{sample.name}</div>
          <div class="sample-path">{sample.directory}</div>
        </div>
      {/each}
    </div>
  {:else if samplesDirectory}
    <div class="no-samples">No audio samples found in the selected directory.</div>
  {/if}
</div>

<style>
  .samples-browser {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .controls {
    margin-bottom: 20px;
  }
  
  .select-button {
    padding: 8px 16px;
    background-color: #647eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
  }
  
  .select-button:hover {
    background-color: #4c6be0;
  }
  
  .directory-info {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    color: var(--ev-c-text-2);
    font-size: 14px;
  }
  
  .search-container {
    margin-top: 15px;
  }
  
  .search-input {
    width: 100%;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid var(--ev-c-gray-2);
    background-color: var(--ev-c-black-mute);
    color: var(--ev-c-text-1);
  }
  
  .loading {
    text-align: center;
    color: var(--ev-c-text-2);
    padding: 20px;
  }
  
  .samples-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
    margin-top: 20px;
  }
  
  .sample-item {
    padding: 12px;
    background-color: var(--ev-c-gray-3);
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .sample-item:hover {
    background-color: var(--ev-c-gray-2);
  }
  
  .sample-name {
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--ev-c-text-1);
  }
  
  .sample-path {
    font-size: 12px;
    color: var(--ev-c-text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .no-samples {
    text-align: center;
    color: var(--ev-c-text-2);
    padding: 40px 0;
  }
</style>