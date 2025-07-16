# Learnings

Technical lessons from building SonarAI. These come from actual problems hit during development.

---

## JSON-RPC over stdin/stdout for Python-Electron IPC

**The problem:** Connecting a Python subprocess to Electron without introducing sockets, HTTP servers, or named pipes.

**The solution:** JSON-RPC 2.0 over stdin/stdout. Each request and response is a single JSON line followed by `\n`. The Python process reads stdin line-by-line; Electron's `readline.Interface` reads stdout line-by-line. No ports, no external processes, no network stack.

**Key detail:** The Python process must flush stdout after every write. Set `PYTHONUNBUFFERED=1` in the subprocess environment (done in `python-bridge.ts`) and call `sys.stdout.flush()` in the IPC server after every response write.

**Startup signaling:** The Python process sends `{"id": null, "result": {"status": "ready"}}` on stdout when it finishes initializing. The Electron bridge resolves its `readyPromise` on that signal. All IPC calls await this promise. Without the ready signal, calls sent before Python is fully initialized would silently fail.

---

## D-Bus for Linux Media Detection

**The problem:** Detecting what's playing in Spotify on Linux without using the Spotify API.

**The solution:** MPRIS (Media Player Remote Interfacing Specification) over D-Bus. Every major Linux media player (Spotify, Tidal, VLC, Rhythmbox, etc.) exposes its current track via `org.mpris.MediaPlayer2.*` on the session D-Bus.

**Bus name:** Spotify registers as `org.mpris.MediaPlayer2.spotify`. You can enumerate all MPRIS players with:
```bash
dbus-send --session --print-reply \
  --dest=org.freedesktop.DBus \
  / org.freedesktop.DBus.ListNames | grep mpris
```

**Why not the Spotify API?** No OAuth dance, no API key, works offline for detection (no internet needed to just check what's playing).

---

## LRC Sync Timing with requestAnimationFrame

**The problem:** Highlighting the correct lyric line in real time without jank.

**The solution:** `requestAnimationFrame` loop started when a new synced song loads. Each frame calculates `performance.now() - startTime` and does a binary search (`findCurrentLineIndex`) through the sorted `LRCLine[]` array. The binary search keeps the per-frame computation at O(log n) regardless of how many lines are in the file.

**Gotcha:** The timer starts from zero when lyrics load, not from the actual playback position. This means if you skip into the middle of a song, sync is off until the song loops or you skip back to the beginning. A future fix would use the media player's reported playback position.

**Auto-scroll conflict:** The auto-scroll logic calls `container.scrollTo()` programmatically. User manual scrolls shouldn't fight this. We detect user scroll with `wheel` and `touchmove` event listeners and pause auto-scroll for 5 seconds. An `isAutoScrollingRef` flag distinguishes programmatic scrolls (which should not trigger the pause) from user scrolls.

---

## Frameless Transparent Windows on Linux

**The problem:** `frame: false` + `transparent: true` in Electron on Linux is not reliable across all desktop environments.

**The solution (what worked):**
- `app.commandLine.appendSwitch('enable-transparent-visuals')` - signals the compositor that the window needs ARGB
- `app.commandLine.appendSwitch('disable-gpu-compositing')` - less aggressive than `--disable-gpu`, still allows transparent window rendering
- 300ms startup delay on Linux: `setTimeout(createWindow, 300)` inside `app.whenReady()`. This gives the compositor time to set up the ARGB visual before the window is created. Without this, the window sometimes renders opaque.
- `backgroundColor: '#00000000'` explicitly set (not just transparent: true)
- `hasShadow: false` - let CSS handle depth

**What NOT to use:** `--disable-gpu` (fully disables GPU, breaks transparency) and `experimentalFeatures: true` (caused `ipcRenderer.invoke()` promises to silently fail through the contextBridge proxy in Electron 28).

---

## diskcache for Python-Side Caching

**The problem:** Repeated lyrics fetches for the same song hit the scraping sources every time, causing slow responses and potential rate limiting.

**The solution:** Python's `diskcache` library provides a simple key-value store with TTL. One line to set, one line to get:
```python
cache = Cache(path)
if (result := cache.get(key)):
    return result
result = fetch_from_web(...)
cache.set(key, result, expire=604800)  # 1 week
```

**Why not the filesystem directly?** diskcache handles concurrent access, TTL expiry, and serialization. It's SQLite under the hood so it's durable across restarts.

---

## Song Change Detection Without Re-renders

**The problem:** The polling loop runs every second. If it creates a new `SongInfo` object on every poll (even for the same song), Zustand's reference equality check sees a change, React re-renders, and the lyrics reset.

**The solution:** In `songSlice.ts`, `fetchCurrentSong` compares the incoming `artist`, `title`, and `raw_title` against the current store values before calling `set()`. If all three match, the existing object is returned unchanged. This means the component tree only re-renders when the song actually changes.

---

## Electron Security Model

**Learned from the security audit (v1.3.1):**

1. `experimentalFeatures: false` is required. Setting it to `true` broke `ipcRenderer.invoke()` through the contextBridge in Electron 28.
2. `webSecurity: true` should be explicit, not relied on as a default.
3. Python tracebacks must not go to the client. The IPC server previously included `traceback.format_exc()` in the error response `data` field. This leaks internal paths. Tracebacks now go to stderr only.
4. An `ALLOWED_METHODS` Set on both sides (TypeScript and Python) is a lightweight but effective defense against method injection. A single typo or injected payload can't call an unexpected handler.
5. Path traversal in file operations: always `os.path.realpath()` the resolved path and verify it starts with the intended base directory + `os.sep`. Null bytes in paths are a separate attack vector (`'\x00' in path` check).

---

## Scraper Resilience

**What went wrong:** Several scrapers in `services.py` called `.find()` and directly accessed `.text` or `.string` without null checks. When a site changes its HTML structure, `.find()` returns `None` and the next access throws `AttributeError`.

**The fix:** Null-guard every BeautifulSoup find call before accessing attributes. The `@lyrics_service` decorator catches exceptions and returns `None`, so the pipeline continues to the next source. The real issue was that unhandled `AttributeError` inside the decorator's try/except was being swallowed silently with no retry logic. After adding null guards, failures are at least logged clearly.

**Also:** The `requests.get()` calls had no timeout. A hanging source would block the IPC thread for the entire session. Adding `timeout=REQUEST_TIMEOUT` (15 seconds) on all requests fixed this.
