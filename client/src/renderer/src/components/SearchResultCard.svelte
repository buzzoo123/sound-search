<script lang="ts">
  import { Play, Pause } from 'lucide-svelte';
  import { onDestroy } from 'svelte';
  export let result;
  
  // Example duration - you would get this from your actual data
  // If result doesn't have duration, we'll use a placeholder
  const duration = result.metadata?.duration || "0:30";
  
  let isPlaying = false;
  let playbackError = false;
  
  function extractFilePath(result) {
    // In your search results, the file path is in result.metadata.path 
    // This is clear from your main/index.ts file
    return result.metadata?.path || '';
  }
  
  function playAudio() {
    // Reset error state on new attempt
    playbackError = false;
    
    // Get the file path from the result
    const filePath = extractFilePath(result);
    console.log('Attempting to play file:', filePath);
    
    if (!filePath) {
      console.error('No file path found in result:', result);
      playbackError = true;
      return;
    }
    
    if (!isPlaying) {
      // Start playback using the main process handler
      window.api.playAudio(filePath)
        .then(response => {
          console.log('Playback response:', response);
          
          if (response.success) {
            isPlaying = true;
            
            // Since we're using the system player, we'll automatically 
            // reset the play button after a short delay
            setTimeout(() => {
              isPlaying = false;
            }, 1000);
          } else {
            console.error('Playback failed:', response.error);
            playbackError = true;
          }
        })
        .catch(error => {
          console.error('Error during playback:', error);
          playbackError = true;
        });
    } else {
      // Stop playback
      window.api.stopAudio()
        .then(() => {
          isPlaying = false;
        })
        .catch(error => {
          console.error('Error stopping playback:', error);
        });
    }
  }
  
  onDestroy(() => {
    if (isPlaying) {
      window.api.stopAudio().catch(err => console.error('Error stopping audio on destroy:', err));
    }
  });
</script>

<div class="card">
  <div class="name-section">
    <div class="name" title={result.metadata?.filename || 'Unknown Sample'}>
      {result.metadata?.filename || 'Unknown Sample'}
    </div>
    <div class="duration">{duration}</div>
  </div>
  
  <div class="controls">
    <button class="play-button" on:click={playAudio} class:error={playbackError}>
      {#if isPlaying}
        <Pause size={20} color="white" />
      {:else}
        <Play size={20} color="white" />
      {/if}
    </button>
    <div class="score">Similarity: {(result.similarity * 100).toFixed(1)}%</div>
  </div>
</div>

<style>
  .card {
    background: #202225;
    padding: 1.5rem;
    border-radius: 12px;
    font-size: 1rem;
    display: flex;
    overflow: hidden;
    flex-direction: column;
    justify-content: space-between;
    height: 20vh;
    transition: all 0.3s;
    border: 2px solid transparent;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    position: relative;
    z-index: 0;
  }

  .card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 2px;
    background: linear-gradient(45deg, #a370f7, #6d5be0, #4c6be0);
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: destination-out;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: -1;
  }

  .card:hover::before {
    opacity: 1;
  }

  .card:hover {
    transform: translateY(-8px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
  }
  
  .name-section {
    margin-bottom: 1rem;
  }

  .name {
    font-weight: 700;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: linear-gradient(90deg, #fff, #a8b2d1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .duration {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
  }
  
  .play-button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6d5be0, #a370f7);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .play-button:hover {
    transform: scale(1.1);
    box-shadow: 0 0 12px rgba(109, 91, 224, 0.5);
  }
  
  .play-button.error {
    background: linear-gradient(135deg, #e06b5b, #f77070);
  }

  .score {
    color: #90ee90; /* Light green color */
    font-weight: 500;
    margin-left: 1rem;
  }
</style>