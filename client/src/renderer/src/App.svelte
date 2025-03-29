<script lang="ts">
  import Versions from './components/Versions.svelte'
  import SamplesBrowser from './components/SamplesBrowser.svelte'
</script>

<div class="app-container">
  <div class="header">
    <div class="text">
      Sample Finder - Search through your music samples
    </div>
  </div>
  
  <div class="content">
    <SamplesBrowser />
  </div>
  
  <Versions />
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    padding: 20px;
  }
  
  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .content {
    flex-grow: 1;
    overflow-y: auto;
  }
  
  .logo {
    margin-bottom: 20px;
    height: 80px;
    width: 80px;
  }
</style>