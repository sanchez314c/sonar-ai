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

      {/* Title text — positioned inside the drag area */}
      <div className="titlebar-title">
        <img src={iconTitlebar} alt="" className="titlebar-icon" draggable={false} />
        <span className="text-xs font-medium tracking-wide uppercase"
          style={{ color: 'var(--text-dim)' }}
        >
          SONAR-AI
        </span>
      </div>

      {/* Window controls — z-200, ABOVE drag handle */}
      <div className="window-controls">
        {/* About button */}
        <button
          onClick={() => setAboutOpen(true)}
          className="window-ctrl-btn btn-about"
          aria-label="About"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </button>

        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="window-ctrl-btn"
          aria-label="Minimize"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12">
            <rect y="5" width="12" height="2" fill="currentColor" />
          </svg>
        </button>

        {/* Maximize/Restore */}
        <button
          onClick={handleMaximize}
          className="window-ctrl-btn"
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <svg className="w-3 h-3" viewBox="0 0 12 12">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                d="M3 1h8v8M1 3h8v8H1z"
              />
            </svg>
          ) : (
            <svg className="w-3 h-3" viewBox="0 0 12 12">
              <rect
                x="1"
                y="1"
                width="10"
                height="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="window-ctrl-btn window-close-btn"
          aria-label="Close"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12">
            <path
              fill="currentColor"
              d="M1.41 0L6 4.59 10.59 0 12 1.41 7.41 6 12 10.59 10.59 12 6 7.41 1.41 12 0 10.59 4.59 6 0 1.41z"
            />
          </svg>
        </button>
      </div>

      {/* About Modal */}
      {aboutOpen && (
        <div className="about-overlay" onClick={() => setAboutOpen(false)}>
          <div className="about-modal" onClick={e => e.stopPropagation()}>
            <button className="about-close" onClick={() => setAboutOpen(false)} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <div className="about-icon">
              <img src={iconTitlebar} alt="SonarAI" draggable={false} />
            </div>

            <h2 className="about-app-name">SonarAI</h2>
            <span className="about-version">v1.0.0</span>
            <p className="about-desc">Cross-platform lyrics viewer with Spotify-inspired UI</p>

            <div className="about-meta">
              <span className="about-license">MIT License</span>
              <span className="about-separator">|</span>
              <span className="about-author">Jason Paul Michaels</span>
            </div>

            <div className="about-links">
              <button
                className="about-github-badge"
                onClick={() => handleOpenExternal('https://github.com/sanchez314c/sonar-ai')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
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
