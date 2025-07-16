# Deployment

SonarAI ships as a self-contained desktop application. There is no server to deploy. "Deployment" means building distributable packages and distributing them to end users.

## Distribution Formats

| Platform | Format | Notes |
|----------|--------|-------|
| Linux | AppImage | Portable, no install needed. Mark executable and run. |
| Linux | .deb | Installs via `dpkg` or `apt`. |
| macOS | .dmg | Universal binary (x64 + arm64). Drag to Applications. |
| Windows | .exe (NSIS) | Installer wizard. Optional per-machine or per-user install. |

## Release Process

1. Bump the version in `package.json`.
2. Add a `CHANGELOG.md` entry with the new version and a summary of changes.
3. Build the target platform:
   ```bash
   bash build-linux.sh          # Linux
   npm run build:mac             # macOS
   npm run build:win             # Windows
   ```
4. Test the packaged binary locally on the target platform.
5. Create a GitHub Release at `https://github.com/sanchez314c/sonar-ai/releases/new` and upload the files from `release/`.

## What's Inside the Package

The packaged app contains:
- The compiled Electron/React frontend (in the asar archive)
- The compiled Electron main process
- The Python backend (`python/`) unpacked from asar so it can be executed
- The Python virtual environment with all dependencies bundled

End users do not need Python, Node.js, or any package manager installed. Everything ships inside the app bundle.

## Linux Distribution Notes

### AppImage

```bash
chmod +x SonarAI-1.0.0.AppImage
./SonarAI-1.0.0.AppImage
```

On some distributions you may need to install `libfuse2`:
```bash
sudo apt install libfuse2   # Ubuntu/Debian
```

The AppImage includes an embedded `--no-sandbox` flag set in `electron/main.ts` via `app.commandLine.appendSwitch('no-sandbox')`. This is required for Electron on Linux without user namespace support. If you need to verify, check the Electron sandbox configuration section in the ARCHITECTURE doc.

### .deb Package

```bash
sudo dpkg -i sonar-ai_1.0.0_amd64.deb
# or
sudo apt install ./sonar-ai_1.0.0_amd64.deb
```

### Compositor Requirement

The transparent floating window requires a compositor. On GNOME, Mutter handles this automatically. On minimal window managers you may need to run Picom or similar.

## macOS Distribution Notes

The `.dmg` contains a universal binary that runs natively on both Intel and Apple Silicon Macs.

The app is **not code-signed or notarized** by default. On macOS Sequoia users will need to bypass Gatekeeper:

1. Right-click the app in Finder and select Open.
2. Click Open again in the warning dialog.

Or from terminal:
```bash
xattr -cr /Applications/SonarAI.app
```

If you have an Apple Developer account, add signing details to `electron-builder.yml`:
```yaml
mac:
  identity: "Developer ID Application: Your Name (TEAMID)"
  notarize: true
```

## Windows Distribution Notes

The NSIS installer supports per-user and per-machine install. Desktop shortcut and Start Menu shortcut are created by default (configurable in `electron-builder.yml`).

The app is **not signed**. Windows Defender SmartScreen will show a warning on first run. Click "More info" then "Run anyway."

## Auto-Update

SonarAI does not include an auto-update mechanism. Updates are distributed manually via GitHub Releases. Users download and install the new package over the old one.

## Environment at Runtime

The packaged app sets `PYTHONUNBUFFERED=1` when spawning the Python subprocess so stdout lines flush immediately (required for the JSON-RPC readline loop).

No other environment configuration is needed at runtime.

## Troubleshooting Packaged Builds

**App won't launch on Linux:**
- Check logs: `journalctl -xe | grep sonar`
- Try running from terminal to see stderr output
- Verify compositor is running if you need transparency

**Python backend fails in production:**
- The Python venv must have been set up before running `electron-builder`
- Check that `python/.venv` exists with all dependencies installed before building
- In the packaged app, Python lives at `resources/python/.venv/bin/python3`

**macOS: "damaged or can't be opened":**
```bash
xattr -cr /Applications/SonarAI.app
```

**Windows: antivirus flagging the binary:**
This is a common false positive with unsigned Electron apps. Submit a false positive report to your AV vendor or add an exclusion.
