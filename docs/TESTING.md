# Testing

SonarAI does not currently have an automated test suite. This document covers the manual verification steps, what exists structurally, and what a test suite would need to cover.

## Current State

There are no automated unit, integration, or E2E tests. The `tests/` directory exists but is empty. This is tracked as technical debt in `docs/TODO.md`.

## Manual Testing Checklist

Use this checklist when verifying a build or PR before merging.

### Song Detection

- [ ] Open Spotify, play a track. SonarAI detects the artist and title within 1-2 seconds.
- [ ] Pause the track. SonarAI shows the last detected song (does not clear on pause).
- [ ] Play a different track. SonarAI updates to the new song without refreshing the whole UI.
- [ ] Switch the active service to Tidal or VLC in Settings. Detection still works.
- [ ] With nothing playing, the app shows the empty state (no song card, no lyrics).

### Lyrics Display

- [ ] A song with LRC data shows synced lyrics that scroll and highlight the current line.
- [ ] A song without LRC data shows plain-text lyrics (static, no highlight).
- [ ] Clicking "Next Source" in the player bar fetches lyrics from the next provider.
- [ ] After clicking "Next Source" enough times, the sources cycle back to the beginning.

### Auto-Scroll

- [ ] Auto-scroll is on by default and moves the lyrics to the active line.
- [ ] Manually scrolling up pauses auto-scroll for about 5 seconds, then it resumes.
- [ ] Turning off "Auto Scroll" in Settings keeps the view stationary.

### Settings

- [ ] Open Settings with the gear icon or `Ctrl+,`.
- [ ] Change font size. Lyrics text resizes immediately.
- [ ] Use `Ctrl++` and `Ctrl+-` to adjust font size without opening Settings.
- [ ] Toggle "Synced Lyrics" off. The next detected song fetches plain-text instead.
- [ ] Reset to Defaults restores font size to 18 and all toggles to their default states.
- [ ] Close and reopen the app. Settings persist (Zustand localStorage).

### Local Lyrics Files

- [ ] Place an `.lrc` file at `~/.SonarAI/lyrics/Artist - Title.lrc`.
- [ ] Play the matching song. The local file is used (source name shows "Local").
- [ ] Place a `.txt` file. Same behavior but no sync.

### Window Controls

- [ ] Minimize, maximize/restore, and close buttons all work.
- [ ] The window is draggable from the title bar area.
- [ ] The window resizes above the minimum of 360x500.
- [ ] On Linux: transparent background visible (compositor must be active).

### Python Backend

- [ ] Launch from source. The terminal shows `Python backend started successfully`.
- [ ] Open DevTools (`Ctrl+Shift+I`). No Python-related errors in the console.
- [ ] Kill the Python process externally. The app logs an error but does not crash hard.

## Testing the Python Backend in Isolation

You can call the backend directly without Electron:

```bash
cd python
source .venv/bin/activate

# Start the RPC server interactively (stdin/stdout)
python main.py

# In another terminal, send a request:
echo '{"jsonrpc":"2.0","id":"1","method":"ping","params":{}}' | python main.py
```

Expected response:
```json
{"jsonrpc": "2.0", "id": null, "result": {"status": "ready", "version": "1.0.0"}}
{"jsonrpc": "2.0", "id": "1", "result": {"status": "ok", "version": "1.0.0"}}
```

Test song detection directly:
```bash
echo '{"jsonrpc":"2.0","id":"2","method":"get_current_song","params":{}}' | python main.py
```

Test lyrics fetch:
```bash
echo '{"jsonrpc":"2.0","id":"3","method":"get_lyrics","params":{"artist":"The Beatles","title":"Hey Jude","sync":true}}' | python main.py
```

## What a Test Suite Should Cover

When tests are added, these are the priority areas:

### Unit Tests (TypeScript)

- `src/services/lrcParser.ts` - Parse valid LRC, malformed LRC, empty string, LRC with metadata tags, multi-timestamp lines
- `src/store/settingsSlice.ts` - Font size clamping, polling interval clamping, persist/rehydrate
- `src/store/songSlice.ts` - Same song deduplication (no re-render if artist/title unchanged)
- `src/store/lyricsSlice.ts` - fetchLyrics sets loading state, clears error on success
- `src/hooks/useSyncedLyrics.ts` - getLineClass returns correct classifications

### Unit Tests (Python)

- `python/ipc_server.py` - Unknown method rejection, oversized line guard, malformed JSON error
- `python/main.py` - `_validate_string` rejects empty/too-long values, `save_lyrics` path traversal guard, `set_lyrics_directory` null byte rejection
- `python/services.py` - `parseLRC` equivalent if there's a Python-side parser

### Integration Tests

- Full IPC round-trip: renderer calls `python:ping`, response arrives in renderer
- Song change detection triggers lyrics fetch
- "Next Source" increments source index and returns different lyrics

### Recommended Tools

- **TypeScript/React**: Vitest + React Testing Library
- **Python**: pytest
- **E2E**: Playwright (can drive Electron apps via `@playwright/test`)

## Linting and Type Checking

These are the only automated checks currently running:

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript strict check (0 errors required)
```

Run both before committing.
