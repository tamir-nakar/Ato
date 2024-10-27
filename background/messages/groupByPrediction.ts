import type { PlasmoMessaging } from "@plasmohq/messaging"
import type { Message } from "~types"
import { groupByPrediction } from "../index"

// prepare data for prediction
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("Background: groupByPrediction handler")
  const message: Message = { isError: false }
  message.isError = await groupByPrediction()
  res.send(message)
}

export default handler
