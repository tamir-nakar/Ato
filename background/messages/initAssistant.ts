import type { PlasmoMessaging } from "@plasmohq/messaging"
import { assistant } from "../index"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {

  const apiKey = req.body?.api_key
  console.log('Init AI model with:', apiKey)
  assistant.initModel(apiKey)  
}

export default handler
