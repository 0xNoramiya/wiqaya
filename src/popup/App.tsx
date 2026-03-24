import { useState } from 'react'
import Dashboard from './Dashboard'
import Sites from './Sites'
import Saved from './Saved'
import Settings from './Settings'

const tabs = ['Dashboard', 'Sites', 'Saved', 'Settings'] as const
type Tab = typeof tabs[number]

const tabIcons: Record<Tab, JSX.Element> = {
  Dashboard: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="7" width="3" height="6" rx="0.5"/>
      <rect x="5.5" y="4" width="3" height="9" rx="0.5"/>
      <rect x="10" y="1" width="3" height="12" rx="0.5"/>
    </svg>
  ),
  Sites: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="5.5"/>
      <path d="M7 1.5C7 1.5 5 4 5 7s2 5.5 2 5.5M7 1.5C7 1.5 9 4 9 7s-2 5.5-2 5.5M1.5 7h11"/>
    </svg>
  ),
  Saved: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 12s-5.5-3.5-5.5-7a3.5 3.5 0 0 1 5.5-2.88A3.5 3.5 0 0 1 12.5 5c0 3.5-5.5 7-5.5 7z"/>
    </svg>
  ),
  Settings: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="2"/>
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.6 2.6l1.05 1.05M10.35 10.35l1.05 1.05M2.6 11.4l1.05-1.05M10.35 3.65l1.05-1.05"/>
    </svg>
  ),
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard')

  return (
    <div
      style={{ width: 400, minHeight: 500, background: '#0a0f1e' }}
      className="text-white flex flex-col"
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0d1630 0%, #0a0f1e 100%)',
        }}
        className="px-5 pt-4 pb-3"
      >
        <div className="flex items-baseline gap-2">
          <h1
            style={{ letterSpacing: '0.04em' }}
            className="text-xl font-bold text-white"
          >
            Wiqaya
          </h1>
          <span
            style={{ color: '#D4AF37', fontFamily: 'serif' }}
            className="text-base font-normal"
          >
            وقاية
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
          Your screen time, redeemed.
        </p>
      </div>
      <div className="header-gold-line mx-0" />

      {/* Tab bar */}
      <div
        style={{ background: '#0a0f1e', borderBottom: '1px solid rgba(212,175,55,0.1)' }}
        className="flex"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-all duration-200 ${
                isActive ? 'tab-active' : ''
              }`}
              style={{
                color: isActive ? '#D4AF37' : '#64748b',
                background: isActive ? 'rgba(212,175,55,0.04)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = '#94a3b8'
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = '#64748b'
              }}
            >
              <span className="leading-none">{tabIcons[tab]}</span>
              <span style={{ fontSize: '10px', letterSpacing: '0.04em' }}>{tab.toUpperCase()}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Sites' && <Sites />}
        {activeTab === 'Saved' && <Saved />}
        {activeTab === 'Settings' && <Settings />}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid rgba(212,175,55,0.07)',
          color: '#334155',
          fontSize: '10px',
          textAlign: 'center',
          padding: '6px 0',
          background: '#0a0f1e',
        }}
      >
        Wiqaya v1.0.0
      </div>
    </div>
  )
}
