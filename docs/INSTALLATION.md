# Installation

## Pre-Built Packages (Recommended)

Download the latest release from [GitHub Releases](https://github.com/sanchez314c/sonar-ai/releases).

### Linux

**AppImage (no install needed):**
```bash
chmod +x SonarAI-1.0.0.AppImage
./SonarAI-1.0.0.AppImage
```

If you see a FUSE error:
```bash
sudo apt install libfuse2    # Ubuntu/Debian
sudo dnf install fuse        # Fedora
```

**Debian/Ubuntu package:**
```bash
sudo dpkg -i sonar-ai_1.0.0_amd64.deb
# or
sudo apt install ./sonar-ai_1.0.0_amd64.deb
```

**Transparent window note:** SonarAI uses a frameless transparent window. You need a compositor running. GNOME, KDE, and most modern desktop environments include one. If you're on a bare window manager like i3 or bspwm, install and run Picom first.

### macOS

1. Download `SonarAI-1.0.0-mac.dmg`
2. Open the .dmg
3. Drag SonarAI to Applications
4. On first launch, macOS may block it (the app is not notarized). Right-click the app and choose Open, then click Open again.

If that doesn't work:
```bash
xattr -cr /Applications/SonarAI.app
```

Works on both Intel and Apple Silicon.

### Windows

1. Download `SonarAI Setup 1.0.0.exe`
2. Run the installer
3. Choose per-user or per-machine install
4. If Windows Defender SmartScreen appears, click "More info" then "Run anyway"

The installer creates desktop and Start Menu shortcuts.

---

## From Source

If you want to run from source (useful for development or if a pre-built package isn't available for your platform):

### Prerequisites

- Node.js 18 or newer ([nodejs.org](https://nodejs.org))
- Python 3.8 or newer
- Git
- A running media player: Spotify, Tidal, or VLC

Check your versions:
```bash
node -v      # should be v18.0.0 or higher
python3 --version  # should be 3.8.x or higher
```

### Clone and Run

```bash
git clone https://github.com/sanchez314c/sonar-ai.git
cd sonar-ai
```

Then run the appropriate script for your platform:

```bash
bash run-source-linux.sh    # Linux
bash run-source-mac.sh      # macOS
run-source-windows.bat      # Windows
```

The run script:
- Creates a Python virtual environment at `python/.venv`
- Installs Python dependencies from `python/requirements.txt`
- Installs Node.js dependencies via `npm install`
- Fixes the Linux sandbox setting if needed
- Launches the app in development mode

On subsequent launches you can just run the script again. It skips dependency installation if nothing changed.

### Manual Steps (if the script doesn't work)

```bash
# Set up Python environment
cd python
python3 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Install Node dependencies
npm install

# Launch
npm run dev
```

---

## Post-Installation Setup

1. Launch SonarAI
2. Open a supported media player (Spotify, Tidal, or VLC) and play a song
3. If your player isn't detected, open Settings (gear icon) and select the correct service
4. Lyrics should appear within 1-2 seconds

### Optional: Local Lyrics Files

Place your own `.lrc` or `.txt` lyrics files at `~/.SonarAI/lyrics/` using this naming format:

```
Artist Name - Song Title.lrc
Artist Name - Song Title.txt
```

Local files are used first before any network scraping.

---

## Uninstalling

### Pre-built Package

- **Linux AppImage:** Delete the `.AppImage` file
- **Linux .deb:** `sudo apt remove sonar-ai`
- **macOS:** Drag SonarAI from Applications to Trash
- **Windows:** Settings > Apps > SonarAI > Uninstall

### App Data

App data (lyrics, cache, settings) lives at:
- Linux/macOS: `~/.SonarAI/`
- Windows: `%APPDATA%\SonarAI\`

Delete that folder to remove all cached lyrics and settings.
