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
  console.log("in organizeByCategory")
  const tabs = await tabsManager.getTabsByCategory()
  console.log(tabs)
  const res = await assistant.generateContent(tabs)
  console.log(res)
  tabsManager.groupTabs(res.output)
}
