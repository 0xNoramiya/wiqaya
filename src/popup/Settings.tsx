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
  { id: 7, label: '7 — Mishary Rashid Alafasy' },
  { id: 1, label: '1 — Abdul Basit (Murattal)' },
  { id: 2, label: '2 — Abdul Basit (Mujawwad)' },
  { id: 3, label: '3 — Abdur-Rahman as-Sudais' },
  { id: 4, label: '4 — Abu Bakr al-Shatri' },
]

type SettingsState = Pick<
  WiqayaStorage,
  'translationId' | 'recitationId' | 'autoPlayAudio' | 'globalTimeLimitMinutes'
>

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    translationId: 85,
    recitationId: 7,
    autoPlayAudio: false,
    globalTimeLimitMinutes: 15,
  })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(
      ['translationId', 'recitationId', 'autoPlayAudio', 'globalTimeLimitMinutes'],
      (result) => {
        setSettings({
          translationId: result.translationId ?? 85,
          recitationId: result.recitationId ?? 7,
          autoPlayAudio: result.autoPlayAudio ?? false,
          globalTimeLimitMinutes: result.globalTimeLimitMinutes ?? 15,
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

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Translation */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <label className="block text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">
          Translation
        </label>
        <select
          value={settings.translationId}
          onChange={(e) => update('translationId', Number(e.target.value))}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
        >
          {TRANSLATIONS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Reciter */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <label className="block text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">
          Reciter
        </label>
        <select
          value={settings.recitationId}
          onChange={(e) => update('recitationId', Number(e.target.value))}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
        >
          {RECITERS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Auto-play audio */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Auto-play Audio
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Play recitation automatically on overlay
            </p>
          </div>
          <button
            role="switch"
            aria-checked={settings.autoPlayAudio}
            onClick={() => update('autoPlayAudio', !settings.autoPlayAudio)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.autoPlayAudio ? 'bg-teal-500' : 'bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                settings.autoPlayAudio ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Global Time Limit */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Global Time Limit
          </label>
          <span className="text-teal-400 text-sm font-medium">
            {settings.globalTimeLimitMinutes < 1 ? `${Math.round(settings.globalTimeLimitMinutes * 60)}s` : `${settings.globalTimeLimitMinutes} min`}
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
          className="w-full accent-teal-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>6s</span>
          <span>60m</span>
        </div>
      </div>

      {/* Account */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
          Account
        </h2>
        {authLoading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : isLoggedIn ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-teal-400 text-sm">●</span>
              <span className="text-sm text-white">Logged in</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 rounded-lg px-3 py-1.5 transition-colors"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-slate-400 text-sm">
              Quran.com login for streaks and bookmarks — coming soon.
              Pending production scope approval.
            </p>
            <button
              disabled
              className="bg-slate-700 text-slate-500 text-sm font-medium rounded-lg py-2 cursor-not-allowed"
            >
              Log in with Quran.com (coming soon)
            </button>
          </div>
        )}
      </div>

      {/* Saved indicator */}
      <div
        className={`text-center text-xs text-teal-400 transition-opacity duration-300 ${
          saved ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Settings saved
      </div>
    </div>
  )
}
