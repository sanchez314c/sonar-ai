import { useSongStore } from '../../store/songSlice'
import { useLyricsStore } from '../../store/lyricsSlice'
import { useSettingsStore } from '../../store/settingsSlice'

interface SidebarProps {
  onSettingsClick: () => void
}

export function Sidebar({ onSettingsClick }: SidebarProps) {
  const { currentSong } = useSongStore()
  const { serviceName, lyricsUrl, isLoading } = useLyricsStore()
  const { showSourceInfo } = useSettingsStore()

  return (
    <aside className="sidebar p-4">
      {/* Album Art */}
      <div className="aspect-square w-full mb-4 rounded-neo-card overflow-hidden shadow-neo-card relative">
        {/* Inner highlight */}
        <div className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
        {currentSong?.albumArt ? (
          <img
            src={currentSong.albumArt}
            alt={`${currentSong.title} album art`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full album-art-placeholder flex items-center justify-center">
            <svg
              className="w-16 h-16 text-neo-text-dim"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="mb-6">
        {currentSong ? (
          <>
            <h2 className="text-lg font-semibold text-neo-text-heading truncate">
              {currentSong.title}
            </h2>
            <p className="text-sm text-neo-text-secondary truncate">
              {currentSong.artist}
            </p>
            {currentSong.album && currentSong.album !== 'UNKNOWN' && (
              <p className="text-xs text-neo-text-muted truncate mt-1">
                {currentSong.album}
                {currentSong.year && currentSong.year > 0 && ` (${currentSong.year})`}
              </p>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-neo-text-secondary">
              {isLoading ? 'Detecting...' : 'No song playing'}
            </p>
            <p className="text-xs text-neo-text-muted mt-2">
              Play a song in Spotify, Tidal, or VLC
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-neo-border-subtle my-4" />

      {/* Source Info */}
      {showSourceInfo && (
        <div className="mb-4">
          <p className="text-[10px] text-neo-text-dim uppercase tracking-[1.5px] mb-1">
            Source
          </p>
          <p className="text-sm text-neo-text-secondary">
            {serviceName}
          </p>
          {lyricsUrl && (
            <a
              href={lyricsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neo-teal hover:text-neo-teal-hover truncate block mt-1 transition-colors"
              title={lyricsUrl}
            >
              View source
            </a>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom actions */}
      <div className="space-y-2">
        {/* Settings button */}
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-neo-text-secondary hover:text-neo-text-primary hover:bg-[rgba(255,255,255,0.03)] border border-transparent hover:border-[rgba(255,255,255,0.05)] transition-all duration-150"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <span className="text-sm">Settings</span>
        </button>

        {/* Version info */}
        <p className="text-xs text-neo-text-dim text-center px-3">
          SonarAI v1.0.0
        </p>
      </div>
    </aside>
  )
}
