import {
  AUTH_URL,
  AUTH_TOKEN_URL,
  AUTH_CLIENT_ID,
  AUTH_CLIENT_SECRET,
  USER_API,
} from '../shared/constants'
import { getStorage, setStorage } from '../shared/storage'
import type { Bookmark } from '../shared/types'

const REDIRECT_URI = 'https://0xnoramiya.github.io/wiqaya/callback.html'
const SCOPE = 'openid offline_access user'

// --- PKCE helpers ---

function base64UrlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomBytes(len: number): Uint8Array {
  const buf = new Uint8Array(len)
  crypto.getRandomValues(buf)
  return buf
}

function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32))
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64UrlEncode(hash)
}

// --- Pending-auth state (lives in session storage so it's cleared on browser close) ---

interface PendingAuth {
  state: string
  verifier: string
}

async function setPendingAuth(p: PendingAuth | null): Promise<void> {
  if (p === null) {
    await chrome.storage.session.remove('pendingAuth')
  } else {
    await chrome.storage.session.set({ pendingAuth: p })
  }
}

async function getPendingAuth(): Promise<PendingAuth | null> {
  const r = await chrome.storage.session.get('pendingAuth')
  return (r.pendingAuth as PendingAuth | undefined) ?? null
}

// --- Login flow ---

export async function startLogin(): Promise<boolean> {
  if (!AUTH_CLIENT_ID) {
    console.error('[Wiqaya] VITE_QF_AUTH_CLIENT_ID is not set; cannot start login.')
    return false
  }

  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = base64UrlEncode(randomBytes(16))

  await setPendingAuth({ state, verifier })

  const params = new URLSearchParams({
    client_id: AUTH_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  await chrome.tabs.create({ url: `${AUTH_URL}?${params.toString()}` })
  return true
}

export async function completeLogin(
  code: string,
  state: string
): Promise<{ success: boolean; error?: string }> {
  const pending = await getPendingAuth()
  if (!pending) return { success: false, error: 'No pending login in this browser session.' }
  if (pending.state !== state) {
    await setPendingAuth(null)
    return { success: false, error: 'OAuth state mismatch — possible CSRF.' }
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: AUTH_CLIENT_ID,
    code_verifier: pending.verifier,
  })
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  if (AUTH_CLIENT_SECRET) {
    headers.Authorization = `Basic ${btoa(`${AUTH_CLIENT_ID}:${AUTH_CLIENT_SECRET}`)}`
  }

  let response: Response
  try {
    response = await fetch(AUTH_TOKEN_URL, { method: 'POST', headers, body })
  } catch (e) {
    return { success: false, error: `Network error during token exchange: ${String(e)}` }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    return { success: false, error: `Token exchange failed (${response.status}): ${text}` }
  }

  const data = await response.json()
  await setStorage({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    tokenExpiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  })
  await setPendingAuth(null)
  return { success: true }
}

// --- Token refresh ---

async function getAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken, tokenExpiresAt } = await getStorage([
    'accessToken',
    'refreshToken',
    'tokenExpiresAt',
  ])

  // Refresh ~30s before expiry so we don't race the clock.
  const fresh = accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 30_000
  if (fresh) return accessToken

  if (!refreshToken) {
    if (accessToken) await setStorage({ accessToken: null, tokenExpiresAt: null })
    return null
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: AUTH_CLIENT_ID,
  })
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  if (AUTH_CLIENT_SECRET) {
    headers.Authorization = `Basic ${btoa(`${AUTH_CLIENT_ID}:${AUTH_CLIENT_SECRET}`)}`
  }

  const response = await fetch(AUTH_TOKEN_URL, { method: 'POST', headers, body }).catch(() => null)
  if (!response || !response.ok) {
    await setStorage({ accessToken: null, refreshToken: null, tokenExpiresAt: null })
    return null
  }

  const data = await response.json()
  await setStorage({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    tokenExpiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  })
  return data.access_token
}

// --- Auth state ---

