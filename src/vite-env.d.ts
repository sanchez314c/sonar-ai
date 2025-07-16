/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_SERVER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Type declarations for the contextBridge API exposed from electron/preload.ts

interface SongInfo {
  artist: string
  title: string
  raw_title: string
  service: string
  albumArt?: string
  album?: string
}

interface LyricsResult {
  lyrics: string
  url: string
  service_name: string
  timed: boolean
  album?: string | null
  year?: number | null
  error?: string
}

interface Config {
  lyrics_dir: string
  settings_dir: string
  default_lyrics_dir: string
  synced_sources: number
  unsynced_sources: number
}

interface SaveResult {
  success: boolean
  path?: string
  error?: string
}

interface ServiceResult {
  success: boolean
  service?: string
  error?: string
  available?: string[]
}

interface Window {
  sonarAPI: {
    window: {
      minimize: () => void
      maximize: () => void
      close: () => void
      isMaximized: () => Promise<boolean>
      onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void
    }
    openExternal: (url: string) => Promise<{ success: boolean; error?: string }>
    python: {
      ping: () => Promise<{ status: string; version: string }>
      getConfig: () => Promise<Config>
      getCurrentSong: (serviceName?: string) => Promise<SongInfo | null>
      getLyrics: (artist: string, title: string, sync?: boolean) => Promise<LyricsResult>
      nextLyrics: (artist: string, title: string, sync?: boolean) => Promise<LyricsResult>
      saveLyrics: (artist: string, title: string, lyrics: string, timed?: boolean) => Promise<SaveResult>
      setLyricsDirectory: (path: string) => Promise<SaveResult>
      setService: (serviceName: string) => Promise<ServiceResult>
    }
  }
}
