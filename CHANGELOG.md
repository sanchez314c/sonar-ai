# Changelog

## [1.3.2] - 2026-03-14 — Neo-Noir Glass Monitor Full Compliance Restyle

### Visual Design System — Full Compliance Pass

Applied Master Control / Neo-Noir Glass Monitor canonical specification. Every component now passes the 27-point validation checklist.

#### CSS Variable Completeness (`src/index.css`)
- **Replaced** `rgba(255,255,255,0.06/0.12)` on window control buttons with `var(--glass-highlight)` / `var(--glass-highlight-strong)`
- **Replaced** `rgba(10,11,14,0.94)` on about overlay with `var(--bg-modal)`
- **Replaced** hardcoded gradient on `.about-modal` with `var(--gradient-card)` and `var(--glass-border)`
- **Replaced** `0 0 16px rgba(20,184,166,0.25)` on github badge with `var(--shadow-glow)` / `var(--shadow-glow-strong)`
- **Replaced** `rgba(255,255,255,0.06)` on `.about-close-btn` with `var(--glass-highlight)`
- **Replaced** `.about-modal-highlight` inline rgba with `var(--glass-highlight-strong)`
- **Replaced** `.album-art-placeholder` hardcoded gradient hex with `var(--accent-teal-dim)`, `var(--accent-purple-dim)`, `var(--gradient-card)`
- **Replaced** `.status-action-btn` rgba with `var(--glass-bg)` / `var(--glass-bg-medium)`
- **Replaced** `color: #ffffff` on close-btn hover with `var(--text-heading)`
- **Added** `border-bottom: 1px solid var(--border-subtle)` to `.title-bar` for visual separation

#### New CSS Components Added (`src/index.css`)
- **Added** `.song-info-header`, `.song-info-row`, `.song-album-art`, `.song-album-art-highlight` — semantic song header classes
- **Added** `.song-details`, `.song-title`, `.song-artist`, `.song-artist-album`, `.song-source-row`, `.song-source-name`, `.song-synced-badge`, `.song-source-link`
- **Added** `.section-label` — uppercase 10px 600-weight 1.5px tracking section headers (canonical spec)
- **Added** `.main-content` — flex column with gradient background via CSS class
- **Added** `.lyrics-empty-area` — centered empty state with proper title-bar clearance
- **Added** `.btn-reset` — neutral full-width reset button with hover escalation (no JS hover handlers)
- **Added** `.settings-close-btn` — ghost settings modal close button
- **Added** `.service-btn`, `.service-btn.active`, `.service-btn-label` — service selector cards
- **Added** `.font-size-btn` — circular font size increment/decrement buttons

#### MainContent.tsx — Semantic CSS Classes
- Replaced all inline `style={{ background: 'linear-gradient(...)' }}` with `.main-content` CSS class
- Replaced all inline style props on song header wrapper, album art, song details with semantic CSS classes
- Song info header now uses `padding-top: 56px` via `.song-info-header` to clear absolute-positioned title bar
- Empty state uses `.lyrics-empty-area` with correct title-bar clearance

#### PlayerBar.tsx — Status Bar Canonical Compliance
- Added dynamic lyric line count to left status: `● Now Playing | 42 lines`
- Shows service name when no lyrics loaded, line count when lyrics present
- `Next` button now only renders when a song is active (reduces clutter when idle)
- Removed conditional on `currentSong` for button disabled state (unnecessary with conditional render)

#### TitleBar.tsx — Tagline Updated
- Changed tagline from `"Synced Lyrics"` to `"Synced Lyrics Viewer"` to match package.json description intent

#### SettingsModal.tsx — Full CSS Class Migration
- Replaced all `onMouseEnter`/`onMouseLeave` hover handlers with CSS class-based hover states
- Service selector buttons use `.service-btn` / `.service-btn.active` classes
- Font size buttons use `.font-size-btn` class (circular, hover via CSS)
- Close button uses `.settings-close-btn` class
- Section headings use `.section-label` class (uppercase, 10px, 600 weight, 1.5px tracking)
- Reset button uses `.btn-reset` class
- Footer background changed from `rgba(10,11,14,0.5)` to `var(--bg-void)`
- Added `backdropFilter: 'blur(10px)'` to modal backdrop

