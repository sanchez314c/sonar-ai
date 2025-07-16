# SonarAI Forensic Code Audit Report

**Date**: 2026-03-28
**Auditor**: Master Control
**Scope**: Security, Performance, Error Handling, Accessibility, Code Quality
**Status**: AUTO-FIXED (all fixable findings resolved)

---

## Backup

Pre-fix backup: `archive/20260328_122239-pre-audit-fixes.zip`

---

## Phase 1: Security Audit

### SEC-01 — CRITICAL (FIXED): lyricsUrl rendered as bare `<a href>` in renderer

**Files**: `src/components/Layout/MainContent.tsx`, `src/components/Layout/Sidebar.tsx`

**Problem**: The `lyricsUrl` value returned by the Python backend (which can be `file:///~/.SonarAI/lyrics/...` for locally saved lyrics) was rendered directly as an `href` attribute on anchor tags in the Electron renderer. In Electron, clicking such a link could navigate the renderer to a local file path, bypassing the `open-external` IPC handler that validates URLs. This is an arbitrary local file read/navigation vector.

**Fix**: Converted both `<a href={lyricsUrl}>` elements to `<button onClick={() => window.sonarAPI.openExternal(lyricsUrl)}>`. All external navigation now routes through the validated `open-external` IPC handler.

---

### SEC-02 — HIGH (FIXED): open-external IPC handler blocked file:// for local lyrics

**File**: `electron/main.ts`

**Problem**: The `open-external` handler only allowed `http:`, `https:`, and `mailto:` — silently blocking clicks on local lyrics files (returning `{success: false}` with no user feedback). With SEC-01 fixed (buttons routing through this handler), local file:// URLs also need handling.

**Fix**: Added a `file:` branch that resolves the path and allows opening only files within the user's home directory via `shell.openPath()`. Absolute paths outside home are rejected.

---

### SEC-03 — HIGH (FIXED): Python scrapers follow externally-supplied hrefs without protocol validation (SSRF)

**File**: `python/services.py`

**Problem**: Multiple lyrics scrapers followed `href` values extracted from parsed HTML (from untrusted external websites) without validating the URL protocol. A malicious lyrics site could inject `href="file:///etc/passwd"` or `href="http://169.254.169.254/..."` into a scraped page, causing the backend to make arbitrary requests.

**Affected scrapers**: `_rclyricsband` (title_link href and lrc_download_button href), `_lyricsify` (iframe src), `_megalobiz` (result_link href), `_versuri` (scraped hrefs), `_tanzmusikonline` (song_urls from pagination).

**Fix**: Added `_is_safe_url()` helper that validates protocol is `http` or `https` and a netloc is present. Applied at every point where a scraped URL is followed. For scrapers that construct URLs via concatenation with a known base, added check that scraped href is not absolute (preventing host override).

---

### SEC-04 — HIGH (FIXED): Pagination loop upper bound controllable by scraped data

**File**: `python/services.py` (`_tanzmusikonline`)

**Problem**: The `highest_page` variable was read from a scraped pagination element with no upper bound. A malicious server response could set pagination to 999999 and cause an effectively infinite loop of HTTP requests.

**Fix**: Capped `highest_page` at `min(int(page_number) + 1, 11)` — maximum 10 pages.

---

### SEC-05 — MEDIUM (FIXED): Songmeanings search URL not URL-encoded

**File**: `python/services.py` (`_songmeanings`)

**Problem**: Search URL built with raw space: `"...?q=%s %s" % (song.artist, song.name)`. Unencoded spaces and special chars (`&`, `=`, `#`) in artist/title could cause broken requests.

**Fix**: Replaced with `parse.urlencode({"q": ...})` consistent with other scrapers in the file.

---

### SEC-06 — INFO (NOTED): sandbox: false in BrowserWindow

**File**: `electron/main.ts`

