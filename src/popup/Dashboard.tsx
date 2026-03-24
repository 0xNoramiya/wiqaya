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

    // Check auth status
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
    <div className="p-4 flex flex-col gap-4">
      {/* Time Tracked */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
          Time Tracked Today
        </h2>
        {todayEntries.length === 0 ? (
          <p className="text-slate-500 text-sm">No tracked time yet today.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {todayEntries.map((entry) => {
              const site = data.trackedSites.find(
                (s) => s.domain === entry.domain
              )
              const limitMs = (site?.timeLimitMinutes ?? 0) * 60 * 1000
              const pct =
                limitMs > 0
                  ? Math.min(100, Math.round((entry.timeSpentMs / limitMs) * 100))
                  : 0

              return (
                <li key={entry.domain}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-white font-medium">
                      {entry.domain}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatTime(entry.timeSpentMs)}
                      {limitMs > 0 && (
                        <span className="text-slate-500">
                          {' '}/ {site!.timeLimitMinutes}m
                        </span>
                      )}
                    </span>
                  </div>
                  {limitMs > 0 && (
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 90
                            ? 'bg-red-500'
                            : pct >= 60
                            ? 'bg-yellow-500'
                            : 'bg-teal-500'
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

      {/* Verses Read */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
          Verses Read
        </h2>
        <div className="flex gap-6">
          <div className="flex flex-col items-center">
            <span
              className="text-3xl font-bold"
              style={{ color: '#D4AF37' }}
            >
              {data.versesReadToday}
            </span>
            <span className="text-xs text-slate-400 mt-0.5">Today</span>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-teal-400">
              {data.totalVersesRead}
            </span>
            <span className="text-xs text-slate-400 mt-0.5">All Time</span>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
          Current Streak
        </h2>
        {!isLoggedIn ? (
          <p className="text-slate-500 text-sm">
            Log in for streak tracking.
          </p>
        ) : loadingStreak ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : streak ? (
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <span
                className="text-3xl font-bold"
                style={{ color: '#D4AF37' }}
              >
                {streak.days ?? 0}
              </span>
              <span className="text-slate-400 text-sm ml-1">days</span>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Streak data unavailable.</p>
        )}
      </div>
    </div>
  )
}
