# Wiqaya — وقاية

**Your screen time, redeemed.**

Wiqaya (وقاية — "protection" in Arabic) is a Chrome extension that monitors time spent on distracting websites and overlays a beautiful Quran verse gate — transforming doomscrolling into an opportunity for Quran connection.

Built for the **Quran Foundation Hackathon 2026**.

## How It Works

1. **Add distracting sites** — twitter.com, reddit.com, youtube.com, etc.
2. **Set time limits** — global or per-site (default: 1 minute for testing, configurable up to 60)
3. **Browse normally** — Wiqaya tracks time in the background with a badge indicator
4. **Threshold exceeded** — a full-page overlay fades in with a random Quran verse
5. **Engage** — read the Arabic text, reveal the translation, listen to the recitation
6. **Continue** — after engaging with the verse, a "Continue Browsing" button appears with a grace period
7. **Track progress** — see verses read, time tracked per site, and streaks in the popup dashboard

## Features

### Core
- **Time Tracking** — per-site time limits with live badge counter on the extension icon
- **Quran Verse Overlay** — immersive, contemplative full-page gate with:
  - Arabic text in Amiri font (the visual hero)
  - "Reveal Translation" interaction (Arabic first, tap to show meaning)
  - Audio recitation with waveform visualizer (auto-play option)
  - Bookmark button to save verses
  - Animated gold particles, shimmer effects, and gradient borders
- **Popup Dashboard** — real-time stats: time per site, verses read today/all-time, streak count
- **Site Management** — watch list with quick-add for common sites, custom domains + limits
- **Dark/Light Theme** — warm paper-like light mode inspired by a physical mushaf

### Quran Foundation API Integration
- **Content API** (no login required):
  - Random verse with Uthmani script (`/api/v4/verses/random`)
  - Translations fetched separately (`/api/v4/quran/translations/{id}`)
  - Audio recitation from CDN (`/api/v4/recitations/{id}/by_ayah/{key}`)
  - Chapter names cached locally (`/api/v4/chapters`)
- **User API** (requires OAuth2 login — pending scope approval):
  - Bookmarks — save/list/delete favorite verses
  - Reading Sessions — log each verse interaction
  - Activity Days — track daily Quran engagement
  - Streaks — maintain reading streaks

### UX Polish
- Onboarding welcome state for new users
- Error retry on verse fetch failure
- Live dashboard refresh (updates while popup is open)
- Smooth animations throughout (fade-in, slide-up, pulse-glow)
- Engagement gating: "Continue Browsing" only appears after 30 seconds, translation reveal, or audio play
- Grace period after dismissing overlay (configurable)
- Daily reset of time tracking at midnight

## Installation

### Prerequisites
- Node.js 18+
- Chrome browser

### Setup

```bash
git clone https://github.com/0xNoramiya/wiqaya.git
cd wiqaya
npm install
```

Create a `.env` file in the project root:
```
VITE_QF_CLIENT_ID=your_client_id
VITE_QF_CLIENT_SECRET=your_client_secret
```

### Build & Load

```bash
npm run build
```

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/` folder from the project

### Development

```bash
npm run dev
```

Vite + CRXJS provides hot module replacement during development.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome Manifest V3 |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS v4 + custom CSS |
| Build | Vite 6 + @crxjs/vite-plugin |
| Content API | Quran Foundation Content API v4 |
| User API | Quran Foundation User API v1 |
| Auth | OAuth2 Authorization Code + PKCE |
| Fonts | Amiri (Arabic), Cormorant Garamond (translation) |

## Architecture

```
Background Service Worker
  ├── Time tracking (chrome.alarms, chrome.tabs, chrome.idle)
  ├── Content API (client_credentials token, verse/translation/audio fetch)
  └── User API (OAuth2 PKCE, bookmarks, streaks, sessions)

Content Script (Shadow DOM)
  └── Overlay injection (React app with isolated styles)

Popup (React)
  ├── Dashboard (live stats)
  ├── Sites (watch list management)
  ├── Saved (bookmarked verses)
  └── Settings (theme, translation, reciter, time limit, auth)
```

## API Usage

### Content API — Client Credentials (no user login)

| Endpoint | Purpose |
|----------|---------|
| `GET /content/api/v4/verses/random` | Random verse with Uthmani script |
| `GET /content/api/v4/quran/translations/{id}` | Translation text for a verse |
| `GET /content/api/v4/chapters` | Chapter names (Arabic + English) |
| `GET /content/api/v4/recitations/{id}/by_ayah/{key}` | Audio recitation URL |
| `POST /oauth2/token` | Client credentials token (`grant_type=client_credentials`) |

### User API — OAuth2 PKCE (requires login)

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/v1/bookmarks` | Save a verse bookmark |
| `GET /auth/v1/bookmarks` | List saved bookmarks |
| `DELETE /auth/v1/bookmarks/{id}` | Remove a bookmark |
| `POST /auth/v1/reading-sessions` | Log a reading session |
| `POST /auth/v1/activity-days` | Log daily activity |
| `GET /auth/v1/streaks` | Get streak data |

## License

This project was built for the Quran Foundation Hackathon 2026.

---

*Wiqaya (وقاية) — "protection/prevention" in Arabic. Your screen time, redeemed.*
