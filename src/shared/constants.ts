// Content API — use production for full Quran data
export const CONTENT_API_BASE = 'https://apis.quran.foundation'
export const CONTENT_OAUTH2_BASE = 'https://oauth2.quran.foundation'
export const CONTENT_CLIENT_ID = import.meta.env.VITE_QF_CONTENT_CLIENT_ID || import.meta.env.VITE_QF_CLIENT_ID || ''
export const CONTENT_CLIENT_SECRET = import.meta.env.VITE_QF_CONTENT_CLIENT_SECRET || import.meta.env.VITE_QF_CLIENT_SECRET || ''
export const CONTENT_API = `${CONTENT_API_BASE}/content/api/v4`
export const CONTENT_TOKEN_URL = `${CONTENT_OAUTH2_BASE}/oauth2/token`

// User/Auth API — use prelive (has all auth features enabled for testing)
export const AUTH_API_BASE = 'https://apis-prelive.quran.foundation'
export const AUTH_OAUTH2_BASE = 'https://prelive-oauth2.quran.foundation'
export const AUTH_CLIENT_ID = import.meta.env.VITE_QF_AUTH_CLIENT_ID || '742879bd-48ab-4df0-8eb6-6227cd5110c5'
export const AUTH_CLIENT_SECRET = import.meta.env.VITE_QF_AUTH_CLIENT_SECRET || 'KkBV6K-RgtE3xkGFcYTZT7de87'
export const USER_API = `${AUTH_API_BASE}/auth/v1`
export const AUTH_TOKEN_URL = `${AUTH_OAUTH2_BASE}/oauth2/token`
export const AUTH_URL = `${AUTH_OAUTH2_BASE}/oauth2/auth`

// Legacy aliases used by existing code
export const CLIENT_ID = CONTENT_CLIENT_ID
export const CLIENT_SECRET = CONTENT_CLIENT_SECRET
export const TOKEN_URL = CONTENT_TOKEN_URL
export const OAUTH2_BASE = AUTH_OAUTH2_BASE
export const MUSHAF_ID = 1

export const DEFAULT_TRANSLATION_ID = 85
export const DEFAULT_RECITATION_ID = 7
export const DEFAULT_TIME_LIMIT_MINUTES = 0.1 // ~6 seconds for testing
export const ENGAGEMENT_DELAY_MS = 30000
export const GRACE_PERIOD_MINUTES = 10
