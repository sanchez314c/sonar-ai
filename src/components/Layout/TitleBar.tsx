import { useState, useEffect, useCallback } from 'react'
import iconTitlebar from '../../icon-titlebar.png'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)

  useEffect(() => {
    window.sonarAPI.window.isMaximized().then(setIsMaximized)
  }, [])

  // Close About on Escape key
  useEffect(() => {
    if (!aboutOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAboutOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [aboutOpen])

  const handleMinimize = () => {
    window.sonarAPI.window.minimize()
  }

  const handleMaximize = async () => {
    window.sonarAPI.window.maximize()
    const maximized = await window.sonarAPI.window.isMaximized()
    setIsMaximized(maximized)
  }

  const handleClose = () => {
    window.sonarAPI.window.close()
  }

  const handleOpenExternal = useCallback((url: string) => {
    window.sonarAPI.openExternal(url)
  }, [])

  return (
    <>
      {/* Drag handle — invisible overlay, z-50, enables window dragging */}
      <div className="drag-handle" />

      {/* Canonical title bar — app icon + name + tagline + flat actions + circular window controls */}
      <div className="title-bar">
        <img src={iconTitlebar} alt="" className="title-bar-icon" draggable={false} />
        <span className="title-bar-name">SonarAI</span>
        <span className="title-bar-tagline">Synced Lyrics Viewer</span>

        <div className="title-bar-spacer" />

        {/* Controls group — ABOVE drag handle */}
        <div className="title-bar-controls">
          {/* Flat action icons: About + Settings grouped tight */}
          <div className="title-bar-actions">
            {/* About — flat icon, no circle background */}
            <button
              onClick={() => setAboutOpen(true)}
              className="title-bar-action"
              title="About SonarAI"
              aria-label="About"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </button>
          </div>

          {/* Circular window controls: Min / Max / Close */}
          <div className="title-bar-window-controls">
            <button
              onClick={handleMinimize}
              className="window-ctrl-btn"
              aria-label="Minimize"
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect y="4.5" width="10" height="1.5" fill="currentColor" rx="0.75" />
              </svg>
            </button>

            <button
              onClick={handleMaximize}
              className="window-ctrl-btn"
              aria-label={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path stroke="currentColor" strokeWidth="1.5" d="M3 1h6v6M1 3h6v6H1z"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <rect x="0.75" y="0.75" width="8.5" height="8.5" stroke="currentColor" strokeWidth="1.5" rx="1"/>
                </svg>
              )}
            </button>

            <button
              onClick={handleClose}
              className="window-ctrl-btn window-close-btn"
              aria-label="Close"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M1.175 0L5 3.825 8.825 0 10 1.175 6.175 5 10 8.825 8.825 10 5 6.175 1.175 10 0 8.825 3.825 5 0 1.175z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* About Modal — canonical layout */}
      {aboutOpen && (
        <div className="about-overlay" onClick={() => setAboutOpen(false)}>
          <div className="about-modal" onClick={e => e.stopPropagation()}>
            {/* Inner highlight */}
            <div className="about-modal-highlight" />

            <button
              className="about-close-btn"
              onClick={() => setAboutOpen(false)}
              aria-label="Close"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M1.175 0L6 4.825 10.825 0 12 1.175 7.175 6 12 10.825 10.825 12 6 7.175 1.175 12 0 10.825 4.825 6 0 1.175z"/>
              </svg>
            </button>

            <img src={iconTitlebar} alt="SonarAI" className="about-app-icon" draggable={false} />
            <h2 className="about-app-name">SonarAI</h2>
            <div className="about-version">v1.0.0</div>
            <p className="about-desc">Cross-platform lyrics viewer with Spotify-inspired UI</p>
            <div className="about-license">MIT License | Jason Paul Michaels</div>

            <div className="about-links">
              <button
                className="about-github-badge"
                onClick={() => handleOpenExternal('https://github.com/sanchez314c/sonar-ai')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                GitHub
              </button>
              <button
                className="about-email-link"
                onClick={() => handleOpenExternal('mailto:software@jasonpaulmichaels.co')}
              >
                software@jasonpaulmichaels.co
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
