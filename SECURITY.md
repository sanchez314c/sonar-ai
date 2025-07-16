# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

Report security issues to software@jasonpaulmichaels.co.

## Security Considerations

- **Python Subprocess**: The Electron main process spawns a Python backend as a child process. The Python process has full system access for media player detection (D-Bus, AppleScript, Win32).
- **Web Scraping**: The Python backend scrapes lyrics from multiple websites. Network requests go to third-party services (RentAnAdviser, Megalobiz, Lyricsify, etc.).
- **Local Cache**: Lyrics are cached at `~/.SonarAI/lyrics/` and via `diskcache`. No encryption at rest.
- **No Authentication**: The app has no user authentication. It's a local desktop application.
- **Electron Context Isolation**: The preload bridge uses `contextBridge.exposeInMainWorld` for safe IPC between renderer and main processes.
