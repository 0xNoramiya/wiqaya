import { useRef, useState, useEffect } from 'react'

interface Props {
  audioUrl: string | null
  onPlay: () => void
  autoPlay?: boolean
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Extracts a human-readable reciter name from the audio URL path
function extractReciter(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/')
    // evesalabs / hafs / mishari etc. — pick the first meaningful segment
    const candidate = parts.find(
      (p) => p.length > 3 && !/^\d/.test(p) && p !== 'audio' && p !== 'ayah',
    )
    if (!candidate) return 'Recitation'
    // Convert snake_case or kebab-case to Title Case
    return candidate
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return 'Recitation'
  }
}

export default function AudioPlayer({ audioUrl, onPlay, autoPlay }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)       // 0–100
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!audioUrl) return

    const audio = new Audio(audioUrl)
    audio.preload = 'metadata'
    audioRef.current = audio

    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(100)
    }
    const handleCanPlay = () => setIsLoading(false)

    const handleCanPlayThrough = () => {
      if (autoPlay && !hasPlayed) {
        audio.play().then(() => {
          setIsPlaying(true)
          setIsLoading(false)
          setHasPlayed(true)
          onPlay()
        }).catch(() => {
          // Browser may block autoplay — that's fine, user can click
        })
      }
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('canplaythrough', handleCanPlayThrough)

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('canplaythrough', handleCanPlayThrough)
    }
  }, [audioUrl])

  const handleTogglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      setIsLoading(true)
      audio.play().then(() => {
        setIsPlaying(true)
        setIsLoading(false)
        if (!hasPlayed) {
          setHasPlayed(true)
          onPlay()
        }
      }).catch(() => {
        setIsLoading(false)
      })
    }
  }

  if (!audioUrl) return null

  const reciterName = extractReciter(audioUrl)

  return (
    <div className="wiqaya-audio-player">
      {/* Top row: play button | reciter info | waveform | time */}
      <div className="wiqaya-audio-top-row">
        {/* Play / Pause button */}
        <button
          className={`wiqaya-audio-play-btn${isPlaying ? ' wiqaya-playing' : ''}`}
          onClick={handleTogglePlay}
          disabled={isLoading}
          aria-label={isPlaying ? 'Pause recitation' : 'Play recitation'}
        >
          {isLoading ? (
            /* Loading spinner dots */
            <span style={{ fontSize: '0.6rem', opacity: 0.7, letterSpacing: '2px' }}>•••</span>
          ) : isPlaying ? (
            /* Pause icon */
            <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ width: '3px', height: '13px', background: 'currentColor', borderRadius: '2px' }} />
              <span style={{ width: '3px', height: '13px', background: 'currentColor', borderRadius: '2px' }} />
            </span>
          ) : (
            /* Play triangle */
            <span style={{
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '7px 0 7px 12px',
              borderColor: 'transparent transparent transparent currentColor',
              marginLeft: '3px',
              display: 'block',
            }} />
          )}
        </button>

        {/* Reciter info */}
        <div className="wiqaya-audio-info">
          <span className="wiqaya-audio-label">Recitation</span>
          <span className="wiqaya-audio-reciter">{reciterName}</span>
        </div>

        {/* Waveform equalizer */}
        <div className={`wiqaya-waveform${isPlaying ? ' wiqaya-wave-playing' : ''}`}>
          <div className="wiqaya-wave-bar" />
          <div className="wiqaya-wave-bar" />
          <div className="wiqaya-wave-bar" />
          <div className="wiqaya-wave-bar" />
          <div className="wiqaya-wave-bar" />
          <div className="wiqaya-wave-bar" />
          <div className="wiqaya-wave-bar" />
        </div>

        {/* Time display */}
        <span className="wiqaya-audio-time">
          {duration > 0
            ? `${formatTime(currentTime)} / ${formatTime(duration)}`
            : isPlaying ? formatTime(currentTime) : '--:--'
          }
        </span>
      </div>

      {/* Bottom row: progress bar */}
      <div className="wiqaya-audio-bottom-row">
        <div className="wiqaya-audio-progress">
          <div
            className="wiqaya-audio-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
