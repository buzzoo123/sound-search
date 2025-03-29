// client/src/preload/index.d.ts
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectSamplesDirectory: () => Promise<string | null>
      scanSamples: (directoryPath: string) => Promise<Array<{
        name: string
        path: string
        directory: string
        extension: string
      }>>
      generateEmbedding: (filePath: string) => Promise<boolean>
      generateEmbeddingsBatch: (samples: any[]) => Promise<boolean>
      findSimilarSamples: (samplePath: string) => Promise<Array<{
        similarity: number
        metadata: {
          path: string
          filename: string
          directory: string
          extension: string
          timestamp: string
        }
      }>>
      getEmbeddingStats: () => Promise<{
        count: number
        hasIndex: boolean
      }>
      clearEmbeddings: () => Promise<boolean>
      getStoragePath: () => Promise<string>
    }
  }
}