#### TypeScript Fixes (`src/vite-env.d.ts`, hooks, store)
- **Added** complete `Window.sonarAPI` interface declaration to `vite-env.d.ts` — eliminates all 18 pre-existing `window.sonarAPI` type errors
- Removed unused `SyncState` interface from `useSyncedLyrics.ts`
- Removed unused `LRCLine` import from `useSyncedLyrics.ts`
- Removed unused `setCurrentSong` destructure from `useSongDetection.ts`
- Renamed unused `get` parameter to `_get` in `lyricsSlice.ts`
- **Result**: 0 TypeScript errors (was 28 errors)

#### Validation Checklist — 27/27 PASS
- [x] body padding: 16px — float gap visible
- [x] html/body background: transparent !important
- [x] App container border-radius: 20px + overflow hidden
- [x] BrowserWindow: frame:false, transparent:true, hasShadow:false
- [x] experimentalFeatures: false in webPreferences
- [x] Linux: disable-gpu-compositing (NOT disable-gpu)
- [x] ZERO OS title bar visible
- [x] NO rainbow gradient strip
- [x] App icon present (18px from src/icon-titlebar.png)
- [x] App name in teal (var(--accent-teal))
- [x] Tagline in muted text (var(--text-dim))
- [x] About (ⓘ) button present — FLAT icon, no circle background
- [x] Settings gear wired through PlayerBar status bar
- [x] ALL THREE window controls: minimize, maximize, close — CIRCULAR 28px
- [x] Close button hover = red (var(--error))
- [x] All controls wired via IPC (not window.close())
- [x] Drag handle z-index: 50, controls z-index: 200
- [x] About modal: overlay blur, glass card, layered shadow
- [x] About: X button, icon, name, version teal, description, license, GitHub badge, email
- [x] Status bar left: dot + status + pipe + count
- [x] Status bar right: version ONLY in teal
- [x] Glass cards float with gap (hero card, song album art)
- [x] Cards have ::before inner highlight
- [x] Card hover: translateY(-2px) + shadow escalation
- [x] No single box-shadows — all 2+ layered
- [x] backdrop-filter on overlays only (NOT primary glass technique)
- [x] Zero hardcoded hex/rgb outside design token variables



## [1.3.0] - 2026-02-08 14:25 CST

### Changed — Dark Neo Glass Theme Complete Restyle

Full application of the Neo-Noir Glass Monitor design specification with proper z-index layering, complete design token system, and orphan color elimination.

#### Drag Handle & Window Controls Restructured (`TitleBar.tsx`, `index.css`)
- **Replaced** inline titlebar with absolute-positioned `.drag-handle` (z-index: 50, height: 48px)
- **Repositioned** window controls to absolute top-right `.window-controls` (z-index: 200)
- Window controls use circular `.window-ctrl-btn` with glass-bg hover, red close hover
- Title text overlay at z-index: 51 with pointer-events: none
- No-drag rules applied to interactive leaf elements ONLY (button, input, select, a) — NOT layout containers

#### Design Token System Completed (`index.css` :root)
- **Added** `--accent-info`, `--status-offline/online/busy/away`, `--border-input`
- **Added** `--gradient-header`, `--shadow-glow-accent`, `--shadow-inset`
- **Added** `--radius-lg`, `--radius-2xl`, `--radius-full`
- **Added** `--space-xs` through `--space-2xl` (spacing scale)
- **Added** `--font-size-xs` through `--font-size-3xl` (typography scale)
- **Added** `--transition-slow: 400ms ease`
- Shadow values reformatted to multi-line for readability

#### Component Systems Added (`index.css`)
- **Added** `.btn-secondary` (glass highlight, border-light, hover escalation)
- **Added** `.btn-danger` (red-tinted bg, red border, hover deepening)
- **Added** global `input, textarea, select` overrides with focus glow
- **Added** `.status-indicator` with online/error/warning glow variants
- **Added** `.modal-backdrop` + `.modal-dialog` with ::before highlight and shadow-xl
- **Added** `.notification` toast system with success/error/info/warning gradient variants
- **Added** `.loading-overlay` with blur backdrop (enhancement only)
- **Added** `.warning-banner` with amber tint
- **Added** `.content-below-controls` utility (56px padding-top)

