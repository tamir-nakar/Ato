import { GoogleGenerativeAI } from "@google/generative-ai"

import { systemInstruction } from "./system"
import type { Tab } from "./tabsManager"

enum EMethods {
  CATEGORY = "category",
  LAST_ACCESSED = "last_accessed",
  PREDICTION = "prediction"
}

export class Assistant {
  private static instance: Assistant
  private genAI: GoogleGenerativeAI
  private model: any

  private constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.PLASMO_PUBLIC_API_KEY)
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction
    })
  }

  public static getInstance(): Assistant {
    if (!Assistant.instance) {
      Assistant.instance = new Assistant()
    }
    return Assistant.instance
  }

  public async generateContent(data: Tab[]): Promise<{ output: object }> {
    const result = await this.model.generateContent(JSON.stringify(data))
    return JSON.parse(result.response.text())
  }
}
