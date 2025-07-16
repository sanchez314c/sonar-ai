import { app, BrowserWindow, ipcMain, nativeTheme, shell } from 'electron'
import { join } from 'path'
import { pythonBridge } from './python-bridge'

// Handle Linux Electron issues
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('enable-transparent-visuals')
  app.commandLine.appendSwitch('disable-gpu-compositing')
}

let mainWindow: BrowserWindow | null = null
const isMac = process.platform === 'darwin'

async function createWindow(): Promise<void> {
  // Start Python backend first
  try {
    await pythonBridge.start()
    console.log('Python backend started successfully')
  } catch (error) {
    console.error('Failed to start Python backend:', error)
  }

  // Create the frameless transparent window
  // Layout: single column (no sidebar) + 32px body padding — optimized for tall narrow
  mainWindow = new BrowserWindow({
    width: 480,
    height: 850,
    minWidth: 360,
    minHeight: 500,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: true,
    roundedCorners: true,
    ...(isMac ? { titleBarStyle: 'hiddenInset' as const } : {}),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // sandbox: true would be ideal but breaks vite-plugin-electron-renderer's
      // require() polyfill in the preload context. Keep false until that plugin
      // is upgraded to support sandboxed preloads (tracked as audit item).
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
    icon: join(__dirname, '../resources/icon.png'),
    show: false
  })

  // Set dark mode
  nativeTheme.themeSource = 'dark'

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle external links — validate protocol before opening
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url)
      if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        shell.openExternal(url)
      }
    } catch { /* invalid URL, ignore */ }
    return { action: 'deny' }
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // DevTools: open manually via Ctrl+Shift+I (Linux/Win) or Cmd+Option+I (macOS)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  // Emit maximize state changes to renderer so preload's onMaximizeChange works
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximize-change', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximize-change', false)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC Handlers - Bridge between renderer and Python backend

// Window controls
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false
})

// Open external URL — validate protocol to prevent arbitrary code execution
ipcMain.handle('open-external', async (_event, url: string) => {
  try {
    const parsed = new URL(url)
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      await shell.openExternal(url)
      return { success: true }
    }
    // Allow file:// only for paths inside the user's home directory (local lyrics)
    if (parsed.protocol === 'file:') {
      const userDataPath = app.getPath('home')
      const filePath = decodeURIComponent(parsed.pathname)
      // Must be within the user's home directory
      if (filePath.startsWith(userDataPath)) {
        await shell.openPath(filePath)
        return { success: true }
      }
      return { success: false, error: 'File path outside allowed directory' }
    }
    return { success: false, error: 'Invalid URL protocol' }
  } catch {
    return { success: false, error: 'Invalid URL' }
  }
})

// Python backend calls
ipcMain.handle('python:ping', async () => {
  return await pythonBridge.call('ping')
})

ipcMain.handle('python:getConfig', async () => {
  return await pythonBridge.call('get_config')
})

ipcMain.handle('python:getCurrentSong', async (_event, serviceName?: string) => {
  return await pythonBridge.call('get_current_song', serviceName ? { service_name: serviceName } : {})
})

ipcMain.handle('python:getLyrics', async (_event, artist: string, title: string, sync?: boolean) => {
  return await pythonBridge.call('get_lyrics', { artist, title, sync: sync ?? true })
})

ipcMain.handle('python:nextLyrics', async (_event, artist: string, title: string, sync?: boolean) => {
  return await pythonBridge.call('next_lyrics', { artist, title, sync: sync ?? true })
})

ipcMain.handle('python:saveLyrics', async (_event, artist: string, title: string, lyrics: string, timed?: boolean) => {
  return await pythonBridge.call('save_lyrics', { artist, title, lyrics, timed: timed ?? false })
})

ipcMain.handle('python:setLyricsDirectory', async (_event, path: string) => {
  return await pythonBridge.call('set_lyrics_directory', { path })
})

ipcMain.handle('python:setService', async (_event, serviceName: string) => {
  return await pythonBridge.call('set_service', { service_name: serviceName })
})

// App lifecycle — delay on Linux for transparent visuals to initialize
app.whenReady().then(() => {
  if (process.platform === 'linux') {
    setTimeout(createWindow, 300)
  } else {
    createWindow()
  }
})

app.on('window-all-closed', async () => {
  await pythonBridge.stop()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', async () => {
  await pythonBridge.stop()
})
