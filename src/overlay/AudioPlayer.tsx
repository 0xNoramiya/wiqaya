import { useRef, useState, useEffect } from 'react'

interface Props {
  audioUrl: string | null
  onPlay: () => void
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ audioUrl, onPlay }: Props) {
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

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }
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
    const handleCanPlay = () => {
      setIsLoading(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
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

  return (
    <div className="wiqaya-audio-player">
      {/* Play/Pause button */}
      <button
        className="wiqaya-audio-play-btn"
        onClick={handleTogglePlay}
        disabled={isLoading}
        aria-label={isPlaying ? 'Pause recitation' : 'Play recitation'}
      >
        {isLoading ? (
          <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>◌</span>
        ) : isPlaying ? (
          /* Pause icon */
          <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            <span style={{ width: '3px', height: '12px', background: 'currentColor', borderRadius: '1px' }} />
            <span style={{ width: '3px', height: '12px', background: 'currentColor', borderRadius: '1px' }} />
          </span>
        ) : (
          /* Play triangle */
          <span style={{
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '6px 0 6px 10px',
            borderColor: 'transparent transparent transparent currentColor',
            marginLeft: '2px',
            display: 'block',
          }} />
        )}
      </button>

      {/* Progress bar */}
      <div className="wiqaya-audio-progress">
        <div
          className="wiqaya-audio-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time */}
      <span className="wiqaya-audio-time">
        {duration > 0
          ? `${formatTime(currentTime)} / ${formatTime(duration)}`
          : isPlaying ? formatTime(currentTime) : 'Recitation'
        }
      </span>
    </div>
  )
}
