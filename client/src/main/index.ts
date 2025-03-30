import axios from 'axios';
import FormData from 'form-data';
import { app, shell, BrowserWindow, ipcMain, dialog, protocol } from 'electron'
import { join } from 'path'
import { promises as fsPromises } from 'fs'
import fs from 'fs'
import path from 'path'
import * as mm from 'music-metadata';
// import faiss from 'faiss-node'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/sound-sift-logo.png?asset'

// Import FAISS - we'll handle this with require to avoid TypeScript issues
const faiss = require('faiss-node')
const sound = require("sound-play");

async function debugFileSystem() {
  const userDataPath = getUserDataPath();
  const indexPath = getIndexPath();
  const metadataPath = getMetadataPath();

  console.log('==== DEBUGGING FILE SYSTEM ====');
  console.log(`User data path: ${userDataPath}`);
  console.log(`Index path: ${indexPath}`);
  console.log(`Metadata path: ${metadataPath}`);

  try {
    const userDataStats = await fsPromises.stat(userDataPath);
    console.log(`User data directory exists: ${userDataStats.isDirectory()}`);
  } catch (error) {
    console.log(`Error checking user data directory: ${error.message}`);
    try {
      await fs.promises.mkdir(userDataPath, { recursive: true });
      console.log(`Created user data directory`);
    } catch (createError) {
      console.log(`Failed to create user data directory: ${createError.message}`);
    }
  }

  const testFilePath = path.join(userDataPath, 'test-write.txt');
  try {
    await fs.promises.writeFile(testFilePath, 'Test write operation');
    console.log(`Successfully wrote test file: ${testFilePath}`);
    const content = await fs.promises.readFile(testFilePath, 'utf-8');
    console.log(`Successfully read test file, content: ${content}`);
    await fs.promises.unlink(testFilePath);
    console.log(`Successfully deleted test file`);
  } catch (error) {
    console.log(`Error with test file operations: ${error.message}`);
  }

  try {
    const indexStats = await fs.promises.stat(indexPath);
    console.log(`Index file exists: true, size: ${indexStats.size} bytes`);
  } catch (error) {
    console.log(`Index file does not exist: ${error.message}`);
  }

  try {
    const metadataStats = await fs.promises.stat(metadataPath);
    console.log(`Metadata file exists: true, size: ${metadataStats.size} bytes`);
    try {
      const content = await fs.promises.readFile(metadataPath, 'utf-8');
      console.log(`Metadata file content (first 100 chars): ${content.substring(0, 100)}...`);
      console.log(`Total metadata entries: ${JSON.parse(content).length}`);
    } catch (readError) {
      console.log(`Error reading metadata file: ${readError.message}`);
    }
  } catch (error) {
    console.log(`Metadata file does not exist: ${error.message}`);
  }

  console.log('==== END DEBUGGING FILE SYSTEM ====');
}

const getUserDataPath = () => app.getPath('userData');
const getIndexPath = () => path.join(getUserDataPath(), 'faiss-index.bin');
const getMetadataPath = () => path.join(getUserDataPath(), 'samples-metadata.json');

