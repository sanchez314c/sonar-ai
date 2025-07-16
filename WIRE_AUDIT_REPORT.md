# Wire Audit Report

**Project**: SonarAI
**Audit Date**: 2026-03-28
**Auditor**: Master Control (Step 8 /repowireaudit)

---

## Complete Wire Map

### Layer 1: UI Components -> IPC (window.sonarAPI)

| Component | API Call | Purpose |
|---|---|---|
| `TitleBar.tsx` | `window.sonarAPI.window.minimize()` | Minimize window |
| `TitleBar.tsx` | `window.sonarAPI.window.maximize()` | Toggle maximize |
| `TitleBar.tsx` | `window.sonarAPI.window.close()` | Close window |
| `TitleBar.tsx` | `window.sonarAPI.window.isMaximized()` | Check maximize state |
| `TitleBar.tsx` | `window.sonarAPI.openExternal(url)` | Open GitHub/email links |
| `MainContent.tsx` | `window.sonarAPI.openExternal(lyricsUrl)` | Open lyrics source URL |
| `App.tsx` -> `songSlice.ts` | `window.sonarAPI.python.getCurrentSong(serviceName)` | Poll for current song |
| `App.tsx` -> `lyricsSlice.ts` | `window.sonarAPI.python.getLyrics(artist, title, sync)` | Fetch lyrics |
| `PlayerBar.tsx` -> `lyricsSlice.ts` | `window.sonarAPI.python.nextLyrics(artist, title, sync)` | Alternate lyrics source |
| `lyricsSlice.ts` | `window.sonarAPI.python.saveLyrics(artist, title, lyrics, timed)` | Save lyrics to disk |
| `SettingsModal.tsx` | `window.sonarAPI.python.setService(service)` | Change streaming service (FIXED) |
| `useSettings.ts` | `window.sonarAPI.python.setLyricsDirectory(path)` | Set lyrics save directory |
| `useSettings.ts` | `window.sonarAPI.python.setService(service)` | Change streaming service |

### Layer 2: Preload (contextBridge) -> IPC Channels

| Preload Method | IPC Channel | Direction |
|---|---|---|
| `window.minimize()` | `window:minimize` | send (fire-and-forget) |
| `window.maximize()` | `window:maximize` | send (fire-and-forget) |
| `window.close()` | `window:close` | send (fire-and-forget) |
| `window.isMaximized()` | `window:isMaximized` | invoke (request/response) |
| `window.onMaximizeChange()` | `window:maximize-change` | on (event listener) |
| `openExternal()` | `open-external` | invoke |
| `python.ping()` | `python:ping` | invoke |
| `python.getConfig()` | `python:getConfig` | invoke |
| `python.getCurrentSong()` | `python:getCurrentSong` | invoke |
| `python.getLyrics()` | `python:getLyrics` | invoke |
| `python.nextLyrics()` | `python:nextLyrics` | invoke |
| `python.saveLyrics()` | `python:saveLyrics` | invoke |
| `python.setLyricsDirectory()` | `python:setLyricsDirectory` | invoke |
| `python.setService()` | `python:setService` | invoke |

### Layer 3: Main Process IPC Handlers -> Python Bridge

| IPC Handler | Python RPC Method | Python Handler |
|---|---|---|
| `python:ping` | `ping` | `main.py:ping()` |
| `python:getConfig` | `get_config` | `main.py:get_config()` |
| `python:getCurrentSong` | `get_current_song` | `main.py:get_current_song()` |
| `python:getLyrics` | `get_lyrics` | `main.py:get_lyrics()` |
| `python:nextLyrics` | `next_lyrics` | `main.py:next_lyrics()` |
| `python:saveLyrics` | `save_lyrics` | `main.py:save_lyrics()` |
| `python:setLyricsDirectory` | `set_lyrics_directory` | `main.py:set_lyrics_directory()` |
| `python:setService` | `set_service` | `main.py:set_service()` |

### Layer 4: Python Backend -> Storage

| Function | Storage Access | Type |
|---|---|---|
| `backend.cache_lyrics()` | `~/.SonarAI/cache/` (diskcache/SQLite) | Read/Write |
| `backend.get_window_title()` | D-Bus (Linux), AppleScript (macOS), Win32 API (Windows) | Read |
| `services._local()` | `~/.SonarAI/lyrics/` directory scan | Read |
| `main.save_lyrics()` | `~/.SonarAI/lyrics/` file write | Write |
| `services._rentanadviser()` | HTTP GET/POST to rentanadviser.com | Network |
| `services._megalobiz()` | HTTP GET to megalobiz.com | Network |
| `services._lyricsify()` | HTTP GET to lyricsify.com | Network |
| `services._rclyricsband()` | HTTP GET to rclyricsband.com | Network |
| `services._musixmatch()` | HTTP GET to musixmatch.com | Network |
| `services._songmeanings()` | HTTP GET to songmeanings.com | Network |
| `services._songlyrics()` | HTTP GET to songlyrics.com | Network |
| `services._genius()` | HTTP GET to genius.com | Network |
| `services._versuri()` | HTTP GET to versuri.ro | Network |
| `services._azapi()` | AZLyrics API via azapi lib | Network |

### Layer 5: State Management (Zustand)

