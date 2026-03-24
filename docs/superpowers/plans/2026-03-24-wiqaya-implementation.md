# Wiqaya Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that monitors time on distracting sites and overlays a beautiful Quran verse gate.

**Architecture:** Manifest V3 Chrome Extension with React content script overlay (Shadow DOM), background service worker for time tracking + API calls, and a React popup for settings/dashboard. Content API (client_credentials) for verses, User API (OAuth2 PKCE) for bookmarks/streaks.

**Tech Stack:** Vite 6 + @crxjs/vite-plugin 2.4 + React 18 + TypeScript + Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-03-24-wiqaya-design.md`

---

## File Structure

```
wiqaya/
├── .env                            # QF_CLIENT_ID, QF_CLIENT_SECRET (not committed)
├── .env.example                    # Template
├── .gitignore
├── manifest.json                   # Chrome Manifest V3
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── tailwind.config.ts              # Minimal (Tailwind v4 CSS-first, but need custom fonts)
├── public/
│   ├── callback.html               # OAuth2 redirect handler
│   └── icons/
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
├── src/
│   ├── shared/
│   │   ├── types.ts                # All shared TypeScript types
│   │   ├── constants.ts            # API URLs, defaults, mushaf IDs
│   │   ├── storage.ts              # chrome.storage.local typed helpers
│   │   └── messaging.ts            # Message types and helpers
│   ├── background/
│   │   ├── index.ts                # Service worker entry: wires up listeners
│   │   ├── tracker.ts              # Time tracking: tab monitoring, threshold detection
│   │   ├── api.ts                  # Content API: client_credentials token, verse fetch
│   │   └── auth.ts                 # OAuth2 PKCE flow, token refresh, user API calls
│   ├── content/
│   │   ├── index.tsx               # Content script: listens for trigger, injects overlay
│   │   └── overlay.css             # Tailwind entry for shadow DOM (@import 'tailwindcss')
│   ├── overlay/
│   │   ├── App.tsx                 # Overlay root: manages state, engagement tracking
│   │   ├── AyahCard.tsx            # Arabic text + translation reveal + reference
│   │   └── AudioPlayer.tsx         # Play/pause recitation audio
│   └── popup/
│       ├── index.html              # Popup HTML entry
│       ├── main.tsx                # React entry
│       ├── App.tsx                 # Popup root with tab navigation
│       ├── Dashboard.tsx           # Stats: time per site, verses read, streak
│       ├── Sites.tsx               # Watch list CRUD, per-site time limits
│       ├── Saved.tsx               # Bookmarked verses (requires auth)
│       ├── Settings.tsx            # Translation, audio, auth login/logout
│       └── popup.css               # Tailwind entry for popup
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `manifest.json`, `.env.example`, `src/popup/index.html`, `src/popup/main.tsx`, `src/popup/popup.css`, `src/popup/App.tsx`, `public/icons/` (placeholder SVGs)

- [ ] **Step 1: Initialize npm project and install dependencies**

```bash
cd /home/kudaliar/wiqaya
npm init -y
npm install react@18 react-dom@18
npm install -D vite@^6 @vitejs/plugin-react @crxjs/vite-plugin tailwindcss @tailwindcss/vite typescript @types/react @types/react-dom @types/chrome
```

Set `"type": "module"` in package.json. Add scripts: `"dev": "vite"`, `"build": "vite build"`.

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
  ],
})
```

- [ ] **Step 3: Create tsconfig.json and tsconfig.node.json**

tsconfig.json:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

tsconfig.node.json:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true
  },
  "include": ["vite.config.ts", "manifest.json"]
}
```

