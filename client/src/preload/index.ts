// Update to client/src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Make sure these functions are defined exactly as shown here
  selectSamplesDirectory: () => ipcRenderer.invoke('select-samples-directory'),
  scanSamples: (directoryPath: string) => ipcRenderer.invoke('scan-samples', directoryPath),
  generateEmbedding: (filePath) => ipcRenderer.invoke('generate-embedding', filePath),
  generateEmbeddingsBatch: (samples) => ipcRenderer.invoke('generate-embeddings-batch', samples),
  findSimilarSamples: (samplePath) => ipcRenderer.invoke('find-similar-samples', samplePath),
  getEmbeddingStats: () => ipcRenderer.invoke('get-embedding-stats'),
  clearEmbeddings: () => ipcRenderer.invoke('clear-embeddings'),
  getStoragePath: () => ipcRenderer.invoke('get-storage-path'),
  debugFileSystem: () => ipcRenderer.invoke('debug-file-system'),
  getAllEmbeddings: () => ipcRenderer.invoke('get-all-embeddings')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}