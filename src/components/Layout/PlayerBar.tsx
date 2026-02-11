import { useSongStore } from '../../store/songSlice'
import { useLyricsStore } from '../../store/lyricsSlice'
import { useSettingsStore } from '../../store/settingsSlice'

interface PlayerBarProps {
  onSettingsClick: () => void
}

export function PlayerBar({ onSettingsClick }: PlayerBarProps) {
  const { currentSong } = useSongStore()
  const { fetchNextLyrics, currentArtist, currentTitle, isLoading } = useLyricsStore()
  const { syncEnabled, activeService } = useSettingsStore()

  const handleNextLyrics = async () => {
    if (currentArtist && currentTitle) {
      await fetchNextLyrics(currentArtist, currentTitle, syncEnabled)
    }
  }

  return (
    <footer className="h-14 px-4 flex items-center justify-between flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, var(--bg-surface), var(--bg-sidebar))',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      {/* Left: Service indicator */}
      <div className="flex items-center gap-2"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span className="text-xs capitalize">{activeService}</span>
      </div>

      {/* Center: Next source button */}
      <button
        onClick={handleNextLyrics}
        disabled={!currentSong || isLoading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
        title="Try alternate lyrics source"
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.background = 'var(--bg-card-hover)'
          el.style.borderColor = 'var(--border-light)'
          el.style.boxShadow = 'var(--shadow-md)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.background = 'var(--bg-card)'
          el.style.borderColor = 'var(--border-subtle)'
          el.style.boxShadow = 'var(--shadow-sm)'
        }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ color: 'var(--text-primary)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-xs" style={{ color: 'var(--text-primary)' }}>Next Source</span>
      </button>

      {/* Right: Settings */}
      <button
        onClick={onSettingsClick}
        className="p-1.5 rounded-full transition-all duration-150 group"
        style={{
          border: '1px solid transparent',
        }}
        title="Settings (Ctrl+,)"
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.background = 'var(--glass-bg)'
          el.style.borderColor = 'var(--glass-border)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.background = 'transparent'
          el.style.borderColor = 'transparent'
        }}
      >
        <svg
          className="w-4 h-4 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--text-muted)' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </footer>
  )
}