- [ ] **Step 4: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Wiqaya — وقاية",
  "version": "1.0.0",
  "description": "Your screen time, redeemed. A Quran verse gate for mindful browsing.",
  "permissions": ["activeTab", "tabs", "storage", "idle", "alarms"],
  "host_permissions": [
    "https://apis.quran.foundation/*",
    "https://apis-prelive.quran.foundation/*",
    "https://oauth2.quran.foundation/*",
    "https://prelive-oauth2.quran.foundation/*"
  ],
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/index.tsx"]
    }
  ],
  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": {
      "16": "public/icons/icon-16.png",
      "48": "public/icons/icon-48.png",
      "128": "public/icons/icon-128.png"
    }
  },
  "icons": {
    "16": "public/icons/icon-16.png",
    "48": "public/icons/icon-48.png",
    "128": "public/icons/icon-128.png"
  }
}
```

- [ ] **Step 5: Create .env.example and .env**

.env.example:
```
VITE_QF_CLIENT_ID=your_client_id
VITE_QF_CLIENT_SECRET=your_client_secret
VITE_QF_ENV=prelive
```

Copy to `.env` with real values from `apikey` file (prelive by default).

- [ ] **Step 6: Create popup entry files**

`src/popup/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Wiqaya</title></head>
<body><div id="root"></div><script type="module" src="./main.tsx"></script></body>
</html>
```

`src/popup/main.tsx`:
```tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './popup.css'
createRoot(document.getElementById('root')!).render(<App />)
```

`src/popup/popup.css`:
```css
@import 'tailwindcss';
```

`src/popup/App.tsx` — minimal placeholder.

- [ ] **Step 7: Create placeholder icons**

Generate simple SVG-based PNG icons (16x16, 48x48, 128x128) with a shield/Wiqaya motif.

- [ ] **Step 8: Create minimal background and content script stubs**

`src/background/index.ts`: `console.log('Wiqaya background service worker loaded')`
`src/content/index.tsx`: `console.log('Wiqaya content script loaded')`

- [ ] **Step 9: Verify build works**

```bash
npm run dev
npm run build
```

Verify `dist/` output is loadable in `chrome://extensions` (developer mode).

- [ ] **Step 10: Initialize git and commit**

```bash
git init
git add -A
git commit -m "feat: initial project scaffolding with Vite + CRXJS + React + Tailwind"
```

---

## Task 2: Shared Types, Constants, and Storage Helpers

**Files:**
- Create: `src/shared/types.ts`, `src/shared/constants.ts`, `src/shared/storage.ts`, `src/shared/messaging.ts`

- [ ] **Step 1: Create types.ts**

```typescript
// Site tracking
export interface TrackedSite {
  domain: string
  timeLimitMinutes: number // default 15
}

export interface SiteTimeEntry {
  domain: string
  timeSpentMs: number
  date: string // YYYY-MM-DD
}

// Overlay verse data
export interface VerseData {
  verseKey: string // e.g. "2:255"
  chapterNumber: number
  verseNumber: number
  textUthmani: string
  translationText: string
  translationName: string
  chapterNameArabic: string
  chapterNameSimple: string
  audioUrl: string | null
}

// Storage schema
export interface WiqayaStorage {
  trackedSites: TrackedSite[]
  globalTimeLimitMinutes: number
  siteTimeEntries: Record<string, SiteTimeEntry> // keyed by domain
  versesReadToday: number
  totalVersesRead: number
  translationId: number
  recitationId: number
  autoPlayAudio: boolean
  // Auth
  accessToken: string | null
  refreshToken: string | null
  tokenExpiresAt: number | null
  // Content API token (client_credentials)
  contentAccessToken: string | null
  contentTokenExpiresAt: number | null
}

// Bookmarks
export interface Bookmark {
  id: string
  createdAt: string
  type: string
  key: number
  verseNumber?: number
}

// Messages between background and content script
export type WiqayaMessage =
  | { type: 'TRIGGER_OVERLAY' }
  | { type: 'DISMISS_OVERLAY' }
  | { type: 'GET_VERSE'; }
  | { type: 'VERSE_DATA'; data: VerseData }
  | { type: 'BOOKMARK_VERSE'; verseKey: string; chapterNumber: number; verseNumber: number }
  | { type: 'BOOKMARK_RESULT'; success: boolean }
  | { type: 'LOG_SESSION'; chapterNumber: number; verseNumber: number }
  | { type: 'GET_AUTH_STATUS' }
  | { type: 'AUTH_STATUS'; isLoggedIn: boolean }
  | { type: 'START_LOGIN' }
  | { type: 'LOGOUT' }
```