The code already documents this: `sandbox: false` is required because `vite-plugin-electron-renderer` uses a `require()` polyfill that breaks in sandboxed preloads. Mitigations in place (`nodeIntegration: false`, `contextIsolation: true`, `webSecurity: true`, `allowRunningInsecureContent: false`) provide defense-in-depth. Acceptable until the Vite plugin is upgraded.

---

### SEC-07 — HIGH (FIXED): Electron ASAR Integrity Bypass

**Package**: `electron@28.2.0` — GHSA-vmqv-hx8q-j7mg

**Fix**: Updated `electron` to `^35` via `npm install electron@35 --save-dev`. TypeScript compiles clean against new version.

---

### SEC-08 — INFO (TRACKED): Remaining dev-only npm vulnerabilities

**Count**: 17 vulnerabilities (4 low, 2 moderate, 11 high) — all devDependencies only.

| Package | Vuln | Risk | Notes |
|---|---|---|---|
| `electron-builder` | `@tootallnate/once`, `tar` | Build-time only | Requires electron-builder@26 (breaking) |
| `esbuild` / `vite` | Dev server CORS bypass | Dev-mode only | Only active during `npm run dev`. Requires vite@8 (breaking) |
| `minimatch` | ReDoS | Build-time only | Used by eslint/typescript-eslint |
| `tar` | Path traversal | Build-time only | Used by electron-builder during packaging |

None of these are exploitable in the packaged production app. Recommend addressing in a dedicated dependency upgrade sprint.

---

### SEC-09 — INFO: No hardcoded secrets found. Clean.

---

## Phase 2: Performance Audit

### PERF-01 — MEDIUM (FIXED): useSettings keyboard listener re-registered on every settings change

**File**: `src/hooks/useSettings.ts`

**Problem**: `useEffect` for keyboard shortcuts had `[settings]` as dependency — the entire Zustand store object. This caused listener removal/re-add on every polling cycle and settings update.

**Fix**: Extracted the three stable action references (`increaseFontSize`, `decreaseFontSize`, `setFontSize`) as explicit deps. Zustand actions are stable references — listener now registers once and stays.

---

### PERF-02 — LOW (FIXED): Animation frame not cancelled before restart in useSyncedLyrics

**File**: `src/hooks/useSyncedLyrics.ts`

**Problem**: `startPlayback()` did not cancel any existing animation frame before starting a new one. Rapid lyrics source switches could leave multiple concurrent animation loops running.

**Fix**: Added `cancelAnimationFrame(animationFrameRef.current)` at the start of `startPlayback` if a frame is already queued.

---

### PERF-03 — INFO (NOTED): Large unsynced lyrics animate with per-item delay

The unsynced lyrics render each line with `transition={{ delay: index * 0.02 }}`. For 200+ line songs the last line waits 4+ seconds. This is an aesthetic choice. Not changed.

---

## Phase 3: Error Handling Audit

### ERR-01 — HIGH (FIXED): No React error boundary

**Files**: `src/main.tsx`, NEW `src/components/ErrorBoundary.tsx`

**Problem**: Any uncaught render error produced a blank white screen with no recovery path.

**Fix**: Created `ErrorBoundary.tsx` — class component with `getDerivedStateFromError` and `componentDidCatch`. Displays recovery UI with "Try again" button. Wrapped root `<App>` in `<ErrorBoundary>` in `main.tsx`.

---

### ERR-02 — INFO: Python backend error handling is correct. Clean.

The `ipc_server.py` catches all handler exceptions, logs full tracebacks to stderr (not to the client), and returns a JSON-RPC error with only the message. Traceback intentionally omitted from client response. Clean.

---

### ERR-03 — INFO (NOTED): Python `song.year = int(text)` unguarded type coercion

**File**: `python/services.py` (`_tanzmusikonline`)

Non-numeric text in scraped year field raises `ValueError`. Mitigated by the outer `try/except` that calls `capture_exception`. Not changed.

---

## Phase 4: Accessibility Audit

