# TODO

## Planned Features

- [ ] Apple Music support (macOS MPRIS-equivalent via AppleScript)
- [ ] YouTube Music support (browser extension bridge or title parsing)
- [ ] Manual lyrics search (search by artist/title without a playing song)
- [ ] Lyrics editing in-app (correct timestamps or typos and save to local file)
- [ ] Font size and theme customization beyond what Settings currently exposes
- [ ] Lyrics translation (Google Translate or DeepL integration)
- [ ] Spotify Web API integration for accurate playback position sync
- [ ] Window position persistence between sessions
- [ ] Tray icon with controls (play/pause, skip, toggle window)
- [ ] Keyboard shortcut to save current lyrics to file
- [ ] "Copy lyrics to clipboard" button

## Known Issues

- Lyrics sync starts from zero when the song loads, not from actual playback position. If you jump into the middle of a song the sync is off.
- Some lyrics sources return HTML artifacts (e.g., `&amp;`, `&#39;`) that don't get decoded before display.
- Window position is not saved between sessions. The window opens at the OS default position each time.
- D-Bus polling can lag 1-2 seconds on some Linux distributions with slow session bus.
- VLC detection on Windows relies on window title format. Playlist mode or certain VLC skins may not include track info in the title.

## Technical Debt

- Python `requirements.txt` has no version pins. A `pip install -r requirements.txt` could pull incompatible versions in the future.
- No automated test suite. See [TESTING.md](TESTING.md) for what should be covered.
- Scraper selectors in `python/services.py` are tightly coupled to each site's current HTML structure. Any site redesign breaks the scraper silently. There's no monitoring or alerting.
- The LRC parser in TypeScript (`src/services/lrcParser.ts`) and the Python `pylrc` dependency do similar things. One could be consolidated.
- `python/backend.py` uses a global `_SERVICE_LOCK` for threading but the IPC server is single-threaded in practice. The lock is correct but unnecessary overhead.
- Sentry SDK in `services.py` is included but the DSN is never configured. Exceptions get captured and dropped silently.

## Completed

- [x] Frameless transparent window with custom title bar
- [x] D-Bus song detection for Linux (Spotify, Tidal, VLC)
- [x] AppleScript detection for macOS
- [x] Win32 window title detection for Windows
- [x] JSON-RPC IPC over stdin/stdout
- [x] LRC synced lyrics with requestAnimationFrame timing
- [x] Auto-scroll with user scroll pause (5 second pause on manual scroll)
- [x] Multiple lyrics sources with Next Source cycling
- [x] Local lyrics file support (`~/.SonarAI/lyrics/`)
- [x] diskcache TTL caching (1-week TTL)
- [x] Zustand persist middleware for settings
- [x] Neo-Noir Glass Monitor design system full compliance
- [x] Security audit (v1.3.1): method allowlists, path traversal, traceback isolation, request timeouts, input validation
- [x] TypeScript: 0 errors (was 28 before v1.3.2 fixes)
