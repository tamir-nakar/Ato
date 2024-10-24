import { Assistant } from "./assistant"
import {
  TabsManager,
  type BackgroundService,
  type FrequencyTab,
  type LastAccessedTab,
  type Tab
} from "./tabsManager"

const assistant = Assistant.getInstance()

class AppBackgroundService implements BackgroundService {
  async getTabs(): Promise<Tab[]> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: "getTabs" }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(response)
        }
      })
    })
  }

  async getTabsLastAccessed(): Promise<LastAccessedTab[]> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "getTabsLastAccessed" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve(response)
          }
        }
      )
    })
  }

  async getTabsAccessFrequency(): Promise<FrequencyTab[]> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "getTabsAccessFrequency" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve(response)
          }
        }
      )
    })
  }
}

const tabsManager = TabsManager.getInstance(new AppBackgroundService())

export async function organizeByCategory() {
  tabsManager.ungroupAllTabs()
  const tabs = await tabsManager.getTabsByCategory()
  const res = await assistant.generateContent(tabs)
  if (res) {
    tabsManager.groupTabs(res.output)
  } else {
    return 'error'
  }
}

export async function organizeByLastAccess() {
  tabsManager.ungroupAllTabs()
  const tabs = await tabsManager.getTabsByLastAccessed()
  const res = await assistant.generateContent(tabs.map(tab => ({ ...tab, la: getElapsedTime(tab.la) })))
  if (res) {
    tabsManager.groupTabs(res.output)
  } else {
    return 'error'
  }
}

export async function organizeByPrediction() {
  tabsManager.ungroupAllTabs()
  const tabs = await tabsManager.getTabsByPrediction()
  const res = await assistant.generateContent(tabs.map(tab=>({ ...tab, a: tab.a.map(el => getElapsedTime(el))})))
  if (res) {
    await tabsManager.groupTabs(res.output)
    tabsManager.reorderAndRenameGroups()
  } else {
    return 'error'
  }
}

export async function ungroupAllTabs() {
  tabsManager.ungroupAllTabs()
}

export async function toggleGroups(collapse: boolean) {
  tabsManager.toggleGroups(collapse)
}

function getElapsedTime(timestamp) {
  const now = getTimestamp()
  const diffInSeconds = now - timestamp;

  const days = Math.floor(diffInSeconds / (24 * 3600));
  const hours = Math.floor((diffInSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);

  return `${days}d${hours}h${minutes}m`;
}

function getTimestamp() {
  return Math.floor(Date.now() / 1000) // Current epoch time in seconds
}