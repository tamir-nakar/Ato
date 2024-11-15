import { GoogleGenerativeAI } from "@google/generative-ai"

import { systemInstruction } from "./system"
import type { FrequencyTab, LastAccessedTab, Tab } from "./tabsManager"

export class Assistant {
  private static instance: Assistant
  private genAI: GoogleGenerativeAI
  private model: any
  private init: boolean = false

  private constructor() {}

  public initModel(apiKey) {
    console.log('init model with api key:', apiKey)
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction
    })
    if (apiKey) {
      this.init = true
    }
  }
  public static getInstance(apiKey?: string): Assistant {
    if (!Assistant.instance) {
      console.log('🎉 Generated new instance of Assistant:', String(apiKey).substring(0,3));
      Assistant.instance = new Assistant()
    }
    return Assistant.instance
  }

  public isKey() {
    return this.init
  }

  public async generateContent(
    data: Tab[] | LastAccessedTab[] | FrequencyTab[]
  ): Promise<{ output: object} | null> {
    try {
      // console.log('📝 AI input:', data)
      const result = await this.model.generateContent(JSON.stringify(data))
      // console.log('🤖 AI res:', JSON.parse(this.sanitize(result.response.text())))
      return JSON.parse(this.sanitize(result.response.text()))
    } catch (e) {
      return null
    }
  }

  private sanitize(inputString: string) {
    if (inputString.startsWith("```")) {
      return inputString.replace(/^```json/, "").replace(/```$/, "")
    } else {
      return inputString
    }
  }
}
