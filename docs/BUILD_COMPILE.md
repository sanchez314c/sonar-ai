# Build and Compile

## Build System

SonarAI uses Vite 5 with `vite-plugin-electron` to handle both the renderer and the Electron main/preload process in one build step. `electron-builder` then packages the compiled output into platform distributables.

## Quick Build (Linux)

```bash
bash build-linux.sh
```

This script handles everything: Python venv setup, Node dependencies, Vite build, and electron-builder packaging. Output lands in `release/`.

## npm Build Commands

```bash
npm run build           # Vite build only (no packaging)
npm run build:linux     # Vite build + AppImage + .deb
npm run build:mac       # Vite build + .dmg (x64 + arm64)
npm run build:win       # Vite build + NSIS .exe installer
```

Run `npm install` first if you haven't already, and make sure `python/.venv` is set up:

```bash
cd python && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cd ..
npm install
npm run build:linux
```

## What Gets Built

### Vite Build (`npm run build`)

Vite compiles:
- Renderer (React + TypeScript) to `dist/`
- Electron main process to `dist-electron/main.js`
- Electron preload to `dist-electron/preload.js`

The renderer uses `@vitejs/plugin-react` for JSX/TSX compilation and Tailwind CSS via PostCSS.

### electron-builder Packaging

After the Vite build, electron-builder reads `electron-builder.yml` and produces:

| Platform | Formats | Output |
|----------|---------|--------|
| Linux | AppImage (x64), .deb (x64) | `release/` |
| macOS | .dmg (x64 + arm64 universal) | `release/` |
| Windows | NSIS installer (.exe, x64) | `release/` |

### Python Bundling

The `extraResources` block in `electron-builder.yml` copies the entire `python/` folder (including the `.venv`) into `resources/python/` in the packaged app. The Python backend runs from there at runtime.

```yaml
extraResources:
  - from: python
    to: python
    filter:
      - "**/*"
      - "!__pycache__"
      - "!*.pyc"
```

The `asar: true` / `asarUnpack: ["python/**/*"]` settings pack most files into the asar archive but unpack the Python folder so it can be executed by the OS.

## Python Path Resolution

When packaged, `PythonBridge.getPythonPath()` in `electron/python-bridge.ts` looks for the bundled venv Python in this order:

1. `SONAR_PYTHON_PATH` environment variable (if set and exists)
2. `resources/python/.venv/bin/python3` (production) or `python/.venv/bin/python3` (dev)
3. System `python3` fallback

## TypeScript Configuration

- `tsconfig.json` covers the renderer (`src/`)
- `tsconfig.node.json` covers Node/Electron files (`electron/`, `vite.config.ts`)
- Both use `"strict": true`

Type-check without compiling:

```bash
npm run typecheck
```

## Linting

```bash
npm run lint
```

Uses ESLint with `@typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`. Max warnings is set to 0, so any warning fails the check.

## Build Output Structure

```
release/
├── SonarAI-1.0.0.AppImage          # Linux portable
├── sonar-ai_1.0.0_amd64.deb        # Linux Debian package
├── SonarAI-1.0.0-mac.dmg           # macOS disk image
└── SonarAI Setup 1.0.0.exe         # Windows installer
```

## Development Mode vs Production Mode

In dev mode (`npm run dev` / `run-source-linux.sh`), the main process detects `process.env.VITE_DEV_SERVER_URL` and loads the renderer from Vite's dev server at `http://localhost:58005`. The Electron binary is launched directly by `vite-plugin-electron`.

In production mode (packaged app), the renderer is loaded from `dist/index.html` inside the asar archive.

## Version Management

The version is defined in `package.json` (the single source of truth) and referenced in `electron-builder.yml`. To release a new version:

1. Update `"version"` in `package.json`
2. Update `CHANGELOG.md`
3. Run `npm run build:linux` (or platform target)
4. Distribute `release/` artifacts

## CPU Parallelism

To use all CPU cores during the Node.js build:

```bash
# electron-builder uses worker threads internally
# For the Vite build step, threads are managed by Rollup
# No additional flags needed — both tools parallelize by default
```

If you need to build faster on CI, set:
```bash
export UV_THREADPOOL_SIZE=16  # match your core count
```
