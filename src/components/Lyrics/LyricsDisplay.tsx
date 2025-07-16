import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SyncedLine, type LineState } from './SyncedLine'
import { useLyricsStore } from '../../store/lyricsSlice'
import { useSettingsStore } from '../../store/settingsSlice'
import { useSyncedLyrics } from '../../hooks/useSyncedLyrics'

export function LyricsDisplay() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { rawLyrics, isTimed, syncedLines, currentLineIndex, setCurrentLineIndex } = useLyricsStore()
  const { fontSize, autoScroll, highlightCurrentLine } = useSettingsStore()

  // User-scroll pause: when the user manually scrolls, pause auto-scroll for 5 seconds
  const [userScrollPaused, setUserScrollPaused] = useState(false)
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoScrollingRef = useRef(false)

  const handleUserScroll = useCallback(() => {
    // Ignore scroll events triggered by our own auto-scroll
    if (isAutoScrollingRef.current) return

    setUserScrollPaused(true)

    // Clear existing timer
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current)
    }

    // Resume auto-scroll after 5 seconds of no user scrolling
    pauseTimerRef.current = setTimeout(() => {
      setUserScrollPaused(false)
    }, 5000)
  }, [])

  // Attach wheel/touch listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleUserScroll, { passive: true })
    container.addEventListener('touchmove', handleUserScroll, { passive: true })

    return () => {
      container.removeEventListener('wheel', handleUserScroll)
      container.removeEventListener('touchmove', handleUserScroll)
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
  }, [handleUserScroll])

  // Get synced lyrics state
  const { getLineClass, seekTo } = useSyncedLyrics({
    enabled: isTimed,
    scrollBehavior: 'smooth',
  })

  // Parse unsynced lyrics into lines
  const unsyncedLines = useMemo(() => {
    if (isTimed) return []
    return rawLyrics.split('\n').map(line => line.trim())
  }, [rawLyrics, isTimed])

  // Auto-scroll to current line (respects user-scroll pause)
  useEffect(() => {
    if (!autoScroll || userScrollPaused || !containerRef.current || currentLineIndex < 0) return

    const container = containerRef.current
    const lineElements = container.querySelectorAll('[data-lyric-line]')

    if (lineElements[currentLineIndex]) {
      const element = lineElements[currentLineIndex] as HTMLElement
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()

      // Center the current line
      const scrollTop = element.offsetTop - container.offsetTop -
        (containerRect.height / 2) + (elementRect.height / 2)

      // Flag that we're auto-scrolling so the wheel listener ignores it
      isAutoScrollingRef.current = true
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
      // Clear flag after scroll animation completes
      setTimeout(() => {
        isAutoScrollingRef.current = false
      }, 400)
    }
  }, [currentLineIndex, autoScroll, userScrollPaused])

  // Handle line click for seeking
  const handleLineClick = (index: number) => {
    if (isTimed && syncedLines[index]) {
      setCurrentLineIndex(index)
      seekTo(syncedLines[index].time)
      // Resume auto-scroll on line click
      setUserScrollPaused(false)
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
  }

  // Get line state for styling
  const getLineState = (index: number): LineState => {
    if (!highlightCurrentLine || currentLineIndex < 0) return 'future'
    return getLineClass(index)
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto lyrics-scroll"
      style={{ scrollBehavior: 'smooth' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isTimed ? 'synced' : 'unsynced'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col pt-4 pb-4"
        >
          {isTimed ? (
            // Synced lyrics display
            syncedLines.map((line, index) => (
              <SyncedLine
                key={`${index}-${line.time}`}
                text={line.text}
                state={getLineState(index)}
                index={index}
                fontSize={fontSize}
                onClick={() => handleLineClick(index)}
              />
            ))
          ) : (
            // Unsynced lyrics display
            unsyncedLines.map((line, index) => (
              <motion.div
                key={index}
                data-lyric-line
                data-index={index}
                className="px-6 py-1.5"
                style={{ color: 'var(--text-secondary)', fontSize }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
              >
                {line || <span className="opacity-0">.</span>}
              </motion.div>
            ))
          )}

          {/* Bottom padding so last lines can scroll into view */}
          <div className="flex-shrink-0 h-32" />
        </motion.div>
      </AnimatePresence>

      {/* Scroll fade overlays — smooth glassmorphic edges */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 z-10"
        style={{ background: 'linear-gradient(to bottom, var(--bg-surface) 0%, rgba(17, 18, 20, 0.6) 50%, transparent 100%)' }} />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 z-10"
        style={{ background: 'linear-gradient(to top, var(--bg-void) 0%, rgba(10, 11, 14, 0.6) 50%, transparent 100%)' }} />
    </div>
  )
}
