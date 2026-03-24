import { AUTH_URL, AUTH_TOKEN_URL, USER_API, AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, MUSHAF_ID } from '../shared/constants'
import { getStorage, setStorage } from '../shared/storage'
import type { Bookmark } from '../shared/types'

// --- PKCE Helpers ---

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function generateState(): string {
  return crypto.randomUUID()
}

// --- Login Flow ---

export async function startLogin(): Promise<boolean> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateState()

  const redirectUrl = 'https://0xnoramiya.github.io/wiqaya/docs/callback.html'

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH_CLIENT_ID,
    redirect_uri: redirectUrl,
    scope: 'openid offline_access user collection',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })

  const authorizeUrl = `${AUTH_URL}?${params.toString()}`

  try {
    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authorizeUrl,
      interactive: true,
    })

    if (!responseUrl) return false

    const url = new URL(responseUrl)
    const code = url.searchParams.get('code')
    const returnedState = url.searchParams.get('state')

    if (!code || returnedState !== state) return false

    // Exchange code for tokens
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUrl,
      code_verifier: verifier,
      client_id: AUTH_CLIENT_ID,
    })

    const response = await fetch(AUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(AUTH_CLIENT_ID + ':' + AUTH_CLIENT_SECRET)}`,
      },
      body: body.toString(),
    })

    if (!response.ok) return false

    const data = await response.json()
    await setStorage({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: Date.now() + data.expires_in * 1000,
    })

    return true
  } catch (err) {
    console.error('Login failed:', err)
    return false
  }
}

// --- Token Refresh ---

export async function getValidAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken, tokenExpiresAt } = await getStorage([
    'accessToken',
    'refreshToken',
    'tokenExpiresAt',
  ])

  if (!accessToken) return null

  if (tokenExpiresAt && Date.now() < tokenExpiresAt - 60000) {
    return accessToken
  }

  if (!refreshToken) {
    await setStorage({ accessToken: null, refreshToken: null, tokenExpiresAt: null })
    return null
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })

    const response = await fetch(AUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(AUTH_CLIENT_ID + ':' + AUTH_CLIENT_SECRET)}`,
      },
      body: body.toString(),
    })

    if (!response.ok) {
      await setStorage({ accessToken: null, refreshToken: null, tokenExpiresAt: null })
      return null
    }

    const data = await response.json()
    const { access_token, refresh_token, expires_in } = data

    await setStorage({
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: Date.now() + expires_in * 1000,
    })

    return access_token
  } catch {
    await setStorage({ accessToken: null, refreshToken: null, tokenExpiresAt: null })
    return null
  }
}

// --- User API Helpers ---

async function getAuthHeaders(): Promise<Record<string, string> | null> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) return null
  return {
    'x-auth-token': accessToken,
    'x-client-id': AUTH_CLIENT_ID,
    'Content-Type': 'application/json',
  }
}

// --- Bookmark API ---

export async function addBookmark(chapterNumber: number, verseNumber: number): Promise<boolean> {
  const headers = await getAuthHeaders()
  if (!headers) return false

  try {
    const response = await fetch(`${USER_API}/bookmarks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ key: chapterNumber, type: 'ayah', verseNumber, mushaf: MUSHAF_ID }),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function getBookmarks(): Promise<Bookmark[]> {
  const headers = await getAuthHeaders()
  if (!headers) return []

  try {
    const response = await fetch(`${USER_API}/bookmarks?mushafId=${MUSHAF_ID}&type=ayah&first=20`, {
      headers,
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.data ?? []
  } catch {
    return []
  }
}

export async function deleteBookmark(id: string): Promise<boolean> {
  const headers = await getAuthHeaders()
  if (!headers) return false

  try {
    const response = await fetch(`${USER_API}/bookmarks/${id}`, {
      method: 'DELETE',
      headers,
    })
    return response.ok
  } catch {
    return false
  }
}

// --- Reading Session / Activity ---

export async function logReadingSession(chapterNumber: number, verseNumber: number): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers) return

  await fetch(`${USER_API}/reading-sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ chapterNumber, verseNumber }),
  })
}

export async function logActivityDay(verseKey: string, seconds: number): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers) return

  await fetch(`${USER_API}/activity-days`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'QURAN', seconds, ranges: [verseKey], mushafId: MUSHAF_ID }),
  })
}

// --- Streaks ---

export async function getStreaks(): Promise<{ days: number; status: string } | null> {
  const headers = await getAuthHeaders()
  if (!headers) return null

  try {
    const response = await fetch(
      `${USER_API}/streaks?type=QURAN&status=ACTIVE&first=1&sortOrder=desc&orderBy=startDate`,
      { headers }
    )
    if (!response.ok) return null
    const data = await response.json()
    return data.data?.[0] ?? null
  } catch {
    return null
  }
}

// --- Auth State ---

export async function logout(): Promise<void> {
  await setStorage({ accessToken: null, refreshToken: null, tokenExpiresAt: null })
}

export async function isLoggedIn(): Promise<boolean> {
  const { accessToken } = await getStorage(['accessToken'])
  return !!accessToken
}
