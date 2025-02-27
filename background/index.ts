import { Assistant } from "~/assistant";
import { TabsManager } from '~tabsManager';
import type { ExcludeTabData, TabData, TabDataMap, TimeRange, GroupingInstructions } from '~types';
import { formatTimestampToLocalTime, getElapsedTime, getTimestamp } from '~utils';

const MAX_ACCESS_HISTORY_ALLOWED = 15
export const tabDataMap: TabDataMap = {}
export const tabsManager = TabsManager.getInstance()
export const assistant = Assistant.getInstance()

// init background worker. Get all currently open tabs and insert into map
async function init() {
  console.log('tabData init')
  const tabs = await chrome.tabs.query({})
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

init() // consider iife

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

// UPDATE
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // console.log("⏰ onUpdate")
  // console.log("title:", changeInfo.title, "|", "status:", changeInfo.status, "|", " url:", changeInfo.url)

  if (changeInfo.status === "complete") {
    // console.log('update!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log("update status reached 'complete'. Calling 'initById' to reset tab")
    initById(tabId)
    chrome.storage.local.get(["auto_mode", "method"], (result) => {
      if (result.auto_mode) {
        switch (result.method) {
          case "category":
            groupByCategory();
            break;
          default:
        }
      }
    });
  }
  console.log(convertToDebugObj(tabDataMap))
})

