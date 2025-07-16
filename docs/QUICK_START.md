# Quick Start

Get SonarAI running in about 5 minutes.

## Option 1: Run from Source (recommended for developers)

```bash
git clone https://github.com/sanchez314c/sonar-ai.git
cd sonar-ai
bash run-source-linux.sh    # Linux
bash run-source-mac.sh      # macOS
run-source-windows.bat      # Windows
```

That's it. The run script installs all dependencies and launches the app. You need Node.js 18+ and Python 3.8+ already installed.

## Option 2: Pre-built Package

Download from [GitHub Releases](https://github.com/sanchez314c/sonar-ai/releases) and install for your platform. See [INSTALLATION.md](INSTALLATION.md) for per-platform details.

## Using the App

1. Open Spotify, Tidal, or VLC and play a song.
2. SonarAI detects it within a second and fetches lyrics automatically.
3. If lyrics are in LRC format, they scroll and highlight the current line in real time.
4. If the lyrics are wrong or out of sync, click the **Next** button in the bottom bar to try a different source.
5. Open Settings with the **gear icon** (or `Ctrl+,`) to:
   - Switch the active media player
   - Adjust font size
   - Toggle auto-scroll, line highlight, and synced lyrics
   - Set a custom lyrics directory

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+,` | Open Settings |
| `Ctrl++` | Increase font size |
| `Ctrl+-` | Decrease font size |
| `Ctrl+Shift+I` | Open DevTools |
| `Escape` | Close Settings |

## File Locations

| Path | What's there |
|------|-------------|
| `~/.SonarAI/lyrics/` | Your local lyrics files (`.lrc` and `.txt`) |
| `~/.SonarAI/cache/` | Cached lyrics from previous lookups (1-week TTL) |

## Troubleshooting

**Nothing detected:** Make sure your media player is actually playing (not just open). Check that the right service is selected in Settings.

**No lyrics found:** Some songs don't have lyrics online. Click **Next** a few times to try all sources. You can also drop an `.lrc` file in `~/.SonarAI/lyrics/Artist - Title.lrc` and it will be used automatically.

**Window is transparent/broken on Linux:** Your compositor may not be running. Start Picom or enable compositing in your desktop environment.

**Python backend won't start:** Make sure `python/.venv` was created properly. Try running the run script again, or do the manual setup steps from [DEVELOPMENT.md](DEVELOPMENT.md).

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more detailed help.
