# FAQ

**Q: Which media players are supported?**

A: Spotify, Tidal, and VLC. Detection uses D-Bus/MPRIS (Linux), AppleScript (macOS), or window title parsing via Win32 (Windows). Switch between them in Settings.

---

**Q: Does SonarAI need an internet connection?**

A: For initial lyrics fetches, yes. Once lyrics are fetched they're cached locally for a week. If you have `.lrc` or `.txt` files in `~/.SonarAI/lyrics/`, those work fully offline.

---

**Q: Where are lyrics stored?**

A: Two places:
- `~/.SonarAI/lyrics/` - manually saved or pre-placed local files
- `~/.SonarAI/cache/` - auto-fetched lyrics cached via `diskcache` with a 1-week TTL

---

**Q: Can I use my own .lrc files?**

A: Yes. Drop them in `~/.SonarAI/lyrics/` with the naming format `Artist - Song Title.lrc` (or `.txt` for plain text). The local source is always tried first. The match is case-insensitive.

---

**Q: Why is the window so narrow?**

A: It's designed as a floating sidebar panel (480x850 pixels) that you position next to your main workspace. The narrow form factor is intentional. You can resize it above the minimum (360x500) if you need more width.

---

**Q: The lyrics are out of sync. What do I do?**

A: SonarAI starts the LRC timer from zero when the song loads, not from the actual playback position. If you start a song mid-way through, sync will be off until the song loops. Click **Next** to try a different source that may have better timestamps. You can also disable synced lyrics in Settings to just read plain text.

---

**Q: How do I switch from Spotify to Tidal or VLC?**

A: Open Settings (gear icon in the player bar) and click the service button for Tidal or VLC. The change takes effect immediately on the next poll.

---

**Q: Why is the background transparent? Can I make it solid?**

A: The transparent floating panel look is the intended design. There's no setting to make the background solid. If you want a solid background, you could modify `src/index.css` and change the `html, body` background from `transparent` to a solid color, then remove `transparent: true` from the BrowserWindow config in `electron/main.ts`.

---

**Q: The window is showing a black or white box instead of being transparent on Linux.**

A: You need a compositor running. On GNOME/KDE this works out of the box. On i3, bspwm, or similar WMs, install Picom: `sudo apt install picom && picom &`. The `--enable-transparent-visuals` and `--disable-gpu-compositing` Electron flags are already set in the code.

---

**Q: The app detected the wrong song. Can I correct it?**

A: SonarAI parses the media player's window title, which sometimes includes "(feat. Artist)" or "[Live]" suffixes. These are stripped in the title parser. If the detection is consistently wrong for a specific player/format, file an issue on GitHub with an example of the window title you're seeing.

---

**Q: Can I contribute a new lyrics source?**

A: Yes. Add a `@lyrics_service` decorated function in `python/services.py`. See the [DEVELOPMENT.md](DEVELOPMENT.md) section "Adding a New Lyrics Source" for the exact pattern.

---

**Q: The app works on first launch but loses lyrics on the next day.**

A: The diskcache TTL is 1 week. If lyrics are fetched, they'll be used from cache for 7 days. After that, a new fetch happens. This is normal behavior, not a bug.

---

**Q: Is my listening data sent anywhere?**

A: No. SonarAI makes outbound requests only to fetch lyrics from scraping sources (RentAnAdviser, Megalobiz, etc.). No analytics, no telemetry, no user tracking. Song names and artist names are sent in plain HTTP requests to those sites as part of the lyrics search query.

---

**Q: Does it work with Apple Music?**

A: Not currently. It's on the planned features list in [TODO.md](TODO.md). Apple Music on macOS exposes metadata through AppleScript differently than Spotify, so it would need its own `StreamingService` implementation.
