export interface TrackedSite {
  domain: string
  timeLimitMinutes: number
}

export interface SiteTimeEntry {
  domain: string
  timeSpentMs: number
  date: string // YYYY-MM-DD
}

export interface VerseData {
  verseKey: string
  chapterNumber: number
  verseNumber: number
  textUthmani: string
  translationText: string
  translationName: string
  chapterNameArabic: string
  chapterNameSimple: string
  audioUrl: string | null
}

export interface WiqayaStorage {
  trackedSites: TrackedSite[]
  globalTimeLimitMinutes: number
  siteTimeEntries: Record<string, SiteTimeEntry> // keyed by domain
  versesReadToday: number
  totalVersesRead: number
  translationId: number
  recitationId: number
  autoPlayAudio: boolean
  accessToken: string | null
  refreshToken: string | null
  tokenExpiresAt: number | null
  contentAccessToken: string | null
  contentTokenExpiresAt: number | null
}

export interface Bookmark {
  id: string
  createdAt: string
  type: string
  key: number
  verseNumber?: number
}

export type WiqayaMessage =
  | { type: 'TRIGGER_OVERLAY' }
  | { type: 'DISMISS_OVERLAY' }
  | { type: 'GET_VERSE' }
  | { type: 'VERSE_DATA'; data: VerseData }
  | { type: 'BOOKMARK_VERSE'; verseKey: string; chapterNumber: number; verseNumber: number }
  | { type: 'BOOKMARK_RESULT'; success: boolean }
  | { type: 'LOG_SESSION'; chapterNumber: number; verseNumber: number }
  | { type: 'GET_AUTH_STATUS' }
  | { type: 'AUTH_STATUS'; isLoggedIn: boolean }
  | { type: 'START_LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'AUTH_CALLBACK'; code: string; state: string }
  | { type: 'GET_BOOKMARKS' }
  | { type: 'BOOKMARKS_DATA'; bookmarks: Bookmark[] }
  | { type: 'DELETE_BOOKMARK'; id: string }
  | { type: 'GET_STREAKS' }
  | { type: 'STREAKS_DATA'; streak: { days: number; status: string } | null }
