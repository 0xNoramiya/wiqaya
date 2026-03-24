# Wiqaya — وقاية

**Your screen time, redeemed.**

A Chrome extension that monitors time spent on distracting websites and overlays a beautiful Quran verse gate — transforming doomscrolling into an opportunity for Quran connection.

## How It Works

1. **Add distracting sites** (twitter.com, reddit.com, youtube.com, etc.)
2. **Set time limits** (default: 15 minutes per site)
3. **Browse normally** — Wiqaya tracks time in the background
4. **When time's up** — a beautiful full-page overlay appears with a random Quran verse
5. **Engage** — read the Arabic, reveal the translation, listen to the recitation
6. **Continue** — after engaging with the verse, continue browsing with a grace period
7. **Track progress** — see your streaks, bookmarked verses, and reading stats

## Features

- **Time Tracking** — per-site time limits with badge indicator
- **Quran Verse Overlay** — immersive, calming design with Arabic text, translation reveal, and audio recitation
- **Bookmarks** — save verses you connect with (requires Quran.com login)
- **Streaks** — track your daily Quran engagement
- **Reading Sessions** — log each interaction with the Quran Foundation API

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
VITE_QF_ENV=prelive
```

### Build & Load

```bash
npm run build
```

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Development

```bash
npm run dev
```

Vite + CRXJS provides hot module replacement during development.

## Tech Stack

- **Chrome Extension** — Manifest V3
- **Frontend** — React 18 + TypeScript + Tailwind CSS v4
- **Build** — Vite 6 + @crxjs/vite-plugin
- **APIs** — Quran Foundation Content API v4 + User API v1
- **Auth** — OAuth2 Authorization Code + PKCE

## API Usage

### Content API (no login required)
- `GET /api/v4/verses/random` — Fetches a random verse with Uthmani script and translation
- `GET /api/v4/chapters` — Chapter names (cached)
- `GET /api/v4/recitations/{id}/by_ayah/{key}` — Audio recitation URL

### User API (requires Quran.com OAuth2 login)
- `POST /auth/v1/bookmarks` — Save favorite verses
- `GET /auth/v1/bookmarks` — List saved verses
- `POST /auth/v1/reading-sessions` — Log reading sessions
- `POST /auth/v1/activity-days` — Log daily activity
- `GET /auth/v1/streaks` — Track engagement streaks

## Hackathon

Built for the **Quran Foundation Hackathon 2026**.

---

*Wiqaya (وقاية) — "protection" in Arabic*
