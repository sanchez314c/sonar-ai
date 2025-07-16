# Architecture

SonarAI is an Electron desktop application with three main layers: a React/TypeScript renderer, an Electron main process, and a Python subprocess that handles platform-specific media detection and lyrics scraping.

## Process Model

```
┌────────────────────────────────────────────────────┐
│                  Electron Main Process              │
│                                                     │
│  electron/main.ts                                   │
│  - BrowserWindow (480x850, frameless, transparent)  │
│  - ipcMain handlers for all python: channels        │
│  - Window control handlers (minimize/maximize/close)│
│                                                     │
│  electron/python-bridge.ts (PythonBridge class)     │
│  - Spawns python/main.py as a subprocess            │
│  - JSON-RPC 2.0 over stdin/stdout                   │
│  - Pending request map with 30s timeouts            │
│  - SIGTERM + SIGKILL on shutdown                    │
│                                                     │
│        │                │                           │
│   JSON-RPC           contextBridge                  │
│  (stdin/stdout)      (preload.ts)                   │
│        │                │                           │
├────────┼────────────────┼──────────────────────────┤
│        ▼                ▼                           │
│  Python Subprocess   Renderer Process               │
│  python/main.py      React + TypeScript             │
│  - IPC RPC server    - Zustand state (3 slices)     │
│  - Song detection    - Hooks (polling, sync)        │
│  - Lyrics scraping   - Tailwind + framer-motion     │
│  - diskcache TTL     - Custom title bar + controls  │
└────────────────────────────────────────────────────┘
```

## Communication Flow

### Song Detection

1. `useSongDetection` hook polls on a configurable interval (default 1 second).
2. Each poll calls `window.sonarAPI.python.getCurrentSong()` in the renderer.
3. The renderer API call goes through contextBridge to `ipcMain.handle('python:getCurrentSong')`.
4. The main process calls `pythonBridge.call('get_current_song')`.
5. PythonBridge serializes a JSON-RPC request and writes it to the Python process's stdin.
6. The Python process reads from stdin, calls the registered handler, and writes a JSON-RPC response to stdout.
7. PythonBridge reads the response, resolves the pending promise, and the result bubbles back to the hook.
8. If the song changed (by comparing artist, title, and raw_title), `useSongDetection` triggers a lyrics fetch.

### Lyrics Fetch

1. `lyricsStore.fetchLyrics(artist, title, sync)` calls `window.sonarAPI.python.getLyrics()`.
2. The Python handler checks `~/.SonarAI/lyrics/` for a local file match first.
3. If no local file, it checks the diskcache (1-week TTL).
4. On a cache miss, it tries scrapers from `SERVICES_LIST1` (synced) or `SERVICES_LIST2` (plain text) in order.
5. The first scraper that returns a result wins. The result is cached.
6. If the lyrics are in LRC format (`timed: true`), `parseLRC()` converts them to `LRCLine[]`.
7. `useSyncedLyrics` starts a `requestAnimationFrame` loop that updates `currentLineIndex` as time progresses.

### Python Process Lifecycle

- Python is spawned in `createWindow()` before the BrowserWindow is shown.
- The Python process emits a ready signal (`{"id": null, "result": {"status": "ready"}}`) on stdout when it finishes initializing.
- PythonBridge resolves its `readyPromise` on that signal. All IPC calls await this promise before proceeding.
- On `window-all-closed` and `before-quit`, `pythonBridge.stop()` sends SIGTERM, waits 3 seconds, then sends SIGKILL.

## Frontend Architecture

### Component Tree

```
App
├── TitleBar          (drag handle, window controls, app name, about modal)
├── MainContent
│   ├── SongHeader    (album art placeholder, artist, title, source info)
│   ├── LyricsDisplay (scroll container with fade overlays)
│   │   └── SyncedLine / plain text lines
│   └── EmptyState    (hero card when no song is playing)
└── PlayerBar         (service indicator, Next Source button, settings gear)
    └── SettingsModal (font size, service selector, toggles, lyrics dir)
```