- [ ] **Step 2: Create constants.ts**

```typescript
const env = import.meta.env.VITE_QF_ENV || 'prelive'
const isPrelive = env === 'prelive'

export const API_BASE = isPrelive
  ? 'https://apis-prelive.quran.foundation'
  : 'https://apis.quran.foundation'

export const OAUTH2_BASE = isPrelive
  ? 'https://prelive-oauth2.quran.foundation'
  : 'https://oauth2.quran.foundation'

export const CLIENT_ID = import.meta.env.VITE_QF_CLIENT_ID || ''
export const CLIENT_SECRET = import.meta.env.VITE_QF_CLIENT_SECRET || ''

export const CONTENT_API = `${API_BASE}/content/api/v4`
export const USER_API = `${API_BASE}/auth/v1`
export const TOKEN_URL = `${OAUTH2_BASE}/oauth2/token`
export const AUTH_URL = `${OAUTH2_BASE}/oauth2/auth`

export const DEFAULT_TRANSLATION_ID = 131 // Sahih International
export const DEFAULT_RECITATION_ID = 7   // Mishary Rashid Alafasy
export const DEFAULT_TIME_LIMIT_MINUTES = 15
export const ENGAGEMENT_DELAY_MS = 30000 // 30 seconds
export const MUSHAF_ID = 1 // Uthmani
export const GRACE_PERIOD_MINUTES = 10 // After dismissing overlay, grant this much extra time
```

- [ ] **Step 3: Create storage.ts**

Typed helpers wrapping `chrome.storage.local` with defaults:

```typescript
import type { WiqayaStorage } from './types'
import { DEFAULT_TIME_LIMIT_MINUTES } from './constants'

const DEFAULTS: WiqayaStorage = {
  trackedSites: [],
  globalTimeLimitMinutes: DEFAULT_TIME_LIMIT_MINUTES,
  siteTimeEntries: {},
  versesReadToday: 0,
  totalVersesRead: 0,
  translationId: 131,
  recitationId: 7,
  autoPlayAudio: false,
  accessToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  contentAccessToken: null,
  contentTokenExpiresAt: null,
}

export async function getStorage<K extends keyof WiqayaStorage>(
  keys: K[]
): Promise<Pick<WiqayaStorage, K>> {
  const result = await chrome.storage.local.get(keys)
  const out: any = {}
  for (const k of keys) {
    out[k] = result[k] ?? DEFAULTS[k]
  }
  return out
}

export async function setStorage(data: Partial<WiqayaStorage>): Promise<void> {
  await chrome.storage.local.set(data)
}
```

- [ ] **Step 4: Create messaging.ts**

```typescript
import type { WiqayaMessage } from './types'

export function sendToBackground(msg: WiqayaMessage): Promise<WiqayaMessage> {
  return chrome.runtime.sendMessage(msg)
}

export function sendToTab(tabId: number, msg: WiqayaMessage): Promise<WiqayaMessage | undefined> {
  return chrome.tabs.sendMessage(tabId, msg)
}
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/
git commit -m "feat: add shared types, constants, storage, and messaging helpers"
```

---

## Task 3: Background Service Worker — Time Tracking

**Files:**
- Create: `src/background/tracker.ts`, update `src/background/index.ts`

- [ ] **Step 1: Implement tracker.ts**

Core logic:
- `startTracking()` — sets up chrome.tabs and chrome.idle listeners
- On tab activate/update: check if domain is in watch list. If yes, start/continue timer. If no, pause timer for previous domain.
- Use `chrome.alarms` for periodic time checks (every 15 seconds) since service worker can be killed.
- On alarm fire: check active tab, increment time for tracked domain, check against threshold.
- When threshold exceeded: send `TRIGGER_OVERLAY` to the active tab.
- Store time entries in chrome.storage.local keyed by domain+date.
- Daily reset: compare stored date vs current date.
- Badge: show minutes spent on extension icon when on a tracked site.

Key functions:
```typescript
export function startTracking(): void
function handleTabChange(tabId: number): Promise<void>
function checkAndUpdateTime(): Promise<void>
function getDomainFromUrl(url: string): string
function isTrackedDomain(domain: string, sites: TrackedSite[]): boolean
function triggerOverlay(tabId: number): Promise<void>
```

