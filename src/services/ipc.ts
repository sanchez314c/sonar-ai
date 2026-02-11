/**
 * IPC Service Type Definitions
 * Type-safe wrapper for the Electron IPC bridge
 */

// Re-export types from the preload script
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

// Type-safe API access
export const ipc = {
  window: {
    minimize: () => window.sonarAPI.window.minimize(),
    maximize: () => window.sonarAPI.window.maximize(),
    close: () => window.sonarAPI.window.close(),
    isMaximized: () => window.sonarAPI.window.isMaximized(),
  },

  python: {
    ping: () => window.sonarAPI.python.ping(),
    getConfig: () => window.sonarAPI.python.getConfig(),
    getCurrentSong: (serviceName?: string) => window.sonarAPI.python.getCurrentSong(serviceName),
    getLyrics: (artist: string, title: string, sync?: boolean) =>
      window.sonarAPI.python.getLyrics(artist, title, sync),
    nextLyrics: (artist: string, title: string, sync?: boolean) =>
      window.sonarAPI.python.nextLyrics(artist, title, sync),
    saveLyrics: (artist: string, title: string, lyrics: string, timed?: boolean) =>
      window.sonarAPI.python.saveLyrics(artist, title, lyrics, timed),
    setLyricsDirectory: (path: string) => window.sonarAPI.python.setLyricsDirectory(path),
    setService: (serviceName: string) => window.sonarAPI.python.setService(serviceName),
  },
}
