import { startTracking, applyGracePeriod, dismissOverlay, getDomainFromUrl } from './tracker'
import { fetchRandomVerse } from './api'

startTracking()

// Set up message listener for content script and popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages - will be expanded in later tasks
  if (message.type === 'GET_VERSE') {
    fetchRandomVerse().then(data => {
      sendResponse({ type: 'VERSE_DATA', data })
    }).catch(err => {
      console.error('Failed to fetch verse:', err)
      sendResponse({ type: 'VERSE_DATA', data: null })
    })
    return true // async response
  }

  if (message.type === 'DISMISS_OVERLAY') {
    // Determine the domain of the sender tab and apply grace period
    const domain = getDomainFromUrl(sender.tab?.url)
    if (domain) {
      applyGracePeriod(domain).then(() => {
        sendResponse({ type: 'DISMISS_OVERLAY' })
      })
    } else {
      dismissOverlay()
      sendResponse({ type: 'DISMISS_OVERLAY' })
    }
  }
  return true // Keep message channel open for async responses
})
