import { LastAccessedTab } from './tabsManager';
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

// Singleton class for managing tabs
export class TabsManager {
  private static instance: TabsManager

  private constructor() {}

  // Method to get the singleton instance
  static getInstance(): TabsManager {
    if (!TabsManager.instance) {
      TabsManager.instance = new TabsManager()
    }
    return TabsManager.instance
  }

  async groupTabs(groupInstructions: { [key: string]: string[] }): Promise<void> {
    
    console.log('at group tabs')
    // Query all open tabs
    const allTabs = await chrome.tabs.query({ windowType: "normal"});
    console.log('allTabs:', allTabs)
    const existingTabIds = new Set(allTabs.map((tab) => tab.id));

    // Collect all tab IDs from the instructions to keep track of which tabs are being grouped
    const groupedTabIds = new Set<number>();

    // Iterate over the group instructions and create new groups
    for (const groupName in groupInstructions) {

      // take only those that are in allTabs
      const tabIdsForGroup = groupInstructions[groupName]
      .map((id) => Number(id))
      .filter((id) => existingTabIds.has(id));

      if(groupInstructions[groupName].length !== tabIdsForGroup.length){
        console.log('Found mismatch between AI-group instructions and actual tabs', 'All tabs:', allTabs, 'Group instructions:', tabIdsForGroup, 'Grouping only those which exists')
      }
      if (tabIdsForGroup.length > 0) {
        
        // Group the tabs and assign them to the current group
        try{
          const groupId = await chrome.tabs.group({ tabIds: tabIdsForGroup });
          await chrome.tabGroups.update(groupId, { title: groupName }); // Set group title

        }catch(e){
          console.log(e)
        }

        // Add grouped tab IDs to the set
        tabIdsForGroup.forEach((id) => groupedTabIds.add(id));
      }
    }

    // Find tabs that are not part of the instructions (ungrouped tabs)
    const ungroupedTabs = allTabs.filter((tab) => tab.id && !groupedTabIds.has(tab.id));

    // If there are any ungrouped tabs, group them under the "?" group
    if (ungroupedTabs.length > 0) {
      const ungroupedTabIds = ungroupedTabs.map((tab) => tab.id!).filter((id) => id !== undefined);
      const groupId = await chrome.tabs.group({ tabIds: ungroupedTabIds });
      await chrome.tabGroups.update(groupId, { title: "?" }); // Set group title to "?"
    }
  }

  async ungroupAllTabs(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('At ungroup all tabs')
        // Query all existing tab groups
        const tabGroups = await chrome.tabGroups.query({})
        if (tabGroups.length === 0) {
          console.log("No tab groups found.")
          resolve() // No groups to ungroup
          return
        }

        // Iterate over all tab groups and ungroup the tabs in each group
        for (const group of tabGroups) {
          // Check if the group exists before trying to ungroup
          const groupExists = await chrome.tabGroups
            .get(group.id)
            .catch(() => null)

          if (groupExists) {
            const tabsInGroup = await chrome.tabs.query({ groupId: group.id })

            if (tabsInGroup.length > 0) {
              const tabIds = tabsInGroup
                .map((tab) => tab.id)
                .filter((id) => id !== undefined) as number[]
              await chrome.tabs.ungroup(tabIds) // Ungroup the tabs
            } else {
              console.log(`No tabs found in group with ID: ${group.id}`)
            }
          } else {
            console.log(`Group with ID: ${group.id} does not exist.`)
          }
        }

        resolve() // Resolve after ungrouping all tabs
      } catch (error) {
        reject(error)
      }
    })
  }

  async reorderAndRenameGroups(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Query all existing tab groups
        const tabGroups = await chrome.tabGroups.query({})

        if (tabGroups.length === 0) {
          console.log("No tab groups found.")
          resolve() // No groups to reorder or rename
          return
        }

        // List of target groups in alphabetical order and their new names
        const groupMappings: { [key: string]: string } = {
          A: "🔥🔥🔥",
          B: "🔥🔥",
          C: "🔥",
          D: "🗑️"
        }
        const groupColorsMappings: { [key: string]: chrome.tabGroups.ColorEnum } = {
          A: 'red',
          B: 'orange',
          C: 'yellow',
          D: 'grey'
        }

        // Filter out the groups that match our target names (A, B, C, D)
        const matchedGroups = tabGroups.filter((group) =>
          Object.keys(groupMappings).includes(group.title || "")
        )

        // Sort the matched groups by their title (A, B, C, D) based on alphabetical order
        matchedGroups.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        )

        // Reorder the groups by moving them
        let currentIndex = 0
        for (const group of matchedGroups) {
          try {
            // Move the group to the new index position in the tab strip
            await chrome.tabGroups.move(group.id, { index: currentIndex })
            currentIndex++ // Increment index for the next group
          } catch (error) {
            console.error(`Failed to move group with ID: ${group.id}`, error)
          }
        }

        // Now rename the groups according to the mapping
        for (const group of matchedGroups) {
          try {
            const newTitle = groupMappings[group.title || ""]
            const newColor = groupColorsMappings[group.title || ""]
            if (newTitle) {
              await chrome.tabGroups.update(group.id, { title: newTitle, color: newColor })
            }
          } catch (error) {
            console.error(`Failed to rename group with ID: ${group.id}`, error)
          }
        }

        resolve() // Resolve when done
      } catch (error) {
        reject(error)
      }
    })
  }

  async toggleGroups(collapse: boolean): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Query all existing tab groups
        const tabGroups = await chrome.tabGroups.query({})

        if (tabGroups.length === 0) {
          console.log("No tab groups found.")
          resolve() // No groups to collapse/expand
          return
        }

        // Iterate over all tab groups and collapse/expand based on the parameter
        for (const group of tabGroups) {
          try {
            await chrome.tabGroups.update(group.id, { collapsed: collapse })
          } catch (error) {
            console.error(`Failed to update group with ID: ${group.id}`, error)
          }
        }

        resolve() // Resolve after updating all groups
      } catch (error) {
        reject(error)
      }
    })
  }

  async getLastAccessedArray(): Promise<{ id: string; la: number }[]> {
    const tabs = await chrome.tabs.query({});
    const lastAccessedArray: { id: string; la: number }[] = [];

    for (const tab of tabs) {
        if (tab.id !== undefined && tab['lastAccessed'] !== undefined) {
            lastAccessedArray.push({
                id: tab.id.toString(),
                la: tab['lastAccessed'],
            });
        }
    }
    console.log('lastAccessedArray', lastAccessedArray);
    return lastAccessedArray;
}

}
