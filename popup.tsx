import { useEffect, useState } from "react"
import { Assistant } from "./assistant"
import { organizeByCategory, organizeByLastAccess, organizeByPrediction, toggleGroups, ungroupAllTabs } from "./index"
function IndexPopup() {
  const [input, setInput] = useState("")
  const [answer, setAnswer] = useState("")
  const [collapse, setCollapse] = useState(true)

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
        <button style={{backgroundColor: '#9DD9F3'}} onClick={(e)=>organizeByCategory()}> by category</button>
        <button style={{backgroundColor: '#9DD9F3'}} onClick={(e)=>organizeByLastAccess()}> by last access</button>
        <button style={{backgroundColor: '#9DD9F3'}} onClick={(e)=>organizeByPrediction()}> by prediction</button>
        <button onClick={(e)=>ungroupAllTabs()}>Ungroup All 🗑️</button>
        <button onClick={(e)=>{toggleGroups(collapse); setCollapse(!collapse)}}>Toggle Groups 🔄</button>

      {/* <input onChange={(e) => setInput(e.target.value)} value={input} /> */}
    </div>
  )
}

export default IndexPopup
