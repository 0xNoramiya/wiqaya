import { CONTENT_API, TOKEN_URL, CLIENT_ID, CLIENT_SECRET } from '../shared/constants'
import { getStorage, setStorage } from '../shared/storage'
import type { VerseData } from '../shared/types'

interface Chapter {
  id: number
  name_simple: string
  name_arabic: string
  verses_count: number
}

let chaptersCache: Chapter[] | null = null

async function getContentToken(): Promise<string> {
  const { contentAccessToken, contentTokenExpiresAt } = await getStorage([
    'contentAccessToken',
    'contentTokenExpiresAt',
  ])

  if (contentAccessToken && contentTokenExpiresAt && Date.now() < contentTokenExpiresAt) {
    return contentAccessToken
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(CLIENT_ID + ':' + CLIENT_SECRET)}`,
    },
    body: 'grant_type=client_credentials&scope=content',
  })

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const newToken: string = data.access_token
  const expiresAt: number = Date.now() + data.expires_in * 1000

  await setStorage({
    contentAccessToken: newToken,
    contentTokenExpiresAt: expiresAt,
  })

  return newToken
}

async function getChapters(): Promise<Chapter[]> {
  if (chaptersCache) {
    return chaptersCache
  }

  // Try to load from storage first (handles service worker restarts)
  const stored = await chrome.storage.local.get('chaptersCache')
  if (stored.chaptersCache && Array.isArray(stored.chaptersCache)) {
    chaptersCache = stored.chaptersCache as Chapter[]
    return chaptersCache
  }

  const token = await getContentToken()
  const response = await fetch(`${CONTENT_API}/chapters`, {
    headers: {
      'x-auth-token': token,
      'x-client-id': CLIENT_ID,
    },
  })

  if (!response.ok) {
    throw new Error(`Chapters request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  chaptersCache = data.chapters as Chapter[]

  await chrome.storage.local.set({ chaptersCache })

  return chaptersCache
}

// On module load, try to warm the chapters cache from storage
chrome.storage.local.get('chaptersCache').then((stored) => {
  if (stored.chaptersCache && Array.isArray(stored.chaptersCache)) {
    chaptersCache = stored.chaptersCache as Chapter[]
  }
})

export async function fetchRandomVerse(): Promise<VerseData> {
  const token = await getContentToken()
  const { translationId, recitationId } = await getStorage(['translationId', 'recitationId'])

  const effectiveTranslationId = translationId ?? 85
  const effectiveRecitationId = recitationId ?? 7

  // 1. Fetch random verse (text_uthmani only — translations come from separate endpoint)
  const verseResponse = await fetch(
    `${CONTENT_API}/verses/random?fields=text_uthmani&language=en`,
    {
      headers: {
        'x-auth-token': token,
        'x-client-id': CLIENT_ID,
      },
    }
  )

  if (!verseResponse.ok) {
    throw new Error(`Verse request failed: ${verseResponse.status} ${verseResponse.statusText}`)
  }

  const verseData = await verseResponse.json()
  const verse = verseData.verse

  const verseKey: string = verse.verse_key
  const chapterNumber = parseInt(verseKey.split(':')[0])

  // 2. Fetch translation separately via /quran/translations/{id}?verse_key={key}
  let translationText = ''
  let translationName = 'Unknown'
  try {
    const translationResponse = await fetch(
      `${CONTENT_API}/quran/translations/${effectiveTranslationId}?verse_key=${verseKey}`,
      {
        headers: {
          'x-auth-token': token,
          'x-client-id': CLIENT_ID,
        },
      }
    )
    if (translationResponse.ok) {
      const translationData = await translationResponse.json()
      translationText = translationData.translations?.[0]?.text || ''
      translationName = translationData.meta?.translation_name || 'Unknown'
      // Strip HTML tags from translation text
      translationText = translationText.replace(/<[^>]*>/g, '')
    }
  } catch {
    console.warn('Translation fetch failed')
  }

  // 3. Get chapter info
  const chapters = await getChapters()
  const chapter = chapters.find((c) => c.id === chapterNumber)

  if (!chapter) {
    throw new Error(`Chapter ${chapterNumber} not found in cache`)
  }

  // 4. Fetch audio
  let audioUrl: string | null = null
  try {
    const audioResponse = await fetch(
      `${CONTENT_API}/recitations/${effectiveRecitationId}/by_ayah/${verseKey}`,
      {
        headers: {
          'x-auth-token': token,
          'x-client-id': CLIENT_ID,
        },
      }
    )
    if (audioResponse.ok) {
      const audioData = await audioResponse.json()
      const rawUrl = audioData.audio_files?.[0]?.url || null
      if (rawUrl) {
        // API returns relative paths like "Alafasy/mp3/002255.mp3" — prepend CDN base
        audioUrl = rawUrl.startsWith('http') ? rawUrl : `https://audio.qurancdn.com/${rawUrl}`
      }
    }
  } catch {
    console.warn('Audio fetch failed')
  }

  return {
    verseKey,
    chapterNumber,
    verseNumber: parseInt(verseKey.split(':')[1]),
    textUthmani: verse.text_uthmani,
    translationText,
    translationName,
    chapterNameArabic: chapter.name_arabic,
    chapterNameSimple: chapter.name_simple,
    audioUrl,
  }
}