- [ ] **Step 2: Wire up in index.ts**

```typescript
import { startTracking } from './tracker'
startTracking()
```

Also set up `chrome.runtime.onMessage` listener to handle messages from content script and popup.

- [ ] **Step 3: Test manually**

Load extension in Chrome, add a test site to storage via console, verify timer badge appears and overlay trigger fires.

- [ ] **Step 4: Commit**

```bash
git add src/background/
git commit -m "feat: implement time tracking engine in background service worker"
```

---

## Task 4: Content API Integration

**Files:**
- Create: `src/background/api.ts`

- [ ] **Step 1: Implement client_credentials token fetch**

```typescript
async function getContentToken(): Promise<string>
```

- Checks storage for valid token (not expired)
- If expired/missing, POST to TOKEN_URL with `grant_type=client_credentials&scope=content`
- Uses Basic auth header (`base64(client_id:client_secret)`)
- Stores token + expiry in chrome.storage.local
- Returns access token

- [ ] **Step 2: Implement verse fetching**

```typescript
export async function fetchRandomVerse(): Promise<VerseData>
```

- Gets content token
- Calls `GET {CONTENT_API}/verses/random?translations={translationId}&fields=text_uthmani&language=en`
- Calls `GET {CONTENT_API}/recitations/{recitationId}/by_ayah/{verseKey}` for audio URL
- Uses cached chapters list for chapter names (fetch once, store in memory/storage)
- Returns normalized `VerseData`

- [ ] **Step 3: Implement chapters cache**

```typescript
async function getChapters(): Promise<Chapter[]>
```

Fetch once from `GET {CONTENT_API}/chapters`, cache in chrome.storage.local.

- [ ] **Step 4: Wire into message handler**

In `index.ts`, handle `GET_VERSE` message by calling `fetchRandomVerse()` and returning `VERSE_DATA`.

- [ ] **Step 5: Test API calls manually**

Via background service worker console, verify token fetch and verse retrieval work.

- [ ] **Step 6: Commit**

```bash
git add src/background/api.ts src/background/index.ts
git commit -m "feat: integrate Content API with client_credentials auth for verse fetching"
```

---

## Task 5: Content Script & Overlay Injection

**Files:**
- Create: `src/content/index.tsx`, `src/content/overlay.css`
- Create: `src/overlay/App.tsx`, `src/overlay/AyahCard.tsx`, `src/overlay/AudioPlayer.tsx`

- [ ] **Step 1: Create content script with Shadow DOM injection**

`src/content/index.tsx`:
- Listen for `TRIGGER_OVERLAY` message from background
- Create host div, attach shadow DOM
- Import `overlay.css` with `?inline` for style isolation
- Render overlay React app into shadow root
- Lock host page scroll (`document.body.style.overflow = 'hidden'`)
- Listen for `DISMISS_OVERLAY` to unmount and restore scroll

`src/content/overlay.css`:
```css
@import 'tailwindcss';
```

- [ ] **Step 2: Create overlay App.tsx**

Root component that:
- Sends `GET_VERSE` message to background on mount
- Tracks engagement state (translationRevealed, audioPlayed, timeElapsed)
- Shows AyahCard with verse data
- Shows "Continue Browsing" button after engagement condition met
- On continue: sends `DISMISS_OVERLAY` + `LOG_SESSION` to background
- Fade-in animation on mount

- [ ] **Step 3: Create AyahCard.tsx**

The visual centerpiece:
- Arabic text in Amiri font, large, with subtle gold accent
- Surah name (Arabic + English) and verse reference
- Translation text — initially hidden, tap/click "Reveal Translation" button to show
- Bookmark heart icon (sends `BOOKMARK_VERSE` to background)
- Beautiful dark card with gradient background
- Smooth reveal animation for translation

- [ ] **Step 4: Create AudioPlayer.tsx**

Simple audio player:
- Play/pause button with recitation icon
- Uses HTML5 Audio element
- Plays the verse audio URL from VerseData
- On play, sets `audioPlayed = true` in parent state