// CREATE
chrome.tabs.onCreated.addListener((tab) => {
  // console.log("⏰ onCreated")

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

// REMOVE
chrome.tabs.onRemoved.addListener((tabId) => {
  // console.log("⏰ onRemoved")
  delete tabDataMap[tabId.toString()] // Remove tab from map
  console.log(convertToDebugObj(tabDataMap))
})

// ACTIVATED(TOUCHED)
// Add listener to track tab access (every touch)
chrome.tabs.onActivated.addListener((activeInfo) => {
  // console.log("⏰ onActivated")

  console.log('***happend')
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
  chrome.storage.local.get(["auto_mode", "method"], (result) => {
    if (result.auto_mode) {
      switch (result.method) {
          case "access":
            setTimeout(groupByLastAccess, 500);
            break;
          case "prediction":
            groupByPrediction();
            break;
        default:
      }
    }
  });
  console.log(convertToDebugObj(tabDataMap))
})

// ======================================
// Tab actions
// ======================================

  export async function groupByCategory(){
    let isError = false
    try{
      const tabs = Object.values(tabDataMap).map(({ u, t }, id) => ({
        u,
        t,
        id: Object.keys(tabDataMap)[id]
      }))
      const aiRes = await assistant.generateContent(tabs)
      if (aiRes) {
        await tabsManager.ungroupAllTabs()
        await tabsManager.groupTabs(aiRes.output)
      }else{
        isError = true
      } 
    }catch(e){
      isError = true
    }
    return isError;
  }

  
  export async function groupByLastAccess(): Promise<boolean> {
    let isError = false
    try {
      const rangesOrder = [
        "older than 2 days",
        "2 days ago",
        "yesterday",
        "last 12 hours",
        "last 6 hours",
        "last 5 hours",
        "last 4 hours",
        "last 3 hours",
        "last 2 hours",
        "last hour",
        "last 45 minutes",
        "last 30 minutes",
        "last 15 minutes",
        "last 5 minutes",
        "just now"
    ]
      const lastAccessed = await tabsManager.getLastAccessedArray()
      const groupingInstructions = groupByLastAccessLocalImpl(lastAccessed)

      if (groupingInstructions) {
        const closedGroup = await tabsManager.ungroupAllTabs()
        await tabsManager.groupTabs(groupingInstructions, rangesOrder, closedGroup)
      } else {
        isError = true
      }
    } catch (e) {
      console.error("Error while grouping tabs by last access:", e)
      isError = true
    }
    return isError
  }

function groupByLastAccessLocalImpl(lastAccessed: { id: string; la: number }[]): GroupingInstructions {
  const now = Date.now();
  // Define time ranges in milliseconds
  const ranges: TimeRange[] = [
    { label: "just now", min: now - 60 * 1000, max: now }, // Last accessed within the last minute
    { label: "last 5 minutes", min: now - 5 * 60 * 1000, max: now - 60 * 1000 }, // Adjusted to exclude "just now"
    { label: "last 15 minutes", min: now - 15 * 60 * 1000, max: now - 5 * 60 * 1000 },
    { label: "last 30 minutes", min: now - 30 * 60 * 1000, max: now - 15 * 60 * 1000 },
    { label: "last 45 minutes", min: now - 45 * 60 * 1000, max: now - 30 * 60 * 1000 },
    { label: "last hour", min: now - 60 * 60 * 1000, max: now - 45 * 60 * 1000 },
    { label: "last 2 hours", min: now - 2 * 60 * 60 * 1000, max: now - 60 * 60 * 1000 },
    { label: "last 3 hours", min: now - 3 * 60 * 60 * 1000, max: now - 2 * 60 * 60 * 1000 },
    { label: "last 4 hours", min: now - 4 * 60 * 60 * 1000, max: now - 3 * 60 * 60 * 1000 },
    { label: "last 5 hours", min: now - 5 * 60 * 60 * 1000, max: now - 4 * 60 * 60 * 1000 },
    { label: "last 6 hours", min: now - 6 * 60 * 60 * 1000, max: now - 5 * 60 * 60 * 1000 },
    { label: "last 12 hours", min: now - 12 * 60 * 60 * 1000, max: now - 6 * 60 * 60 * 1000 },
    { label: "yesterday", min: now - 2 * 24 * 60 * 60 * 1000, max: now - 24 * 60 * 60 * 1000 },
    { label: "2 days ago", min: now - 3 * 24 * 60 * 60 * 1000, max: now - 2 * 24 * 60 * 60 * 1000 },
    { label: "older than 2 days", min: -Infinity, max: now - 3 * 24 * 60 * 60 * 1000 }
];

  // Initialize groups
  const instructions: GroupingInstructions = {};
  ranges.forEach(range => (instructions[range.label] = []));

  // Place each tab in the correct group
  lastAccessed.forEach(tab => {
      const tabLastAccessedMs = tab.la; // Convert seconds to milliseconds
      for (const range of ranges) {
          if (tabLastAccessedMs >= range.min && tabLastAccessedMs < range.max) {
              instructions[range.label].push(tab.id); // Populate with default TabData fields
              break; // Stop checking ranges once a match is found
          }
      }
  });

  // Filter out empty groups
  const instructionsRes: GroupingInstructions = {};
  for (const [label, ids] of Object.entries(instructions)) {
      if (ids.length > 0) {
          instructionsRes[label] = ids;
      }
  }

  return instructionsRes;
}

  export async function groupByPrediction() {
    let isError = false
    try {
      const accessFrequency = Object.entries(tabDataMap).map(([id, tab]) => ({
        id,
        a: tab.a
      }))

      const aiRes = await assistant.generateContent(
        accessFrequency.map((tab) => ({
          ...tab,
          a: tab.a.map((el) => getElapsedTime(el))
        }))
      )
      if (aiRes) {
        await tabsManager.ungroupAllTabs()
        await tabsManager.groupTabs(aiRes.output)
        await tabsManager.reorderAndRenameGroups()
      } else {
        isError = true
      }
    } catch (e) {
      isError = true
    }
    return isError
  }

// ======================================
// omnibox
// ======================================

chrome.omnibox.onInputStarted.addListener(() => {
  // Set the initial suggestion/title in the address bar when the omnibox is triggered
  chrome.omnibox.setDefaultSuggestion({
    description: "Start typing tab's title or url to switch tab"
  });
});

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  const suggestions = [];

  for (const [tabId, tabData] of Object.entries(tabDataMap)) {
    const { u: url, t: title } = tabData;

    // Check if the input matches any part of the URL or title (case-insensitive)
    if (url.toLowerCase().includes(text.toLowerCase()) || title.toLowerCase().includes(text.toLowerCase())) {
      const highlightedUrl = highlightMatch(url, text);
      const highlightedTitle = highlightMatch(title, text);

      const description = `${highlightedTitle} - <url>${highlightedUrl}</url>`;
      suggestions.push({
        content: tabId, // Store tabId to switch to
        description,
      });
    }
  }

  if (suggestions.length) {
    suggest(suggestions); // Provide suggestions to the omnibox
  }
});

// Helper function to bold matching text (case-insensitive)
function highlightMatch(text: string, match: string): string {
  const regex = new RegExp(`(${match})`, 'gi'); // Case-insensitive matching with 'i' flag
  return text.replace(regex, '<match>$1</match>'); // Wrap matched text in <match> tags
}

chrome.omnibox.onInputEntered.addListener((content) => {
  const tabId = parseInt(content, 10); // Get tabId from the content
  if (!isNaN(tabId)) {
    chrome.tabs.update(tabId, { active: true }); // Switch to the selected tab
  }
});

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
  titleAndHRDate: {deleteProps: {a: true, la: false, u: true, t:false},dateFunc: (date:any)=>`${date} = ${formatTimestampToLocalTime(date)}`},
  onlyTime: {deleteProps: {a: true, la: false, u: true, t:true},dateFunc: (date:any)=>formatTimestampToLocalTime(date)}
}

const defaultOption = debugOptionsSets.titleAndHRDate