### State Management (Zustand)

Three stores, each with a distinct responsibility:

| Store | File | What it holds |
|-------|------|---------------|
| `useSongStore` | `songSlice.ts` | `currentSong`, loading/error state, `fetchCurrentSong` |
| `useLyricsStore` | `lyricsSlice.ts` | Raw lyrics, parsed `syncedLines`, `currentLineIndex`, `fetchLyrics`, `fetchNextLyrics` |
| `useSettingsStore` | `settingsSlice.ts` | All user preferences, persisted to localStorage via Zustand `persist` middleware |

Settings are the only store that persists across app restarts. Song and lyrics state are transient.

### Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useSongDetection` | `hooks/useSongDetection.ts` | Polls Python backend for song changes, triggers lyrics fetch on change |
| `useSyncedLyrics` | `hooks/useSyncedLyrics.ts` | `requestAnimationFrame` loop that tracks elapsed time and updates current line index |
| `useSettings` | `hooks/useSettings.ts` | Re-exports settings store with convenience methods |

### Services

| Service | File | Purpose |
|---------|------|---------|
| IPC bridge | `services/ipc.ts` | Typed wrappers around `window.sonarAPI` calls |
| LRC parser | `services/lrcParser.ts` | Parses LRC text to `LRCLine[]`, includes `findCurrentLineIndex` (binary search) |

## Python Backend Architecture

```
python/main.py         - Entry point. Registers all RPC handlers. Starts IPCServer.
python/ipc_server.py   - IPCServer class. Reads stdin line by line. Dispatches to handlers.
python/backend.py      - Song detection logic. Lyrics loading with diskcache. StreamingService classes.
python/services.py     - Lyrics scraping functions. Config class. Service lists (synced + unsynced).
```

### Song Detection

Each platform uses a different mechanism:

| Platform | Mechanism |
|----------|-----------|
| Linux | D-Bus (`org.mpris.MediaPlayer2.*`). Works with any MPRIS-compliant player. |
| macOS | AppleScript targeting the player application by name. |
| Windows | Win32 GUI (`win32gui`) to read the window title of the player process. |

### Lyrics Sources

Sources are registered with the `@lyrics_service` decorator in `services.py`. They are split into two lists:

- `SERVICES_LIST1` - synced sources (return LRC format)
- `SERVICES_LIST2` - unsynced sources (return plain text)

Sources include: Local file, RentAnAdviser, Megalobiz, Lyricsify, Musixmatch, AZLyrics, and several others. The source index advances when `next_lyrics` is called.

### Caching

The Python `diskcache.Cache` instance lives at `~/.SonarAI/cache/` with a 1-week TTL. Cache keys are derived from artist and title. The cache is checked before any network call.

## Security Model

- `contextIsolation: true` and `nodeIntegration: false` in the renderer. The renderer cannot call Node APIs directly.
- `webSecurity: true`, `allowRunningInsecureContent: false`, `experimentalFeatures: false` in webPreferences.
- External URLs opened via `shell.openExternal` are validated against an allowlist of protocols (`http:`, `https:`, `mailto:`).
- Python method calls are validated against an `ALLOWED_METHODS` Set in both TypeScript (PythonBridge) and Python (IPCServer).
- Python input strings are validated for type, empty value, and max length (512 chars). File paths are resolved and checked for traversal. Lyrics payloads are capped at 5 MB.
- Python tracebacks stay server-side (stderr). Error messages sent to the renderer contain no internal paths or stack traces.

## Window Design

- `frame: false`, `transparent: true`, `hasShadow: false` for a fully custom frameless window.
- On Linux, `--enable-transparent-visuals` and `--disable-gpu-compositing` flags enable alpha-channel transparency. A 300ms startup delay allows the compositor to initialize.
- On macOS, `titleBarStyle: 'hiddenInset'` is set to avoid double title bar.
- The body has `padding: 16px` so the rounded app container floats visibly above the desktop.
- `border-radius: 20px` on `.app-container` with `overflow: hidden` creates the rounded floating panel look.
