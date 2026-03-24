import type { WiqayaMessage } from './types'

export function sendToBackground(msg: WiqayaMessage): Promise<WiqayaMessage> {
  return chrome.runtime.sendMessage(msg)
}

export function sendToTab(tabId: number, msg: WiqayaMessage): Promise<WiqayaMessage | undefined> {
  return chrome.tabs.sendMessage(tabId, msg)
}
