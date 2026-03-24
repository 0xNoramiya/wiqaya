import { useEffect, useState } from 'react'
import type { WiqayaStorage } from '../shared/types'

const TRANSLATIONS = [
  { id: 85, label: 'M.A.S. Abdel Haleem' },
  { id: 19, label: 'M. Pickthall' },
  { id: 84, label: 'T. Usmani' },
  { id: 95, label: 'A. Maududi (Tafhim)' },
  { id: 149, label: 'Fadel Soliman (Bridges)' },
]

const RECITERS = [
  { id: 7, label: 'Mishary Rashid Alafasy' },
  { id: 1, label: 'Abdul Basit (Murattal)' },
  { id: 2, label: 'Abdul Basit (Mujawwad)' },
  { id: 3, label: 'Abdur-Rahman as-Sudais' },
  { id: 4, label: 'Abu Bakr al-Shatri' },
]

type SettingsState = Pick<
  WiqayaStorage,
  'translationId' | 'recitationId' | 'autoPlayAudio' | 'globalTimeLimitMinutes' | 'theme'
>

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #111827, #0d1424)',
  border: '1px solid rgba(212,175,55,0.15)',
  borderRadius: '0.75rem',
  padding: '1rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#64748b',
  marginBottom: '8px',
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    translationId: 85,
    recitationId: 7,
    autoPlayAudio: false,
    globalTimeLimitMinutes: 15,
    theme: 'dark',
  })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(
      ['translationId', 'recitationId', 'autoPlayAudio', 'globalTimeLimitMinutes', 'theme'],
      (result) => {
        setSettings({
          translationId: result.translationId ?? 85,
          recitationId: result.recitationId ?? 7,
          autoPlayAudio: result.autoPlayAudio ?? false,
          globalTimeLimitMinutes: result.globalTimeLimitMinutes ?? 15,
          theme: result.theme ?? 'dark',
        })
      }
    )

    chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }, (response) => {
      setIsLoggedIn(response?.isLoggedIn ?? false)
      setAuthLoading(false)
    })
  }, [])

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    chrome.storage.local.set({ [key]: value })
    flashSaved()
  }

  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function handleLogout() {
    chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
      setIsLoggedIn(false)
    })
  }

  function handleLogin() {
    chrome.runtime.sendMessage({ type: 'START_LOGIN' })
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.5rem',
    padding: '8px 36px 8px 12px',
    fontSize: '13px',
    color: 'white',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23D4AF37' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    outline: 'none',
    transition: 'border-color 200ms ease',
  }

  return (
    <div className="p-4 flex flex-col gap-3">

      {/* Theme */}
      <div style={cardStyle} className="card-hover">
        <label style={labelStyle}>Theme</label>
        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.625rem',
            padding: '3px',
            gap: '3px',
          }}
        >
          {(['dark', 'light'] as const).map((option) => {
            const isActive = settings.theme === option
            return (
              <button
                key={option}
                onClick={() => update('theme', option)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '0.45rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  transition: 'all 200ms ease',
                  background: isActive
                    ? option === 'dark'
                      ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                      : 'linear-gradient(135deg, #f8f6f1, #ede8df)'
                    : 'transparent',
                  color: isActive
                    ? option === 'dark'
                      ? '#D4AF37'
                      : '#1a1a2e'
                    : '#64748b',
                  boxShadow: isActive
                    ? option === 'dark'
                      ? '0 1px 6px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(212,175,55,0.25)'
                      : '0 1px 6px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(212,175,55,0.3)'
                    : 'none',
                }}
              >
                {option === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Translation */}
      <div style={cardStyle} className="card-hover">
        <label style={labelStyle}>Translation</label>
        <select
          value={settings.translationId}
          onChange={(e) => update('translationId', Number(e.target.value))}
          style={selectStyle}
          onFocus={(e) => {
            (e.target as HTMLElement).style.borderColor = 'rgba(20,184,166,0.5)'
          }}
          onBlur={(e) => {
            (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        >
          {TRANSLATIONS.map((t) => (
            <option key={t.id} value={t.id} style={{ background: '#111827', color: 'white' }}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Reciter */}
      <div style={cardStyle} className="card-hover">
        <label style={labelStyle}>Reciter</label>
        <select
          value={settings.recitationId}
          onChange={(e) => update('recitationId', Number(e.target.value))}
          style={selectStyle}
          onFocus={(e) => {
            (e.target as HTMLElement).style.borderColor = 'rgba(20,184,166,0.5)'
          }}
          onBlur={(e) => {
            (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        >
          {RECITERS.map((r) => (
            <option key={r.id} value={r.id} style={{ background: '#111827', color: 'white' }}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Auto-play audio */}
      <div style={cardStyle} className="card-hover">
        <div className="flex items-center justify-between">
          <div>
            <p style={labelStyle as React.CSSProperties}>Auto-play Audio</p>
            <p className="text-xs" style={{ color: '#475569' }}>
              Play recitation automatically on overlay
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs transition-all duration-200"
              style={{ color: settings.autoPlayAudio ? '#D4AF37' : '#334155' }}
            >
              {settings.autoPlayAudio ? 'ON' : 'OFF'}
            </span>
            <button
              role="switch"
              aria-checked={settings.autoPlayAudio}
              onClick={() => update('autoPlayAudio', !settings.autoPlayAudio)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none"
              style={{
                background: settings.autoPlayAudio
                  ? 'linear-gradient(135deg, #14b8a6, #0d9488)'
                  : 'rgba(255,255,255,0.1)',
              }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                style={{
                  transform: settings.autoPlayAudio ? 'translateX(24px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Global Time Limit */}
      <div style={cardStyle} className="card-hover">
        <div className="flex items-center justify-between mb-2">
          <label style={labelStyle as React.CSSProperties}>
            Global Time Limit
          </label>
          <span
            className="text-sm font-semibold"
            style={{ color: '#14b8a6' }}
          >
            {settings.globalTimeLimitMinutes < 1
              ? `${Math.round(settings.globalTimeLimitMinutes * 60)}s`
              : `${settings.globalTimeLimitMinutes} min`}
          </span>
        </div>
        <input
          type="range"
          min={0.1}
          max={60}
          step={0.1}
          value={settings.globalTimeLimitMinutes}
          onChange={(e) =>
            update('globalTimeLimitMinutes', Number(e.target.value))
          }
          className="w-full cursor-pointer"
          style={{ accentColor: '#14b8a6' }}
        />
        {/* Tick marks */}
        <div className="slider-ticks">
          {[
            { label: '6s', pos: ((0.1 - 0.1) / (60 - 0.1)) * 100 },
            { label: '5m', pos: ((5 - 0.1) / (60 - 0.1)) * 100 },
            { label: '15m', pos: ((15 - 0.1) / (60 - 0.1)) * 100 },
            { label: '30m', pos: ((30 - 0.1) / (60 - 0.1)) * 100 },
            { label: '60m', pos: ((60 - 0.1) / (60 - 0.1)) * 100 },
          ].map(({ label }) => (
            <div key={label} className="tick-mark">
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Account */}
      <div
        style={{
          ...cardStyle,
          borderColor: 'rgba(212,175,55,0.2)',
        }}
        className="card-hover geometric-border"
      >
        <h2 style={{ ...labelStyle as React.CSSProperties, marginBottom: 12 }}>Account</h2>
        {authLoading ? (
          <p className="text-sm" style={{ color: '#475569' }}>Loading…</p>
        ) : isLoggedIn ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: '#14b8a6', boxShadow: '0 0 6px rgba(20,184,166,0.5)' }}
              />
              <span className="text-sm text-white">Logged in</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm rounded-lg px-3 py-1.5 transition-all duration-200"
              style={{
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.6)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)'
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
              Quran.com login for streaks and bookmarks — coming soon.
              Pending production scope approval.
            </p>
            <button
              disabled
              className="text-sm font-medium rounded-lg py-2 cursor-not-allowed"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: '#334155',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              Log in with Quran.com (coming soon)
            </button>
          </div>
        )}
      </div>

      {/* Saved indicator */}
      <div
        className="text-center text-xs transition-opacity duration-300"
        style={{
          color: '#14b8a6',
          opacity: saved ? 1 : 0,
        }}
      >
        ✓ Settings saved
      </div>
    </div>
  )
}