| Store | Persisted | Consumers |
|---|---|---|
| `songSlice` (useSongStore) | No | App.tsx, MainContent.tsx, PlayerBar.tsx |
| `lyricsSlice` (useLyricsStore) | No | App.tsx, MainContent.tsx, PlayerBar.tsx, LyricsDisplay.tsx, useSyncedLyrics.ts |
| `settingsSlice` (useSettingsStore) | Yes (localStorage) | App.tsx, MainContent.tsx, PlayerBar.tsx, LyricsDisplay.tsx, SettingsModal.tsx, useSyncedLyrics.ts |

---

## Issues Found & Fixed

### CRITICAL: Streaming Service Change Bypassed Python Backend

**Severity**: CRITICAL
**Files**: `src/components/Settings/SettingsModal.tsx`
**Problem**: SettingsModal called `setActiveService()` directly on the Zustand store when the user selected a streaming service (Spotify/Tidal/VLC). This only updated the frontend state. The Python backend was never notified via `window.sonarAPI.python.setService()`, meaning the backend would continue polling the old service.
**Fix**: Replaced direct `setActiveService()` call with a new `handleServiceChange()` callback that calls the Python backend IPC first, then updates the Zustand store on success.
**Impact**: Service switching was silently broken. The UI showed the new service but the backend kept detecting songs from the previous service.

### CRITICAL: Tuple Destructuring Crash in Unsynced Lyrics Path

**Severity**: CRITICAL
**Files**: `python/backend.py` (line 282)
**Problem**: When `sync=False`, the `_local` service (which returns a 4-tuple: lyrics, url, service_name, timed) was inserted into `SERVICES_LIST2` (unsynced list). The loop at line 282 destructured the result into only 3 variables (`lyrics, url, service_name = result`), which would throw `ValueError: too many values to unpack` whenever a local .lrc or .txt file was found via the unsynced path.
**Fix**: Added length check on the result tuple. If 4 values, unpack all 4 (preserving the `timed` flag). If 3 values, unpack 3 (standard unsynced behavior).
**Impact**: Could crash the Python backend on any unsynced lyrics fetch when a local lyrics file existed.

### MEDIUM: `window:maximize-change` Event Never Emitted

**Severity**: MEDIUM
**Files**: `electron/main.ts`
**Problem**: The preload exposed `window.sonarAPI.window.onMaximizeChange()` which listens for `window:maximize-change` events from main process. But `main.ts` never emitted this event. TitleBar worked around this by manually calling `isMaximized()` after each maximize click, but external maximize actions (double-clicking title bar, OS window management) would not update the UI state.
**Fix**: Added `maximize` and `unmaximize` event listeners on the BrowserWindow that emit `window:maximize-change` to the renderer process via `webContents.send()`.
**Impact**: Maximize state icon could become stale when window was maximized/restored through non-button means.

---

## Dead Wires Identified (Not Fixed -- Intentional Design)

These are IPC endpoints that are fully wired end-to-end but have no current UI consumer. They represent planned features or debug/utility endpoints that are architecturally valid. Removing them would be destructive.

### `python.ping()` / `python.getConfig()`

Wired from preload through main.ts to Python, but never called from any React component. These are health-check and debug endpoints. Leaving them in place is correct -- they can be called from DevTools console and are useful for debugging.

### `lyricsSlice.saveLyrics()`

Store action wired to `window.sonarAPI.python.saveLyrics()` and through to the Python backend. No UI component currently calls it. This is a planned feature (save/edit lyrics) that has the backend fully wired but no UI yet. Removing the store action would break the path when the UI is added.

### `useSettings` Hook (src/hooks/useSettings.ts)

Exported but never imported by any component. It wraps `useSettingsStore` with keyboard shortcuts, `changeService()`, and `changeLyricsDirectory()` convenience methods. Components import `useSettingsStore` directly instead. Now that SettingsModal has its own `handleServiceChange`, this hook is genuinely unused but not harmful.

### `songSlice.setError()` / `lyricsSlice.setError()`

Public store actions that are defined but never called externally. Both stores set errors internally during their own async actions. The `setError` actions exist for potential external error injection but have no current consumer.

### `settingsSlice.lyricsDirectory` / `settingsSlice.setLyricsDirectory()`

State is persisted to localStorage but never read or displayed by any component. The `changeLyricsDirectory()` function in `useSettings` hook is also never called. Reserved for a future "custom lyrics directory" UI setting.

---

## Wire Integrity Summary

| Layer | Total Wires | Active | Dead (Intentional) | Broken (Fixed) |
|---|---|---|---|---|
| UI -> IPC | 13 | 10 | 3 (ping, getConfig, saveLyrics) | 0 |
| Preload -> IPC Channels | 14 | 13 | 0 | 1 (maximize-change emission) |
| Main -> Python Bridge | 8 | 8 | 0 | 0 |
| Python RPC -> Handlers | 8 | 8 | 0 | 1 (tuple destructuring) |
| Python -> Storage | 14 | 14 | 0 | 0 |
| Zustand State | 3 stores | All active | 0 | 1 (service change bypass) |

**Total issues found**: 3
**Auto-fixed**: 3
**Remaining broken wires**: 0

---

## Files Modified

1. `electron/main.ts` -- Added maximize/unmaximize event emission to renderer
2. `src/components/Settings/SettingsModal.tsx` -- Added handleServiceChange with IPC backend sync
3. `python/backend.py` -- Fixed tuple destructuring for mixed 3/4-tuple service returns
