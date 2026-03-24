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
      <div style={{ position: 'relative', width: '3rem', height: '3rem' }}>
        <div className="wiqaya-spinner" />
        <div className="wiqaya-spinner-ring" />
      </div>
      <p className="wiqaya-loading-text">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="wiqaya-error">
      <span className="wiqaya-error-icon">✦</span>
      <p>Could not load verse. Please try again.</p>
      <button onClick={onRetry} className="wiqaya-reveal-btn" style={{ marginTop: '1rem' }}>
        Try Again
      </button>
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [autoPlay, setAutoPlay] = useState(false)

  const fetchVerse = () => {
    setLoading(true)
    setVerse(null)
    chrome.runtime.sendMessage({ type: 'GET_VERSE' }, (response) => {
      if (response?.data) setVerse(response.data)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchVerse()

    // Read theme and autoPlayAudio setting
    chrome.storage.local.get(['theme', 'autoPlayAudio'], (result) => {
      setTheme(result.theme ?? 'dark')
      setAutoPlay(result.autoPlayAudio ?? false)
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
    <div className={`wiqaya-overlay${visible ? ' wiqaya-visible' : ''}${theme === 'light' ? ' wiqaya-light' : ''}`}>
      {/* Blurred dark backdrop */}
      <div className="wiqaya-backdrop" />

      {/* Central radial glow */}
      <div className="wiqaya-backdrop-glow" />

      {/* Floating gold particles */}
      <div className="wiqaya-particles" aria-hidden="true">
        <div className="wiqaya-particle" />
        <div className="wiqaya-particle" />
        <div className="wiqaya-particle" />
        <div className="wiqaya-particle" />
        <div className="wiqaya-particle" />
        <div className="wiqaya-particle" />
        <div className="wiqaya-particle" />
        <div className="wiqaya-particle" />
        <div className="wiqaya-particle" />
      </div>

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
              autoPlay={autoPlay}
            />

            {isEngaged && (
              <button onClick={handleContinue} className="wiqaya-continue-btn">
                Continue Browsing
                <span className="wiqaya-continue-btn-arrow">→</span>
              </button>
            )}
          </>
        ) : (
          <ErrorState onRetry={fetchVerse} />
        )}
      </div>
    </div>
  )
}
