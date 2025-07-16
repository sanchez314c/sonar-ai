# SonarAI - AI Assistant Context

## What This Project Is
SonarAI is a cross-platform desktop lyrics viewer. It detects the currently playing song from Spotify, Tidal, or VLC and fetches synced or plain-text lyrics from multiple web sources. Built with Electron + React/TypeScript frontend and a Python backend.

## Tech Stack
- **Frontend**: React 18, TypeScript, Zustand (state), Tailwind CSS, framer-motion
- **Backend**: Python 3.8+ (D-Bus/AppleScript/Win32 media detection, web scraping, diskcache)
- **Desktop**: Electron 28, vite-plugin-electron
- **Build**: Vite 5, electron-builder 24

## Key Files
- `electron/main.ts` - Electron main process, window creation, IPC handlers
- `electron/preload.ts` - Context bridge (renderer <-> main IPC)
- `electron/python-bridge.ts` - Python subprocess management
- `src/` - React frontend (components, hooks, store, services, styles)
- `python/main.py` - Python RPC server startup
- `python/backend.py` - Song detection, lyrics loading, caching
- `python/services.py` - Lyrics scraping functions
- `python/ipc_server.py` - stdin/stdout JSON-RPC 2.0 server

## Architecture
Electron main process spawns Python backend as child process. Communication via JSON-RPC over stdin/stdout. React frontend communicates with main process via IPC bridge.

## Running
```bash
npm run dev          # Vite dev + Electron
npm run build:linux  # Build Linux packages
npm run build:mac    # Build macOS packages
npm run build:win    # Build Windows packages
```

## Design System
Uses the Neo-Noir Glass Monitor aesthetic: dark glassmorphic panels with teal accent colors. Window is 480x850, frameless, transparent.
