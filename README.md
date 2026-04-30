# Wiqaya — وقاية

**Your screen time, redeemed.**

Wiqaya is a Chrome extension that monitors time on distracting websites and overlays a Quran verse gate — transforming doomscrolling into moments of reflection.

Built for the **Quran Foundation Hackathon 2026**.

**Landing page:** <https://0xnoramiya.github.io/wiqaya/>
**Demo video (2:45):** <https://youtu.be/lHm1ml_M68I>
**Latest release:** <https://github.com/0xNoramiya/wiqaya/releases/latest>

## Quick install (no build required)

For judges and anyone who just wants to try it:

1. Download `wiqaya-extension.zip` from the [latest release](https://github.com/0xNoramiya/wiqaya/releases/latest).
2. Unzip the file to any folder.
3. Open `chrome://extensions` in Chrome and toggle on **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.
5. Pin Wiqaya to your toolbar — click the icon to add a site and set a time limit.

The released bundle is pre-built with valid Pre-Production Quran Foundation API credentials, so login, bookmarks, verse fetching, and streaks all work out of the box.

## How it works

1. **Add sites** — youtube.com, twitter.com, reddit.com, etc.
2. **Set time limits** — global or per-site (1–60 minutes)
3. **Browse normally** — Wiqaya tracks time with a live badge counter
4. **Threshold hit** — a full-page verse overlay fades in
5. **Engage** — read Arabic text, reveal translation, listen to recitation
6. **Continue** — after engaging, dismiss and get a grace period

## Features

- **Quran Verse Overlay** — Arabic in Uthmani script (Amiri font), tap-to-reveal translation, audio recitation with waveform visualizer, bookmark button
- **Time Tracking** — per-site limits, live badge counter, daily reset at midnight, auto-pause on idle/lock
- **Popup Dashboard** — verses read today/all-time, time per site, streak counter, live refresh
- **Site Management** — watch list, quick-add common sites, custom domains
- **Engagement Gating** — "Continue Browsing" only after 30s, translation reveal, or audio play
- **Bookmarks & Streaks** — save verses, track daily reading streaks, sync across devices via the User API
- **OAuth 2.0 + PKCE** — sign in to your Quran Foundation account from the extension popup; redirect URI is the project's GitHub Pages site
- **Dark / Light Theme** — warm mushaf-inspired light mode for the day, hushed dark mode for the night
- **Local-first privacy** — your watchlist and time data never leave your browser; only the Quran Foundation APIs are contacted

## Quran Foundation API usage

### Content API (v4) — `apis.quran.foundation`, client-credentials grant

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v4/verses/random` | Random verse with Uthmani script |
| `GET /api/v4/quran/translations/{id}` | Translation for a verse |
| `GET /api/v4/chapters` | Chapter names (cached locally after first fetch) |
| `GET /api/v4/recitations/{id}/by_ayah/{key}` | Audio recitation URL |

### User API (v1) — `apis-prelive.quran.foundation`, OAuth2 Authorization Code + PKCE

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/v1/bookmarks` | Save verse bookmark |
| `GET /auth/v1/bookmarks` | List bookmarks |
| `DELETE /auth/v1/bookmarks/{id}` | Remove bookmark |
| `POST /auth/v1/reading-sessions` | Log reading session |
| `POST /auth/v1/activity-days` | Log daily activity |
| `GET /auth/v1/streaks` | Reading streak data |

The User API uses Quran Foundation's custom `x-auth-token` / `x-client-id` header convention rather than `Authorization: Bearer`. The OAuth callback page lives at `https://0xnoramiya.github.io/wiqaya/callback.html` and forwards the auth code back to the extension via `chrome.runtime.sendMessage` (the extension ID is pinned via `manifest.json`'s `key` field, so it stays stable across machines).

## Build from source

```bash
git clone https://github.com/0xNoramiya/wiqaya.git
cd wiqaya
npm install
```

Create `.env` from the example and fill in your Quran Foundation API credentials (Content API for verses, Pre-Production User API for OAuth):

```bash
cp .env.example .env
# Required:
#   VITE_QF_CONTENT_CLIENT_ID, VITE_QF_CONTENT_CLIENT_SECRET   (Content API)
#   VITE_QF_AUTH_CLIENT_ID,    VITE_QF_AUTH_CLIENT_SECRET      (User API, PKCE)
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

## Demo video

**Watch on YouTube:** <https://youtu.be/lHm1ml_M68I> — also embedded on the [landing page](https://0xnoramiya.github.io/wiqaya/#watch).

A 2:45 narrated walk-through (1920×1080, ElevenLabs voiceover) built with the [HyperFrames](https://hyperframes.dev) framework. The source compositions live in `demo-video-hf/` (gitignored, regenerable locally). Seven scenes: the problem, the idea (with وقاية as a visual anchor), the four-step method, the verse experience, a 20-second slot for live screen-recording footage, the feature summary, and the closing verse.

To re-render locally:

```bash
cd demo-video-hf
ELEVENLABS_API_KEY=sk_... python3 generate-audio.py   # produces audio/scene-{1..7}.mp3
npx hyperframes render                                # produces wiqaya-demo.mp4
```

`SCRIPT.md` and `DESIGN.md` in that folder document the narration script and the visual identity rules.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome Manifest V3 (pinned key for stable extension ID) |
| Frontend | React 18 + TypeScript (strict) |
| Styling | Tailwind CSS v4 + custom CSS |
| Build | Vite 6 + @crxjs/vite-plugin |
| Content API | Quran Foundation Content API v4 |
| User API | Quran Foundation User API v1 (Pre-Production) |
| Auth | OAuth 2.0 Authorization Code + PKCE, callback on GitHub Pages |
| Overlay | Shadow DOM (style isolation, no CSS leakage) |
| Fonts | Amiri (Arabic), Cormorant Garamond (display), Inter (body) |
| Demo video | HyperFrames + ElevenLabs TTS (multilingual_v2) |

## Architecture

```
Background Service Worker
  ├── Time tracking            chrome.alarms (15s tick), chrome.tabs, chrome.idle
  ├── Content API client       client_credentials grant; caches token + chapters
  ├── User API client          PKCE login, x-auth-token / x-client-id headers,
  │                            refresh-token rotation, pendingAuth in storage.session
  └── External-message handler onMessageExternal listener for AUTH_CALLBACK from
                                the GitHub Pages redirect

Content Script  (Shadow DOM)
  └── React overlay            mounted into shadow root for full style isolation;
                                listens for TRIGGER_OVERLAY from background

Popup  (React)
  ├── Dashboard                live stats — verses today, time per site, streak
  ├── Sites                    add/edit watch list and per-site limits
  ├── Saved                    bookmarks pulled from User API
  └── Settings                 theme, translation, reciter, global time limit, login

Storage
  └── chrome.storage.local     single source of truth (WiqayaStorage in shared/types.ts);
                                tracker re-reads on every tick because MV3 service workers
                                are killed and rehydrated.
```

## License

Built for the Quran Foundation Hackathon 2026.