- [ ] **Step 5: Style the overlay**

This is the STAR of the app. Design direction:
- Full viewport overlay with `position: fixed; inset: 0; z-index: 2147483647`
- Semi-transparent dark backdrop with `backdrop-filter: blur(12px)`
- Centered card: dark gradient (midnight blue → deep teal), rounded corners, subtle shadow
- Arabic text: Amiri font loaded from Google Fonts (injected into shadow DOM), 2.5rem+, centered, gold (#D4AF37) accent or white
- Translation: Cormorant Garamond or system serif, muted color, appears with slide-up animation
- Buttons: glass-morphism style, subtle borders
- Fade-in: CSS animation `@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`

Fonts loaded via `@font-face` in the shadow DOM CSS (Google Fonts URLs).

- [ ] **Step 6: Test overlay injection**

Load extension, manually trigger overlay via console message, verify it appears correctly on twitter.com/reddit.com.

- [ ] **Step 7: Commit**

```bash
git add src/content/ src/overlay/
git commit -m "feat: implement Quran verse overlay with Shadow DOM injection"
```

---

## Task 6: Popup UI

**Files:**
- Create/update: `src/popup/App.tsx`, `src/popup/Dashboard.tsx`, `src/popup/Sites.tsx`, `src/popup/Saved.tsx`, `src/popup/Settings.tsx`

- [ ] **Step 1: Create App.tsx with tab navigation**

4 tabs: Dashboard, Sites, Saved, Settings. Simple tab bar at top. Popup dimensions: `width: 400px; min-height: 500px`.

- [ ] **Step 2: Create Dashboard.tsx**

- Reads siteTimeEntries from storage, displays time per tracked site today
- Shows verses read today and total
- Shows current streak (fetched from background via message if logged in)
- Clean card-based layout

- [ ] **Step 3: Create Sites.tsx**

- Lists tracked sites with time limits
- "Add site" input: domain name + time limit
- Delete button per site
- Default sites suggestion (twitter.com, reddit.com, youtube.com, instagram.com, tiktok.com)
- Saves to chrome.storage.local

- [ ] **Step 4: Create Saved.tsx**

- If not logged in: show login prompt
- If logged in: fetch bookmarks from background (`GET_BOOKMARKS` message), display list
- Each bookmark shows verse key, chapter name, and date
- Delete bookmark button

- [ ] **Step 5: Create Settings.tsx**

- Translation selector (dropdown, common translations)
- Reciter selector (dropdown)
- Auto-play audio toggle
- Global time limit slider
- Login/logout button (sends `START_LOGIN` / `LOGOUT` to background)
- Login status indicator

- [ ] **Step 6: Style popup**

Clean, minimal design. Dark mode matching the overlay aesthetic. Tailwind utility classes.

- [ ] **Step 7: Test popup**

Open popup from extension icon, verify all tabs work, add/remove sites.

- [ ] **Step 8: Commit**

```bash
git add src/popup/
git commit -m "feat: implement popup UI with dashboard, sites, saved, and settings tabs"
```

---

## Task 7: OAuth2 + User API Integration

**Files:**
- Create: `src/background/auth.ts`, `public/callback.html`

- [ ] **Step 1: Implement PKCE helpers**

```typescript
function generateCodeVerifier(): string    // 43-128 char random string
function generateCodeChallenge(verifier: string): Promise<string>  // SHA256 + base64url
function generateState(): string           // Random CSRF token
```

- [ ] **Step 2: Implement login flow**

```typescript
export async function startLogin(): Promise<void>
```

- Generate code_verifier, code_challenge, state
- Store verifier + state in chrome.storage.local
- Build authorize URL with params: response_type=code, client_id, redirect_uri (extension callback page), scope=openid offline_access user collection, code_challenge, code_challenge_method=S256, state
- Open URL in new tab via `chrome.tabs.create`
- `redirect_uri` = `chrome.identity.getRedirectURL()` or the extension's callback.html URL

- [ ] **Step 3: Create callback.html**

Simple page that extracts `code` and `state` from URL params, sends them to background via `chrome.runtime.sendMessage`.

- [ ] **Step 4: Implement token exchange**

```typescript
export async function handleAuthCallback(code: string, state: string): Promise<void>
```

- Verify state matches stored state
- POST to TOKEN_URL with grant_type=authorization_code, code, redirect_uri, code_verifier, client_id, client_secret (Basic auth)
- Store access_token, refresh_token, token expiry in chrome.storage.local

- [ ] **Step 5: Implement token refresh**

```typescript
export async function getValidAccessToken(): Promise<string | null>
```

- Check if access_token exists and not expired
- If expired, use refresh_token to get new tokens
- Return valid access token or null

- [ ] **Step 6: Implement User API calls**

```typescript
export async function addBookmark(chapterNumber: number, verseNumber: number): Promise<boolean>
export async function getBookmarks(): Promise<Bookmark[]>
export async function deleteBookmark(id: string): Promise<boolean>
export async function logReadingSession(chapterNumber: number, verseNumber: number): Promise<void>
export async function logActivityDay(verseKey: string, seconds: number): Promise<void>
export async function getStreaks(): Promise<{ days: number; status: string } | null>
```

All calls include headers: `x-auth-token`, `x-client-id`.

- [ ] **Step 7: Wire into background message handler**

Handle BOOKMARK_VERSE, GET_BOOKMARKS, DELETE_BOOKMARK, LOG_SESSION, GET_AUTH_STATUS, START_LOGIN, LOGOUT messages.

- [ ] **Step 8: Implement logout**

Clear access_token, refresh_token, tokenExpiresAt from storage.

- [ ] **Step 9: Test OAuth2 flow end-to-end**

Register redirect URI, test login, verify token storage, test bookmark add/list.

- [ ] **Step 10: Commit**

```bash
git add src/background/auth.ts public/callback.html src/background/index.ts
git commit -m "feat: implement OAuth2 PKCE flow and User API integration"
```

---

## Task 8: Polish & Integration

**Files:** Various — connecting all pieces

- [ ] **Step 1: Connect time tracker to overlay trigger end-to-end**

Verify: tracked site → timer → threshold → overlay → engage → dismiss → timer reset with grace period.

- [ ] **Step 2: Wire badge updates**

Show tracked time as badge text on extension icon (e.g., "12m") when on a tracked site. Clear when on untracked site.

- [ ] **Step 3: Add font loading**

Inject Google Fonts (Amiri, Cormorant Garamond) into shadow DOM via `@font-face` rules pointing to CDN or bundled.

- [ ] **Step 4: Add smooth animations**

- Overlay fade-in (300ms ease-out)
- Backdrop blur transition
- Translation reveal slide-up
- Button hover effects
- Continue button fade-in after engagement

- [ ] **Step 5: Handle edge cases**

- Tab close while overlay is showing
- Multiple tracked tabs open simultaneously
- Service worker restart (restore timer state from storage)
- Offline state (show cached verse or graceful error)
- Sites that block content script injection (chrome://, extension pages)

- [ ] **Step 6: Add daily reset logic**

At midnight (or when first tab activated on new day), reset daily time entries and versesReadToday.

- [ ] **Step 7: Final manual testing**

Test on: twitter.com, reddit.com, youtube.com, instagram.com. Verify overlay appearance, API calls, bookmarks, streaks.

- [ ] **Step 8: Build for production**

```bash
npm run build
```

Verify `dist/` folder loads correctly in Chrome.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: polish UI, animations, edge cases, and final integration"
```

---

## Task 9: Git Remote & README

- [ ] **Step 1: Add remote and push**

```bash
git remote add origin https://github.com/0xNoramiya/wiqaya.git
git push -u origin main
```

Verify `.gitignore` prevents `apikey` and `.env` from being pushed.

- [ ] **Step 2: Create README.md**

Brief README with: project description, install instructions (clone, npm install, create .env, npm run build, load in Chrome), screenshots placeholder, API usage description, hackathon submission info.

- [ ] **Step 3: Commit and push**

```bash
git add README.md
git commit -m "docs: add README with install instructions"
git push
```
