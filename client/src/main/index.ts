import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Add this to src/main/index.ts, inside app.whenReady().then() callback
// Handle folder selection
ipcMain.handle('select-samples-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Samples Folder'
  })
  
  if (!result.canceled) {
    return result.filePaths[0]
  }
  return null
})

// Handle scanning for audio files
ipcMain.handle('scan-samples', async (_, directoryPath) => {
  try {
    const audioExtensions = ['.wav', '.mp3', '.aiff', '.flac', '.ogg']
    const files = await scanDirectory(directoryPath, audioExtensions)
    return files
  } catch (error) {
    console.error('Error scanning for samples:', error)
    return []
  }
})

// Recursive function to scan directory for audio files
async function scanDirectory(directory, extensions) {
  let results = []
  
  try {
    const items = await fs.readdir(directory, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = path.join(directory, item.name)
      
      if (item.isDirectory()) {
        // Recursively scan subdirectories
        const subResults = await scanDirectory(fullPath, extensions)
        results = results.concat(subResults)
      } else {
        // Check if file has an audio extension
        const ext = path.extname(item.name).toLowerCase()
        if (extensions.includes(ext)) {
          results.push({
            name: item.name,
            path: fullPath,
            directory: directory,
            extension: ext
          })
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error)
  }
  
  return results
}
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

