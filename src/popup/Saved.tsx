import { useEffect, useState } from 'react'
import type { Bookmark } from '../shared/types'

export default function Saved() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }, (response) => {
      const loggedIn = response?.isLoggedIn ?? false
      setIsLoggedIn(loggedIn)
      setLoading(false)

      if (loggedIn) {
        setBookmarksLoading(true)
        chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' }, (res) => {
          setBookmarks(res?.bookmarks ?? [])
          setBookmarksLoading(false)
        })
      }
    })
  }, [])

  function deleteBookmark(id: string) {
    setDeletingId(id)
    chrome.runtime.sendMessage({ type: 'DELETE_BOOKMARK', id }, (res) => {
      setDeletingId(null)
      if (res?.success !== false) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id))
      }
    })
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col items-center gap-4 text-center">
          <span className="text-4xl">❤️</span>
          <div>
            <h2 className="text-white font-semibold text-base mb-1">
              Save Your Favourite Verses
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Log in to bookmark verses from the overlay and access them here
              anytime.
            </p>
          </div>
          <button
            onClick={() =>
              chrome.runtime.sendMessage({ type: 'START_LOGIN' })
            }
            className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg px-5 py-2 transition-colors"
          >
            Log in to save verses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
          Saved Verses
        </h2>

        {bookmarksLoading ? (
          <p className="text-slate-500 text-sm">Loading bookmarks…</p>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <span className="text-3xl">📖</span>
            <p className="text-slate-400 text-sm font-medium">
              No saved verses yet
            </p>
            <p className="text-slate-500 text-xs leading-relaxed max-w-[220px]">
              Tap the bookmark icon on the overlay to save verses here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {bookmarks.map((bookmark) => {
              const verseKey =
                bookmark.verseNumber != null
                  ? `${bookmark.key}:${bookmark.verseNumber}`
                  : String(bookmark.key)

              return (
                <li
                  key={bookmark.id}
                  className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2.5"
                >
                  <div className="flex flex-col">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: '#D4AF37' }}
                    >
                      {verseKey}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDate(bookmark.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    disabled={deletingId === bookmark.id}
                    className="text-slate-500 hover:text-red-400 transition-colors ml-2 text-lg leading-none disabled:opacity-40"
                    title="Delete bookmark"
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
