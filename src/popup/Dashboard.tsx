import { useEffect, useState } from 'react'
import type { SiteTimeEntry, TrackedSite } from '../shared/types'

interface DashboardData {
  siteTimeEntries: Record<string, SiteTimeEntry>
  versesReadToday: number
  totalVersesRead: number
  trackedSites: TrackedSite[]
}

interface StreakData {
  days?: number
  status?: string
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  if (seconds === 0) return `${minutes}m`
  return `${minutes}m ${seconds}s`
}

/** Deterministic pastel color from a domain string */
function domainColor(domain: string): string {
  const colors = [
    '#14b8a6', '#6366f1', '#f59e0b', '#ec4899',
    '#8b5cf6', '#10b981', '#f97316', '#3b82f6',
  ]
  let hash = 0
  for (let i = 0; i < domain.length; i++) hash = domain.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    siteTimeEntries: {},
    versesReadToday: 0,
    totalVersesRead: 0,
    trackedSites: [],
  })
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loadingStreak, setLoadingStreak] = useState(true)

  useEffect(() => {
    chrome.storage.local.get(
      ['siteTimeEntries', 'versesReadToday', 'totalVersesRead', 'trackedSites'],
      (result) => {
        setData({
          siteTimeEntries: result.siteTimeEntries ?? {},
          versesReadToday: result.versesReadToday ?? 0,
          totalVersesRead: result.totalVersesRead ?? 0,
          trackedSites: result.trackedSites ?? [],
        })
      }
    )

    chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }, (response) => {
      const loggedIn = response?.isLoggedIn ?? false
      setIsLoggedIn(loggedIn)

      if (loggedIn) {
        chrome.runtime.sendMessage({ type: 'GET_STREAKS' }, (streakResponse) => {
          setStreak(streakResponse?.streak ?? null)
          setLoadingStreak(false)
        })
      } else {
        setLoadingStreak(false)
      }
    })
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayEntries = Object.values(data.siteTimeEntries).filter(
    (e) => e.date === today
  )

  return (
    <div className="p-4 flex flex-col gap-3">

      {/* Verses Read — hero stat */}
      <div className="gold-card card-hover p-4">
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: '#64748b' }}
        >
          Verses Read
        </h2>
        <div className="flex items-center">
          {/* Today */}
          <div className="flex-1 flex flex-col items-center">
            <span
              className="text-4xl font-bold gold-glow"
              style={{ color: '#D4AF37' }}
            >
              {data.versesReadToday}
            </span>
            <span className="text-xs mt-1" style={{ color: '#64748b' }}>Today</span>
          </div>

          {/* Divider diamond */}
          <div className="flex flex-col items-center gap-1 px-2">
            <div style={{ width: 1, height: 20, background: 'rgba(212,175,55,0.2)' }} />
            <span style={{ color: '#D4AF37', fontSize: 10 }}>◆</span>
            <div style={{ width: 1, height: 20, background: 'rgba(212,175,55,0.2)' }} />
          </div>

          {/* All Time */}
          <div className="flex-1 flex flex-col items-center">
            <span className="text-4xl font-bold" style={{ color: '#14b8a6' }}>
              {data.totalVersesRead}
            </span>
            <span className="text-xs mt-1" style={{ color: '#64748b' }}>All Time</span>
          </div>
        </div>
      </div>

      {/* Time Tracked */}
      <div className="gold-card card-hover p-4">
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: '#64748b' }}
        >
          Time Tracked Today
        </h2>
        {todayEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <span style={{ fontSize: 28, opacity: 0.3 }}>◎</span>
            <p className="text-sm" style={{ color: '#475569' }}>
              No tracked time yet today.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {todayEntries.map((entry) => {
              const site = data.trackedSites.find((s) => s.domain === entry.domain)
              const limitMs = (site?.timeLimitMinutes ?? 0) * 60 * 1000
              const pct =
                limitMs > 0
                  ? Math.min(100, Math.round((entry.timeSpentMs / limitMs) * 100))
                  : 0
              const remaining =
                limitMs > 0 ? Math.max(0, limitMs - entry.timeSpentMs) : null
              const color = domainColor(entry.domain)

              return (
                <li key={entry.domain}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="favicon-dot"
                        style={{ background: color }}
                      />
                      <span className="text-sm text-white font-medium">
                        {entry.domain}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                        {formatTime(entry.timeSpentMs)}
                      </span>
                      {remaining !== null && (
                        <span className="text-xs ml-1" style={{ color: '#475569' }}>
                          · {formatTime(remaining)} left
                        </span>
                      )}
                    </div>
                  </div>
                  {limitMs > 0 && (
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 90
                            ? 'progress-bar-red'
                            : pct >= 60
                            ? 'progress-bar-amber'
                            : 'progress-bar-teal'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Streak */}
      <div className="gold-card card-hover p-4">
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: '#64748b' }}
        >
          Current Streak
        </h2>
        {!isLoggedIn ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div className="lock-icon" />
            <div>
              <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
                Streak tracking locked
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                Log in to track your daily streak
              </p>
            </div>
          </div>
        ) : loadingStreak ? (
          <p className="text-sm" style={{ color: '#475569' }}>Loading…</p>
        ) : streak ? (
          <div className="flex items-center gap-3">
            <span className="text-3xl flame-flicker">🔥</span>
            <div>
              <span
                className="text-3xl font-bold"
                style={{ color: '#D4AF37' }}
              >
                {streak.days ?? 0}
              </span>
              <span className="text-sm ml-1" style={{ color: '#64748b' }}>days</span>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#475569' }}>Streak data unavailable.</p>
        )}
      </div>
    </div>
  )
}
