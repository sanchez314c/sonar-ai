# Contributing to SonarAI

Thanks for wanting to contribute. Here is how to get set up and what to expect.

## Development Setup

1. Fork and clone the repo
2. Run `bash run-source-linux.sh` (Linux) or the equivalent script for your platform
3. The script creates `python/.venv`, installs Python deps from `python/requirements.txt`, installs Node deps via `npm install`, and starts the dev server with `npm run dev`
4. The app launches via Vite + Electron in dev mode — hot reload works for the React frontend

## Project Layout

- `electron/` — Electron main process (`main.ts`), IPC bridge to Python (`python-bridge.ts`), and renderer-side API exposure (`preload.ts`)
- `src/` — React/TypeScript frontend. State lives in Zustand stores under `src/store/`. Components in `src/components/`. LRC parsing in `src/services/lrcParser.ts`
- `python/` — Python backend. All RPC methods are registered in `python/main.py`. Scraping logic lives in `python/services.py`. Song detection and caching in `python/backend.py`

## Code Standards

**TypeScript / React:**
- Functional components only, no class components
- State management via Zustand (`src/store/`). Never mutate store state directly — always return new objects
- All styling uses CSS variables from the design token system (`src/index.css` `:root` block) and `src/styles/theme.ts`. No hardcoded hex colors in component files
- Error handling: errors propagate up through the Zustand `error` fields and surface in the UI

**Python:**
- New lyrics services go in `python/services.py` using the `@lyrics_service` decorator with `synced=True` for LRC sources or the default `synced=False` for plain text
- New RPC methods get registered in `python/main.py`'s `main()` function via `server.register()`
- Use `pathvalidate.sanitize_filename()` before writing any file. Never use `shell=True` in subprocess calls

**IPC Protocol:**
- All renderer-to-Python calls go through `window.sonarAPI` (exposed by `electron/preload.ts` via contextBridge)
- New IPC channels need: a handler in `electron/main.ts` (`ipcMain.handle`), an entry in the `api` object in `electron/preload.ts`, and a type on `Window.sonarAPI`
- Validate URL protocols before calling `shell.openExternal` — only `http:`, `https:`, and `mailto:` are allowed

## Running Type Checks and Lint

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint on ts/tsx files
```

There is no automated test suite currently. See [docs/TODO.md](docs/TODO.md) for the test coverage tracking item.

## Commit Format

Use conventional commits:

```
feat: add spotify connect polling
fix: lrc parser ignores metadata-only lines
refactor: extract lrc timestamp parser into separate function
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`, `perf`

## Pull Requests

- Keep PRs focused. One concern per PR
- Describe what changed and why in the PR body
- If you change the IPC API surface (new channels, changed param types), update `docs/API.md`
- If you change the build system or Python deps, update `docs/BUILD_COMPILE.md` and `docs/INSTALLATION.md`

## Design System

All UI work must use the Neo-Noir Glass Monitor design tokens. The full token set is in `src/index.css` (`:root`) and mirrored in `src/styles/theme.ts`. The key rule: no hardcoded hex, rgba, or pixel values for colors, shadows, or border-radius outside the token system.

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). Include your OS, the media player you were using, and the Python/Node versions from the run script output.
