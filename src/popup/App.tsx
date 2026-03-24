import { useState } from 'react'
import Dashboard from './Dashboard'
import Sites from './Sites'
import Saved from './Saved'
import Settings from './Settings'

const tabs = ['Dashboard', 'Sites', 'Saved', 'Settings'] as const
type Tab = typeof tabs[number]

const tabIcons: Record<Tab, string> = {
  Dashboard: '📊',
  Sites: '🌐',
  Saved: '❤️',
  Settings: '⚙️',
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard')

  return (
    <div
      style={{ width: 400, minHeight: 500 }}
      className="bg-slate-900 text-white flex flex-col"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-slate-700">
        <h1 className="text-lg font-bold tracking-wide">
          Wiqaya{' '}
          <span className="text-slate-400 font-normal text-sm">وقاية</span>
        </h1>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors duration-150 relative ${
              activeTab === tab
                ? 'text-teal-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base leading-none">{tabIcons[tab]}</span>
            <span>{tab}</span>
            {activeTab === tab && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-teal-400 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Sites' && <Sites />}
        {activeTab === 'Saved' && <Saved />}
        {activeTab === 'Settings' && <Settings />}
      </div>
    </div>
  )
}
