# API Reference

This document covers two API surfaces: the `window.sonarAPI` object exposed to the React renderer via Electron's contextBridge, and the Python JSON-RPC methods exposed over stdin/stdout.

## Renderer API (`window.sonarAPI`)

The preload script (`electron/preload.ts`) exposes this object to the renderer process via `contextBridge.exposeInMainWorld('sonarAPI', api)`.

### Window Controls

```typescript
window.sonarAPI.window.minimize(): void
window.sonarAPI.window.maximize(): void
window.sonarAPI.window.close(): void
window.sonarAPI.window.isMaximized(): Promise<boolean>
window.sonarAPI.window.onMaximizeChange(callback: (isMaximized: boolean) => void): () => void
```

`onMaximizeChange` returns a cleanup function that removes the listener. Call it in a `useEffect` cleanup.

### Shell

```typescript
window.sonarAPI.openExternal(url: string): Promise<{ success: boolean; error?: string }>
```

Opens a URL in the default browser. Only `http:`, `https:`, and `mailto:` are allowed. Other protocols return `{ success: false, error: 'Invalid URL protocol' }`.

### Python Backend

All Python calls go through the subprocess bridge. They return promises that resolve when the Python process responds, or reject on timeout (30 seconds) or process error.

---

#### `python.ping()`

Health check.

```typescript
window.sonarAPI.python.ping(): Promise<{ status: string; version: string }>
```

Returns `{ status: "ok", version: "1.0.0" }`.

---

#### `python.getConfig()`

Get the current Python backend configuration.

```typescript
window.sonarAPI.python.getConfig(): Promise<Config>
```

```typescript
interface Config {
  lyrics_dir: string          // Current lyrics directory path
  settings_dir: string        // App data directory path
  default_lyrics_dir: string  // Default lyrics directory path
  synced_sources: number      // Number of registered synced lyrics sources
  unsynced_sources: number    // Number of registered plain-text lyrics sources
}
```

---

#### `python.getCurrentSong(serviceName?)`

Get the currently playing song.

```typescript
window.sonarAPI.python.getCurrentSong(serviceName?: string): Promise<SongInfo | null>
```

```typescript
interface SongInfo {
  artist: string
  title: string
  raw_title: string  // Raw window title before parsing
  service: string    // Service name (e.g., "Spotify")
}
```

Returns `null` if no song is playing or the player is not running. Pass `serviceName` as `"spotify"`, `"tidal"`, or `"vlc"` to override the active service for this call only.

---

#### `python.getLyrics(artist, title, sync?)`

Fetch lyrics for a song.

```typescript
window.sonarAPI.python.getLyrics(
  artist: string,
  title: string,
  sync?: boolean  // default: true
): Promise<LyricsResult>
```

```typescript
interface LyricsResult {
  lyrics: string        // Raw lyrics text (LRC format if timed, plain text otherwise)
  url: string           // Source URL
  service_name: string  // Name of the source that provided the lyrics
  timed: boolean        // true if lyrics are in LRC format with timestamps
  album?: string | null
  year?: number | null
  error?: string        // Present if fetch failed
}
```

If `sync` is true, the backend tries synced (LRC) sources first, then falls back to plain text. If `sync` is false, only plain-text sources are tried.

---

#### `python.nextLyrics(artist, title, sync?)`

Fetch lyrics from the next available source. Call this when the current source returns unsatisfactory lyrics. The backend cycles through its source list.

```typescript
window.sonarAPI.python.nextLyrics(
  artist: string,
  title: string,
  sync?: boolean  // default: true
): Promise<LyricsResult>
```

Same return type as `getLyrics`.

---

#### `python.saveLyrics(artist, title, lyrics, timed?)`

Save lyrics to a local file.

```typescript
window.sonarAPI.python.saveLyrics(
  artist: string,
  title: string,
  lyrics: string,
  timed?: boolean  // default: false
): Promise<SaveResult>
```

```typescript
interface SaveResult {
  success: boolean
  path?: string   // Full path to saved file (present on success)
  error?: string  // Error message (present on failure)
}
```

The file is saved to `~/.SonarAI/lyrics/Artist - Title.lrc` (if `timed`) or `.txt` (if not). Filenames are sanitized. Max payload is 5 MB.

