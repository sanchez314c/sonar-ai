import { LyricsDisplay } from '../Lyrics/LyricsDisplay'
import { useLyricsStore } from '../../store/lyricsSlice'
import { useSongStore } from '../../store/songSlice'
import { useSettingsStore } from '../../store/settingsSlice'

export function MainContent() {
  const { serviceName, lyricsUrl, isTimed, isLoading, error } = useLyricsStore()
  const { currentSong } = useSongStore()
  const { showSourceInfo } = useSettingsStore()

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-void) 100%)',
      }}
    >
      {/* Song info header — with top padding to avoid window controls overlap */}
      {currentSong && (
        <div className="flex-shrink-0 px-5 py-3 border-b border-neo-border-subtle/50"
          style={{ paddingTop: '56px' }}
        >
          <div className="flex items-center gap-3">
            {/* Album art */}
            <div className="w-12 h-12 rounded-[10px] flex-shrink-0 overflow-hidden relative"
              style={{
                background: 'var(--gradient-card)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, var(--glass-highlight), transparent)' }} />
              {currentSong.albumArt ? (
                <img
                  src={currentSong.albumArt}
                  alt={`${currentSong.title} album art`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full album-art-placeholder flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Song details + source */}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold truncate"
                style={{ color: 'var(--text-heading)' }}
              >
                {currentSong.title}
              </h2>
              <p className="text-xs truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                {currentSong.artist}
                {currentSong.album && currentSong.album !== 'UNKNOWN' && (
                  <span style={{ color: 'var(--text-muted)' }}> · {currentSong.album}</span>
                )}
              </p>
              {showSourceInfo && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {serviceName}
                  </span>
                  {isTimed && (
                    <span className="px-1.5 py-0 text-[9px] rounded-full leading-relaxed"
                      style={{
                        background: 'var(--accent-teal-dim)',
                        color: 'var(--accent-teal)',
                        border: '1px solid var(--border-glow)',
                      }}
                    >
                      Synced
                    </span>
                  )}
                  {lyricsUrl && (
                    <a
                      href={lyricsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] transition-colors"
                      style={{ color: 'var(--accent-teal)' }}
                      title={lyricsUrl}
                    >
                      ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24"
                style={{ color: 'var(--text-muted)' }}
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Lyrics area */}
      <div className="flex-1 overflow-hidden relative"
        style={!currentSong ? { paddingTop: '56px' } : undefined}
      >
        {error ? (
          <div className="h-full flex items-center justify-center text-center px-6">
            <div>
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--text-dim)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{error}</p>
            </div>
          </div>
        ) : !currentSong ? (
          <div className="h-full flex items-center justify-center text-center px-6">
            {/* Hero card with ambient gradient mesh */}
            <div className="hero-card glass-card p-8 max-w-sm relative">
              <svg
                className="w-20 h-20 mx-auto mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--text-dim)' }}
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              <p className="text-xl mb-2" style={{ color: 'var(--text-secondary)' }}>
                No song playing
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Play a song in Spotify, Tidal, or VLC to see lyrics
              </p>
            </div>
          </div>
        ) : (
          <LyricsDisplay />
        )}
      </div>
    </main>
  )
}
