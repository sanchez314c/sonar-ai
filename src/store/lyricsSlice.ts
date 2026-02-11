import { create } from 'zustand'
import { parseLRC, type LRCLine } from '../services/lrcParser'

export interface LyricsResult {
  lyrics: string
  url: string
  service_name: string
  timed: boolean
  album?: string | null
  year?: number | null
  error?: string
}

interface LyricsState {
  // Raw lyrics data
  rawLyrics: string
  lyricsUrl: string
  serviceName: string
  isTimed: boolean

  // Parsed synced lyrics
  syncedLines: LRCLine[]
  currentLineIndex: number

  // UI state
  isLoading: boolean
  error: string | null

  // For tracking the current song
  currentArtist: string
  currentTitle: string

  // Actions
  fetchLyrics: (artist: string, title: string, sync?: boolean) => Promise<void>
  fetchNextLyrics: (artist: string, title: string, sync?: boolean) => Promise<void>
  saveLyrics: (artist: string, title: string, lyrics: string, timed?: boolean) => Promise<boolean>
  setCurrentLineIndex: (index: number) => void
  clearLyrics: () => void
  setError: (error: string | null) => void
}

export const useLyricsStore = create<LyricsState>((set, get) => ({
  rawLyrics: '',
  lyricsUrl: '',
  serviceName: '---',
  isTimed: false,
  syncedLines: [],
  currentLineIndex: -1,
  isLoading: false,
  error: null,
  currentArtist: '',
  currentTitle: '',

  fetchLyrics: async (artist: string, title: string, sync = true) => {
    set({
      isLoading: true,
      error: null,
      currentArtist: artist,
      currentTitle: title
    })

    try {
      const result = await window.sonarAPI.python.getLyrics(artist, title, sync)

      if (result.error) {
        set({
          rawLyrics: result.lyrics,
          lyricsUrl: '',
          serviceName: result.service_name,
          isTimed: false,
          syncedLines: [],
          currentLineIndex: -1,
          isLoading: false,
          error: result.error
        })
        return
      }

      // Parse LRC if timed
      const syncedLines = result.timed ? parseLRC(result.lyrics) : []

      set({
        rawLyrics: result.lyrics,
        lyricsUrl: result.url,
        serviceName: result.service_name,
        isTimed: result.timed,
        syncedLines,
        currentLineIndex: -1,
        isLoading: false,
        error: null
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch lyrics'
      set({
        rawLyrics: `Error: ${errorMessage}`,
        lyricsUrl: '',
        serviceName: '---',
        isTimed: false,
        syncedLines: [],
        currentLineIndex: -1,
        isLoading: false,
        error: errorMessage
      })
    }
  },

  fetchNextLyrics: async (artist: string, title: string, sync = true) => {
    set({ isLoading: true, error: null })

    try {
      const result = await window.sonarAPI.python.nextLyrics(artist, title, sync)

      if (result.error) {
        set({
          rawLyrics: result.lyrics,
          lyricsUrl: '',
          serviceName: result.service_name,
          isTimed: false,
          syncedLines: [],
          currentLineIndex: -1,
          isLoading: false,
          error: result.error
        })
        return
      }

      const syncedLines = result.timed ? parseLRC(result.lyrics) : []

      set({
        rawLyrics: result.lyrics,
        lyricsUrl: result.url,
        serviceName: result.service_name,
        isTimed: result.timed,
        syncedLines,
        currentLineIndex: -1,
        isLoading: false,
        error: null
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch next lyrics'
      set({
        isLoading: false,
        error: errorMessage
      })
    }
  },

  saveLyrics: async (artist: string, title: string, lyrics: string, timed = false) => {
    try {
      const result = await window.sonarAPI.python.saveLyrics(artist, title, lyrics, timed)
      if (!result.success && result.error) {
        set({ error: result.error })
        return false
      }
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save lyrics'
      set({ error: errorMessage })
      return false
    }
  },

  setCurrentLineIndex: (index: number) => set({ currentLineIndex: index }),

  clearLyrics: () => set({
    rawLyrics: '',
    lyricsUrl: '',
    serviceName: '---',
    isTimed: false,
    syncedLines: [],
    currentLineIndex: -1,
    error: null,
    currentArtist: '',
    currentTitle: ''
  }),

  setError: (error) => set({ error }),
}))
