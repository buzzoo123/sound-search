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
    }
  }
}
