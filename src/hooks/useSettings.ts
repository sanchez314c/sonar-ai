import { useEffect, useCallback } from 'react'
import { useSettingsStore, type StreamingService } from '../store/settingsSlice'

/**
 * Convenience hook for settings with keyboard shortcuts
 */
export function useSettings() {
  const settings = useSettingsStore()

  // Extract stable action refs so the keyboard listener is only registered once
  const { increaseFontSize, decreaseFontSize, setFontSize } = settings

  // Keyboard shortcuts for font size
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Plus: Increase font size
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        increaseFontSize()
      }

      // Ctrl/Cmd + Minus: Decrease font size
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        decreaseFontSize()
      }

      // Ctrl/Cmd + 0: Reset font size
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        setFontSize(18)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // Zustand actions are stable references — they never change between renders.
  // Using them directly as deps is safe and avoids re-registering on every settings update.
  }, [increaseFontSize, decreaseFontSize, setFontSize])

  // Apply font size to CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--lyrics-font-size', `${settings.fontSize}px`)
  }, [settings.fontSize])

  // Wrapper to change service with backend sync
  const changeService = useCallback(async (service: StreamingService) => {
    try {
      const result = await window.sonarAPI.python.setService(service)
      if (result.success) {
        settings.setActiveService(service)
        return true
      }
      console.error('Failed to set service:', result.error)
      return false
    } catch (error) {
      console.error('Error setting service:', error)
      return false
    }
  }, [settings])

  // Wrapper to change lyrics directory with backend sync
  const changeLyricsDirectory = useCallback(async (path: string) => {
    try {
      const result = await window.sonarAPI.python.setLyricsDirectory(path)
      if (result.success) {
        settings.setLyricsDirectory(path)
        return true
      }
      console.error('Failed to set lyrics directory:', result.error)
      return false
    } catch (error) {
      console.error('Error setting lyrics directory:', error)
      return false
    }
  }, [settings])

  return {
    // Current settings values
    fontSize: settings.fontSize,
    showSourceInfo: settings.showSourceInfo,
    syncEnabled: settings.syncEnabled,
    autoScroll: settings.autoScroll,
    highlightCurrentLine: settings.highlightCurrentLine,
    pollingInterval: settings.pollingInterval,
    activeService: settings.activeService,
    lyricsDirectory: settings.lyricsDirectory,

    // Font size actions
    increaseFontSize: settings.increaseFontSize,
    decreaseFontSize: settings.decreaseFontSize,
    setFontSize: settings.setFontSize,

    // Toggle actions
    setShowSourceInfo: settings.setShowSourceInfo,
    setSyncEnabled: settings.setSyncEnabled,
    setAutoScroll: settings.setAutoScroll,
    setHighlightCurrentLine: settings.setHighlightCurrentLine,

    // Polling
    setPollingInterval: settings.setPollingInterval,

    // Service with backend sync
    changeService,
    changeLyricsDirectory,

    // Reset
    resetToDefaults: settings.resetToDefaults,
  }
}