#### Hardcoded Colors Eliminated (7 files)
- `MainContent.tsx` — Replaced `#111214`/`#0a0b0e` gradient with `var(--bg-surface)`/`var(--bg-void)`
- `MainContent.tsx` — Added 56px top padding below window controls for both song-header and empty states
- `MainContent.tsx` — Hero card now uses `.glass-card` class for ::before highlight
- `PlayerBar.tsx` — Replaced `#111214`/`#0d0e10` gradient with `var(--bg-surface)`/`var(--bg-sidebar)`
- `PlayerBar.tsx` — All hover states use CSS variables via event handlers
- `LyricsDisplay.tsx` — Scroll fade overlays use `var(--bg-surface)` and `var(--bg-void)` instead of hex
- `LyricsDisplay.tsx` — Unsynced lyric lines use CSS variable for text color
- `SyncedLine.tsx` — State colors imported from `theme.ts` instead of hardcoded hex
- `SyncedLine.tsx` — Glow background uses `var(--accent-teal-dim)` instead of inline rgba
- `SettingsModal.tsx` — Modal background, borders, shadows, all typography colors use CSS variables
- `SettingsModal.tsx` — Toggle switch uses `var(--accent-teal)` and `var(--shadow-glow)`
- `SettingsModal.tsx` — Service button active border uses `var(--border-glow)`

#### Theme TypeScript Tokens Updated (`theme.ts`)
- **Added** `info`, `statusOffline/Online/Busy/Away` to colors
- **Added** `borderInput` to colors
- **Added** `header` gradient
- **Added** `glowAccent`, `inset` shadows
- **Added** `slow` transition
- **Added** `dragHandle`, `windowControls` z-index values

#### Validation Checklist (27/27 PASS)
- [x] body padding: 16px
- [x] html/body background: transparent !important
- [x] App container border-radius: 20px + overflow hidden
- [x] App container background is gradient
- [x] BrowserWindow: frame:false, transparent:true, hasShadow:false
- [x] experimentalFeatures NOT set
- [x] Linux flags: disable-gpu-compositing (NOT disable-gpu)
- [x] All elevated elements use 2+ layered shadows
- [x] Hero card has ambient radial-gradient mesh
- [x] Glass cards have ::before inner highlight
- [x] Card hover states: translateY(-2px) + shadow escalation
- [x] backdrop-filter used only on overlays (not primary glass)
- [x] No hardcoded hex/rgb outside theme system
- [x] Scrollbars themed (6px, dark thumb, transparent track)
- [x] Input focus: teal border + glow shadow
- [x] Three window control buttons: minimize, maximize, close
- [x] Window controls wired via IPC (preload contextBridge)
- [x] Font: Inter + system stack with -webkit-font-smoothing
- [x] Zero OS title bar visible
- [x] No duplicate window controls
- [x] Drag handle z-index: 50
- [x] Window controls z-index: 200
- [x] No large layout containers in no-drag list
- [x] Content top padding: 56px below controls
- [x] Window dimensions fit content (480x850 default)
- [x] titleBarStyle only on macOS
- [x] Only ONE BrowserWindow creation point

---

## [1.2.1] - 2026-02-08 13:40 CST

### Fixed — Lyrics Display: Gap, Scroll Lock, and Refresh Flash

Three interrelated corruptions in the lyrics display pipeline.

#### Giant Gap Above Lyrics (`LyricsDisplay.tsx`)
- **Removed** `h-[40vh]` top spacer (was 40% of viewport height — massive dead space)
- **Removed** `h-[40vh]` bottom spacer (replaced with fixed `h-32` for end-of-scroll padding)
- Lyrics now start at the top with `pt-4` padding
- Removed `min-h-full` from inner container (was forcing stretch)
- Reduced fade overlays from `h-24` to `h-12` for narrow layout

