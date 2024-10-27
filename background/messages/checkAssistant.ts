import type { PlasmoMessaging } from "@plasmohq/messaging"
import { assistant } from "../index"
import type { Message } from '~types'
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {

  const message: Message = {}
  const isInitialized = assistant.isKey()
  message.content = {isInit : isInitialized}
  res.send(message)
}

export default handler
