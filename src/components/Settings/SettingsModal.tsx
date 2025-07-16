import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore, type StreamingService } from '../../store/settingsSlice'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SERVICES: { id: StreamingService; name: string; icon: string }[] = [
  { id: 'spotify', name: 'Spotify', icon: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.371-.721.49-1.101.241-3.021-1.85-6.822-2.27-11.302-1.24-.418.1-.851-.16-.949-.578-.101-.42.158-.852.578-.95 4.9-1.121 9.101-.641 12.531 1.431.371.24.49.73.241 1.101zm1.47-3.27c-.301.47-.93.62-1.391.32-3.451-2.12-8.702-2.741-12.782-1.5-.488.15-1.011-.13-1.16-.609-.149-.489.13-1.012.619-1.16 4.671-1.42 10.472-.73 14.402 1.71.459.3.619.93.319 1.39zm.131-3.391c-4.141-2.46-10.982-2.689-14.932-1.489-.639.2-1.311-.16-1.51-.79-.2-.63.16-1.3.789-1.5 4.531-1.38 12.062-1.11 16.822 1.71.579.34.769 1.09.43 1.66-.341.58-1.09.77-1.66.43l.061-.021z' },
  { id: 'tidal', name: 'Tidal', icon: 'M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004L0 16.004l4.004 4.004 4.004-4.004 4.004 4.004 4.004-4.004-4.004-4.004 4.004-4.004-4.004-4.004zm0 8.008l-4.004 4.004L3.996 12l4.012-4.004L12.012 12zm4.004-4.004L12.012 12l4.004 4.004L20.02 12l-4.004-4.004zM20.02 7.996L16.016 12l4.004 4.004L24.024 12l-4.004-4.004z' },
  { id: 'vlc', name: 'VLC', icon: 'M12 0c-1.5 0-3 .5-4.5 1.5L12 6l4.5-4.5C15 .5 13.5 0 12 0zM7.5 1.5C3 4.5 0 9 0 12c0 1.5.5 3 1.5 4.5L6 12 1.5 7.5c.5-1 1-2 1.5-3L7.5 1.5zM16.5 1.5l4.5 3c.5 1 1 2 1.5 3L18 12l4.5 4.5c1-1.5 1.5-3 1.5-4.5 0-3-3-7.5-7.5-10.5zM12 8L6 14l6 6 6-6-6-6zm0 4l2 2-2 2-2-2 2-2zM1.5 16.5c1.5 3 4.5 5.5 7.5 6.5L12 18l-4.5-4.5-6 3zM12 18l2.5 5c1-.5 2-1 3-1.5l1.5-1.5c.5-.5 1-1 1.5-1.5L16.5 13.5 12 18z' },
]

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  // Track the element that had focus before the modal opened, to restore it on close
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const {
    fontSize,
    showSourceInfo,
    syncEnabled,
    autoScroll,
    highlightCurrentLine,
    pollingInterval,
    activeService,
    setFontSize,
    setShowSourceInfo,
    setSyncEnabled,
    setAutoScroll,
    setHighlightCurrentLine,
    setPollingInterval,
    setActiveService,
    resetToDefaults,
  } = useSettingsStore()

  // Change streaming service — notify Python backend AND update Zustand store
  const handleServiceChange = useCallback(async (service: StreamingService) => {
    try {
      const result = await window.sonarAPI.python.setService(service)
      if (result.success) {
        setActiveService(service)
      } else {
        console.error('Failed to set service:', result.error)
      }
    } catch (error) {
      console.error('Error setting service:', error)
    }
  }, [setActiveService])

  // Focus management: save previous focus, move focus into modal on open, restore on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Move focus into modal after animation starts
      const timer = setTimeout(() => {
        const focusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        focusable?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      // Restore focus to element that was active before modal opened
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'var(--bg-modal)', backdropFilter: 'blur(10px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            className="w-full overflow-hidden relative"
            style={{
              maxWidth: '400px',
              background: 'var(--gradient-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-xl)',
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Inner highlight — glass top edge */}
            <div className="absolute top-0 left-0 right-0 h-px pointer-events-none z-10"
              style={{ background: 'linear-gradient(90deg, transparent, var(--glass-highlight-strong), transparent)' }} />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-heading)' }}>Settings</h2>
              <button
                onClick={onClose}
                className="settings-close-btn"
                aria-label="Close settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto lyrics-scroll">

              {/* Streaming Service */}
              <section className="mb-6">
                <h3 className="section-label">Streaming Service</h3>
                <div className="grid grid-cols-3 gap-3">
                  {SERVICES.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceChange(service.id)}
                      className={`service-btn${activeService === service.id ? ' active' : ''}`}
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24"
                        style={{ color: activeService === service.id ? 'var(--accent-teal)' : 'var(--text-secondary)' }}
                      >
                        <path fill="currentColor" d={service.icon} />
                      </svg>
                      <span className="service-btn-label">{service.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Display Settings */}
              <section className="mb-6">
                <h3 className="section-label">Display</h3>

                {/* Font Size */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Font Size</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setFontSize(fontSize - 2)}
                      className="font-size-btn"
                      aria-label="Decrease font size"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-12 text-center font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >{fontSize}px</span>
                    <button
                      onClick={() => setFontSize(fontSize + 2)}
                      className="font-size-btn"
                      aria-label="Increase font size"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Toggle: Show Source Info */}
                <Toggle
                  label="Show lyrics source"
                  checked={showSourceInfo}
                  onChange={setShowSourceInfo}
                />
              </section>

              {/* Lyrics Settings */}
              <section className="mb-6">
                <h3 className="section-label">Lyrics</h3>

                <Toggle
                  label="Prefer synced lyrics"
                  description="Try to fetch time-synced lyrics first"
                  checked={syncEnabled}
                  onChange={setSyncEnabled}
                />

                <Toggle
                  label="Auto-scroll"
                  description="Automatically scroll to current line"
                  checked={autoScroll}
                  onChange={setAutoScroll}
                />

                <Toggle
                  label="Highlight current line"
                  description="Emphasize the currently playing line"
                  checked={highlightCurrentLine}
                  onChange={setHighlightCurrentLine}
                />
              </section>

              {/* Advanced Settings */}
              <section className="mb-6">
                <h3 className="section-label">Advanced</h3>

                {/* Polling Interval */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-sm block" style={{ color: 'var(--text-secondary)' }}>Polling interval</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>How often to check for song changes</span>
                  </div>
                  <select
                    value={pollingInterval}
                    onChange={(e) => setPollingInterval(Number(e.target.value))}
                    className="text-sm"
                    style={{
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-md)',
                      padding: '6px 12px',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <option value={500}>0.5s</option>
                    <option value={1000}>1s</option>
                    <option value={2000}>2s</option>
                    <option value={3000}>3s</option>
                    <option value={5000}>5s</option>
                  </select>
                </div>
              </section>

              {/* Reset */}
              <section>
                <button
                  onClick={resetToDefaults}
                  className="btn-reset"
                >
                  Reset to defaults
                </button>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-3"
              style={{
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-void)',
              }}
            >
              <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>
                Ctrl+, to toggle settings · Ctrl+/- for font size
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Toggle component — Neo-Noir glass style
interface ToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <span className="text-sm block" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        {description && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{description}</span>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
        style={{
          background: checked ? 'var(--accent-teal)' : 'var(--bg-card)',
          boxShadow: checked ? 'var(--shadow-glow)' : 'none',
          border: checked ? 'none' : '1px solid var(--border-subtle)',
        }}
        aria-checked={checked}
        role="switch"
        aria-label={label}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 bg-white rounded-full"
          style={{ boxShadow: 'var(--shadow-sm)' }}
          animate={{ left: checked ? 'calc(100% - 20px)' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  )
}
