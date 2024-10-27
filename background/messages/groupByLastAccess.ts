import type { PlasmoMessaging } from "@plasmohq/messaging"
import { groupByLastAccess } from "../index"
import type { Message } from "~types"

// prepare data for lastAccess
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log('Background: groupByLastAccess handler')
  const message: Message = { isError: false }
  message.isError = await groupByLastAccess()
  res.send(message)
}

export default handler


