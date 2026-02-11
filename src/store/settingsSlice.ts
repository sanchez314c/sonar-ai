import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type StreamingService = 'spotify' | 'tidal' | 'vlc'

interface SettingsState {
  // Display settings
  fontSize: number
  fontSizeMin: number
  fontSizeMax: number
  showSourceInfo: boolean

  // Lyrics settings
  syncEnabled: boolean
  autoScroll: boolean
  highlightCurrentLine: boolean

  // Polling settings
  pollingInterval: number

  // Service settings
  activeService: StreamingService
  lyricsDirectory: string | null

  // Actions
  setFontSize: (size: number) => void
  increaseFontSize: () => void
  decreaseFontSize: () => void
  setShowSourceInfo: (show: boolean) => void
  setSyncEnabled: (enabled: boolean) => void
  setAutoScroll: (enabled: boolean) => void
  setHighlightCurrentLine: (enabled: boolean) => void
  setPollingInterval: (interval: number) => void
  setActiveService: (service: StreamingService) => void
  setLyricsDirectory: (path: string | null) => void
  resetToDefaults: () => void
}

const defaultSettings = {
  fontSize: 18,
  fontSizeMin: 12,
  fontSizeMax: 32,
  showSourceInfo: true,
  syncEnabled: true,
  autoScroll: true,
  highlightCurrentLine: true,
  pollingInterval: 1000, // 1 second
  activeService: 'spotify' as StreamingService,
  lyricsDirectory: null as string | null,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setFontSize: (size: number) => {
        const { fontSizeMin, fontSizeMax } = get()
        const clampedSize = Math.min(Math.max(size, fontSizeMin), fontSizeMax)
        set({ fontSize: clampedSize })
      },

      increaseFontSize: () => {
        const { fontSize, fontSizeMax } = get()
        if (fontSize < fontSizeMax) {
          set({ fontSize: fontSize + 2 })
        }
      },

      decreaseFontSize: () => {
        const { fontSize, fontSizeMin } = get()
        if (fontSize > fontSizeMin) {
          set({ fontSize: fontSize - 2 })
        }
      },

      setShowSourceInfo: (show: boolean) => set({ showSourceInfo: show }),

      setSyncEnabled: (enabled: boolean) => set({ syncEnabled: enabled }),

      setAutoScroll: (enabled: boolean) => set({ autoScroll: enabled }),

      setHighlightCurrentLine: (enabled: boolean) => set({ highlightCurrentLine: enabled }),

      setPollingInterval: (interval: number) => {
        // Clamp between 500ms and 5000ms
        const clampedInterval = Math.min(Math.max(interval, 500), 5000)
        set({ pollingInterval: clampedInterval })
      },

      setActiveService: (service: StreamingService) => set({ activeService: service }),

      setLyricsDirectory: (path: string | null) => set({ lyricsDirectory: path }),

      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'sonar-ai-settings',
      partialize: (state) => ({
        fontSize: state.fontSize,
        showSourceInfo: state.showSourceInfo,
        syncEnabled: state.syncEnabled,
        autoScroll: state.autoScroll,
        highlightCurrentLine: state.highlightCurrentLine,
        pollingInterval: state.pollingInterval,
        activeService: state.activeService,
        lyricsDirectory: state.lyricsDirectory,
      }),
    }
  )
)