async function saveIndex(index) {
  try {
    console.log(`Attempting to save index to: ${getIndexPath()}`);
    index.write(getIndexPath());
    console.log(`Successfully wrote index file using write() method`);
    try {
      const stats = await fs.promises.stat(getIndexPath());
      console.log(`Verified index file exists with size: ${stats.size} bytes`);
      return true;
    } catch (statError) {
      console.error(`Error verifying index file: ${statError.message}`);
      return false;
    }
  } catch (error) {
    console.error(`Error saving index: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

const setupAudioProtocol = () => {
  protocol.registerFileProtocol('audio', (request, callback) => {
    const filePath = decodeURIComponent(request.url.slice('audio://'.length))
    try {
      return callback({ path: filePath })
    } catch (error) {
      console.error('Error in audio protocol:', error)
      return callback({ error: -2 /* FAILED */ })
    }
  })
}

// Update the loadIndex function to handle different FAISS implementations
// Update loadIndex function to use the correct methods
async function loadIndex(dimension) {
  try {
    const indexPath = getIndexPath();
    try {
      await fs.promises.access(indexPath);
      console.log(`Found existing index file at: ${indexPath}`);
      const loadedIndex = faiss.IndexFlatL2.read(indexPath);
      console.log(`Successfully loaded index with dimension: ${loadedIndex.getDimension()}`);
      console.log(`Total vectors in index: ${loadedIndex.ntotal()}`);
      return loadedIndex;
    } catch (error) {
      console.log(`No existing index file found or error reading it: ${error.message}`);
    }
    console.log(`Creating new index with dimension: ${dimension}`);
    return new faiss.IndexFlatL2(dimension);
  } catch (error) {
    console.error(`Error in loadIndex: ${error.message}`);
    console.log('Falling back to new index');
    return new faiss.IndexFlatL2(dimension);
  }
}

async function saveMetadata(metadata) {
  try {
    console.log(`Attempting to save metadata to: ${getMetadataPath()}`);
    const jsonString = JSON.stringify(metadata, null, 2);
    console.log(`Successfully serialized metadata, JSON length: ${jsonString.length} bytes`);
    try {
      await fs.promises.mkdir(path.dirname(getMetadataPath()), { recursive: true });
    } catch (dirError) {
      console.log(`Note: Directory creation result: ${dirError ? dirError.message : 'already exists'}`);
    }
    await fs.promises.writeFile(getMetadataPath(), jsonString);
    console.log(`Successfully wrote metadata file`);
    try {
      const stats = await fs.promises.stat(getMetadataPath());
      console.log(`Verified metadata file exists with size: ${stats.size} bytes`);
      return true;
    } catch (statError) {
      console.error(`Error verifying metadata file: ${statError.message}`);
      return false;
    }
  } catch (error) {
    console.error(`Error saving metadata: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

async function loadMetadata() {
  try {
    const data = await fs.promises.readFile(getMetadataPath(), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function addEmbedding(embedding, metadata) {
  try {
    if (!Array.isArray(embedding)) {
      throw new Error('Embedding must be an array');
    }
    const dimension = embedding.length;
    if (dimension <= 0) {
      throw new Error('Embedding array must have a positive length');
    }
    const index = await loadIndex(dimension);
    console.log(`Adding embedding with dimension: ${dimension}`);
    index.add(embedding);
    console.log(`Total vectors in index after adding: ${index.ntotal()}`);
    const metadataList = await loadMetadata();
    metadataList.push(metadata);
    const indexSaved = await saveIndex(index);
    const metadataSaved = await saveMetadata(metadataList);
    console.log(`Index saved: ${indexSaved}, Metadata saved: ${metadataSaved}`);
    return metadataList.length - 1;
  } catch (error) {
    console.error('Error in addEmbedding:', error);
    throw error;
  }
}

async function searchSimilar(queryEmbedding, numResults = 10) {
  try {
      console.log('Query Embedding:', queryEmbedding);
      if (!queryEmbedding.query_embedding || !Array.isArray(queryEmbedding.query_embedding)) {
          console.error('Query embedding is not in the correct format.');
          return [];
      }
      const embeddingArray = queryEmbedding.query_embedding;
      const index = await loadIndex(embeddingArray.length);
      const metadataList = await loadMetadata();
      const count = Math.min(numResults, metadataList.length);
      if (count === 0) {
          return [];
      }
      console.log(`Searching for ${count} similar samples`);
      const results = index.search(embeddingArray, count);
      console.log(`Search results:`, {
          numResults: results.labels.length,
          labels: results.labels,
          distances: results.distances,
      });
      return results.labels.map((idx, i) => ({
          similarity: 1 / (1 + results.distances[i]),
          metadata: metadataList[idx],
      }));
  } catch (error) {
      console.error('Error searching for similar samples:', error);
      return [];
  }
}

async function getAudioEmbeddingFromBackend(filePath: string): Promise<{ query_embedding: number[] } | null> {
  try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath), path.basename(filePath));
      const response = await axios.post('http://34.85.129.73:8000/api/embed/audio', formData, {
          headers: formData.headers,
      });
      return response.data; // Return the entire response data
  } catch (error) {
      console.error('Error getting audio embedding from backend:', error);
      return null;
  }
}

async function getTextEmbeddingFromBackend(text: string) {
  try {
      const formData = new FormData();
      formData.append('text', text); // Send text as 'text' field

      const headers = formData.headers;

      const response = await axios.post('http://34.85.129.73:8000/api/embed/text', formData, {
          headers: headers,
      });

      console.log('Text embedding response:', response.data);
      return response.data;
  } catch (error: any) {
      console.error('Error getting text embedding from backend:', error);
      return false;
  }
}

async function generateEmbedding(filePath: string, text?: string) {
  try {
      let embedding: { query_embedding: number[] } | null = null;
      if (text) {
          embedding = await getTextEmbeddingFromBackend(text);
      } else {
          console.log('Audio filePath:', filePath); // Add this line
          embedding = await getAudioEmbeddingFromBackend(filePath);
      }
      if (!embedding) {
          throw new Error('Failed to generate embedding from backend.');
      }
      console.log('Generated Embedding:', embedding);
      return embedding;
  } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
  }
}

async function generateEmbeddingsBatch(samples: { path: string, name: string, directory: string, extension: string }[]) {
  try {
      const formData = new FormData();
      samples.forEach((sample) => {
          formData.append('files', fs.createReadStream(sample.path), path.basename(sample.path));
      });

      const headers = formData.headers;

      const response = await axios.post('http://34.85.129.73:8000/api/embed/batch_upload', formData, {
          headers: headers,
      });

      const sampleEmbeddings = response.data.sample_embeddings;
      if (!sampleEmbeddings || typeof sampleEmbeddings !== 'object') {
          console.error('Invalid sample_embeddings format from backend.');
          return false;
      }

      for (let i = 0; i < samples.length; i++) {
          const sample = samples[i];
          const embedding = sampleEmbeddings[sample.name]; // Use filename as key

          if (!Array.isArray(embedding)) {
              console.error(`Invalid embedding for ${sample.name}.`);
              continue;
          }

          const metadata = {
              path: sample.path,
              filename: sample.name,
              directory: sample.directory,
              extension: sample.extension,
              timestamp: new Date().toISOString(),
          };

          await addEmbedding(embedding, metadata);
      }

      return true;
  } catch (error: any) {
      console.error('Error generating embeddings batch:', error);
      if (error.response && error.response.data && error.response.data.detail) {
          console.error('FastAPI validation errors:', error.response.data.detail);
      }
      return false;
  }
}

async function findSimilarSamples(samplePath: string, text?: string) {
  try {
      const queryEmbedding = await generateEmbedding(samplePath, text);
      console.log('Query Embedding before search:', queryEmbedding); // Add this line
      if (!queryEmbedding || !queryEmbedding.query_embedding || !Array.isArray(queryEmbedding.query_embedding)) {
          throw new Error('Failed to generate query embedding from backend or invalid format.');
      }
      const similarSamples = await searchSimilar(queryEmbedding, 20);
      return similarSamples;
  } catch (error) {
      console.error('Error finding similar samples:', error);
      return [];
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.on('ping', () => console.log('pong'));
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  ipcMain.handle('select-samples-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Samples Folder',
    });
    if (!result.canceled) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('scan-samples', async (_, directoryPath) => {
    try {
      const audioExtensions = ['.wav', '.mp3', '.aiff', '.flac', '.ogg'];
      const files = await scanDirectory(directoryPath, audioExtensions);
      return files;
    } catch (error) {
      console.error('Error scanning for samples:', error);
      return [];
    }
  });

  async function scanDirectory(directory, extensions) {
    let results = [];
    try {
      const items = await fs.promises.readdir(directory, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(directory, item.name);
        if (item.isDirectory()) {
          const subResults = await scanDirectory(fullPath, extensions);
          results = results.concat(subResults);
        } else {
          const ext = path.extname(item.name).toLowerCase();
          console.log("full path", fullPath)
          if (extensions.includes(ext)) {
            // New code to get audio metadata
            let duration = "0:30"; // Default fallback
            
            try {
              // Parse audio metadata
              const metadata = await mm.parseFile(fullPath);
              
              // Get duration in seconds
              const durationSec = metadata.format.duration || 0;
              
              // Format as MM:SS
              const minutes = Math.floor(durationSec / 60);
              const seconds = Math.floor(durationSec % 60);
              duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } catch (metadataError) {
              console.error(`Error getting metadata for ${fullPath}:`, metadataError)
            }
            
            results.push({
              name: item.name,
              path: fullPath,
              directory: directory,
              extension: ext,
              duration: duration // Add duration to the results
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
    }
    return results;
  }

  ipcMain.handle('generate-embedding', async (_, filePath, text?: string) => {
    try {
      const embedding = await generateEmbedding(filePath, text);
      if (!embedding) return false;
      const metadata = {
        path: filePath,
        filename: path.basename(filePath),
        directory: path.dirname(filePath),
        extension: path.extname(filePath),
        timestamp: new Date().toISOString(),
      };
      const idx = await addEmbedding(embedding, metadata);
      return idx !== -1;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return false;
    }
  });

  ipcMain.handle('get-all-embeddings', async () => {
    try {
      const metadataList = await loadMetadata();
      return {
        count: metadataList.length,
        embeddings: metadataList,
      };
    } catch (error) {
      console.error('Error getting all embeddings:', error);
      return {
        count: 0,
        embeddings: [],
      };
    }
  });

  ipcMain.handle('generate-embeddings-batch', async (_, samples) => {
    return await generateEmbeddingsBatch(samples);
  });

  ipcMain.handle('find-similar-samples', async (_, payload: { arrayBuffer?: ArrayBuffer; fileName?: string; text?: string }) => {
      try {
          if (payload.text) {
              // Text search
              return await findSimilarSamples('', payload.text);
          } else if (payload.arrayBuffer && payload.fileName) {
              // Audio file upload
              const tempFilePath = path.join(app.getPath('temp'), payload.fileName);
              await fs.promises.writeFile(tempFilePath, Buffer.from(payload.arrayBuffer));
              const results = await findSimilarSamples(tempFilePath);
              await fs.promises.unlink(tempFilePath);
              return results;
          } else {
              throw new Error('Invalid payload for find-similar-samples');
          }
      } catch (error) {
          console.error('Error finding similar samples:', error);
          return [];
      }
  });

  ipcMain.handle('get-embedding-stats', async () => {
    try {
      let hasIndex = false;
      let count = 0;
      try {
        await fs.promises.access(getIndexPath());
        hasIndex = true;
      } catch {}
      try {
        const metadata = await loadMetadata();
        count = metadata.length;
      } catch {}
      return { count, hasIndex };
    } catch (error) {
      console.error('Error getting embedding stats:', error);
      return { count: 0, hasIndex: false };
    }
  });

  ipcMain.handle('clear-embeddings', async () => {
    try {
      try {
        await fs.promises.unlink(getIndexPath());
      } catch {}
      try {
        await fs.promises.unlink(getMetadataPath());
      } catch {}
      return true;
    } catch (error) {
      console.error('Error clearing embeddings:', error);
      return false;
    }
  });

  ipcMain.handle('get-storage-path', () => {
    return app.getPath('userData');
  });

  ipcMain.handle('debug-file-system', async () => {
    await debugFileSystem();
    return 'Debugging complete, check console logs';
  });


  // Handle the getAudioUrl IPC call
  ipcMain.handle('get-audio-url', (event, filePath) => {
    // Make sure the file exists
    try {
      if (fs.existsSync(filePath)) {
        // Return a URL using our custom protocol
        return `audio://${encodeURIComponent(filePath)}`
      } else {
        console.error(`File does not exist: ${filePath}`)
        throw new Error(`File does not exist: ${filePath}`)
      }
    } catch (error) {
      console.error('Error accessing audio file:', error)
      throw new Error(`Could not access audio file: ${filePath}`)
    }
  })

  // Handle play audio request
ipcMain.handle('play-audio', async (event, filePath) => {
  try {
    // Check if the file exists using fsPromises instead of fsPromises.promises
    if (fs.existsSync(filePath)) {
      console.log('File exists, attempting to play:', filePath)
      
      // Play using the system's default audio player
      sound.play(filePath)
      // shell.openPath(filePath)
      return { success: true, method: 'external' }
    } else {
      console.error('File does not exist:', filePath)
      return { success: false, error: 'File not found' }
    }
  } catch (error) {
    console.error('Error playing audio:', error)
    return { success: false, error: error.message }
  }
})

// Handle stop audio request (not much we can do with system player)
ipcMain.handle('stop-audio', async (event) => {
  return { success: true }
})

// Helper method to check if a file exists
ipcMain.handle('check-file-exists', async (event, filePath) => {
  try {
    return fs.existsSync(filePath)
  } catch (error) {
    console.error('Error checking if file exists:', error)
    return false
  }
})

});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});