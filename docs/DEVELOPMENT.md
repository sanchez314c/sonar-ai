# Development

## Prerequisites

- Node.js 18+
- Python 3.8+
- npm (comes with Node)
- A media player: Spotify, Tidal, or VLC
- Linux: compositor for transparent window (GNOME/KDE work out of the box, bare WMs need Picom)

## First-Time Setup

Use the run script. It handles everything automatically.

```bash
git clone https://github.com/sanchez314c/sonar-ai.git
cd sonar-ai
bash run-source-linux.sh    # Linux
bash run-source-mac.sh      # macOS
run-source-windows.bat      # Windows
```

The script:
1. Checks Node.js 18+ and Python 3.8+ are present
2. Creates `python/.venv` if it doesn't exist
3. Installs Python dependencies from `python/requirements.txt`
4. Installs Node dependencies via `npm install`
5. Fixes the Linux sandbox setting if needed
6. Launches `npm run dev`

## Manual Setup

If you prefer to set up manually:

```bash
# Python backend
cd python
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Node frontend
npm install

# Launch
npm run dev
```

The dev server runs on port 58005. Electron loads the renderer from `http://localhost:58005`.

## Project Structure

```
sonar-ai/
├── electron/
│   ├── main.ts             # Window creation, ipcMain handlers, app lifecycle
│   ├── preload.ts          # contextBridge API exposed as window.sonarAPI
│   └── python-bridge.ts    # PythonBridge class: spawn, JSON-RPC, lifecycle
├── src/
│   ├── App.tsx             # Root component, polling setup
│   ├── components/
│   │   ├── Layout/         # TitleBar, PlayerBar, SettingsModal
│   │   ├── Lyrics/         # LyricsDisplay, SyncedLine
│   │   └── Settings/       # Settings panel components
│   ├── hooks/
│   │   ├── useSongDetection.ts   # Polls backend, triggers lyrics fetch on change
│   │   ├── useSyncedLyrics.ts    # requestAnimationFrame loop for LRC playback
│   │   └── useSettings.ts        # Settings store convenience re-export
│   ├── services/
│   │   ├── ipc.ts          # Typed wrappers around window.sonarAPI
│   │   └── lrcParser.ts    # LRC format parser and line-finding utilities
│   ├── store/
│   │   ├── songSlice.ts    # currentSong state, fetchCurrentSong
│   │   ├── lyricsSlice.ts  # Lyrics state, fetchLyrics, fetchNextLyrics
│   │   └── settingsSlice.ts # User settings, persisted to localStorage
│   └── styles/
│       └── theme.ts        # Neo-Noir Glass Monitor design tokens (TypeScript)
├── python/
│   ├── main.py             # RPC handler registration, IPCServer startup
│   ├── ipc_server.py       # JSON-RPC 2.0 server over stdin/stdout
│   ├── backend.py          # StreamingService classes, diskcache, song detection
│   └── services.py         # Lyrics scraping functions, Config class
├── resources/              # App icons (icns, ico, png)
├── tests/                  # Test directory (currently empty)
├── run-source-linux.sh     # Dev launcher for Linux
├── run-source-mac.sh       # Dev launcher for macOS
├── run-source-windows.bat  # Dev launcher for Windows
├── build-linux.sh          # Production build script for Linux
├── vite.config.ts          # Vite + vite-plugin-electron configuration
├── electron-builder.yml    # Packaging configuration
├── tailwind.config.js      # Tailwind with neo-noir token extensions
└── tsconfig.json           # TypeScript configuration
```

## npm Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Launch Vite dev server + Electron (hot reload for renderer) |
| `npm run build` | Vite production build to `dist/` and `dist-electron/` |
| `npm run build:linux` | Vite build + electron-builder Linux packages |
| `npm run build:mac` | Vite build + electron-builder macOS package |
| `npm run build:win` | Vite build + electron-builder Windows package |
| `npm run lint` | ESLint with zero warnings allowed |
| `npm run typecheck` | TypeScript type check without emitting files |

## Hot Reload Behavior

- Renderer changes (React, TypeScript, CSS): instant hot module replacement via Vite
- Electron main process changes (`electron/main.ts`, `electron/python-bridge.ts`): requires restarting the dev session (Ctrl+C, then `npm run dev`)
- Preload changes (`electron/preload.ts`): requires Electron to reload the renderer, which `vite-plugin-electron` handles automatically

## Adding a New Lyrics Source

1. Add a function decorated with `@lyrics_service` in `python/services.py`:
   ```python
   @lyrics_service(synced=True)   # synced=False for plain text
   def _mysource(song):
       # fetch and return a LyricsResult or None
       ...
   ```
2. The function is automatically registered in `SERVICES_LIST1` (synced) or `SERVICES_LIST2` (unsynced).
3. Test manually by running `python main.py` and sending a `get_lyrics` request.

## Adding a New IPC Method

1. Add a Python handler function in `python/main.py` and register it:
   ```python
   server.register("my_method", my_handler)
   ```
2. Add `"my_method"` to the `ALLOWED_METHODS` set in `electron/python-bridge.ts`.
3. Add an `ipcMain.handle('python:myMethod', ...)` handler in `electron/main.ts`.
4. Expose the method through `preload.ts` in the `api.python` object.
5. Add a TypeScript type for the return value in `preload.ts`.

## Adding a New Media Player

1. Create a new `StreamingService` subclass in `python/backend.py` implementing all required methods for each platform.
2. Register it in the `SERVICES` dict in `python/main.py`.
3. Add the service name to the `StreamingService` type in `src/store/settingsSlice.ts`.
4. Add a service selector button in the Settings modal.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+,` | Open Settings |
| `Ctrl++` | Increase font size |
| `Ctrl+-` | Decrease font size |
| `Ctrl+Shift+I` | Open DevTools (Linux/Windows) |
| `Cmd+Option+I` | Open DevTools (macOS) |
| `Escape` | Close Settings modal |

## Code Style

- TypeScript strict mode (`"strict": true` in tsconfig)
- ESLint with `@typescript-eslint` — zero warnings allowed
- No mutation of state objects (create new objects with spread)
- Error handling at every async boundary
- No hardcoded hex/rgb colors in components — use CSS variables from `src/index.css` or design tokens from `src/styles/theme.ts`

## Design System

SonarAI uses the Neo-Noir Glass Monitor design system. Key rules:

- Dark backgrounds using CSS custom properties (`--bg-void`, `--bg-surface`, `--bg-card`)
- Teal accent color (`--accent-teal: #14b8a6`)
- Glass effects via rgba backgrounds, NOT `backdrop-filter` (backdrop-filter only on modal overlays)
- Layered shadows (minimum 2 layers per elevated element)
- Card hover: `translateY(-2px)` + shadow escalation
- Body padding 16px creates the floating panel gap

Full token reference in `src/styles/theme.ts` and `src/index.css`.
