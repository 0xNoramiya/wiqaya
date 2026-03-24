import { createRoot } from 'react-dom/client'
import App from '../overlay/App'
import styles from './overlay.css?inline'

let overlayRoot: ReturnType<typeof createRoot> | null = null
let hostEl: HTMLDivElement | null = null

function showOverlay() {
  if (hostEl) return // already showing

  hostEl = document.createElement('div')
  hostEl.id = 'wiqaya-overlay-host'
  document.body.appendChild(hostEl)

  const shadow = hostEl.attachShadow({ mode: 'open' })

  // Inject styles into shadow root
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadow.appendChild(styleEl)

  // Create React mount point
  const mountPoint = document.createElement('div')
  mountPoint.id = 'wiqaya-mount'
  shadow.appendChild(mountPoint)

  // Lock page scroll
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'

  overlayRoot = createRoot(mountPoint)
  overlayRoot.render(<App onDismiss={dismissOverlay} />)
}

function dismissOverlay() {
  if (overlayRoot) {
    overlayRoot.unmount()
    overlayRoot = null
  }
  if (hostEl) {
    hostEl.remove()
    hostEl = null
  }
  // Restore scroll
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TRIGGER_OVERLAY') {
    showOverlay()
    sendResponse({ type: 'TRIGGER_OVERLAY' })
  }
  return true
})
