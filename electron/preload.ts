import { contextBridge, ipcRenderer } from 'electron'

// Type definitions for the API
export interface SongInfo {
  artist: string
  title: string
  raw_title: string
  service: string
}

export interface LyricsResult {
  lyrics: string
  url: string
  service_name: string
  timed: boolean
  album?: string | null
  year?: number | null
  error?: string
}

export interface Config {
  lyrics_dir: string
  settings_dir: string
  default_lyrics_dir: string
  synced_sources: number
  unsynced_sources: number
}

export interface SaveResult {
  success: boolean
  path?: string
  error?: string
}

export interface ServiceResult {
  success: boolean
  service?: string
  error?: string
  available?: string[]
}

// Expose protected methods to the renderer process
const api = {
  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized)
      ipcRenderer.on('window:maximize-change', handler)
      return () => ipcRenderer.removeListener('window:maximize-change', handler)
    }
  },

  // Shell — open external URLs safely
  openExternal: (url: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('open-external', url),

  // Python backend API
  python: {
    ping: (): Promise<{ status: string; version: string }> =>
      ipcRenderer.invoke('python:ping'),

    getConfig: (): Promise<Config> =>
      ipcRenderer.invoke('python:getConfig'),

    getCurrentSong: (serviceName?: string): Promise<SongInfo | null> =>
      ipcRenderer.invoke('python:getCurrentSong', serviceName),

    getLyrics: (artist: string, title: string, sync?: boolean): Promise<LyricsResult> =>
      ipcRenderer.invoke('python:getLyrics', artist, title, sync),

    nextLyrics: (artist: string, title: string, sync?: boolean): Promise<LyricsResult> =>
      ipcRenderer.invoke('python:nextLyrics', artist, title, sync),

    saveLyrics: (artist: string, title: string, lyrics: string, timed?: boolean): Promise<SaveResult> =>
      ipcRenderer.invoke('python:saveLyrics', artist, title, lyrics, timed),

    setLyricsDirectory: (path: string): Promise<SaveResult> =>
      ipcRenderer.invoke('python:setLyricsDirectory', path),

    setService: (serviceName: string): Promise<ServiceResult> =>
      ipcRenderer.invoke('python:setService', serviceName)
  }
}

// Expose API to renderer via contextBridge
contextBridge.exposeInMainWorld('sonarAPI', api)

// Type declaration for the renderer process
declare global {
  interface Window {
    sonarAPI: typeof api
  }
}
