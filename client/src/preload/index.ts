import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  selectSamplesDirectory: () => ipcRenderer.invoke('select-samples-directory'),
  scanSamples: (directoryPath: string) => ipcRenderer.invoke('scan-samples', directoryPath),
  generateEmbedding: (filePath: string, text?: string) => ipcRenderer.invoke('generate-embedding', filePath, text),
  generateEmbeddingsBatch: (samples: { path: string, name: string, directory: string, extension: string }[]) => ipcRenderer.invoke('generate-embeddings-batch', samples),
  findSimilarSamples: (samplePath: string, text?: string) => ipcRenderer.invoke('find-similar-samples', samplePath, text),
  getEmbeddingStats: () => ipcRenderer.invoke('get-embedding-stats'),
  clearEmbeddings: () => ipcRenderer.invoke('clear-embeddings'),
  getStoragePath: () => ipcRenderer.invoke('get-storage-path'),
  debugFileSystem: () => ipcRenderer.invoke('debug-file-system'),
  getAllEmbeddings: () => ipcRenderer.invoke('get-all-embeddings'),
  getAudioUrl: (filePath) => ipcRenderer.invoke('get-audio-url', filePath),
  playAudio: (filePath) => {
    return ipcRenderer.invoke('play-audio', filePath)
  },
  
  // Stop audio playback
  stopAudio: () => {
    return ipcRenderer.invoke('stop-audio')
  },
  
  // Check if a file exists
  checkFileExists: (filePath) => {
    return ipcRenderer.invoke('check-file-exists', filePath)
  }
}

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