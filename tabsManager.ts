
export interface Tab {
  u: string // URL
  t: string // Title
  id: string // Tab ID
}

export interface LastAccessedTab {
  id: string // Tab ID
  la: string // Last accessed date-time
}

export interface FrequencyTab {
  id: string // Tab ID
  a: string[] // Access timestamps
}

// BackgroundService interface
export interface BackgroundService {
  getTabs(): Promise<Tab[]>
  getTabsLastAccessed(): Promise<LastAccessedTab[]>
  getTabsAccessFrequency(): Promise<FrequencyTab[]>
}

// Singleton class for managing tabs
export class TabsManager {
  private static instance: TabsManager

  private constructor(private backgroundService: BackgroundService) {}

  // Method to get the singleton instance
  static getInstance(backgroundService: BackgroundService): TabsManager {
    if (!TabsManager.instance) {
      TabsManager.instance = new TabsManager(backgroundService)
    }
    return TabsManager.instance
  }

  // Prepare input for AI by category
  async getTabsByCategory() {
    const tabs = await this.backgroundService.getTabs()
    return tabs
  }

  async groupTabs(groupInstructions: {
    [key: string]: string[]
  }): Promise<void> {
    // Query all open tabs

    // First, remove all existing tab groups
    // const tabGroups = await chrome.tabGroups.query({});
    // for (const group of tabGroups) {
    //     await chrome.tabs.ungroup(group.id); // Remove all tabs from existing groups
    // }

    const newGroups: { [key: string]: string[] } = {} // To hold newly grouped tabs

    // Iterate over the group instructions and create new groups
    for (const groupName in groupInstructions) {
        
      const tabIdsForGroup = groupInstructions[groupName].map((id) =>
        Number(id)
      ) // Convert IDs to numbers for chrome.tabs API

      if (tabIdsForGroup.length > 0) {
        // Group the tabs and assign them to the current group
        const groupId = await chrome.tabs.group({ tabIds: tabIdsForGroup })
        debugger
        const groupExists = await chrome.tabGroups.get(groupId);
        await chrome.tabGroups.update(groupId, { title: groupName }) // Set group title

        newGroups[groupName] = tabIdsForGroup.map((id) => id.toString()) // Store the grouped tabs
      }
    }

    // Handle tabs that don't fit into any provided group (i.e., "Other")

    // Resolve with the new groupings
  }

  // Prepare input for AI by last accessed
  async getTabsByLastAccessed(): Promise<{ [timeFrame: string]: string[] }> {
    const tabs = await this.backgroundService.getTabsLastAccessed()
    const timeFrameMap: { [timeFrame: string]: string[] } = {
      "last hour": [],
      "last day": [],
      "last week": [],
      older: []
    }

    const now = new Date()

    tabs.forEach((tab) => {
      const lastAccessed = new Date(tab.la)
      const timeDiff = now.getTime() - lastAccessed.getTime()
      const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60))

      if (hoursDiff < 1) {
        timeFrameMap["last hour"].push(tab.id)
      } else if (hoursDiff < 24) {
        timeFrameMap["last day"].push(tab.id)
      } else if (hoursDiff < 168) {
        timeFrameMap["last week"].push(tab.id)
      } else {
        timeFrameMap["older"].push(tab.id)
      }
    })

    return timeFrameMap
  }

  // Prepare input for AI based on access frequency
  async getTabsByPrediction(): Promise<string[]> {
    const tabs = await this.backgroundService.getTabsAccessFrequency()
    const tabFrequency: { id: string; frequency: number }[] = []

    tabs.forEach((tab) => {
      const accessTimes = tab.a.length
      tabFrequency.push({ id: tab.id, frequency: accessTimes })
    })

    tabFrequency.sort((a, b) => b.frequency - a.frequency)

    return tabFrequency.map((tab) => tab.id)
  }
}
