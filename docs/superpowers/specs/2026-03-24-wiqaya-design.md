# Wiqaya (وقاية) — Design Spec

## Overview

Chrome extension (Manifest V3) that monitors time on user-configured distracting websites and overlays a full-page Quran verse gate after a threshold is exceeded. Built with React 18 + TypeScript + Tailwind CSS + Vite + @crxjs/vite-plugin.

## Architecture

### Components

1. **Background Service Worker** — Time tracking engine, API token management, gate trigger logic
2. **Content Script** — Listens for trigger messages, injects overlay into the page
3. **Overlay** — Full-page React component with verse display, audio, bookmark, reveal interaction
4. **Popup** — React app with 4 tabs: Dashboard, Sites, Saved, Settings

### Data Flow

```
User browses tracked site
  → Background worker tracks time via chrome.tabs + chrome.idle
  → Threshold exceeded → sends message to content script
  → Content script injects overlay shadow DOM
  → Overlay fetches verse from Content API (via background worker)
  → User engages (reveal translation / play audio / wait 30s)
  → Optional: bookmark verse (User API, requires auth)
  → Log reading session + update streak (User API)
  → "Continue Browsing" button appears → overlay dismissed
  → Timer resets for that site with a grace period
```

### API Integration

**Content API (no login required):**
- OAuth2 client_credentials flow in background worker
- `GET /api/v4/verses/random` — verse with translations
- `GET /api/v4/chapters` — chapter names (cached)
- `GET /api/v4/recitations/{id}/by_ayah/{key}` — audio URL

**User API (requires OAuth2 login):**
- Authorization Code + PKCE flow
- Headers: `x-auth-token`, `x-client-id`
- Bookmarks CRUD, streaks, activity days, reading sessions

### Auth Strategy

- Works without login (Content API uses client_credentials)
- Enhanced with login (bookmarks, streaks, reading sessions)
- Tokens stored in chrome.storage.local
- Background worker handles all token management
- Client secret never exposed to content scripts

## Core Features

### Time Tracking
- Watch list stored in chrome.storage.local
- Cumulative time per domain per day (resets at midnight)
- Uses chrome.tabs.onActivated, chrome.tabs.onUpdated, chrome.idle.onStateChanged
- Badge on extension icon shows time for current tracked site
- Per-site or global time limit (default: 15 minutes)

### Overlay (The Star)
- Shadow DOM injection to isolate styles from host page
- Dark, contemplative aesthetic — midnight blue/deep teal gradients
- Arabic text as visual hero (Amiri font), gold accent
- Reveal interaction: Arabic shown first, tap to reveal translation
- Audio play button with recitation
- Bookmark heart icon (if authenticated)
- "Continue Browsing" appears after engagement (30s OR reveal OR audio play)
- Smooth fade-in, blur backdrop
- Host page scroll-locked and dimmed

### Popup Dashboard
- Tab 1: Dashboard — time per site today, verses read, streak count
- Tab 2: Sites — add/remove domains, per-site time limits
- Tab 3: Saved — bookmarked verses (requires auth)
- Tab 4: Settings — translation language, audio auto-play, auth login/logout

### Streaks & Progress
- Log each overlay interaction as a reading session
- Track activity days via User API
- Display streak in popup dashboard

## Environment

- Default: Pre-production (all features enabled for testing)
- Secrets in .env (not committed), .env.example committed
- Background worker is the only component that uses secrets

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Vite + @crxjs/vite-plugin
- Chrome Manifest V3
- Fonts: Amiri (Arabic), Inter or similar (UI), Cormorant Garamond (translation)
