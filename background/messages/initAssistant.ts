import type { PlasmoMessaging } from "@plasmohq/messaging"
import BuiltInAssistant, { AI_STATUS } from '~/builtInAssistant';

// import { assistant } from "../index"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {

  const assistant = BuiltInAssistant.getInstance()

  assistant.onStatusChanged((status) => {
    console.log(`Assistant status updated: ${status}`)
  })

  await assistant.initializeAssistant()

  if (assistant["status"] === AI_STATUS.READY) {
    console.log("assistant is ready")
    //console.log('systemPrompt:', assistant.getSystemMessage())
  } else {
    console.warn("Assistant is not ready yet.")
  }

  // const apiKey = req.body?.api_key
  // console.log('Init AI model with:', apiKey)
  // assistant.initModel(apiKey)
}

export default handler
