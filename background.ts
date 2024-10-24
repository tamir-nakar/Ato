const MAX_ACCESS_HISTORY_ALLOWED = 15
const tabDataMap: TabDataMap = {}
type ExcludeTabData = {
  [K in keyof TabData]: boolean;
};
// type debugMethod = 'ALL'|''
interface TabData {
  u: string // URL
  t: string // Title
  la: number // Last accessed epoch time in seconds
  a: number[] // Access frequency array
}

interface TabDataMap  { [tabId: string]: TabData }

async function init() {
  const tabs = await chrome.tabs.query({}) // Get all currently open tabs
  tabs.forEach((tab) => {
    const tabInfo: TabData = {
      t: tab.title || "",
      la: getTimestamp(),
      u: tab.url || "",
      a: []
    }
    tabDataMap[tab.id.toString()] = tabInfo
  })
}

init()

function getTimestamp() {
  return Math.floor(Date.now() / 1000) // Current epoch time in seconds
}

async function initById(tabId: number) {
  const tab = await chrome.tabs.get(tabId)
  let tabInfo: TabData
  if (tab) {
    tabInfo = {
      u: tab.url || "",
      t: tab.title || "",
      la: getTimestamp(),
      a: [...tabDataMap[tabId].a, getTimestamp()] // decided to keep the old access history even when tab updates...
    }
  }

  tabDataMap[tab.id.toString()] = tabInfo
}

// ======================================
// EVENTS
// ======================================
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  console.log("⏰ onUpdate")
  console.log("title:", changeInfo.title, "|", "status:", changeInfo.status, "|", " url:", changeInfo.url)

  if (changeInfo.status === "complete") {
    console.log("update status reached 'complete'. Calling 'initById' to reset tab")
    initById(tabId)
  }
  console.log(convertToDebugObj(tabDataMap))
})

chrome.tabs.onCreated.addListener((tab) => {
  console.log("⏰ onCreated")

  const tabInfo: TabData = {
    u: tab.url || "",
    t: tab.title || "",
    la: getTimestamp(),
    a: []
  }
  tabDataMap[tab.id.toString()] = tabInfo
  console.log("new tab created 🎉", tabInfo)
  console.log(convertToDebugObj(tabDataMap))
})

chrome.tabs.onRemoved.addListener((tabId) => {
  console.log("⏰ onRemoved")
  delete tabDataMap[tabId.toString()] // Remove tab from map
  console.log(convertToDebugObj(tabDataMap))
})

// Add listener to track tab access (every touch)
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("⏰ onActivated")

  const tabId = activeInfo?.tabId?.toString()
  if (tabId) {
    tabDataMap[tabId].a.push(getTimestamp()) // updating access history
    tabDataMap[activeInfo.tabId].la = getTimestamp() // updating last access
  }
  if (tabDataMap[tabId].a.length > MAX_ACCESS_HISTORY_ALLOWED) {
    tabDataMap[tabId].a.reverse()
    tabDataMap[tabId].a.length = MAX_ACCESS_HISTORY_ALLOWED
    tabDataMap[tabId].a.reverse()
  }
  console.log(convertToDebugObj(tabDataMap))
})

// ======================================
// Listeners (communication with tabsManager consumer)
// ======================================

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


// ======================================
// Debug
// ======================================

let convertToDebugObj = (
  tabDataMap: TabDataMap,
  options?: { dateFunc?: Function; deleteProps?: ExcludeTabData }
) => {
  if (defaultOption) {
    options = defaultOption
  }
  if (!options) {
    return tabDataMap
  } else {
    const deepCopy = JSON.parse(JSON.stringify(tabDataMap))

    for (const tab in deepCopy){
      
      // Remove keys
      for (const [key, isExclude] of Object.entries(options.deleteProps)) {
        if (isExclude) {
          delete deepCopy[tab][key]
        }
      }

      if (deepCopy[tab]["la"]) {
        deepCopy[tab]["la"] = options.dateFunc(deepCopy[tab]["la"])
      }
    }



    return deepCopy
  }
}

const debugOptionsSets = {
  onlyTitle: {deleteProps: {a: true, la: true, u: true, t:false}},
  titleAndHRDate: {deleteProps: {a: true, la: false, u: true, t:false},dateFunc: (date:any)=>formatTimestampToLocalTime(date)}
}

function formatTimestampToLocalTime(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Convert to milliseconds

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Etc/GMT-3', // GMT+3 timezone
    month: 'short', // 'short' is correct here
    day: 'numeric', // Numeric day of the month
    hour: '2-digit', // 2-digit hour
    minute: '2-digit', // 2-digit minute
    hour12: false, // Use 24-hour format
  };

  // Format the date and time
  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

  // Rearrange the output to match "Oct 23, 13:25"
  const [monthDay, time] = formattedDate.split(', ');
  return `${monthDay}, ${time}`;
}



const defaultOption = debugOptionsSets.titleAndHRDate
