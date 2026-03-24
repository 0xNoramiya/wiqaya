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
        <p className="text-sm" style={{ color: '#475569' }}>Loading…</p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="p-6">
        <div
          className="gold-card flex flex-col items-center gap-4 text-center p-6"
          style={{ borderColor: 'rgba(212,175,55,0.2)' }}
        >
          {/* Book CSS art icon */}
          <div style={{ paddingTop: 8 }}>
            <div className="book-icon" />
          </div>

          <div>
            <h2 className="text-white font-semibold text-base mb-1.5">
              Save Your Favourite Verses
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
              Log in to bookmark verses from the overlay and revisit them
              anytime — your personal Quran collection.
            </p>
          </div>

          <button
            onClick={() =>
              chrome.runtime.sendMessage({ type: 'START_LOGIN' })
            }
            className="text-white text-sm font-semibold rounded-lg px-6 py-2.5 transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #2dd4bf, #14b8a6)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #14b8a6, #0d9488)'
            }}
          >
            Log in to save verses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="gold-card card-hover p-4">
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: '#64748b' }}
        >
          Saved Verses
        </h2>

        {bookmarksLoading ? (
          <p className="text-sm" style={{ color: '#475569' }}>Loading bookmarks…</p>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="book-icon" />
            <div>
              <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
                No saved verses yet
              </p>
              <p className="text-xs mt-1 leading-relaxed max-w-[220px]" style={{ color: '#475569' }}>
                Tap the bookmark icon on the overlay to save verses here.
              </p>
            </div>
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
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-all duration-200"
                  style={{
                    background: 'rgba(212,175,55,0.04)',
                    border: '1px solid rgba(212,175,55,0.1)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.08)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.04)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.1)'
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Gold verse badge */}
                    <span className="verse-badge">{verseKey}</span>
                    <span className="text-xs" style={{ color: '#475569' }}>
                      {formatDate(bookmark.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    disabled={deletingId === bookmark.id}
                    className="transition-colors ml-2 text-lg leading-none rounded-full w-6 h-6 flex items-center justify-center disabled:opacity-40"
                    style={{ color: '#475569' }}
                    onMouseEnter={(e) => {
                      if (deletingId !== bookmark.id)
                        (e.currentTarget as HTMLElement).style.color = '#f87171'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = '#475569'
                    }}
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
