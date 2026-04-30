# Wiqaya — وقاية

**Your screen time, redeemed.**

Wiqaya is a Chrome extension that monitors time on distracting websites and overlays a Quran verse gate — transforming doomscrolling into moments of reflection.

Built for the **Quran Foundation Hackathon 2026**.

## Quick install (no build required)

For judges and anyone who just wants to try it:

1. Download `wiqaya-extension.zip` from the [latest release](https://github.com/0xNoramiya/wiqaya/releases/latest).
2. Unzip the file to any folder.
3. Open `chrome://extensions` in Chrome and toggle on **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.
5. Pin Wiqaya to your toolbar — click the icon to add a site and set a time limit.

The released bundle is pre-built with valid Pre-Production Quran Foundation API credentials, so login, bookmarks, verse fetching, and streaks all work out of the box.

## How It Works

1. **Add sites** — twitter.com, reddit.com, youtube.com, etc.
2. **Set time limits** — global or per-site (1–60 minutes)
3. **Browse normally** — Wiqaya tracks time with a badge counter
4. **Threshold hit** — a full-page verse overlay fades in
5. **Engage** — read Arabic text, reveal translation, listen to recitation
6. **Continue** — after engaging, dismiss and get a grace period

## Features

- **Quran Verse Overlay** — Arabic in Uthmani script (Amiri font), tap-to-reveal translation, audio recitation with waveform visualizer, bookmark button
- **Time Tracking** — per-site limits, live badge counter, daily reset at midnight
- **Popup Dashboard** — verses read today/all-time, time per site, streak counter, live refresh
- **Site Management** — watch list, quick-add common sites, custom domains
- **Engagement Gating** — "Continue Browsing" only after 30s, translation reveal, or audio play
- **Bookmarks & Streaks** — save verses, track daily reading streaks
- **Dark/Light Theme** — warm mushaf-inspired light mode

## Quran Foundation API Usage

### Content API (v4) — no login required

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v4/verses/random` | Random verse with Uthmani script |
| `GET /api/v4/quran/translations/{id}` | Translation for a verse |
| `GET /api/v4/chapters` | Chapter names (cached) |
| `GET /api/v4/recitations/{id}/by_ayah/{key}` | Audio recitation URL |

### User API (v1) — OAuth2 PKCE

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/v1/bookmarks` | Save verse bookmark |
| `GET /auth/v1/bookmarks` | List bookmarks |
| `DELETE /auth/v1/bookmarks/{id}` | Remove bookmark |
| `POST /auth/v1/reading-sessions` | Log reading session |
| `POST /auth/v1/activity-days` | Log daily activity |
| `GET /auth/v1/streaks` | Reading streak data |

## Build from source

```bash
git clone https://github.com/0xNoramiya/wiqaya.git
cd wiqaya
npm install
```

Create `.env` from the example:

```bash
cp .env.example .env
# Fill in your Quran Foundation API credentials
```

Build and load:

```bash
npm run build
```

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder

For development with hot reload:

```bash
npm run dev
```

Produce a distributable zip (`wiqaya-extension.zip` at repo root) for releases:

```bash
npm run package
```

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
| Overlay | Shadow DOM (style isolation) |
| Fonts | Amiri (Arabic), Cormorant Garamond (English) |

## Architecture

```
Background Service Worker
  ├── Time tracking (chrome.alarms, tabs, idle)
  ├── Content API (client_credentials, verse/translation/audio)
  └── User API (OAuth2 PKCE, bookmarks, streaks, sessions)

Content Script (Shadow DOM)
  └── Overlay injection (React, isolated styles)

Popup (React)
  ├── Dashboard (live stats)
  ├── Sites (watch list)
  ├── Saved (bookmarks)
  └── Settings (theme, translation, reciter, time limit)
```

## License

Built for the Quran Foundation Hackathon 2026.
