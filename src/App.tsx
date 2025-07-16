import { useEffect, useState } from 'react'
import { MainContent } from './components/Layout/MainContent'
import { PlayerBar } from './components/Layout/PlayerBar'
import { TitleBar } from './components/Layout/TitleBar'
import { SettingsModal } from './components/Settings/SettingsModal'
import { useSongStore } from './store/songSlice'
import { useLyricsStore } from './store/lyricsSlice'
import { useSettingsStore } from './store/settingsSlice'

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { currentSong, fetchCurrentSong, setCurrentSong } = useSongStore()
  const { fetchLyrics, clearLyrics } = useLyricsStore()
  const { pollingInterval, syncEnabled, activeService } = useSettingsStore()

  // Poll for song changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const pollSong = async () => {
      try {
        const song = await fetchCurrentSong(activeService)

        // If song changed, fetch new lyrics
        if (song && (!currentSong ||
            song.artist !== currentSong.artist ||
            song.title !== currentSong.title)) {
          await fetchLyrics(song.artist, song.title, syncEnabled)
        } else if (!song && currentSong) {
          setCurrentSong(null)
          clearLyrics()
        }
      } catch (error) {
        console.error('Error polling for song:', error)
      }

      timeoutId = setTimeout(pollSong, pollingInterval)
    }

    pollSong()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  // fetchCurrentSong, fetchLyrics, clearLyrics, setCurrentSong are stable Zustand
  // actions — they do not change between renders. Including them would not cause
  // correctness issues but would add noise; the actual reactive triggers are the
  // primitive settings values and the current song identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollingInterval, syncEnabled, activeService, currentSong?.artist, currentSong?.title])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close settings
      if (e.key === 'Escape' && settingsOpen) {
        setSettingsOpen(false)
      }

      // Ctrl+, or Cmd+, for settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settingsOpen])

  return (
    <div className="app-container">
      {/* Custom title bar */}
      <TitleBar />

      {/* Main content — single column, no sidebar */}
      <MainContent />

      {/* Bottom player bar */}
      <PlayerBar onSettingsClick={() => setSettingsOpen(true)} />

      {/* Settings modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}

export default App
