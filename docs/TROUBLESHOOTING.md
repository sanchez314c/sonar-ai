# Troubleshooting

## Song Not Detected

**Check the media player is actually playing.**
SonarAI polls for an active song, not just an open player. Hit play.

**Check the service selection.**
Open Settings (gear icon) and confirm the correct service is selected: Spotify, Tidal, or VLC.

**Linux: verify D-Bus access.**
Spotify and Tidal expose metadata via the MPRIS protocol over D-Bus. Test it:
```bash
dbus-send --print-reply \
  --dest=org.mpris.MediaPlayer2.spotify \
  /org/mpris/MediaPlayer2 \
  org.freedesktop.DBus.Properties.GetAll \
  string:"org.mpris.MediaPlayer2.Player"
```
If this errors, Spotify may not be running or D-Bus is not configured. Try restarting Spotify.

For Tidal:
```bash
dbus-send --print-reply \
  --dest=org.mpris.MediaPlayer2.tidal \
  /org/mpris/MediaPlayer2 \
  org.freedesktop.DBus.Properties.GetAll \
  string:"org.mpris.MediaPlayer2.Player"
```

**macOS: grant AppleScript permissions.**
Go to System Settings > Privacy & Security > Automation and make sure SonarAI is allowed to control the media player.

**VLC: check window title.**
On Windows, SonarAI reads the window title to detect VLC. Make sure VLC shows "Artist - Title - VLC media player" in the title bar (it doesn't if VLC is in a playlist mode that hides track info).

---

## Python Backend Not Starting

**Check Python is installed:**
```bash
python3 --version   # should be 3.8 or higher
```

**Check the virtual environment exists:**
```bash
ls python/.venv/bin/python3   # Linux/macOS
# or
dir python\.venv\Scripts\python.exe  # Windows
```

If it doesn't exist, create it:
```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Check the console for errors.**
Open DevTools with `Ctrl+Shift+I`. Look in the Console tab for lines starting with "Python stderr:" or "Failed to start Python backend:".

**Run the backend directly to see raw errors:**
```bash
cd python
source .venv/bin/activate
python main.py
```
Type a ping request and press Enter:
```
{"jsonrpc":"2.0","id":"1","method":"ping","params":{}}
```
You should see a ready message followed by the ping response. If you see a Python traceback, the error will be obvious.

---

## No Lyrics Found

**Try Next Source.**
Click the **Next** button in the player bar. SonarAI cycles through multiple lyrics sources. Some songs are only available on certain sites.

**Check your network connection.**
Scraping requires internet access. If you're on a restricted network, some sources may be blocked.

**Create a local file.**
Place your own lyrics at `~/.SonarAI/lyrics/Artist - Song Title.lrc` (for synced) or `.txt` (for plain text). Local files are tried first and always work offline.

**The song may just not have lyrics online.**
Obscure tracks, instrumentals, and very new releases often have nothing available.

---

## Lyrics Are Out of Sync

**The sync depends on your media player reporting accurate playback position.**
SonarAI starts the LRC timestamp counter from zero when a new song loads, not from the actual playback position. If you start a song in the middle, the sync will be off.

**Try Next Source.**
Different sources have different timestamp accuracy. Click **Next** to try others.

**Disable synced lyrics.**
If sync is consistently wrong, turn off "Synced Lyrics" in Settings. You'll get plain-text lyrics without any timing.

---

## Window Not Showing / Black Window

**On Linux, run the sandbox fix:**
```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```
Or just use `run-source-linux.sh` which handles this automatically.

**No compositor running:**
The transparent floating window requires a compositor. On minimal setups, install and start Picom:
```bash
picom --backend glx --vsync &
```
Then restart SonarAI.

**Check the terminal output:**
When using the run script, any startup errors print to the terminal. Look for error lines from Node or Python.

**On Windows: missing WebView2 runtime:**
Download and install the [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

---

## App Crashes or Freezes

**Check if Python died.**
Open DevTools > Console and look for "Python process exited" messages. If Python crashed, try restarting the whole app.

**Clear the lyrics cache.**
A corrupted cache entry can cause repeated failures. Delete `~/.SonarAI/cache/` and restart:
```bash
rm -rf ~/.SonarAI/cache/
```

**Reset settings.**
If the app behaves strangely after a version update, reset settings: open the Settings panel and click "Reset to Defaults". Or manually clear localStorage by opening DevTools > Application > Local Storage and deleting the `sonar-ai-settings` key.

---

## Transparent Window Issues on Linux

The window uses `frame: false`, `transparent: true`, and `--enable-transparent-visuals`. This requires:

1. A compositor with ARGB/transparency support
2. The GPU compositing flag: `--disable-gpu-compositing` (set automatically in `electron/main.ts`)

If you see a white or black rectangle instead of transparency:
- Start or restart your compositor
- Try `picom --backend glx` (GLX backend supports transparency better than XRender on some setups)
- On GNOME: make sure "Mutter" compositor is running (it should be by default)

---

## High CPU Usage

**Lower the polling interval.**
The default is 1 second. Open Settings and increase it to 2000 or 5000 ms. This reduces how often SonarAI checks for song changes.

**Disable auto-scroll.**
The `requestAnimationFrame` loop for synced lyrics runs continuously while a timed song is loaded. Disabling auto-scroll or turning off "Synced Lyrics" stops the loop.

---

## Reporting a Bug

If none of the above helps, open an issue on GitHub with:
- Your OS and version
- Node.js version (`node -v`)
- Python version (`python3 --version`)
- The media player you're using
- Console output from DevTools or the terminal
- A description of what you expected vs what happened
