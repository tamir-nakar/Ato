console.log("Background-page")
const MAX_ACCESS_HISTORY_ALLOWED = 15
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

async function initById(tabId: number) {
  const tab = await chrome.tabs.get(tabId);
  let tabInfo : TabData
  if(tab){
    tabInfo = {
      u: tab.url || "",
      t: tab.title || "",
      la: new Date().toISOString(),
      a: [...tabDataMap[tabId].a, new Date().toISOString()] // decided to keep the old access history even when tab updates... 
    }
  }

    tabDataMap[tab.id.toString()] = tabInfo
}

init()

const tabDataMap: { [tabId: string]: TabData } = {}

function hasAtLeastXSecondsDifference(date1: string, date2: string, X: number): boolean {
  // Convert ISO date strings to Date objects
  const dateObj1 = new Date(date1);
  const dateObj2 = new Date(date2);

  // Get the time difference in milliseconds using .getTime()
  const timeDifference = Math.abs(dateObj2.getTime() - dateObj1.getTime());

  // Convert the time difference to seconds
  const secondsDifference = timeDifference / 1000;

  // Check if the difference is at least X seconds
  return secondsDifference >= X;
}


chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  console.log('update 🔥')
  console.log(changeInfo.status)
  console.log(` ${tabId} updated |`,"status:",changeInfo.status,"|"," title:",changeInfo.title,"|"," url:",changeInfo.url)
  // if (tabDataMap[tabId]) {
  //   // we get here several times on each update. We want to update only if never accessed or X seconds elapsed since last update
  //   if(!tabDataMap[tabId].la || hasAtLeastXSecondsDifference(tabDataMap[tabId].la,new Date().toISOString(), 5)){
  //     console.log('5 elapsed')
  //     tabDataMap[tabId].la = new Date().toISOString()
  //     tabDataMap[tabId].a = [...tabDataMap[tabId].a,new Date().toISOString()]
  //   }
  //   // we get here several times on each update, we want to update only if there is a real change
  //   tabDataMap[tabId].t =
  //     changeInfo.title && (tabDataMap[tabId].t !== '' && tabDataMap[tabId].t !== undefined)
  //       ? changeInfo.title
  //       : tabDataMap[tabId].t
  //   tabDataMap[tabId].u =
  //     changeInfo.url && (tabDataMap[tabId].u !== '' && tabDataMap[tabId].u !== undefined)
  //       ? changeInfo.url
  //       : tabDataMap[tabId].u
  // }
  if(changeInfo.status === 'complete'){
    console.log('updating NOW!!!')
    initById(tabId)
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
  if(tabDataMap[tabId].a.length > MAX_ACCESS_HISTORY_ALLOWED){
    tabDataMap[tabId].a.reverse()
    tabDataMap[tabId].a.length = MAX_ACCESS_HISTORY_ALLOWED
    tabDataMap[tabId].a.reverse()
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
