import { startTracking, applyGracePeriod, dismissOverlay, getDomainFromUrl } from './tracker'
import { fetchRandomVerse } from './api'
import { startLogin, handleAuthCallback, isLoggedIn, addBookmark, getBookmarks, deleteBookmark, logReadingSession, logActivityDay, getStreaks, logout } from './auth'
import { getStorage, setStorage } from '../shared/storage'

startTracking()

// Set up message listener for content script and popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_VERSE') {
    fetchRandomVerse().then(data => {
      sendResponse({ type: 'VERSE_DATA', data })
    }).catch(err => {
      console.error('Failed to fetch verse:', err)
      sendResponse({ type: 'VERSE_DATA', data: null })
    })
    return true
  }

  if (message.type === 'DISMISS_OVERLAY') {
    const domain = getDomainFromUrl(sender.tab?.url)
    if (domain) {
      applyGracePeriod(domain).then(() => {
        sendResponse({ type: 'DISMISS_OVERLAY' })
      })
    } else {
      dismissOverlay()
      sendResponse({ type: 'DISMISS_OVERLAY' })
    }
    return true
  }

  if (message.type === 'START_LOGIN') {
    startLogin().then(() => sendResponse({ success: true }))
    return true
  }

  if (message.type === 'AUTH_CALLBACK') {
    handleAuthCallback(message.code, message.state).then(success => {
      sendResponse({ success })
    })
    return true
  }

  if (message.type === 'GET_AUTH_STATUS') {
    isLoggedIn().then(loggedIn => {
      sendResponse({ type: 'AUTH_STATUS', isLoggedIn: loggedIn })
    })
    return true
  }

  if (message.type === 'BOOKMARK_VERSE') {
    addBookmark(message.chapterNumber, message.verseNumber).then(success => {
      sendResponse({ type: 'BOOKMARK_RESULT', success })
    })
    return true
  }

  if (message.type === 'GET_BOOKMARKS') {
    getBookmarks().then(bookmarks => {
      sendResponse({ type: 'BOOKMARKS_DATA', bookmarks })
    })
    return true
  }

  if (message.type === 'DELETE_BOOKMARK') {
    deleteBookmark(message.id).then(success => {
      sendResponse({ success })
    })
    return true
  }

  if (message.type === 'LOG_SESSION') {
    // Log reading session + activity day + increment verse count
    // User API calls are best-effort; local counts always increment
    Promise.all([
      logReadingSession(message.chapterNumber, message.verseNumber).catch(() => {}),
      logActivityDay(`${message.chapterNumber}:${message.verseNumber}`, 30).catch(() => {}),
    ]).then(async () => {
      const { versesReadToday, totalVersesRead } = await getStorage(['versesReadToday', 'totalVersesRead'])
      await setStorage({
        versesReadToday: versesReadToday + 1,
        totalVersesRead: totalVersesRead + 1,
      })
      sendResponse({ success: true })
    }).catch(() => sendResponse({ success: false }))
    return true
  }

  if (message.type === 'GET_STREAKS') {
    getStreaks().then(streak => {
      sendResponse({ type: 'STREAKS_DATA', streak })
    })
    return true
  }

  if (message.type === 'LOGOUT') {
    logout().then(() => sendResponse({ success: true }))
    return true
  }

  return true // Keep message channel open for async responses
})
