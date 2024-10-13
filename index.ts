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
  const res = await assistant.generateContent(tabs)
  if (res) {
    tabsManager.groupTabs(res.output)
  } else {
    return 'error'
  }
}

export async function organizeByPrediction() {
  tabsManager.ungroupAllTabs()
  const tabs = await tabsManager.getTabsByPrediction()
  const res = await assistant.generateContent(tabs)
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
