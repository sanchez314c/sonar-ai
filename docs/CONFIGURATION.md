# Configuration

SonarAI stores all user-facing settings in localStorage via Zustand's persist middleware. There are no external config files to edit. Everything is accessible through the in-app Settings panel (gear icon in the player bar, or Ctrl+,).

## User Settings

Settings are stored under the key `sonar-ai-settings` in localStorage.

| Setting | Default | Description |
|---------|---------|-------------|
| `fontSize` | 18 | Lyrics text size in pixels (range: 12 to 32) |
| `showSourceInfo` | true | Show the lyrics source name and URL |
| `syncEnabled` | true | Fetch and display timed LRC lyrics when available |
| `autoScroll` | true | Auto-scroll lyrics to the current line |
| `highlightCurrentLine` | true | Highlight the active lyric line |
| `pollingInterval` | 1000 | How often to poll for song changes (ms, range: 500 to 5000) |
| `activeService` | `"spotify"` | Media player to monitor: `spotify`, `tidal`, or `vlc` |
| `lyricsDirectory` | null | Custom lyrics folder (null uses the default `~/.SonarAI/lyrics/`) |

### Resetting to Defaults

Open Settings and click "Reset to Defaults" at the bottom of the panel. This restores all settings above to the values in the table.

### Font Size Shortcuts

You can also adjust font size from the keyboard without opening settings:

- `Ctrl++` to increase
- `Ctrl+-` to decrease

## Python Backend Config

The Python backend has its own runtime config managed through the `Config` class in `python/services.py`.

| Setting | Default | Description |
|---------|---------|-------------|
| `LYRICS_DIR` | `~/.SonarAI/lyrics/` | Where lyrics files are saved and read from |
| `SETTINGS_DIR` | `~/.SonarAI/` | App data directory |
| `REQUEST_TIMEOUT` | 15 seconds | Network timeout for each scraping call |

On Windows the settings dir is `%APPDATA%\SonarAI\` instead.

You can change the lyrics directory at runtime through the Settings panel (the "Lyrics Directory" field). This calls `python:setLyricsDirectory` via IPC and updates `Config.LYRICS_DIR` for the session. The new path must already exist.

## Lyrics Cache

Fetched lyrics are cached by the Python backend using `diskcache` with a 1-week TTL. The cache lives at `~/.SonarAI/cache/`. To clear it, delete that folder while SonarAI is not running.

## Local Lyrics Files

Place your own `.lrc` or `.txt` files in `~/.SonarAI/lyrics/` (or your custom directory). The filename format is:

```
Artist - Song Title.lrc
Artist - Song Title.txt
```

The local file source is always tried first before any network scraping. If a matching `.lrc` file exists, it takes priority over fetching from the web.

## Environment Variables

These are set automatically by the run scripts and do not need to be set manually.

| Variable | Purpose |
|----------|---------|
| `SONAR_PYTHON_PATH` | Path to the Python interpreter to use for the backend. If set and the path exists, it overrides venv detection. |
| `VITE_DEV_SERVER_URL` | Set by Vite in dev mode. Tells Electron where to load the renderer from. |
| `PYTHONUNBUFFERED` | Set to `1` when spawning the Python subprocess so stdout lines flush immediately. |

## Electron Window Options

The window starts at 480x850 pixels with a minimum of 360x500. These values are set in `electron/main.ts` and cannot be changed through settings. The window is frameless, transparent, and has no OS shadow. On Linux, transparent visuals require compositor support (e.g., Picom or KWin with compositing enabled).
