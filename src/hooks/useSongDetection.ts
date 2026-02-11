import { useEffect, useRef, useCallback } from 'react'
import { useSongStore } from '../store/songSlice'
import { useLyricsStore } from '../store/lyricsSlice'
import { useSettingsStore } from '../store/settingsSlice'

interface UseSongDetectionOptions {
  enabled?: boolean
  onSongChange?: (song: { artist: string; title: string } | null) => void
}

/**
 * Hook for detecting song changes from the media player
 * Polls the Python backend at the configured interval
 */
export function useSongDetection(options: UseSongDetectionOptions = {}) {
  const { enabled = true, onSongChange } = options

  const { currentSong, fetchCurrentSong, setCurrentSong } = useSongStore()
  const { fetchLyrics, clearLyrics } = useLyricsStore()
  const { pollingInterval, syncEnabled, activeService } = useSettingsStore()

  // Use ref to track previous song for change detection
  const previousSongRef = useRef<{ artist: string; title: string } | null>(null)

  const pollForSong = useCallback(async () => {
    if (!enabled) return

    try {
      const song = await fetchCurrentSong(activeService)

      // Check if song changed
      const prevSong = previousSongRef.current
      const hasSongChanged = !prevSong !== !song ||
        (song && prevSong && (song.artist !== prevSong.artist || song.title !== prevSong.title))

      if (hasSongChanged) {
        previousSongRef.current = song ? { artist: song.artist, title: song.title } : null

        if (song) {
          // New song detected
          await fetchLyrics(song.artist, song.title, syncEnabled)
          onSongChange?.({ artist: song.artist, title: song.title })
        } else {
          // No song playing
          clearLyrics()
          onSongChange?.(null)
        }
      }
    } catch (error) {
      console.error('Error detecting song:', error)
    }
  }, [enabled, activeService, syncEnabled, fetchCurrentSong, fetchLyrics, clearLyrics, onSongChange])

  // Set up polling interval
  useEffect(() => {
    if (!enabled) return

    // Initial poll
    pollForSong()

    // Set up interval
    const intervalId = setInterval(pollForSong, pollingInterval)

    return () => clearInterval(intervalId)
  }, [enabled, pollingInterval, pollForSong])

  // Return current state and manual trigger
  return {
    currentSong,
    isDetecting: enabled,
    refreshNow: pollForSong,
  }
}
