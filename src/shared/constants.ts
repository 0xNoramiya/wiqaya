export const CONTENT_API_BASE = 'https://apis.quran.foundation'
export const CONTENT_OAUTH2_BASE = 'https://oauth2.quran.foundation'
export const CONTENT_CLIENT_ID = import.meta.env.VITE_QF_CONTENT_CLIENT_ID || import.meta.env.VITE_QF_CLIENT_ID || ''
export const CONTENT_CLIENT_SECRET = import.meta.env.VITE_QF_CONTENT_CLIENT_SECRET || import.meta.env.VITE_QF_CLIENT_SECRET || ''
export const CONTENT_API = `${CONTENT_API_BASE}/content/api/v4`
export const CONTENT_TOKEN_URL = `${CONTENT_OAUTH2_BASE}/oauth2/token`

export const AUTH_API_BASE = 'https://apis-prelive.quran.foundation'
export const AUTH_OAUTH2_BASE = 'https://prelive-oauth2.quran.foundation'
export const AUTH_CLIENT_ID = import.meta.env.VITE_QF_AUTH_CLIENT_ID || ''
export const AUTH_CLIENT_SECRET = import.meta.env.VITE_QF_AUTH_CLIENT_SECRET || ''
export const USER_API = `${AUTH_API_BASE}/auth/v1`
export const AUTH_TOKEN_URL = `${AUTH_OAUTH2_BASE}/oauth2/token`
export const AUTH_URL = `${AUTH_OAUTH2_BASE}/oauth2/auth`

export const DEFAULT_TRANSLATION_ID = 85
export const DEFAULT_RECITATION_ID = 7
export const DEFAULT_TIME_LIMIT_MINUTES = 1
export const ENGAGEMENT_DELAY_MS = 30000
export const GRACE_PERIOD_MINUTES = 10
