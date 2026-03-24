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
    <div className="p-4 flex flex-col gap-4">
      {/* Site list */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
          Watch List
        </h2>
        {sites.length === 0 ? (
          <p className="text-slate-500 text-sm">No sites added yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sites.map((site) => (
              <li
                key={site.domain}
                className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2"
              >
                <div>
                  <span className="text-sm text-white font-medium">
                    {site.domain}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    {site.timeLimitMinutes}m limit
                  </span>
                </div>
                <button
                  onClick={() => removeSite(site.domain)}
                  className="text-slate-500 hover:text-red-400 transition-colors ml-2 text-lg leading-none"
                  title="Remove site"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick add */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
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
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  already
                    ? 'border-slate-700 text-slate-600 cursor-not-allowed'
                    : 'border-teal-700 text-teal-400 hover:bg-teal-900/30'
                }`}
              >
                {domain}
                {already && ' ✓'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Add site form */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
          Add Site
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => {
                setDomainInput(e.target.value)
                setError('')
              }}
              placeholder="example.com"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
            <input
              type="number"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              min={1}
              max={180}
              placeholder="min"
              className="w-16 bg-slate-700 border border-slate-600 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-teal-500"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg py-2 transition-colors"
          >
            Add Site
          </button>
        </form>
      </div>
    </div>
  )
}
