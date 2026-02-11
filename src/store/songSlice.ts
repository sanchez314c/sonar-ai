import { create } from 'zustand'

export interface SongInfo {
  artist: string
  title: string
  raw_title: string
  service: string
  album?: string | null
  year?: number | null
  albumArt?: string | null
}

interface SongState {
  currentSong: SongInfo | null
  isLoading: boolean
  error: string | null

  // Actions
  setCurrentSong: (song: SongInfo | null) => void
  fetchCurrentSong: (serviceName?: string) => Promise<SongInfo | null>
  setError: (error: string | null) => void
}

export const useSongStore = create<SongState>((set, get) => ({
  currentSong: null,
  isLoading: false,
  error: null,

  setCurrentSong: (song) => set({ currentSong: song }),

  fetchCurrentSong: async (serviceName?: string) => {
    const { currentSong } = get()

    // Only show loading on first fetch (no song yet)
    if (!currentSong) {
      set({ isLoading: true, error: null })
    }

    try {
      const song = await window.sonarAPI.python.getCurrentSong(serviceName)

      if (song) {
        // Only update store if song actually changed (prevents unnecessary re-renders)
        if (!currentSong ||
            song.artist !== currentSong.artist ||
            song.title !== currentSong.title ||
            song.raw_title !== currentSong.raw_title) {
          const songInfo: SongInfo = {
            ...song,
            albumArt: null
          }
          set({ currentSong: songInfo, isLoading: false })
          return songInfo
        }
        // Same song — just clear loading if it was set
        if (get().isLoading) set({ isLoading: false })
        return currentSong
      } else {
        set({ isLoading: false })
        return null
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch current song'
      set({ error: errorMessage, isLoading: false })
      return null
    }
  },

  setError: (error) => set({ error }),
}))
