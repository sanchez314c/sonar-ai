# Development Workflow

## Branching

- `main` - primary branch, should always be in a working state
- Feature branches off `main`, merged via PR

There is no CI/CD pipeline. Builds and releases are done manually.

## Day-to-Day Development Cycle

1. Pull latest from `main`
2. Create a feature branch: `git checkout -b feature/my-thing`
3. Start the dev server: `bash run-source-linux.sh` (or platform equivalent)
4. Make changes
5. Test manually (see [TESTING.md](TESTING.md) for the manual checklist)
6. Run lint and typecheck: `npm run lint && npm run typecheck`
7. Update `CHANGELOG.md` with what changed
8. Commit and open a PR

## Hot Reload Notes

- Renderer changes (React components, CSS, hooks): Vite hot-reloads instantly
- `electron/main.ts` or `electron/python-bridge.ts` changes: stop and restart the dev session
- `electron/preload.ts` changes: `vite-plugin-electron` reloads the renderer automatically
- Python changes: stop and restart the dev session (the Python subprocess is spawned once on startup)

## Code Quality Gates

Before committing:

```bash
npm run lint        # ESLint (zero warnings)
npm run typecheck   # TypeScript strict check (zero errors)
```

Both must pass clean. The project uses strict TypeScript (`"strict": true`) and ESLint with max-warnings 0. A warning counts as a failure.

## Commit Style

Use conventional commits:

```
feat: add Apple Music detection on macOS
fix: resolve null pointer in Megalobiz scraper
docs: update INSTALLATION.md with libfuse2 note
refactor: extract lyrics source cycling to separate function
chore: pin Python requirements.txt versions
```

Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `perf`

## Adding a Feature

1. Make sure the behavior is defined before writing code. If it's more than a small change, sketch out what it does and how it fits into the existing architecture.
2. Start with the Python side if the feature needs backend support. Test it in isolation first (run `python main.py` directly and send test RPC calls).
3. Add the IPC channel: Python handler -> `main.ts` `ipcMain.handle` -> `preload.ts` API method.
4. Build the UI last. Hooks first, then components.
5. Test the full flow end-to-end with a real media player.

## Fixing a Bug

1. Reproduce the bug locally.
2. Find the source. Open DevTools (`Ctrl+Shift+I`) to check renderer errors. Check the terminal running the dev server for Python stderr output.
3. Fix the root cause, not just the symptom.
4. Verify the fix manually before committing.
5. Document it in `CHANGELOG.md`.

## Making a Release

1. Bump version in `package.json`
2. Write a `CHANGELOG.md` entry
3. Build: `bash build-linux.sh` (or `npm run build:mac`, `npm run build:win`)
4. Test the packaged binary (not just the dev build)
5. Tag the commit: `git tag v1.0.1 && git push origin v1.0.1`
6. Create a GitHub Release and upload the built artifacts

## File Organization Rules

- One component per file
- Hooks in `src/hooks/`, one hook per file
- Zustand stores in `src/store/`, one slice per file
- Python handlers registered in `python/main.py`, implementation logic in `python/backend.py` or `python/services.py`
- No files over ~400 lines. If a file is getting long, split it.

## No-Op Changes to Avoid

- Don't add unused imports (ESLint catches these)
- Don't leave `console.log` calls in committed code (ESLint rule)
- Don't hardcode hex colors in components. Use CSS custom properties (`var(--accent-teal)`) or theme tokens from `src/styles/theme.ts`
- Don't add `any` types. Use proper TypeScript types or `unknown` with type guards.

## Debugging Tips

**Renderer issues:** Open DevTools with `Ctrl+Shift+I` and check Console.

**IPC issues:** Add `console.log` in the `ipcMain.handle` block in `electron/main.ts` to see what parameters arrive.

**Python issues:** Python `print()` statements go to the terminal running the dev session (they show up as "Python stderr: ..."). You can also run `python main.py` directly and send RPC requests by hand.

**Sync issues:** Add `console.log(elapsedTime, currentLineIndex)` in `useSyncedLyrics` to trace the timing loop.
