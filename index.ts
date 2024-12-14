import { sendToBackground } from "@plasmohq/messaging"
import { TabsManager } from "./tabsManager"

const tabsManager = TabsManager.getInstance()

export async function organizeByCategory() {
  const response = await sendToBackground({
    name: "groupByCategory"
  })
  if (response.isError){
    return "error"
  }
}

export async function organizeByLastAccess() {
  const response = await sendToBackground({
    name: "groupByLastAccess"
  })
  if (response.isError){
    return "error"
  }
}

export async function organizeByPrediction() {
  const response = await sendToBackground({
    name: "groupByPrediction"
  })
  if (response.isError){
    return "error"
  }
}

export async function ungroupAllTabs() {
  tabsManager.ungroupAllTabs()
}

export async function toggleGroups(collapse: boolean) {
  tabsManager.toggleGroups(collapse)
}
