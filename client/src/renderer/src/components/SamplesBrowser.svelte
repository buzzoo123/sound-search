<script lang="ts">
    import { onMount } from 'svelte'
    import path from 'path'
    
    let samplesDirectory: string = ''
    let samples: Array<{ name: string; path: string; directory: string; extension: string }> = []
    let isLoading: boolean = false
    let isGeneratingEmbeddings: boolean = false
    let searchQuery: string = ''
    let selectedSample: any = null
    let similarSamples: Array<any> = []
    let embeddingStats = { count: 0, hasIndex: false }
    let storagePath: string = ''
    
    // Filtered samples based on search query
    $: filteredSamples = samples.filter(sample => 
      sample.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    async function selectDirectory() {
      if (!window.api || !window.api.selectSamplesDirectory) {
        console.error('API not available: window.api.selectSamplesDirectory is undefined')
        return
      }
      
      const selectedDir = await window.api.selectSamplesDirectory()
      if (selectedDir) {
        samplesDirectory = selectedDir
        await loadSamples()
      }
    }
    
    async function loadSamples() {
      if (!samplesDirectory || !window.api) return
      
      isLoading = true
      samples = await window.api.scanSamples(samplesDirectory)
      await loadEmbeddingStats()
      await checkStoragePath()
      isLoading = false
    }
    
    async function loadEmbeddingStats() {
      if (!window.api || !window.api.getEmbeddingStats) {
        console.error('API not available: window.api.getEmbeddingStats is undefined')
        return
      }
      
      embeddingStats = await window.api.getEmbeddingStats()
    }
    
    async function checkStoragePath() {
      if (window.api && window.api.getStoragePath) {
        storagePath = await window.api.getStoragePath()
      }
    }
    
    async function generateEmbeddings() {
      if (!samples.length || !window.api || !window.api.generateEmbeddingsBatch) {
        console.error('API not available: window.api.generateEmbeddingsBatch is undefined')
        return
      }
      
      isGeneratingEmbeddings = true
      
      try {
        await window.api.generateEmbeddingsBatch(samples)
        await loadEmbeddingStats()
        alert('Embeddings generated successfully!')
      } catch (error) {
        console.error('Error generating embeddings:', error)
        alert('Error generating embeddings. See console for details.')
      } finally {
        isGeneratingEmbeddings = false
      }
    }
    
    async function clearEmbeddings() {
      if (!window.api || !window.api.clearEmbeddings) {
        console.error('API not available: window.api.clearEmbeddings is undefined')
        return
      }
      
      if (confirm('Are you sure you want to clear all embeddings? This cannot be undone.')) {
        await window.api.clearEmbeddings()
        await loadEmbeddingStats()
        similarSamples = []
        alert('Embeddings cleared successfully!')
      }
    }
    
    async function debugFileSystem() {
      if (!window.api || !window.api.debugFileSystem) {
        console.error('API not available: window.api.debugFileSystem is undefined')
        return
      }
      
      const result = await window.api.debugFileSystem()
      console.log(result)
      alert("File system debugging complete. Please check the console logs for detailed information.")
    }
    
    async function findSimilar(sample) {
      if (!window.api || !window.api.findSimilarSamples) {
        console.error('API not available: window.api.findSimilarSamples is undefined')
        return
      }
      
      selectedSample = sample
      similarSamples = await window.api.findSimilarSamples(sample.path)
    }
    
    function handleSampleClick(sample) {
      findSimilar(sample)
    }
    
    function getBasename(filePath) {
      return filePath.split('/').pop().split('\\').pop() || filePath
    }
    
    function formatSimilarity(similarity) {
      return (similarity * 100).toFixed(2) + '%'
    }
    
    function formatPath(filepath) {
      if (!filepath) return ''
      return filepath.replace(/\\/g, '/')
    }
    
    onMount(async () => {
      await loadEmbeddingStats()
      await checkStoragePath()
    })
  </script>
  
  <div class="app-container">
    <h1 class="app-title">Sample Finder - Search through your music samples</h1>
    
    <div class="controls">
      <button class="primary-button" on:click={selectDirectory}>
        {samplesDirectory ? 'Change Samples Folder' : 'Select Samples Folder'}
      </button>
      
      <button class="secondary-button" on:click={debugFileSystem}>
        Debug File System
      </button>
    </div>
    
    {#if samplesDirectory}
      <div class="info-panel">
        <div class="directory-info">
          <div class="info-item">Selected directory: {samplesDirectory}</div>
          <div class="info-item">Total samples: {samples.length}</div>
          <div class="info-item">Samples with embeddings: {embeddingStats.count}</div>
        </div>
        
        {#if storagePath}
          <div class="storage-info">
            <div>Storage location: {storagePath}</div>
            <div>Look for faiss-index.bin and samples-metadata.json in this folder</div>
          </div>
        {/if}
        
        <div class="search-container">
          <input 
            type="text" 
            placeholder="Search samples..." 
            bind:value={searchQuery}
            class="search-input"
          />
        </div>
        
        {#if samples.length > 0}
          <div class="action-buttons">
            <button 
              class="generate-button" 
              on:click={generateEmbeddings} 
              disabled={isGeneratingEmbeddings}
            >
              {isGeneratingEmbeddings ? 'Generating Embeddings...' : 'Generate Embeddings'}
            </button>
            
            {#if embeddingStats.hasIndex}
              <button 
                class="clear-button" 
                on:click={clearEmbeddings}
                disabled={isGeneratingEmbeddings}
              >
                Clear Embeddings
              </button>
            {/if}
          </div>
        {/if}
      </div>
    
      <div class="content-area">
        <!-- Samples list -->
        <div class="panel samples-panel">
          <h2>Sample Files ({filteredSamples.length})</h2>
          
          {#if isLoading}
            <div class="loading">Loading samples...</div>
          {:else if samples.length > 0}
            <div class="samples-list">
              {#each filteredSamples as sample (sample.path)}
                <div 
                  class="sample-item"
                  class:selected={selectedSample && selectedSample.path === sample.path}
                  on:click={() => handleSampleClick(sample)}
                >
                  <div class="sample-name">{getBasename(sample.path)}</div>
                  <div class="sample-path">{formatPath(sample.directory)}</div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="no-samples">No audio samples found in the selected directory.</div>
          {/if}
        </div>
        
        <!-- Similar samples section -->
        <div class="panel similar-panel">
          <h2>Similar Samples</h2>
          
          {#if selectedSample}
            <div class="selected-sample">
              <div class="selected-title">Selected: {getBasename(selectedSample.path)}</div>
              <div class="selected-path">{formatPath(selectedSample.path)}</div>
            </div>
            
            {#if !embeddingStats.hasIndex}
              <div class="no-embeddings">
                Generate embeddings first to find similar samples.
              </div>
            {:else if similarSamples.length > 0}
              <div class="similar-list">
                {#each similarSamples as similar (similar.metadata?.path || similar.path)}
                  <div class="similar-item">
                    <div class="similar-name">
                      {getBasename(similar.metadata?.path || similar.path)}
                    </div>
                    <div class="similar-score">
                      Similarity: {formatSimilarity(similar.similarity)}
                    </div>
                    <div class="similar-path">{formatPath(similar.metadata?.directory || '')}</div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="no-similar">No similar samples found.</div>
            {/if}
          {:else}
            <div class="no-selection">
              Select a sample from the list to find similar sounds.
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    .app-container {
      width: 100%;
      max-width: 100%;
      padding: 20px;
      color: var(--ev-c-text-1);
    }
    
    .app-title {
      font-size: 28px;
      text-align: center;
      margin-bottom: 30px;
      color: var(--ev-c-text-1);
    }
    
    .controls {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .primary-button {
      padding: 10px 20px;
      background-color: #647eff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
    }
    
    .secondary-button {
      padding: 10px 20px;
      background-color: #444;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
    }
    
    .primary-button:hover {
      background-color: #4c6be0;
    }
    
    .info-panel {
      background-color: rgba(40, 44, 52, 0.6);
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    
    .directory-info {
      margin-bottom: 10px;
    }
    
    .info-item {
      margin-bottom: 5px;
      color: var(--ev-c-text-2);
    }
    
    .storage-info {
      background-color: rgba(30, 34, 42, 0.6);
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
      color: var(--ev-c-text-2);
      font-size: 14px;
    }
    
    .search-container {
      margin: 15px 0;
    }
    
    .search-input {
      width: 100%;
      padding: 10px 15px;
      border-radius: 4px;
      border: 1px solid var(--ev-c-gray-2);
      background-color: var(--ev-c-black-mute);
      color: var(--ev-c-text-1);
      font-size: 16px;
    }
    
    .action-buttons {
      display: flex;
      gap: 10px;
    }
    
    .generate-button {
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
    }
    
    .clear-button {
      padding: 10px 20px;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
    }
    
    .generate-button:hover {
      background-color: #45a049;
    }
    
    .clear-button:hover {
      background-color: #d32f2f;
    }
    
    .generate-button:disabled,
    .clear-button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    
    .content-area {
      display: flex;
      gap: 20px;
      height: calc(100vh - 300px);
      min-height: 400px;
    }
    
    .panel {
      flex: 1;
      background-color: rgba(40, 44, 52, 0.6);
      border-radius: 8px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .panel h2 {
      margin-top: 0;
      margin-bottom: 15px;
      color: var(--ev-c-text-1);
      font-size: 18px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--ev-c-gray-3);
    }
    
    .samples-list, .similar-list {
      overflow-y: auto;
      flex-grow: 1;
      padding-right: 5px;
    }
    
    .sample-item, .similar-item {
      padding: 12px;
      background-color: var(--ev-c-gray-3);
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
      margin-bottom: 8px;
    }
    
    .sample-item:hover, .similar-item:hover {
      background-color: var(--ev-c-gray-2);
      transform: translateY(-2px);
    }
    
    .sample-item.selected {
      background-color: #4c6be0;
      border-left: 4px solid #ffffff;
    }
    
    .sample-name, .similar-name {
      font-weight: 600;
      margin-bottom: 5px;
      color: var(--ev-c-text-1);
      word-break: break-word;
    }
    
    .sample-path, .similar-path {
      font-size: 12px;
      color: var(--ev-c-text-3);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .similar-score {
      font-size: 14px;
      color: #4CAF50;
      font-weight: 500;
      margin-bottom: 5px;
    }
    
    .selected-sample {
      background-color: var(--ev-c-gray-2);
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 15px;
    }
    
    .selected-title {
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 5px;
    }
    
    .selected-path {
      font-size: 12px;
      color: var(--ev-c-text-3);
      word-break: break-all;
    }
    
    .loading,
    .no-samples,
    .no-similar,
    .no-embeddings,
    .no-selection {
      color: var(--ev-c-text-2);
      text-align: center;
      padding: 40px 0;
      font-style: italic;
    }
    
    /* Add styling for scrollbars */
    .samples-list::-webkit-scrollbar,
    .similar-list::-webkit-scrollbar {
      width: 8px;
    }
    
    .samples-list::-webkit-scrollbar-track,
    .similar-list::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }
    
    .samples-list::-webkit-scrollbar-thumb,
    .similar-list::-webkit-scrollbar-thumb {
      background: rgba(100, 126, 255, 0.5);
      border-radius: 4px;
    }
    
    .samples-list::-webkit-scrollbar-thumb:hover,
    .similar-list::-webkit-scrollbar-thumb:hover {
      background: rgba(100, 126, 255, 0.7);
    }
    
    /* Make the layout more responsive */
    @media (max-width: 768px) {
      .content-area {
        flex-direction: column;
        height: auto;
      }
      
      .panel {
        height: 300px;
        margin-bottom: 20px;
      }
    }
  </style>