import { useEffect, useState } from "react"
import { Assistant } from "./assistant"
import { organizeByCategory } from "./index"
const assistant = Assistant.getInstance()
function IndexPopup() {
  const [input, setInput] = useState("")
  const [answer, setAnswer] = useState("")

  // useEffect(() => {
  //   const askAi = async function () {
  //     const answer = await assistant.generateContent(input)
  //     setAnswer(answer)
  //   }
  //   askAi()
  // }, [input])

  return (
    <div
      style={{
        padding: 16
      }}>
        <button onClick={(e)=>organizeByCategory()}>by category</button>
        <button>by last access</button>
        <button>by prediction</button>
      {/* <input onChange={(e) => setInput(e.target.value)} value={input} /> */}
    </div>
  )
}

export default IndexPopup
