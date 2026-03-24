import { useState, useEffect } from 'react'
import type { VerseData } from '../shared/types'
import AyahCard from './AyahCard'
import AudioPlayer from './AudioPlayer'

interface Props {
  onDismiss: () => void
}

function LoadingSpinner() {
  return (
    <div className="wiqaya-loading">
      <div className="wiqaya-spinner" />
      <p className="wiqaya-loading-text">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="wiqaya-error">
      <span className="wiqaya-error-icon">✦</span>
      <p>Could not load verse. Please try again.</p>
    </div>
  )
}

export default function App({ onDismiss }: Props) {
  const [verse, setVerse] = useState<VerseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [translationRevealed, setTranslationRevealed] = useState(false)
  const [audioPlayed, setAudioPlayed] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_VERSE' }, (response) => {
      if (response?.data) setVerse(response.data)
      setLoading(false)
    })

    // Start 30s engagement timer
    const timer = setTimeout(() => setTimeElapsed(true), 30000)

    // Trigger fade-in on next frame
    requestAnimationFrame(() => setVisible(true))

    return () => clearTimeout(timer)
  }, [])

  const isEngaged = translationRevealed || audioPlayed || timeElapsed

  const handleContinue = () => {
    if (verse) {
      chrome.runtime.sendMessage({
        type: 'LOG_SESSION',
        chapterNumber: verse.chapterNumber,
        verseNumber: verse.verseNumber,
      })
      chrome.runtime.sendMessage({ type: 'DISMISS_OVERLAY' })
    }
    onDismiss()
  }

  const handleBookmark = () => {
    if (verse && !isBookmarked) {
      chrome.runtime.sendMessage(
        {
          type: 'BOOKMARK_VERSE',
          verseKey: verse.verseKey,
          chapterNumber: verse.chapterNumber,
          verseNumber: verse.verseNumber,
        },
        (response) => {
          if (response?.success) setIsBookmarked(true)
        },
      )
    }
  }

  return (
    <div className={`wiqaya-overlay${visible ? ' wiqaya-visible' : ''}`}>
      {/* Blurred dark backdrop */}
      <div className="wiqaya-backdrop" />

      {/* Centered content */}
      <div className="wiqaya-content">
        {loading ? (
          <LoadingSpinner />
        ) : verse ? (
          <>
            <AyahCard
              verse={verse}
              translationRevealed={translationRevealed}
              onRevealTranslation={() => setTranslationRevealed(true)}
              isBookmarked={isBookmarked}
              onBookmark={handleBookmark}
            />

            <AudioPlayer
              audioUrl={verse.audioUrl}
              onPlay={() => setAudioPlayed(true)}
            />

            {isEngaged && (
              <button onClick={handleContinue} className="wiqaya-continue-btn">
                Continue Browsing
              </button>
            )}
          </>
        ) : (
          <ErrorState />
        )}
      </div>
    </div>
  )
}