### A11Y-01 — MEDIUM (FIXED): Settings modal missing ARIA dialog role and focus management

**File**: `src/components/Settings/SettingsModal.tsx`

**Problem**: No `role="dialog"`, no `aria-modal`, no focus movement on open, no focus restoration on close.

**Fix**: Added `role="dialog"`, `aria-modal="true"`, `aria-label="Settings"` to the modal. Added `useEffect` for focus management: saves `document.activeElement`, moves focus to first focusable element inside modal on open, restores focus on close.

---

### A11Y-02 — MEDIUM (FIXED): Synced lyric lines not keyboard-accessible

**File**: `src/components/Lyrics/SyncedLine.tsx`

**Problem**: Clickable `<motion.div>` lyrics lines not reachable via keyboard (no tabIndex, no role, no keydown handler).

**Fix**: Added `tabIndex={onClick ? 0 : undefined}`, `role={onClick ? 'button' : undefined}`, `aria-current={state === 'current' ? 'true' : undefined}`, and `onKeyDown` handler (Enter/Space activate `onClick`).

---

### A11Y-03 — LOW (FIXED): Sidebar settings button missing aria-label

**File**: `src/components/Layout/Sidebar.tsx`

**Problem**: SVG-only button with no accessible label.

**Fix**: Added `aria-label="Settings"`.

---

### A11Y-04 — LOW (FIXED): lyricsUrl links lacked accessible labels (see SEC-01)

The SEC-01 fix converted `<a>` elements to `<button>` with `aria-label={`Open lyrics source: ${lyricsUrl}`}`.

---

### A11Y-05 — INFO (NOTED): Color contrast is design-system responsibility

Neo-Noir dark theme uses CSS custom properties. Not changed.

---

## Phase 5: Code Quality (Noted Only — No Changes)

| ID | Issue | File |
|---|---|---|
| QC-01 | Sidebar.tsx is unused dead code (not imported anywhere) | Sidebar.tsx |
| QC-02 | Duplicate type definitions in preload.ts, vite-env.d.ts, and ipc.ts | Multiple |
| QC-03 | TODO comments in Tidal/VLC macOS applescript methods | python/backend.py |
| QC-04 | `dances = []` class-level mutable default (Python anti-pattern) | python/backend.py |

---

## Summary

| Severity | Count | Fixed | Tracked/Noted |
|---|---|---|---|
| CRITICAL | 1 | 1 | 0 |
| HIGH | 5 | 5 | 0 |
| MEDIUM | 3 | 3 | 0 |
| LOW | 3 | 3 | 0 |
| INFO | 12 | 0 | 12 |

**Total Fixed**: 12 findings across security, performance, error handling, and accessibility.

---

## Files Modified

| File | Change |
|---|---|
| `src/components/Layout/MainContent.tsx` | lyricsUrl link converted to button via openExternal; aria-label added |
| `src/components/Layout/Sidebar.tsx` | lyricsUrl link converted to button; settings button aria-label added |
| `src/components/Lyrics/SyncedLine.tsx` | Keyboard accessibility: tabIndex, role, onKeyDown, aria-current |
| `src/components/Settings/SettingsModal.tsx` | ARIA dialog role; focus management on open/close |
| `src/components/ErrorBoundary.tsx` | NEW — top-level React error boundary with recovery UI |
| `src/main.tsx` | Wrapped App in ErrorBoundary |
| `src/hooks/useSettings.ts` | Fixed keyboard listener deps to prevent re-registration on every state change |
| `src/hooks/useSyncedLyrics.ts` | Cancel existing RAF before starting new animation loop |
| `electron/main.ts` | open-external handler: allow file:// within home dir via shell.openPath |
| `python/services.py` | _is_safe_url helper; SSRF fixes on 5 scrapers; pagination cap at 10; URL encoding fix |
| `package.json` / `package-lock.json` | electron updated to ^35 (ASAR bypass fix) |
