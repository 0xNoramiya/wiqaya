import { useEffect, useState } from 'react'
import type { TrackedSite } from '../shared/types'

const QUICK_ADD = [
  'twitter.com',
  'reddit.com',
  'youtube.com',
  'instagram.com',
  'tiktok.com',
]

function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(
    domain.trim()
  )
}

/** Deterministic color from a domain string */
function domainColor(domain: string): string {
  const colors = [
    '#14b8a6', '#6366f1', '#f59e0b', '#ec4899',
    '#8b5cf6', '#10b981', '#f97316', '#3b82f6',
  ]
  let hash = 0
  for (let i = 0; i < domain.length; i++) hash = domain.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function Sites() {
  const [sites, setSites] = useState<TrackedSite[]>([])
  const [domainInput, setDomainInput] = useState('')
  const [limitInput, setLimitInput] = useState('15')
  const [error, setError] = useState('')

  useEffect(() => {
    chrome.storage.local.get(['trackedSites'], (result) => {
      setSites(result.trackedSites ?? [])
    })
  }, [])

  function saveSites(updated: TrackedSite[]) {
    setSites(updated)
    chrome.storage.local.set({ trackedSites: updated })
  }

  function addSite(domain: string, limitMinutes: number) {
    const d = domain.trim().toLowerCase()
    if (!isValidDomain(d)) {
      setError('Please enter a valid domain (e.g. example.com)')
      return
    }
    if (sites.some((s) => s.domain === d)) {
      setError('This site is already in your watch list.')
      return
    }
    setError('')
    saveSites([...sites, { domain: d, timeLimitMinutes: limitMinutes }])
    setDomainInput('')
    setLimitInput('15')
  }

  function removeSite(domain: string) {
    saveSites(sites.filter((s) => s.domain !== domain))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const limit = parseInt(limitInput, 10)
    if (isNaN(limit) || limit < 1) {
      setError('Time limit must be at least 1 minute.')
      return
    }
    addSite(domainInput, limit)
  }

  function quickAdd(domain: string) {
    if (sites.some((s) => s.domain === domain)) return
    saveSites([...sites, { domain, timeLimitMinutes: 15 }])
  }

  return (
    <div className="p-4 flex flex-col gap-3">

      {/* Watch list */}
      <div className="gold-card card-hover p-4">
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: '#64748b' }}
        >
          Watch List
        </h2>
        {sites.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <div
              style={{
                fontSize: 36,
                opacity: 0.2,
                lineHeight: 1,
                color: '#D4AF37',
              }}
            >
              ◈
            </div>
            <p className="text-sm" style={{ color: '#475569' }}>
              No sites added yet.
            </p>
            <p className="text-xs" style={{ color: '#334155' }}>
              Add a site below to start tracking your time.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {sites.map((site) => {
              const color = domainColor(site.domain)
              const initial = site.domain[0].toUpperCase()
              return (
                <li
                  key={site.domain}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.055)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Favicon placeholder */}
                    <div
                      className="flex items-center justify-center rounded-full text-white font-bold flex-shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        background: color,
                        fontSize: 12,
                        opacity: 0.85,
                      }}
                    >
                      {initial}
                    </div>
                    <div>
                      <span className="text-sm text-white font-medium">
                        {site.domain}
                      </span>
                      <span
                        className="text-xs ml-2"
                        style={{ color: '#475569' }}
                      >
                        {site.timeLimitMinutes}m limit
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeSite(site.domain)}
                    className="transition-colors ml-2 text-lg leading-none rounded-full w-6 h-6 flex items-center justify-center"
                    style={{ color: '#475569' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = '#f87171'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = '#475569'
                    }}
                    title="Remove site"
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Quick add */}
      <div className="gold-card card-hover p-4">
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: '#64748b' }}
        >
          Quick Add
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_ADD.map((domain) => {
            const already = sites.some((s) => s.domain === domain)
            return (
              <button
                key={domain}
                onClick={() => quickAdd(domain)}
                disabled={already}
                className="text-xs px-3 py-1.5 rounded-full transition-all duration-200 font-medium"
                style={
                  already
                    ? {
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: '#334155',
                        cursor: 'not-allowed',
                      }
                    : {
                        border: '1px solid rgba(20,184,166,0.4)',
                        color: '#14b8a6',
                        background: 'rgba(20,184,166,0.06)',
                      }
                }
                onMouseEnter={(e) => {
                  if (!already) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(20,184,166,0.14)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!already) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(20,184,166,0.06)'
                  }
                }}
              >
                {already ? `${domain} ✓` : `+ ${domain}`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Add site form */}
      <div className="gold-card card-hover p-4">
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: '#64748b' }}
        >
          Add Site
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => {
                setDomainInput(e.target.value)
                setError('')
              }}
              placeholder="example.com"
              className="flex-1 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'border-color 200ms ease',
              }}
              onFocus={(e) => {
                (e.target as HTMLElement).style.borderColor = 'rgba(20,184,166,0.5)'
              }}
              onBlur={(e) => {
                (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            />
            <input
              type="number"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              min={1}
              max={180}
              placeholder="min"
              className="w-16 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'border-color 200ms ease',
              }}
              onFocus={(e) => {
                (e.target as HTMLElement).style.borderColor = 'rgba(20,184,166,0.5)'
              }}
              onBlur={(e) => {
                (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            />
            <button
              type="submit"
              className="text-white text-sm font-medium rounded-lg px-3 py-2 transition-all duration-200 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #2dd4bf, #14b8a6)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #14b8a6, #0d9488)'
              }}
            >
              Add
            </button>
          </div>
          {error && (
            <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}