export async function isLoggedIn(): Promise<boolean> {
  const { accessToken, refreshToken } = await getStorage(['accessToken', 'refreshToken'])
  return !!(accessToken || refreshToken)
}

export async function logout(): Promise<void> {
  await setStorage({
    accessToken: null,
    refreshToken: null,
    tokenExpiresAt: null,
  })
  await setPendingAuth(null)
}

// --- User API fetch wrapper ---

async function userFetch(path: string, init: RequestInit = {}): Promise<Response | null> {
  const token = await getAccessToken()
  if (!token) {
    console.warn('[Wiqaya/userFetch] no access token — request skipped:', init.method ?? 'GET', path)
    return null
  }

  const headers = new Headers(init.headers)
  // Quran Foundation APIs use these custom headers, not standard Authorization: Bearer.
  headers.set('x-auth-token', token)
  headers.set('x-client-id', AUTH_CLIENT_ID)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const url = `${USER_API}${path}`
  const method = init.method ?? 'GET'
  console.log('[Wiqaya/userFetch] →', method, url, init.body ? `body=${init.body}` : '')

  let response: Response
  try {
    response = await fetch(url, { ...init, headers })
  } catch (e) {
    console.error('[Wiqaya/userFetch] network error:', method, url, e)
    return null
  }

  if (!response.ok) {
    const text = await response.clone().text().catch(() => '')
    console.error('[Wiqaya/userFetch] ←', response.status, response.statusText, method, url, text)
  } else {
    console.log('[Wiqaya/userFetch] ←', response.status, method, url)
  }
  return response
}

// --- Bookmarks ---

export async function addBookmark(chapterNumber: number, verseNumber: number): Promise<boolean> {
  const response = await userFetch('/bookmarks', {
    method: 'POST',
    body: JSON.stringify({
      type: 'ayah',
      key: chapterNumber,
      verse_number: verseNumber,
    }),
  })
  return !!(response && response.ok)
}

export async function getBookmarks(): Promise<Bookmark[]> {
  const response = await userFetch('/bookmarks', { method: 'GET' })
  if (!response || !response.ok) return []
  const data = await response.json().catch(() => null)
  if (!data) return []

  const list = Array.isArray(data) ? data : (data.bookmarks ?? data.data ?? [])
  return list.map((b: any) => ({
    id: String(b.id ?? b._id ?? `${b.type}-${b.key}-${b.verse_number ?? ''}`),
    createdAt: b.created_at ?? b.createdAt ?? new Date().toISOString(),
    type: b.type ?? 'ayah',
    key: Number(b.key),
    verseNumber: b.verse_number ?? b.verseNumber,
  }))
}

export async function deleteBookmark(id: string): Promise<boolean> {
  const response = await userFetch(`/bookmarks/${encodeURIComponent(id)}`, { method: 'DELETE' })
  return !!(response && response.ok)
}

// --- Reading sessions / activity / streaks ---

export async function logReadingSession(chapterNumber: number, verseNumber: number): Promise<void> {
  await userFetch('/reading-sessions', {
    method: 'POST',
    body: JSON.stringify({
      chapter_number: chapterNumber,
      verse_number: verseNumber,
      verse_key: `${chapterNumber}:${verseNumber}`,
    }),
  })
}

export async function logActivityDay(verseKey: string, seconds: number): Promise<void> {
  await userFetch('/activity-days', {
    method: 'POST',
    body: JSON.stringify({
      verse_key: verseKey,
      seconds_engaged: seconds,
      occurred_on: new Date().toISOString().slice(0, 10),
    }),
  })
}

export async function getStreaks(): Promise<{ days: number; status: string } | null> {
  const response = await userFetch('/streaks', { method: 'GET' })
  if (!response || !response.ok) return null
  const data = await response.json().catch(() => null)
  if (!data) return null

  const streak = data.streak ?? data.current_streak ?? data
  return {
    days: Number(streak.days ?? streak.length ?? 0),
    status: streak.status ?? streak.state ?? 'ACTIVE',
  }
}
