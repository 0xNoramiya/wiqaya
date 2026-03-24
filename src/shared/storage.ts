import type { WiqayaStorage } from './types'
import { DEFAULT_TIME_LIMIT_MINUTES } from './constants'

const DEFAULTS: WiqayaStorage = {
  trackedSites: [],
  globalTimeLimitMinutes: DEFAULT_TIME_LIMIT_MINUTES,
  siteTimeEntries: {},
  versesReadToday: 0,
  totalVersesRead: 0,
  translationId: 85,
  recitationId: 7,
  autoPlayAudio: false,
  accessToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  contentAccessToken: null,
  contentTokenExpiresAt: null,
  lastTrackedDate: null,
}

export async function getStorage<K extends keyof WiqayaStorage>(
  keys: K[]
): Promise<Pick<WiqayaStorage, K>> {
  const result = await chrome.storage.local.get(keys)
  const out: any = {}
  for (const k of keys) {
    out[k] = result[k] ?? DEFAULTS[k]
  }
  return out
}

export async function setStorage(data: Partial<WiqayaStorage>): Promise<void> {
  await chrome.storage.local.set(data)
}
