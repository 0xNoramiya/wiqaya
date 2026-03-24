import { getStorage, setStorage } from '../shared/storage'
import { GRACE_PERIOD_MINUTES } from '../shared/constants'
import type { SiteTimeEntry, TrackedSite } from '../shared/types'

const ALARM_NAME = 'wiqaya-tick'
const TICK_PERIOD_MINUTES = 0.25 // every 15 seconds

// In-memory state (rehydrated from storage on each alarm tick since SW can be killed)
let currentTrackedTabId: number | null = null
let isOverlayShowing = false

/**
 * Extract hostname from a URL string. Returns null for non-http(s) URLs.
 */
export function getDomainFromUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    // Remove leading 'www.' for consistent matching
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * Get today's date as YYYY-MM-DD in local time.
 */
function todayString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Find a tracked site entry matching the given domain (checks exact match and
 * whether the domain ends with `.trackedDomain`).
 */
function findTrackedSite(domain: string, trackedSites: TrackedSite[]): TrackedSite | null {
  for (const site of trackedSites) {
    const tracked = site.domain.replace(/^www\./, '')
    if (domain === tracked || domain.endsWith(`.${tracked}`)) {
      return site
    }
  }
  return null
}

/**
 * Update badge text for the active tab. Shows minutes spent if on a tracked
 * site, clears badge otherwise.
 */
async function updateBadge(domain: string | null, tabId: number | null): Promise<void> {
  if (!domain || tabId === null) {
    chrome.action.setBadgeText({ text: '' })
    return
  }

  const { trackedSites, siteTimeEntries } = await getStorage(['trackedSites', 'siteTimeEntries'])
  const site = findTrackedSite(domain, trackedSites)
  if (!site) {
    chrome.action.setBadgeText({ text: '' })
    return
  }

  const entry = siteTimeEntries[site.domain]
  const today = todayString()
  const timeSpentMs = entry && entry.date === today ? entry.timeSpentMs : 0
  const minutesSpent = Math.floor(timeSpentMs / 60000)

  chrome.action.setBadgeBackgroundColor({ color: '#10b981' })
  chrome.action.setBadgeText({ text: `${minutesSpent}m` })
}

/**
 * Determine the active tab and update `currentTrackedTabId`.
 * Returns { tabId, domain } for the active tab, or nulls if unavailable.
 */
async function getActiveTabInfo(): Promise<{ tabId: number | null; domain: string | null }> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (!tab?.id || !tab.url) return { tabId: null, domain: null }
    const domain = getDomainFromUrl(tab.url)
    return { tabId: tab.id, domain }
  } catch {
    return { tabId: null, domain: null }
  }
}

/**
 * Reset time entries whose stored date doesn't match today (daily reset).
 */
async function resetStaleEntries(): Promise<void> {
  const today = todayString()
  const { siteTimeEntries } = await getStorage(['siteTimeEntries'])
  let changed = false
  for (const domain of Object.keys(siteTimeEntries)) {
    if (siteTimeEntries[domain].date !== today) {
      siteTimeEntries[domain] = { domain, timeSpentMs: 0, date: today }
      changed = true
    }
  }
  if (changed) {
    await setStorage({ siteTimeEntries })
  }
}

/**
 * Core tick logic — called on each alarm fire.
 * Increments time for the active tracked domain and checks thresholds.
 */
