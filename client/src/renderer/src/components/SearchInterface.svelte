<script lang="ts">
    import { onMount } from 'svelte'
    import { Search, Upload, Sparkles } from 'lucide-svelte'
    import SearchResultCard from './SearchResultCard.svelte'
  
    let hasSearched = false
    let rotatingTextIndex = 0
    let currentText = ''
    let searchQuery = ''
    let results = []
    let searching = false
    let uploadProgress = 0
    let audioFileName = ''
    let isDragging = false
  
    const rotatingText = ['Punchy Kicks', 'Funky Basslines', 'Lo-fi Textures', 'Vocal Chops']
  
    const updateRotation = () => {
      rotatingTextIndex = (rotatingTextIndex + 1) % rotatingText.length
      currentText = rotatingText[rotatingTextIndex]
    }
  
    async function handleSearch() {
        if (!searchQuery) return;
        searching = true;

        // Simulate progress
        const progressInterval = setInterval(() => {
            uploadProgress = Math.min(uploadProgress + Math.random() * 15, 95);
        }, 200);

        try {
            results = await window.api.findSimilarSamples({ text: searchQuery }); // Corrected line
            hasSearched = true;
        } finally {
            clearInterval(progressInterval);
            uploadProgress = 100;

            // Reset progress bar after completed
            setTimeout(() => {
                uploadProgress = 0;
                searching = false;
            }, 500);
        }
    }
  
    async function handleAudioUpload(event: Event) {
          searching = true;
          const files = (event.target as HTMLInputElement).files;

          if (files && files[0]) {
              audioFileName = files[0].name;

              // Simulate progress
              const progressInterval = setInterval(() => {
                  uploadProgress = Math.min(uploadProgress + Math.random() * 15, 95);
              }, 200);

              try {
                  const file = files[0];
                  const reader = new FileReader();

                  reader.onload = async (e) => {
                      const arrayBuffer = e.target?.result as ArrayBuffer;
                      if (arrayBuffer) {
                          results = await window.api.findSimilarSamples({
                              arrayBuffer: arrayBuffer,
                              fileName: file.name,
                          });
                          hasSearched = true;
                      } else {
                          console.error("Error reading file content.");
                          searching = false;
                      }
                  };

                  reader.onerror = () => {
                      console.error("Error reading file.");
                      searching = false;
                  };

                  reader.readAsArrayBuffer(file);
              } catch (error) {
                  console.error("Error in handleAudioUpload:", error);
                  searching = false;
              } finally {
                  clearInterval(progressInterval);
                  uploadProgress = 100;

                  // Reset progress bar after completed
                  setTimeout(() => {
                      uploadProgress = 0;
                      searching = false;
                  }, 500);
              }
          } else {
              searching = false;
          }
      }
  
      function handleDrop(event: DragEvent) {
          event.preventDefault();
          isDragging = false;
          searching = true;

          const file = event.dataTransfer?.files?.[0];
          if (file) {
              audioFileName = file.name;

              const reader = new FileReader();

              reader.onload = async (e) => {
                  const arrayBuffer = e.target?.result as ArrayBuffer;
                  if (arrayBuffer) {
                      window.api.findSimilarSamples({
                          arrayBuffer: arrayBuffer,
                          fileName: file.name,
                      })
                          .then(r => {
                              results = r;
                              hasSearched = true;
                              clearInterval(progressInterval);
                              uploadProgress = 100;

                              // Reset progress bar after completed
                              setTimeout(() => {
                                  uploadProgress = 0;
                                  searching = false;
                              }, 500);
                          })
                          .catch(err => {
                              console.error("Error in handleDrop:", err);
                              clearInterval(progressInterval);
                              uploadProgress = 0;
                              searching = false;
                          });
                  } else {
                      console.error("Error reading file content.");
                      searching = false;
                  }
              };

              reader.onerror = () => {
                  console.error("Error reading file.");
                  searching = false;
              };

              reader.readAsArrayBuffer(file);
          } else {
              searching = false;
          }
      }
  
    onMount(() => {
      updateRotation()
      setInterval(updateRotation, 2500)
    })
  </script>
  
  <div class="container">
    <header>
      <div class="logo-container">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>
        <h1 class="title">Sound Sift</h1>
      </div>
      
      <p class="tagline">
        Find your perfect 
        <span class="text-container">
          <span class="highlight">
            {currentText}
          </span>
        </span>
      </p>
    </header>
  
    <div class="search-container">
      <div class="search-bar">
        <div class="search-icon">
          <Search size={20} color="rgba(255, 255, 255, 0.6)" />
        </div>
        
        <input
          bind:value={searchQuery}
          placeholder="Search for textures, moods, instruments..."
          on:keydown={(e) => e.key === 'Enter' && handleSearch()}
        />
        
          <div class="upload-wrapper">
            <label class="upload-button" for="file-upload">
              <Upload size={20} color="black" />
            </label>
            <input
              id="file-upload"
              type="file"
              accept="audio/*"
              on:change={handleAudioUpload}
              class="hidden-input"
            />
          </div>
        
        <button 
          on:click={handleSearch}
          class:searching
          disabled={searching}
        >
          {#if searching}
            <span class="button-spinner"></span>
          {:else}
            <Sparkles size={20} color="white" />
          {/if}
        </button>
      </div>      
  
      {#if searching}
        <div class="progress-container">
          <div class="progress-bar" style="width: {uploadProgress}%"></div>
        </div>
      {/if}
  
      {#if !hasSearched}
      <div
        class="upload-zone"
        class:dragging={isDragging}
        class:has-file={audioFileName}
        class:searching
        on:dragover|preventDefault={() => isDragging = true}
        on:dragleave={() => isDragging = false}
        on:drop={handleDrop}
      >
        <input
          type="file"
          accept="audio/*"
          on:change={handleAudioUpload}
          class="file-input"
          disabled={searching}
        />
        
        <div class="upload-content">
          {#if searching}
            <div class="upload-spinner"></div>
            <div class="upload-label">Analyzing audio...</div>
          {:else if audioFileName}
            <div class="file-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.5 22h.5c1.7 0 3-1.3 3-3V5c0-1.7-1.3-3-3-3h-.5"></path>
                <path d="M6.5 22H6c-1.7 0-3-1.3-3-3V5c0-1.7 1.3-3 3-3h.5"></path>
                <rect x="8" y="2" width="8" height="20" rx="2"></rect>
              </svg>
            </div>
            <div class="upload-label">
              <div class="file-name">{audioFileName}</div>
              <div class="file-hint">Click or drop to replace</div>
            </div>
          {:else}
            <div class="upload-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <div class="upload-label">
              <div>Drag & drop an audio file here</div>
              <div class="or-divider">
                <span>or</span>
              </div>
              <div class="browse-text">Browse files</div>
            </div>
          {/if}
        </div>
      </div>
      {/if}
    </div>


  
    {#if results.length > 0}
      <div class="results-container">
        <h2 class="results-title">Results</h2>
        <div class="results-count">{results.length} samples found</div>
        
        <div class="results-grid">
          {#each results as result}
            <SearchResultCard {result} />
          {/each}
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    .container {
      margin-top: 25vh;
      height: 100vh;
      max-height: 100vh;
      width: 100vw;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 2rem;
      overflow: hidden; /* Prevent the container itself from scrolling */
    }

    .results-container {
      width: 100%;
      max-width: 80%; /* Using percentage instead of fixed width */
      margin: 2rem auto 0; /* Center the container */
      overflow-y: auto;
      flex-grow: 1;
      padding-bottom: 2rem;
    }
  
    header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 2.5rem;
      padding-bottom: 1rem;
      text-align: center;
      width: 100%;
    }
  
    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
  
    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 8px;
      background: linear-gradient(135deg, #4c6be0, #6d5be0);
      color: white;
    }
  
    .title {
      font-size: 2.25rem;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0.8));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  
    .tagline {
      font-size: 1.25rem;
      font-weight: 500;
      margin: 0.5rem 0 1rem;
      display: flex;
    }
  
    .text-container {
      position: relative;
      display: inline-block;
      min-width: 165px;
      text-align: left;
      margin-left: 0.5rem;
      height: 1.5em;
    }
  
    .highlight {
      position: absolute;
      background: linear-gradient(90deg, #f472b6, #60a5fa, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
  
    .search-container {
      width: 100%;
      max-width: 800px;
      margin: 1rem 0 2rem;
    }
  
    .search-bar {
      display: flex;
      align-items: center;
      background: rgba(30, 30, 40, 0.6);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  
    .search-icon {
      padding: 0 0.75rem 0 1rem;
      color: rgba(255, 255, 255, 0.6);
    }
  
    input {
      flex: 1;
      padding: 0.9rem 0;
      background: transparent;
      border: none;
      color: white;
      outline: none;
      font-size: 0.95rem;
    }
  
    input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  
    button {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      padding: 0;
      background: linear-gradient(135deg, #a370f7, #6d5be0);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 4px;
    }

  /* Add this to make the SVG icon white */
    button svg {
      fill: white;
      stroke: white;
    }

    button:hover:not(:disabled) {
      background: linear-gradient(135deg, #3f59bd, #5a4bbf);
    }
  
    button.searching {
      opacity: 0.8;
      cursor: wait;
    }
  
    button:disabled {
      cursor: not-allowed;
    }
  
    .button-spinner {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
    }
  
    .progress-container {
      height: 4px;
      width: 100%;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      margin-top: 0.5rem;
      overflow: hidden;
    }
  
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #4c6be0, #6d5be0);
      border-radius: 2px;
      transition: width 0.3s ease;
    }
  
    .upload-zone {
      margin-top: 1.5rem;
      padding: 2rem;
      border: 2px dashed rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      background: rgba(30, 30, 40, 0.4);
      text-align: center;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
    }
  
    .upload-zone:hover:not(.searching) {
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(30, 30, 40, 0.5);
    }
  
    .upload-zone.dragging {
      border-color: #4c6be0;
      background: rgba(76, 107, 224, 0.1);
    }
  
    .upload-zone.has-file {
      border-style: solid;
      border-color: rgba(255, 255, 255, 0.2);
      background: rgba(76, 107, 224, 0.1);
    }
  
    .upload-zone.searching {
      border-color: rgba(255, 255, 255, 0.1);
      cursor: wait;
    }

    .upload-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      margin-right: 8px;
    }

    .upload-button {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      z-index: 2;
    }

    .hidden-input {
      position: absolute;
      width: 0.1px;
      height: 0.1px;
      opacity: 0;
      overflow: hidden;
      z-index: -1;
      pointer-events: none;
    }
  
    .file-input {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      top: 0;
      left: 0;
      z-index: 10;
    }
  
    .file-input:disabled {
      cursor: not-allowed;
    }
  
    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }
  
    .upload-icon, .file-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 0.5rem;
    }
  
    .upload-spinner {
      width: 3rem;
      height: 3rem;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border-top-color: #4c6be0;
      animation: spin 1s linear infinite;
      margin-bottom: 0.5rem;
    }
  
    .upload-label {
      font-size: 1rem;
      line-height: 1.5;
    }
  
    .file-name {
      font-weight: 600;
      color: white;
      max-width: 90%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin: 0 auto;
    }
  
    .file-hint {
      font-size: 0.85rem;
      opacity: 0.6;
      margin-top: 0.25rem;
    }
  
    .or-divider {
      display: flex;
      align-items: center;
      color: rgba(255, 255, 255, 0.4);
      margin: 0.75rem 0;
      width: 100%;
    }
  
    .or-divider::before,
    .or-divider::after {
      content: "";
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 0.5rem;
    }
  
    .browse-text {
      color: #4c6be0;
      font-weight: 600;
    }
  
    .results-container {
      width: 100%;
      max-width: 1000px;
      margin-top: 2rem;
    }
  
    .results-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
  
    .results-count {
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
  
    /* In SearchInterface.svelte, modify the results grid */
    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
      width: 100%;
    }

    @media (min-width: 768px) {
      .results-grid {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      }
    }

    @media (min-width: 1200px) {
      .results-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      }
    }

    /* Increase max-width for results container */
    .results-container {
      max-width: 1200px; /* Increased from 1000px */
    }

    @keyframes spin {
        to {
        transform: rotate(360deg);
        }
    }
    </style>