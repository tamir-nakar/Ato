console.log("Background-page")
const MAX_ACCESS_HISTORY_ALLOWED = 15
interface TabData {
  u: string // URL
  t: string // Title
  la: number // Last accessed epoch time in seconds
  a: number[] // Access frequency array
}

function getTimestamp(){
  return  Math.floor(Date.now() / 1000); // Current epoch time in seconds
}
async function init() {
  const tabs = await chrome.tabs.query({}) // Get all currently open tabs
  tabs.forEach((tab) => {
    const tabInfo: TabData = {
      u: tab.url || "",
      t: tab.title || "",
      la: getTimestamp(),
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
      la: getTimestamp(),
      a: [...tabDataMap[tabId].a, getTimestamp()] // decided to keep the old access history even when tab updates... 
    }
  }

    tabDataMap[tab.id.toString()] = tabInfo
}

init()

const tabDataMap: { [tabId: string]: TabData } = {}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  console.log('update 🔥')
  console.log(changeInfo.status)
  console.log(` ${tabId} updated |`,"status:",changeInfo.status,"|"," title:",changeInfo.title,"|"," url:",changeInfo.url)

  if(changeInfo.status === 'complete'){
    console.log('updating NOW!!!')
    initById(tabId)
  }
})


chrome.tabs.onCreated.addListener((tab) => {
  const tabInfo: TabData = {
    u: tab.url || "",
    t: tab.title || "",
    la: getTimestamp(),
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
  const tabId = activeInfo?.tabId?.toString()
  if (tabId) {
    tabDataMap[tabId].a.push(getTimestamp()) // updating access history
    tabDataMap[activeInfo.tabId].la = getTimestamp() // updating last access
  }
  if(tabDataMap[tabId].a.length > MAX_ACCESS_HISTORY_ALLOWED){
    tabDataMap[tabId].a.reverse()
    tabDataMap[tabId].a.length = MAX_ACCESS_HISTORY_ALLOWED
    tabDataMap[tabId].a.reverse()
  }
  const debugObj = {}
  for(const [id, obj] of Object.entries(tabDataMap)){
    debugObj[obj.t] = obj.la
  }
  console.log(debugObj)
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
