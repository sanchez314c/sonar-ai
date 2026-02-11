import { useEffect, useRef, useState, useCallback } from 'react'
import { useLyricsStore } from '../store/lyricsSlice'
import { useSettingsStore } from '../store/settingsSlice'
import { findCurrentLineIndex, type LRCLine } from '../services/lrcParser'

interface UseSyncedLyricsOptions {
  enabled?: boolean
  scrollBehavior?: 'smooth' | 'instant'
}

interface SyncState {
  currentLineIndex: number
  isPlaying: boolean
  elapsedTime: number
}

/**
 * Hook for managing synchronized lyrics playback
 * Tracks the current line based on elapsed time
 */
export function useSyncedLyrics(options: UseSyncedLyricsOptions = {}) {
  const { enabled = true, scrollBehavior = 'smooth' } = options

  const { syncedLines, isTimed, currentLineIndex, setCurrentLineIndex } = useLyricsStore()
  const { autoScroll, highlightCurrentLine } = useSettingsStore()

  // Local state for playback tracking
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Refs for animation frame management
  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Calculate current line based on elapsed time
  const updateCurrentLine = useCallback((timeMs: number) => {
    if (!enabled || !isTimed || syncedLines.length === 0) return

    const newIndex = findCurrentLineIndex(syncedLines, timeMs)

    if (newIndex !== currentLineIndex) {
      setCurrentLineIndex(newIndex)

      // Auto-scroll to current line
      if (autoScroll && containerRef.current && newIndex >= 0) {
        const container = containerRef.current
        const lineElements = container.querySelectorAll('[data-lyric-line]')

        if (lineElements[newIndex]) {
          const element = lineElements[newIndex] as HTMLElement
          const containerRect = container.getBoundingClientRect()
          const elementRect = element.getBoundingClientRect()

          // Center the current line in the container
          const scrollTop = element.offsetTop - container.offsetTop -
            (containerRect.height / 2) + (elementRect.height / 2)

          container.scrollTo({
            top: scrollTop,
            behavior: scrollBehavior
          })
        }
      }
    }
  }, [enabled, isTimed, syncedLines, currentLineIndex, setCurrentLineIndex, autoScroll, scrollBehavior])

  // Start playback timer
  const startPlayback = useCallback((startTimeMs: number = 0) => {
    if (!enabled || !isTimed) return

    setIsPlaying(true)
    setElapsedTime(startTimeMs)
    startTimeRef.current = performance.now() - startTimeMs

    const animate = () => {
      const elapsed = performance.now() - startTimeRef.current
      setElapsedTime(elapsed)
      updateCurrentLine(elapsed)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [enabled, isTimed, updateCurrentLine])

  // Stop playback timer
  const stopPlayback = useCallback(() => {
    setIsPlaying(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Seek to specific time
  const seekTo = useCallback((timeMs: number) => {
    setElapsedTime(timeMs)
    startTimeRef.current = performance.now() - timeMs
    updateCurrentLine(timeMs)
  }, [updateCurrentLine])

  // Reset on lyrics change
  useEffect(() => {
    stopPlayback()
    setElapsedTime(0)
    setCurrentLineIndex(-1)

    // Auto-start playback when new synced lyrics load
    if (isTimed && syncedLines.length > 0 && enabled) {
      startPlayback(0)
    }
  }, [syncedLines, isTimed])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Get line classification for styling
  const getLineClass = useCallback((index: number): 'past' | 'current' | 'future' => {
    if (!highlightCurrentLine || currentLineIndex < 0) return 'future'

    if (index < currentLineIndex) return 'past'
    if (index === currentLineIndex) return 'current'
    return 'future'
  }, [currentLineIndex, highlightCurrentLine])

  return {
    // State
    currentLineIndex,
    isPlaying,
    elapsedTime,
    isTimed,
    syncedLines,

    // Controls
    startPlayback,
    stopPlayback,
    seekTo,

    // Styling helpers
    getLineClass,

    // Ref to attach to container for auto-scroll
    containerRef,

    // Computed
    currentLine: currentLineIndex >= 0 ? syncedLines[currentLineIndex] : null,
    progress: syncedLines.length > 0 ?
      (currentLineIndex + 1) / syncedLines.length * 100 : 0,
  }
}