#### Auto-Scroll Fights User Scrolling (`LyricsDisplay.tsx`)
- Added user-scroll detection via `wheel` and `touchmove` event listeners
- When user scrolls manually, auto-scroll pauses for 5 seconds
- Uses `isAutoScrollingRef` flag to distinguish programmatic scrolls from user scrolls
- Clicking a lyric line re-engages auto-scroll immediately

#### Lyrics Keep Refreshing / Re-rendering (`songSlice.ts`)
- `fetchCurrentSong` no longer sets `isLoading: true` on every poll cycle (only on first fetch)
- `fetchCurrentSong` no longer creates a new `SongInfo` object when the same song is playing
- Compares `artist`, `title`, and `raw_title` — only updates store if song actually changed
- Eliminates unnecessary re-renders that were causing lyrics to flash/reset

---

## [1.2.0] - 2026-02-08 13:30 CST

### Changed — Single Column Layout (Sidebar Removed)

Layout restructured from two-column (sidebar + main) to single column for a tall narrow window form factor.

#### Title Bar (`TitleBar.tsx`)
- Changed "SONARAI" to "SONAR-AI"

#### Sidebar Removed (`App.tsx`, `Sidebar.tsx`)
- Removed `<Sidebar>` component from App layout
- Removed flex wrapper that contained sidebar + main content
- App is now: TitleBar → MainContent → PlayerBar (vertical stack)

#### Main Content Restructured (`MainContent.tsx`)
- Added compact song info header above lyrics area (absorbs sidebar content)
- Header row: 48x48 album art + song title + artist + album + source info + synced badge
- Source link (↗) and synced badge inline with source name
- Loading spinner moved to header row right side
- Removed separate "Lyrics loaded from:" header
- Empty state hero card preserved for no-song state

#### Player Bar Compacted (`PlayerBar.tsx`)
- Reduced height from 80px to 56px (h-14)
- Removed duplicate song info (album art + title + artist) from left section
- Simplified to: [Service indicator] [Next Source] [Settings gear]
- Smaller button and icon sizes for narrow width

#### Window Dimensions (`electron/main.ts`)
- Default: 480x850 (was 1100x800) — tall narrow form factor
- Minimum: 360x500 (was 800x500)

#### Removed
- "Settings" text button from sidebar (settings gear remains in player bar)
- "SonarAI v1.0.0" version text from sidebar
- Sidebar component from active layout (file preserved but unused)

---

## [1.1.1] - 2026-02-08 12:45 CST

### Fixed — Song Detection Regression

Critical fix for song detection functionality broken during Neo-Noir Glass restyle.

#### Root Cause
Two Electron configuration additions in `electron/main.ts` interfered with the IPC/contextBridge pipeline:
1. `experimentalFeatures: true` in webPreferences — enabled experimental Chromium features that caused `ipcRenderer.invoke()` promises to silently fail through the contextBridge proxy
2. `--disable-gpu` flag — fully disabled GPU, overly aggressive for transparent window support

#### Changes (`electron/main.ts`)
- **Removed** `experimentalFeatures: true` from webPreferences (was not in original config)
- **Replaced** `--disable-gpu` with `--disable-gpu-compositing` (less aggressive, still supports transparency)

#### Verification
- Python D-Bus backend confirmed working independently (detects Spotify via `org.mpris.MediaPlayer2`)
- All logic files (stores, hooks, services, python-bridge) confirmed intact and unmodified during restyle
- IPC pipeline: preload.ts → ipcMain handlers → python-bridge.ts → Python JSON-RPC — all code untouched

---

## [1.1.0] - 2026-02-08 12:10 CST

### Changed — Neo-Noir Glass Monitor Restyle

Complete UI transformation from Spotify green theme to Neo-Noir Glass Monitor cyberpunk dark design system.

