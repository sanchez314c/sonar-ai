# SonarAI - Product Requirements Document

## Overview

SonarAI is a cross-platform desktop lyrics viewer built as a floating transparent panel. It detects the currently playing song from Spotify, Tidal, or VLC, fetches synced or plain-text lyrics from multiple web scraping backends, and displays them with real-time line-by-line scrolling and highlighting.

**Author**: Jason Paul Michaels (software@jasonpaulmichaels.co)
**Repository**: https://github.com/sanchez314c/sonar-ai
**Version**: 1.0.0
**License**: MIT

---

## Target Users

- Music listeners who want lyrics displayed alongside their media player
- Users on Linux, macOS, or Windows who use Spotify, Tidal, or VLC
- People who want a minimal, always-on-top lyrics panel that doesn't interfere with their workflow

## Problem Statement

Most lyrics solutions are built into specific music apps (Spotify's own lyrics, Apple Music lyrics) or require browser extensions. There's no good standalone desktop app that works across multiple media players and platforms while providing synced lyrics from multiple sources with a polished, minimal UI.

---

## Architecture

### System Layers

```
+---------------------------+
|   React 18 Frontend       |  Components, Hooks, Store (Zustand), Services
|   (TypeScript + Tailwind) |  Port 58005 (Vite dev server)
+---------------------------+
         |  IPC Bridge (contextBridge)
+---------------------------+
|   Electron 28 Main        |  Window management, IPC handlers, Python bridge
|   (TypeScript)            |  Frameless transparent window (480x850)
+---------------------------+
         |  JSON-RPC 2.0 over stdin/stdout
+---------------------------+
|   Python 3 Backend        |  Song detection (D-Bus/AppleScript/Win32)
|   (subprocess)            |  Lyrics scraping (8+ sources), diskcache
+---------------------------+
```

### Communication Protocol

- **Renderer -> Main**: Electron IPC via `contextBridge.exposeInMainWorld('sonarAPI', api)`
- **Main -> Python**: JSON-RPC 2.0 over `stdin/stdout` of spawned child process
- **Python -> Main**: JSON-RPC 2.0 responses on stdout, logging on stderr
- **Ready Signal**: Python sends `{jsonrpc: "2.0", id: null, result: {status: "ready"}}` on startup

### Data Flow

1. App polls Python backend every N seconds (configurable, default 1s) for current song
2. Python reads media player state via D-Bus (Linux), AppleScript (macOS), or Win32 APIs (Windows)
3. On song change, renderer requests lyrics via IPC -> Electron main -> Python
4. Python checks local cache (diskcache, 1-week TTL), then local `.lrc`/`.txt` files, then scrapes web sources
5. Lyrics returned to renderer, parsed (LRC format if synced), displayed with animation
6. Synced lyrics use `requestAnimationFrame` for real-time line tracking

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 | UI components |
| State | Zustand 4.5 + persist middleware | App state + localStorage persistence |
| Styling | Tailwind CSS 3.4 + CSS custom properties | Design system tokens |
| Animation | framer-motion 11 | Lyrics transitions, modal animations |
| Build | Vite 5 + vite-plugin-electron | Dev server + Electron integration |
| Desktop | Electron 28 | Cross-platform window, IPC |
| Backend | Python 3.8+ | Song detection, lyrics scraping |
| Caching | diskcache (Python) | 1-week TTL on fetched lyrics |
| Scraping | BeautifulSoup 4, requests | HTML parsing for lyrics sources |
| Packaging | electron-builder 24 | AppImage, .deb, .dmg, .exe |

---

## Core Features

### 1. Song Detection
- **Spotify** (Linux): D-Bus `org.mpris.MediaPlayer2.spotify` metadata
- **Spotify** (macOS): AppleScript `artist of current track` + `name of current track`
- **Spotify** (Windows): Window title parsing via `win32gui` + `psutil`
- **Tidal**: Windows window title only (macOS/Linux not supported)
- **VLC**: D-Bus (Linux), AppleScript (macOS), Window title (Windows)
- **Polling**: Configurable interval (500ms to 5s, default 1s)
- **Change detection**: Compare artist+title to prevent redundant fetches

### 2. Lyrics Fetching
- **Synced sources** (return LRC format with timestamps):
  - Local `.lrc` files (`~/.SonarAI/lyrics/`)
  - RentAnAdviser
  - Megalobiz
  - Lyricsify
  - RC Lyrics Band
  - QQ Music (disabled by default)
- **Unsynced sources** (plain text):
  - Musixmatch
  - Songmeanings
  - Songlyrics
  - Genius
  - Versuri (Romanian)
  - AZLyrics (via azapi)
- **Caching**: diskcache with 1-week TTL at `~/.SonarAI/cache/`
- **Local files**: `~/.SonarAI/lyrics/{artist} - {title}.lrc` or `.txt`
- **Source cycling**: "Next Source" button tries alternate backends

### 3. Synced Lyrics Display
- LRC format parser with binary search for current line
- `requestAnimationFrame`-based playback timer
- Auto-scroll to current line (centers in viewport)
- User-scroll pause: manual scrolling pauses auto-scroll for 5 seconds
- Line states: past (muted), current (teal + glow + scale 1.05), future (secondary)
- Click-to-seek on any line
- Smooth entry animations per line via framer-motion

### 4. Settings (persisted via Zustand + localStorage)
- Streaming service selector (Spotify/Tidal/VLC)
- Font size (12-32px, +/- 2px steps)
- Show/hide lyrics source info
- Prefer synced lyrics toggle
- Auto-scroll toggle
- Highlight current line toggle
- Polling interval selector (0.5s to 5s)
- Reset to defaults

### 5. Window Management
- Frameless transparent window (480x850, min 360x500)
- Custom title bar: app icon + name + tagline + About button + circular Min/Max/Close
- Drag handle via `-webkit-app-region: drag`
- Linux-specific: `--no-sandbox`, `--enable-transparent-visuals`, `--disable-gpu-compositing`
- macOS: `titleBarStyle: hiddenInset`
- Window controls respond to keyboard shortcuts (Escape, Ctrl+,, Ctrl++/-)

### 6. Design System
- Neo-Noir Glass Monitor aesthetic
- Dark glassmorphic panels (#0a0b0e to #141518 gradients)
- Teal accent (#14b8a6) with glow effects
- CSS custom properties for all tokens
- Layered shadows (never single shadow)
- Glass highlights (rgba white overlays)
- Custom scrollbar theming (invisible at rest, appears on hover)
- Inter font family

---

## Non-Goals

- Not a music player (no playback controls)
- No lyrics editing or submission
- No karaoke timing adjustment
- No streaming service login/auth (detection only via window title / D-Bus)
- No song metadata enrichment beyond album/year from lyrics sources
- No mobile or web version

## Success Criteria

- Detects playing song within the polling interval (default 1 second)
- Finds lyrics for 80%+ of popular English-language songs
- Synced lyrics stay within 1 second of actual playback position
- App launches in under 3 seconds from run-source script
- Window is responsive and doesn't block system UI
- Works on Linux (primary), macOS, and Windows

---

## File Map

### Electron Layer (3 files)
- `electron/main.ts` - Main process: window creation, IPC handler registration, Python lifecycle
- `electron/preload.ts` - Context bridge: type-safe API exposed to renderer as `window.sonarAPI`
- `electron/python-bridge.ts` - PythonBridge class: subprocess spawn, JSON-RPC protocol, method allowlist

### React Frontend (25 files)
- `src/main.tsx` - React entry point
- `src/App.tsx` - Root component: song polling, keyboard shortcuts, layout assembly
- `src/components/Layout/TitleBar.tsx` - Custom title bar with About modal
- `src/components/Layout/MainContent.tsx` - Song info header + lyrics area + empty state
- `src/components/Layout/PlayerBar.tsx` - Status bar: status dot, line count, Next Source, settings
- `src/components/Layout/Sidebar.tsx` - Legacy sidebar (not used in current single-column layout)
- `src/components/Lyrics/LyricsDisplay.tsx` - Synced + unsynced lyrics renderer with auto-scroll
- `src/components/Lyrics/SyncedLine.tsx` - Individual synced line with state-based styling
- `src/components/Settings/SettingsModal.tsx` - Full settings panel with toggles
- `src/hooks/useSyncedLyrics.ts` - Playback timer, line tracking, auto-scroll
- `src/hooks/useSongDetection.ts` - Song polling with change detection
- `src/hooks/useSettings.ts` - Settings convenience hook with keyboard shortcuts
- `src/store/songSlice.ts` - Zustand store for current song state
- `src/store/lyricsSlice.ts` - Zustand store for lyrics data + fetch actions
- `src/store/settingsSlice.ts` - Zustand store with localStorage persistence
- `src/services/ipc.ts` - Type-safe IPC wrapper (convenience re-export)
- `src/services/lrcParser.ts` - LRC format parser + binary search + serializer
- `src/styles/theme.ts` - Design token object (mirrors CSS custom properties)
- `src/index.css` - 1300-line Neo-Noir Glass Monitor stylesheet
- `index.html` - HTML entry with CSP meta tag

### Python Backend (4 source files)
- `python/main.py` - RPC method registration, input validation, server startup
- `python/backend.py` - Song class, StreamingService classes, lyrics loading with cache decorator
- `python/services.py` - 10+ lyrics scraping service functions, Config class, chord services
- `python/ipc_server.py` - JSON-RPC 2.0 server over stdin/stdout with size limits

### Configuration
- `vite.config.ts` - Vite + electron plugin config, port 58005
- `tailwind.config.js` - Neo-Noir color palette + custom animations
- `tsconfig.json` - TypeScript config (strict mode)
- `electron-builder.yml` - Build targets for Linux/macOS/Windows
- `.eslintrc.cjs` - ESLint config
- `postcss.config.js` - PostCSS with Tailwind + autoprefixer

### Scripts
- `run-source-linux.sh` - Linux dev runner (port cleanup, venv setup, sandbox fix)
- `run-source-mac.sh` - macOS dev runner
- `run-source-windows.bat` - Windows dev runner
- `build-linux.sh` - Linux build script

---

## Security Considerations

- **Context Isolation**: `contextIsolation: true`, `nodeIntegration: false`
- **RPC Method Allowlist**: Both Python IPC server and Electron python-bridge validate methods
- **URL Protocol Validation**: `shell.openExternal` only allows http/https/mailto
- **Path Traversal Prevention**: `save_lyrics` resolves paths and validates against lyrics dir
- **Input Validation**: All RPC params validated (type, length, emptiness)
- **CSP**: `Content-Security-Policy` meta tag in index.html
- **Request Timeouts**: 15s default on all Python HTTP requests
- **Max Payload Sizes**: 5MB lyrics, 10MB IPC messages
- **Sandbox Note**: `sandbox: false` in webPreferences due to vite-plugin-electron-renderer limitation

---

## Dependencies

### Node.js (14 packages)
- **Runtime**: framer-motion, zustand
- **Dev**: react, react-dom, typescript, vite, electron, electron-builder, tailwindcss, eslint, postcss, autoprefixer, vite-plugin-electron, vite-plugin-electron-renderer

### Python (12 packages)
- beautifulsoup4, requests, unidecode, pylrc, pathvalidate, diskcache, sentry-sdk, azapi, setuptools, urllib3
- **Platform-specific**: pywin32 (Windows), dbus-python (Linux), applescript (macOS)
