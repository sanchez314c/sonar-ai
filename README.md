# SonarAI

A cross-platform desktop lyrics viewer with real-time song detection. Built with Electron + React for the UI and a Python backend that talks to your media player via D-Bus (Linux), AppleScript (macOS), or Win32 APIs (Windows).

<p align="center">
  <img src="resources/screenshots/main-app-window.png" alt="SonarAI" width="480">
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-teal.svg)](CHANGELOG.md)
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey.svg)](docs/INSTALLATION.md)

## What it does

SonarAI detects the currently playing song from Spotify, Tidal, or VLC, then fetches synced or plain-text lyrics from multiple scraping backends (RentAnAdviser, Megalobiz, Lyricsify, Musixmatch, AZLyrics, and more). Synced `.lrc` lyrics auto-scroll and highlight the active line in real time. Plain-text lyrics display statically. The app stores lyrics locally at `~/.SonarAI/lyrics/` and caches fetched results for a week via `diskcache`.

The UI is a tall narrow floating panel (480x850, frameless, transparent) using the Neo-Noir Glass Monitor design system — dark glassmorphic aesthetic with teal accent colors.

## Features

- Real-time song detection via Spotify D-Bus (`org.mpris.MediaPlayer2`), AppleScript, or Win32 window title
- Synced LRC lyrics with auto-scroll and line-by-line highlight driven by `requestAnimationFrame`
- Multiple lyric sources with "Next Source" cycling
- Local `.lrc` / `.txt` lyric file caching at `~/.SonarAI/lyrics/`
- Disk cache (1-week TTL) via `diskcache` to avoid repeat network fetches
- Settings persist via Zustand `persist` middleware to `sonar-ai-settings` in localStorage
- Supports Spotify, Tidal, and VLC as detection targets
- Frameless transparent window with custom title bar and custom window controls

## Requirements

- Node.js 18+
- Python 3.8+
- Spotify, Tidal, or VLC running

## Quick Start

```bash
git clone https://github.com/sanchez314c/sonar-ai.git
cd sonar-ai
bash run-source-linux.sh    # Linux (creates venv, installs deps, launches)
bash run-source-mac.sh      # macOS
run-source-windows.bat      # Windows
```

See [docs/QUICK_START.md](docs/QUICK_START.md) for the full 10-step walkthrough.

## Build

```bash
npm run build:linux    # Linux AppImage + .deb
npm run build:mac      # macOS .dmg (x64 + arm64)
npm run build:win      # Windows .exe NSIS installer
```

Or use the bundled script:

```bash
bash build-linux.sh
```

Packaged output lands in `release/`.

## Project Structure

```
sonar-ai/
├── electron/          # Electron main process, preload bridge, Python subprocess manager
├── src/               # React + TypeScript frontend
│   ├── components/    # Layout, Lyrics, Settings UI components
│   ├── hooks/         # useSyncedLyrics, useSongDetection, useSettings
│   ├── services/      # ipc.ts (renderer → main bridge), lrcParser.ts
│   ├── store/         # Zustand slices: songSlice, lyricsSlice, settingsSlice
│   └── styles/        # theme.ts (design tokens)
├── python/            # Python backend (JSON-RPC IPC server)
│   ├── main.py        # RPC method registration and server startup
│   ├── backend.py     # Song detection, lyrics loading, caching
│   ├── services.py    # Lyrics scraping service functions
│   └── ipc_server.py  # stdin/stdout JSON-RPC 2.0 server
├── resources/         # App icons (icns, ico, png at multiple resolutions)
└── release/           # Built distributable packages
```

## Documentation

Full docs are in [docs/](docs/README.md):

- [Architecture](docs/ARCHITECTURE.md)
- [Installation](docs/INSTALLATION.md)
- [Development](docs/DEVELOPMENT.md)
- [API Reference](docs/API.md)
- [Quick Start](docs/QUICK_START.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## License

MIT License - Copyright (c) 2026 Jason Paul Michaels