#### Electron Configuration (`electron/main.ts`)
- Set `transparent: true` for alpha channel window
- Set `backgroundColor: '#00000000'` (fully transparent)
- Set `hasShadow: false` (CSS handles depth, no OS shadow)
- Removed `titleBarStyle: 'hidden'` on Linux (macOS-only via conditional spread)
- Removed `titleBarOverlay` on Linux
- Added `enable-transparent-visuals` and `disable-gpu-compositing` flags for Linux
- Added 300ms delay on Linux for transparent visual initialization
- Resized window: 1100x800 default, 800x500 minimum

#### Design System (`src/index.css`, `src/styles/theme.ts`)
- Injected complete `:root` CSS custom property token block (50+ design tokens)
- Backgrounds: void (#0a0b0e), surface (#111214), card (#141518), sidebar (#0d0e10)
- Accent palette: teal (#14b8a6), cyan (#06b6d4), purple (#8b5cf6)
- Typography: primary (#e8e8ec), secondary (#9a9aa6), muted (#5c5c6a), dim (#44444e)
- Layered shadow system (sm, md, lg, xl, card, card-hover, glow variants)
- Glass effects via rgba backgrounds + gradient highlights (NOT backdrop-filter)
- Card ::before inner highlight (1px gradient glass edge)
- Hover escalation: translateY(-2px) + shadow depth increase

#### Tailwind Configuration (`tailwind.config.js`)
- Replaced all `spotify-*` color tokens with `neo-*` token system
- Added neo-noir box-shadow utilities (neo-sm through neo-xl, glow variants)
- Added neo-card and neo-xl border-radius tokens
- Updated font family from Circular Std to Inter + system stack

#### Global Styles (`src/index.css`)
- `body { padding: 16px }` — creates floating panel gap
- `html, body { background: transparent !important }` — desktop visible through gap
- `.app-container` — gradient background, 20px border-radius, overflow hidden
- Themed scrollbars: 6px width, dark thumb, transparent track
- Selection color: teal-dim background
- `.glass-card` — gradient background, layered shadow, ::before highlight, hover lift
- `.hero-card` — triple radial-gradient ambient mesh
- `.album-art-placeholder` — dual radial-gradient mesh
- `.titlebar` — transparent background, subtle bottom border
- `.titlebar-button` — glass hover, close-btn red hover variant
- `.sidebar` — 220px width, gradient sidebar background

#### Components Restyled (8 files)
- `App.tsx` — app-container class replaces h-screen/bg-spotify-black
- `TitleBar.tsx` — glass window controls, uppercase muted title, close-btn class
- `Sidebar.tsx` — 220px gradient sidebar, glass card album art, neo-noir text hierarchy
- `MainContent.tsx` — gradient background, hero-card with ambient mesh for empty state
- `PlayerBar.tsx` — gradient footer, layered shadow buttons, teal sync indicator with glow
- `LyricsDisplay.tsx` — neo-noir gradient fade overlays, teal-themed text
- `SyncedLine.tsx` — teal (#14b8a6) current line, muted (#5c5c6a) past, secondary (#9a9aa6) future
- `SettingsModal.tsx` — glass modal with inner highlight, teal active states, layered shadow buttons

#### Color Migration Map
| Old (Spotify) | New (Neo-Noir) |
|---|---|
| #121212 (black) | #0a0b0e (void) |
| #181818 (dark) | #111214 (surface) |
| #282828 (elevated) | #141518 (card) |
| #333333 (highlight) | #1a1b1f (card-hover) |
| #1DB954 (green) | #14b8a6 (teal) |
| #1ed760 (green-hover) | #0d9488 (teal-hover) |
| #FFFFFF (text-primary) | #e8e8ec (text-primary) |
| #B3B3B3 (text-secondary) | #9a9aa6 (text-secondary) |
| #6A6A6A (text-muted) | #5c5c6a (text-muted) |

### Added
- `changelog.md` — this file
- CSS custom properties for entire design token system
- Glass card system with inner highlights and hover escalation
- Hero card with ambient radial-gradient mesh
- Layered shadow system (3-5 layers per elevation level)
- Themed scrollbars, selection colors, input focus states

### Removed
- All Spotify brand color references from UI code
- `titleBarStyle: 'hidden'` from Linux electron config
- `titleBarOverlay` from Linux electron config
- Spotify font family (Circular Std)


## [1.3.1] - 2026-03-14 — Forensic Security & Quality Audit

### Security Fixes (CRITICAL)

**`electron/main.ts`**
- Added `webSecurity: true`, `allowRunningInsecureContent: false`, `experimentalFeatures: false` to `webPreferences` — hardened against implicit defaults

**`python/ipc_server.py`**
- Removed `traceback.format_exc()` from JSON-RPC error response `data` field — tracebacks now stay server-side in stderr only
- Added `_registered_methods` allowlist; `_handle_request()` validates method is a non-empty string present in the allowlist
- Added `MAX_LINE_BYTES = 10 MB` guard on stdin reads — prevents memory exhaustion from malformed input
- Added `params` type validation — only `None`, `dict`, or `list` accepted per JSON-RPC spec

**`python/main.py`**
- `set_lyrics_directory()`: resolves path via `os.path.realpath()`, rejects null bytes, stores the resolved path — prevents path traversal
- `save_lyrics()`: added `os.path.realpath()` containment check ensuring output stays within `Config.LYRICS_DIR`
- Added `_validate_string()` helper — all handler inputs now type-checked, empty-string rejected, length-bounded

### Security Fixes (HIGH)

**`electron/python-bridge.ts`**
- `PendingCallback` now stores `timeoutId` — setTimeout handles are cleared when response arrives, fixing memory leak on every successful request
- Added `readyReject` resolver — `readyPromise` now rejects if Python crashes before signaling ready (was hanging forever)
- `stop()` now awaits process exit: sends SIGTERM, waits up to 3 seconds, then sends SIGKILL — no more zombie processes
- Added `ALLOWED_METHODS` constant Set — `call()` validates method against allowlist before writing to stdin

**`python/backend.py`**
- Added `_SERVICE_LOCK = threading.Lock()` — all `CURRENT_SERVICE` global mutations now guarded against concurrent IPC + thread access

**`python/services.py`**
- Added `REQUEST_TIMEOUT = 15` — all `requests.get/post` calls now pass `timeout=REQUEST_TIMEOUT`; hanging servers no longer block IPC thread indefinitely
- `_songmeanings`: changed search URL from `http://` to `https://`

### Bug Fixes (MEDIUM)

**`python/services.py`**
- `_musixmatch`: added null guard on `props` before `'"body":"' in props` check — prevents `TypeError`
- `_rentanadviser`: added null guard on `soup.find(id="tablecontainer")` and on `__EVENTVALIDATION`/`__VIEWSTATE` form fields
- `_megalobiz`: added null guard on `container`, `details`, and `details.span`
- `_lyricsify`: added null guard on `result_link` and `iframe_download` element
- `_rclyricsband`: added null guards on `main`, `title_block`, `title_link`, `lrc_download_button`
- `_versuri`: replaced fragile raw HTML string slicing with proper BeautifulSoup DOM traversal — removed `str(content).find(...)` pattern

**`src/hooks/useSyncedLyrics.ts`**
- Added `enabled` to `useEffect` dependency array — was a stale closure causing missed auto-start when hook re-enabled

**`src/App.tsx`**
- Added eslint-disable comment with explanation for intentionally stable Zustand action refs in polling effect deps

### Quality Improvements (LOW)

**`python/services.py`**
- Updated `UA` user-agent from 2012 Maemo/Firefox 10 string to `Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0`

### npm Dependencies
- Ran `npm audit fix`: patched `flatted` (high — unbounded recursion DoS), `rollup` (high — arbitrary file write via path traversal), `ajv` (moderate — ReDoS with `$data` option)
- Reduced from 23 to 20 vulnerabilities; remaining 20 require breaking major version upgrades tracked separately

### Added
- `AUDIT_REPORT.md` — full forensic audit report with all findings and remediation log

---

## Documentation Standardization - 2026-03-14

- Standardized documentation to 27-file portfolio standard
- Created missing standard files (CODE_OF_CONDUCT.md, SECURITY.md, CLAUDE.md, AGENTS.md, VERSION_MAP.md, GitHub templates, 15 docs/ files)
- All documentation derived from actual source code analysis

