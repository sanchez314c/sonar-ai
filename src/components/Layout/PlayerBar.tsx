import { useSongStore } from '../../store/songSlice'
import { useLyricsStore } from '../../store/lyricsSlice'
import { useSettingsStore } from '../../store/settingsSlice'

interface PlayerBarProps {
  onSettingsClick: () => void
}

export function PlayerBar({ onSettingsClick }: PlayerBarProps) {
  const { currentSong } = useSongStore()
  const { fetchNextLyrics, currentArtist, currentTitle, isLoading, syncedLines, rawLyrics, isTimed } = useLyricsStore()
  const { syncEnabled, activeService } = useSettingsStore()

  const handleNextLyrics = async () => {
    if (currentArtist && currentTitle) {
      await fetchNextLyrics(currentArtist, currentTitle, syncEnabled)
    }
  }

  const isOnline = !!currentSong

  // Derive lyrics line count for status bar
  const lineCount = isTimed
    ? syncedLines.filter(l => l.text.trim()).length
    : rawLyrics
      ? rawLyrics.split('\n').filter(l => l.trim()).length
      : 0

  const countLabel = lineCount > 0
    ? `${lineCount} line${lineCount !== 1 ? 's' : ''}`
    : activeService

  return (
    <footer className="status-bar">
      {/* Left: status dot + status text + pipe + count/service + next source btn */}
      <div className="status-bar-left">
        <div className={`status-dot${isOnline ? ' online' : ''}`} />
        <span className="status-text">
          {isOnline ? 'Now Playing' : 'Ready'}
        </span>
        <span className="status-pipe">|</span>
        <span className="status-service">{countLabel}</span>

        {/* Next source button — compact, only when song active */}
        {currentSong && (
          <button
            className="status-action-btn"
            onClick={handleNextLyrics}
            disabled={isLoading}
            title="Try alternate lyrics source"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Next
          </button>
        )}
      </div>

      {/* Right: settings gear (flat, no bg) + version in teal */}
      <div className="status-bar-right">
        <button
          className="status-settings-btn"
          onClick={onSettingsClick}
          title="Settings (Ctrl+,)"
          aria-label="Settings"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <span className="status-version">v1.0.0</span>
      </div>
    </footer>
  )
}
