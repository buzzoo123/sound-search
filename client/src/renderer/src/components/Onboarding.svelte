<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte'
    
    const dispatch = createEventDispatcher()
  
    let rotatingTextIndex = 0
    const rotatingText = ['Whimsical Drums', 'Punchy Kicks', 'Dreamy Pads', 'Analog Leads']
    let currentText = rotatingText[0]
    let loading = false
  
    const updateRotation = () => {
      rotatingTextIndex = (rotatingTextIndex + 1) % rotatingText.length
      currentText = rotatingText[rotatingTextIndex]
    }
  
    async function handleGetStarted() {
      loading = true
      const folder = await window.api.selectSamplesDirectory()
      if (folder) {
        const files = await window.api.scanSamples(folder)
        await window.api.generateEmbeddingsBatch(files)
        dispatch('ready')
      } else {
        loading = false
      }
    }
  
    onMount(() => {
      setInterval(updateRotation, 2500)
    })
  </script>
  
  <div class="container">
    <div class="content-wrapper">
      <div class="logo-container">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
      
      <p class="subtitle">Your AI-powered sample search assistant</p>
  
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-text">Upload your samples</div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-text">Let the AI analyze them</div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-text">Search with text or sound</div>
        </div>
      </div>
  
      <button 
        on:click={handleGetStarted} 
        class:loading
        disabled={loading}
      >
        {#if loading}
          <span class="button-spinner"></span>
          <span>Processing...</span>
        {:else}
          <span>Get Started</span>
        {/if}
      </button>
    </div>
  
    <div class="background-gradient"></div>
  </div>
  
  <style>
    .container {
      margin-top: 25vh;
      width: 100vw;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      position: relative;
      overflow: hidden;
    }
  
    .content-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      z-index: 10;
      max-width: 600px;
    }
  
    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
  
    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border-radius: 12px;
      background: linear-gradient(135deg, #4c6be0, #6d5be0);
      color: white;
    }
  
    .title {
      font-size: 2.75rem;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0.8));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  
    .tagline {
      font-size: 1.5rem;
      font-weight: 500;
      margin: 0.75rem 0;
      display: flex;
      white-space: nowrap;
    }
  
    .text-container {
      position: relative;
      display: inline-block;
      min-width: 180px;
      text-align: left;
      margin-left: 0.5rem;
      height: 1.5em;
      white-space: nowrap;
    }
  
    .highlight {
      position: absolute;
      background: linear-gradient(90deg, #f472b6, #60a5fa, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
  
    .subtitle {
      font-size: 1.1rem;
      opacity: 0.75;
      margin: 0.5rem 0 3rem;
    }
  
    .steps {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 3rem;
      width: 100%;
    }
  
    .step {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 1.1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1rem;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  
    .step-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #4c6be0, #6d5be0);
      font-weight: 700;
    }
  
    .step-text {
      font-weight: 500;
    }
  
    button {
      padding: 0.9rem 2.5rem;
      font-size: 1.1rem;
      background: linear-gradient(135deg, #4c6be0, #6d5be0);
      border: none;
      border-radius: 12px;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 4px 20px rgba(76, 107, 224, 0.3);
      min-width: 200px;
    }
  
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(76, 107, 224, 0.4);
    }
  
    button:active:not(:disabled) {
      transform: translateY(0);
    }
  
    button.loading {
      background: linear-gradient(135deg, #3f59bd, #5a4bbf);
      cursor: wait;
      opacity: 0.9;
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
  
    .background-gradient {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at center, rgba(76, 107, 224, 0.08) 0%, rgba(255, 255, 255, 0) 70%);
      z-index: 1;
      pointer-events: none;
      animation: pulse-bg 8s ease-in-out infinite;
    }
  
    @keyframes pulse-bg {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 0.3; }
    }
  
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>