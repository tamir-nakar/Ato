console.log("Background-page")
interface TabData {
  u: string // URL
  t: string // Title
  la: string // Last accessed date-time
  a: string[] // Access frequency array
}

async function init() {
  const tabs = await chrome.tabs.query({}) // Get all currently open tabs
  tabs.forEach((tab) => {
    const tabInfo: TabData = {
      u: tab.url || "",
      t: tab.title || "",
      la: new Date().toISOString(),
      a: []
    }
    tabDataMap[tab.id.toString()] = tabInfo
  })
}

init()

const tabDataMap: { [tabId: string]: TabData } = {}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  console.log(
    "status:",
    changeInfo.status,
    "|",
    " title:",
    changeInfo.title,
    "|",
    " url:",
    changeInfo.url
  )
  if (tabDataMap[tabId]) {
    tabDataMap[tabId].la = new Date().toISOString() // Update last accessed time
    tabDataMap[tabId].a = [new Date().toISOString()]
    tabDataMap[tabId].t =
      changeInfo.title && !tabDataMap[tabId].t
        ? changeInfo.title
        : tabDataMap[tabId].t
    tabDataMap[tabId].u =
      changeInfo.url && !tabDataMap[tabId].u
        ? changeInfo.url
        : tabDataMap[tabId].u
  }
})

chrome.tabs.onCreated.addListener((tab) => {
  const tabInfo: TabData = {
    u: tab.url || "",
    t: tab.title || "",
    la: new Date().toISOString(),
    a: []
  }
  tabDataMap[tab.id.toString()] = tabInfo
  console.log("new tab created 🎉", tabInfo)
})

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabDataMap[tabId.toString()] // Remove tab from map
  console.log(tabDataMap)
})

// Add listener to track tab access (every touch)
chrome.tabs.onActivated.addListener((activeInfo) => {
  const timeExp = new Date().toISOString()
  const tabId = activeInfo?.tabId?.toString()
  if (tabId) {
    tabDataMap[tabId].a.push(new Date().toISOString()) // updating access history
    tabDataMap[activeInfo.tabId].la = timeExp // updating last access
  }
  console.log(tabDataMap)
})

// Listen for messages from TabsManager
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTabs") {
    const tabs = Object.values(tabDataMap).map(({ u, t, a }, id) => ({
      u,
      t,
      id: Object.keys(tabDataMap)[id]
    }))
    sendResponse(tabs)
  } else if (request.action === "getTabsLastAccessed") {
    const lastAccessed = Object.entries(tabDataMap).map(([id, tab]) => ({
      id,
      la: tab.la
    }))
    sendResponse(lastAccessed)
  } else if (request.action === "getTabsAccessFrequency") {
    const accessFrequency = Object.entries(tabDataMap).map(([id, tab]) => ({
      id,
      a: tab.a
    }))
    sendResponse(accessFrequency)
  }
  return true // Indicates that the response is asynchronous
})
