# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install deps
npm run dev          # vite dev server with HMR (extension reloads via @crxjs)
npm run build        # production build → dist/ (load unpacked in chrome://extensions)
```

There is no test runner, linter, or formatter configured. `npm test` is a placeholder that exits with an error. TypeScript is checked only via the IDE / `tsc --noEmit` is not wired into a script — `vite build` does not run a separate type-check pass. Run `npx tsc --noEmit -p tsconfig.json` if you need to verify types before shipping.

Icon regeneration (only when `scripts/icon.svg` changes):

```bash
python3 scripts/generate-icons.py    # requires `cairosvg` — writes public/icons/icon-{16,48,128}.png
```

After `npm run build`, load the extension by going to `chrome://extensions`, enabling Developer mode, and selecting the `dist/` folder.

## Architecture

Wiqaya is a **Chrome Manifest V3 extension** with three execution contexts wired together by `chrome.runtime` messaging:

1. **Background service worker** (`src/background/index.ts`) — owns time tracking, all network I/O (Quran Foundation Content + User APIs), and auth. The SW is the only place that talks to external services. Because MV3 service workers are killed and rehydrated, **all state must be persisted to `chrome.storage.local`** — never assume in-memory state survives between alarm ticks. The `tracker.ts` module deliberately re-reads storage on every tick for this reason.
2. **Content script** (`src/content/index.tsx`, injected on `<all_urls>`) — minimal: it listens for `TRIGGER_OVERLAY` messages and mounts the React overlay (`src/overlay/App.tsx`) inside a **Shadow DOM** for style isolation. CSS is imported with `?inline` and injected as a `<style>` element into the shadow root so Tailwind/host page styles don't leak in either direction.
3. **Popup** (`src/popup/`) — React UI shown when the user clicks the toolbar icon. Four tabs (Dashboard, Sites, Saved, Settings) all read/write `chrome.storage.local` directly via the shared helpers, and call the background SW for auth and verse fetches.

### Time-tracking flow

`src/background/tracker.ts` is the heart of the extension:

- A `chrome.alarms` named `wiqaya-tick` fires every 15s (`TICK_PERIOD_MINUTES = 0.25`). Each tick re-reads storage, finds the active tab, increments time on the canonical tracked-domain key, and updates the badge.
- Domains match by exact hostname or as a suffix (`.example.com`); `www.` is stripped for both stored and observed hostnames.
- Per-site `timeLimitMinutes > 0` overrides the `globalTimeLimitMinutes`. When the threshold is crossed, the SW sends `TRIGGER_OVERLAY` to the active tab; an in-memory `isOverlayShowing` flag prevents re-trigger spam (it resets on tab change or grace).
- `applyGracePeriod` (called on overlay dismiss) **subtracts** `GRACE_PERIOD_MINUTES` from the stored time so the user gets that many extra minutes before the overlay re-fires.
- Daily reset is date-string based: every tick checks `lastTrackedDate` against `todayString()` and zeros out `siteTimeEntries` and `versesReadToday` on rollover. Don't substitute timestamp arithmetic — the explicit `YYYY-MM-DD` comparison handles DST and clock changes correctly.
- `chrome.idle` is used to pause accumulation (the next tick simply skips because the active-tab query returns nothing useful while idle/locked).

### Storage and shared types

`src/shared/types.ts` defines `WiqayaStorage` as the single source of truth for every key written to `chrome.storage.local`. `src/shared/storage.ts` exposes `getStorage(keys)` / `setStorage(partial)` typed against that shape and applies the `DEFAULTS` table for missing keys. **Add new persisted state by extending `WiqayaStorage` and `DEFAULTS` together** — the helper relies on the defaults table to back-fill missing keys.

Cross-context messages are similarly typed as the `WiqayaMessage` discriminated union in `types.ts`. Always extend that union when adding a new message type and handle it in `src/background/index.ts`'s listener.

### Quran Foundation API integration

Two **separate** OAuth2 client pairs are configured via env vars (see `.env.example`):

- **Content API** (`apis.quran.foundation`, prod) — `VITE_QF_CONTENT_CLIENT_ID` / `_SECRET` (with `VITE_QF_CLIENT_ID` / `_SECRET` as legacy fallbacks). `client_credentials` grant. Token + chapters list are cached in storage; chapters are warmed from storage on module load to survive SW restarts. `src/background/api.ts` owns all of this.
- **User API** (`apis-prelive.quran.foundation`, prelive) — `VITE_QF_AUTH_CLIENT_ID` / `_SECRET`. Designed for OAuth2 Authorization Code + PKCE.

> **`src/background/auth.ts` is currently a MOCK** for the hackathon demo. `startLogin` stores a fake token, and bookmarks / streaks / reading sessions are all kept in `chrome.storage.local` under `mockBookmarks` / `mockStreakDays`. The real PKCE flow (with the `docs/callback.html` redirect on `0xnoramiya.github.io`, declared in `manifest.json`'s `externally_connectable`) is **not** wired in this file. If you need to restore real auth, replace this whole file — don't merge real and mock paths.

Audio URLs returned by `/recitations/{id}/by_ayah/{key}` are **relative paths** (e.g. `Alafasy/mp3/002255.mp3`); `api.ts` prepends `https://audio.qurancdn.com/` when the URL doesn't start with `http`. Translation responses contain HTML; `api.ts` strips tags before returning.

### Build details

- Vite 6 + `@crxjs/vite-plugin` reads `manifest.json` directly and produces an MV3 build in `dist/`.
- Tailwind CSS v4 via `@tailwindcss/vite` (no `tailwind.config.js` — v4 is config-less by default; class scanning happens automatically).
- TypeScript is `strict` with `noUnusedLocals` and `noUnusedParameters` enabled, so unused imports/params will cause build/IDE errors.

## Conventions specific to this codebase

- When you read time-tracking state, **always** rehydrate from `chrome.storage.local` inside the alarm handler — the module-level variables in `tracker.ts` (`currentTrackedTabId`, `isOverlayShowing`) are best-effort caches and may be stale or zeroed after an SW restart.
- Use the `findTrackedSite(domain, trackedSites)` helper rather than direct `===` comparisons — it handles `www.` stripping and subdomain matching consistently.
- Store dates as `YYYY-MM-DD` strings via `todayString()`, not timestamps, when the semantic is "which calendar day".
- Background → content/popup async responses must `return true` from the `onMessage` listener to keep the channel open; see the pattern throughout `src/background/index.ts`.
- The overlay must remain in a Shadow DOM. If you add new overlay styles, edit `src/content/overlay.css` (imported with `?inline`) — don't reach into the host page's `<head>`.
