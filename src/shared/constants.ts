const env = import.meta.env.VITE_QF_ENV || 'prelive'
const isPrelive = env === 'prelive'

export const API_BASE = isPrelive
  ? 'https://apis-prelive.quran.foundation'
  : 'https://apis.quran.foundation'

export const OAUTH2_BASE = isPrelive
  ? 'https://prelive-oauth2.quran.foundation'
  : 'https://oauth2.quran.foundation'

export const CLIENT_ID = import.meta.env.VITE_QF_CLIENT_ID || ''
export const CLIENT_SECRET = import.meta.env.VITE_QF_CLIENT_SECRET || ''

export const CONTENT_API = `${API_BASE}/content/api/v4`
export const USER_API = `${API_BASE}/auth/v1`
export const TOKEN_URL = `${OAUTH2_BASE}/oauth2/token`
export const AUTH_URL = `${OAUTH2_BASE}/oauth2/auth`

export const DEFAULT_TRANSLATION_ID = 85 // M.A.S. Abdel Haleem
export const DEFAULT_RECITATION_ID = 7
export const DEFAULT_TIME_LIMIT_MINUTES = 0.1 // ~6 seconds for testing
export const ENGAGEMENT_DELAY_MS = 30000
export const MUSHAF_ID = 1
export const GRACE_PERIOD_MINUTES = 10
