# Tech Stack

## Frontend (Renderer Process)

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2 | UI component framework |
| TypeScript | 5.3 | Type safety across the entire codebase |
| Zustand | 4.5 | Lightweight state management (3 slices: song, lyrics, settings) |
| Tailwind CSS | 3.4 | Utility-first CSS, extended with neo-noir design tokens |
| framer-motion | 11.0 | Animations and transitions |
| Vite | 5.0 | Dev server and bundler |

**Why Zustand over Redux?** Much less boilerplate, no providers needed, and the `persist` middleware handles localStorage serialization cleanly. Three small slices beat one giant Redux store for this app's scope.

**Why Tailwind?** The design token system (neo-noir color palette, spacing scale) maps well to Tailwind's utility classes. Custom design tokens are added in `tailwind.config.js`.

## Desktop Shell

| Technology | Version | Purpose |
|-----------|---------|---------|
| Electron | 28.2 | Desktop shell, process management, IPC |
| electron-builder | 24.9 | Cross-platform packaging (.AppImage, .deb, .dmg, .exe) |
| vite-plugin-electron | 0.28 | Integrates Vite's dev server with Electron main/preload compilation |
| vite-plugin-electron-renderer | 0.14 | Polyfills for Electron renderer compatibility |

**Why Electron?** Native OS APIs are needed for D-Bus (Linux), AppleScript (macOS), and Win32 window title access (Windows). A web app can't reach those. Electron's contextBridge + contextIsolation architecture gives a clean security boundary between the renderer and the system-access layer.

## Python Backend

| Technology | Purpose |
|-----------|---------|
| Python 3.8+ | Backend runtime |
| dbus-python | Linux D-Bus access for MPRIS media player detection |
| applescript | macOS AppleScript automation for media player detection |
| pywin32 + psutil | Windows Win32 GUI access for window title reading |
| requests | HTTP requests for lyrics scraping |
| beautifulsoup4 | HTML parsing for scraped lyrics pages |
| azapi | AZLyrics API wrapper |
| diskcache | Local key-value cache with TTL expiration |
| pathvalidate | Filename sanitization for safe local file writes |
| sentry-sdk | Error tracking (optional, used in scraping functions) |
| unidecode | Unicode-to-ASCII transliteration for search normalization |

**Why Python for the backend?** The original lyrics scraping logic was Python. The D-Bus, AppleScript, and Win32 libraries are mature and well-maintained in the Python ecosystem. Keeping the backend in Python avoids rewriting proven scraping logic and keeps Node/Electron focused on the UI.

**Why JSON-RPC over stdin/stdout?** Simple, zero dependencies, no ports, no sockets. The subprocess is fully contained. The Electron main process spawns it, owns it, and shuts it down. No external processes to worry about.

## IPC Architecture

```
Renderer (React)
    ↕ contextBridge (window.sonarAPI)
Electron Preload (preload.ts)
    ↕ ipcRenderer.invoke
Electron Main (main.ts / ipcMain)
    ↕ stdin/stdout JSON-RPC 2.0
Python Backend (main.py / ipc_server.py)
```

## Design System

**Neo-Noir Glass Monitor** - a dark glassmorphic aesthetic with teal accents.

Core visual principles:
- Background palette: void `#0a0b0e`, surface `#111214`, card `#141518`
- Primary accent: teal `#14b8a6` with glow variants
- Glass effects via rgba backgrounds, not `backdrop-filter` (backdrop-filter only on modal overlays)
- Layered shadows (minimum 2 layers on any elevated element)
- Card hover: `translateY(-2px)` + shadow escalation
- Body `padding: 16px` creates the floating panel visual gap
- App container `border-radius: 20px` + `overflow: hidden`

Design tokens are defined in `src/styles/theme.ts` (TypeScript) and `src/index.css` (CSS custom properties).

## Build Toolchain

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | 5.0 | Frontend build, HMR dev server |
| @vitejs/plugin-react | 4.2 | React JSX transform, Fast Refresh |
| TypeScript | 5.3 | Compiled at build time by Vite/esbuild |
| PostCSS | 8.4 | CSS processing pipeline (Tailwind, Autoprefixer) |
| Autoprefixer | 10.4 | CSS vendor prefix injection |
| ESLint | 8.56 | Linting (zero warnings policy) |
| electron-builder | 24.9 | Platform package creation |

## Runtime Requirements (End User)

None. All dependencies are bundled into the packaged app, including the Python virtual environment. Users do not need Node.js, Python, or npm installed.

## Runtime Requirements (Development)

- Node.js 18+
- Python 3.8+
- npm

Platform-specific:
- **Linux**: compositor for transparent window, D-Bus for media detection
- **macOS**: Automation permissions in System Settings for AppleScript
- **Windows**: No extras needed (Win32 APIs available by default)
