import type { PlasmoMessaging } from "@plasmohq/messaging"
import type { Message } from "~types"
import { groupByCategory } from "../index"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log('Background: groupByCategory handler')
  const message: Message = { isError: false }
  message.isError = await groupByCategory()
  res.send(message)
}
export default handler