async function onTick(): Promise<void> {
  await resetStaleEntries()

  const { tabId, domain } = await getActiveTabInfo()
  if (!domain || tabId === null) {
    currentTrackedTabId = null
    chrome.action.setBadgeText({ text: '' })
    return
  }

  currentTrackedTabId = tabId

  const {
    trackedSites,
    globalTimeLimitMinutes,
    siteTimeEntries,
  } = await getStorage(['trackedSites', 'globalTimeLimitMinutes', 'siteTimeEntries'])

  const site = findTrackedSite(domain, trackedSites)
  if (!site) {
    chrome.action.setBadgeText({ text: '' })
    return
  }

  const today = todayString()
  const tickMs = TICK_PERIOD_MINUTES * 60 * 1000

  // Increment time for the canonical tracked domain key
  const existing: SiteTimeEntry = siteTimeEntries[site.domain] ?? {
    domain: site.domain,
    timeSpentMs: 0,
    date: today,
  }

  // Ensure we're working with today's data
  if (existing.date !== today) {
    existing.timeSpentMs = 0
    existing.date = today
  }

  existing.timeSpentMs += tickMs
  siteTimeEntries[site.domain] = existing
  await setStorage({ siteTimeEntries })

  // Update badge
  const minutesSpent = Math.floor(existing.timeSpentMs / 60000)
  chrome.action.setBadgeBackgroundColor({ color: '#10b981' })
  chrome.action.setBadgeText({ text: `${minutesSpent}m`, tabId })

  // Determine effective limit (site-specific takes priority over global)
  const limitMs =
    (site.timeLimitMinutes > 0 ? site.timeLimitMinutes : globalTimeLimitMinutes) * 60 * 1000

  // Check if we should trigger overlay
  if (!isOverlayShowing && existing.timeSpentMs >= limitMs) {
    isOverlayShowing = true
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'TRIGGER_OVERLAY' })
    } catch {
      // Content script may not be ready; silently ignore
      isOverlayShowing = false
    }
  }
}

/**
 * Handle tab activation and updates — update badge and reset overlay flag
 * when navigating away from a tracked site.
 */
async function onTabChange(): Promise<void> {
  const { tabId, domain } = await getActiveTabInfo()
  currentTrackedTabId = tabId

  if (!domain) {
    chrome.action.setBadgeText({ text: '' })
    isOverlayShowing = false
    return
  }

  const { trackedSites } = await getStorage(['trackedSites'])
  const site = findTrackedSite(domain, trackedSites)
  if (!site) {
    chrome.action.setBadgeText({ text: '' })
    isOverlayShowing = false
  } else {
    await updateBadge(site.domain, tabId)
  }
}

/**
 * Apply grace period for a domain after the overlay is dismissed.
 * Subtracts GRACE_PERIOD_MINUTES from the stored time so the user gets
 * extra browsing time before the overlay triggers again.
 */
export async function applyGracePeriod(domain: string): Promise<void> {
  const { siteTimeEntries, trackedSites } = await getStorage(['siteTimeEntries', 'trackedSites'])
  const site = findTrackedSite(domain, trackedSites)
  if (!site) return

  const entry = siteTimeEntries[site.domain]
  if (!entry) return

  const graceMs = GRACE_PERIOD_MINUTES * 60 * 1000
  entry.timeSpentMs = Math.max(0, entry.timeSpentMs - graceMs)
  siteTimeEntries[site.domain] = entry
  await setStorage({ siteTimeEntries })
  isOverlayShowing = false
}

/**
 * Mark overlay as dismissed without applying grace period (e.g. after verse
 * read — grace is already baked in by the caller).
 */
export function dismissOverlay(): void {
  isOverlayShowing = false
}

/**
 * Wire up all Chrome listeners. Called once when the service worker starts.
 */
export function startTracking(): void {
  // Periodic alarm — primary time-tracking mechanism
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: TICK_PERIOD_MINUTES })

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
      onTick()
    }
  })

  // React to tab switching
  chrome.tabs.onActivated.addListener(() => {
    onTabChange()
  })

  // React to navigation within a tab
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      onTabChange()
    }
  })

  // Pause tracking when the user goes idle or locks the screen
  chrome.idle.onStateChanged.addListener((state) => {
    if (state === 'idle' || state === 'locked') {
      // Simply do nothing on the next tick — time won't accumulate while idle
      // We do update the badge to reflect that tracking is paused
      chrome.action.setBadgeText({ text: '' })
    } else if (state === 'active') {
      onTabChange()
    }
  })
}