---

#### `python.setLyricsDirectory(path)`

Change the lyrics directory for the current session.

```typescript
window.sonarAPI.python.setLyricsDirectory(path: string): Promise<SaveResult>
```

The directory must already exist. Path traversal is blocked server-side.

---

#### `python.setService(serviceName)`

Switch the media player the backend monitors.

```typescript
window.sonarAPI.python.setService(serviceName: string): Promise<ServiceResult>
```

```typescript
interface ServiceResult {
  success: boolean
  service?: string    // Active service name on success
  error?: string      // Error message on failure
  available?: string[] // Available service names (present on failure)
}
```

Valid values for `serviceName`: `"spotify"`, `"tidal"`, `"vlc"`.

---

## Python JSON-RPC API

The Python process (`python/main.py`) is a JSON-RPC 2.0 server that communicates over stdin/stdout. The Electron main process is the only caller. Each message is a single JSON line followed by `\n`.

### Protocol

**Request format:**
```json
{"jsonrpc": "2.0", "id": "1", "method": "ping", "params": {}}
```

**Success response:**
```json
{"jsonrpc": "2.0", "id": "1", "result": {"status": "ok", "version": "1.0.0"}}
```

**Error response:**
```json
{"jsonrpc": "2.0", "id": "1", "error": {"code": -32601, "message": "Method not found: bad_method"}}
```

**Ready signal** (sent on startup, before any requests):
```json
{"jsonrpc": "2.0", "id": null, "result": {"status": "ready", "version": "1.0.0"}}
```

### Error Codes

| Code | Meaning |
|------|---------|
| -32700 | Parse error (malformed JSON or line too large) |
| -32600 | Invalid request (not a JSON object, missing method) |
| -32601 | Method not found |
| -32602 | Invalid params (wrong types or missing required fields) |
| -32000 | Application error (handler threw an exception) |

### Method Allowlist

Only these methods are accepted. Any other method name returns a -32601 error.

| Method | Params | Description |
|--------|--------|-------------|
| `ping` | `{}` | Health check |
| `get_config` | `{}` | Get current config |
| `get_current_song` | `{service_name?: string}` | Get playing song |
| `get_lyrics` | `{artist: string, title: string, sync?: bool}` | Fetch lyrics |
| `next_lyrics` | `{artist: string, title: string, sync?: bool}` | Fetch from next source |
| `save_lyrics` | `{artist: string, title: string, lyrics: string, timed?: bool}` | Save to file |
| `set_lyrics_directory` | `{path: string}` | Change lyrics directory |
| `set_service` | `{service_name: string}` | Switch media player |

### Input Constraints

- Max line size: 10 MB
- Max artist/title length: 512 characters
- Max lyrics payload: 5 MB

## IPC Channel Reference (Electron Main)

These are the `ipcMain` channels wired in `electron/main.ts`. They map directly to the `window.sonarAPI` methods above.

| Channel | Direction | Transport |
|---------|-----------|-----------|
| `window:minimize` | renderer to main | `ipcRenderer.send` |
| `window:maximize` | renderer to main | `ipcRenderer.send` |
| `window:close` | renderer to main | `ipcRenderer.send` |
| `window:isMaximized` | renderer to main (invoke) | `ipcRenderer.invoke` |
| `window:maximize-change` | main to renderer | `ipcRenderer.on` |
| `open-external` | renderer to main (invoke) | `ipcRenderer.invoke` |
| `python:ping` | renderer to main (invoke) | `ipcRenderer.invoke` |
| `python:getConfig` | renderer to main (invoke) | `ipcRenderer.invoke` |
| `python:getCurrentSong` | renderer to main (invoke) | `ipcRenderer.invoke` |
| `python:getLyrics` | renderer to main (invoke) | `ipcRenderer.invoke` |
| `python:nextLyrics` | renderer to main (invoke) | `ipcRenderer.invoke` |
| `python:saveLyrics` | renderer to main (invoke) | `ipcRenderer.invoke` |
| `python:setLyricsDirectory` | renderer to main (invoke) | `ipcRenderer.invoke` |
| `python:setService` | renderer to main (invoke) | `ipcRenderer.invoke` |
