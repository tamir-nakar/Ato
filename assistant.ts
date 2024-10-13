import { GoogleGenerativeAI } from "@google/generative-ai"

import { systemInstruction } from "./system"
import type { FrequencyTab, LastAccessedTab, Tab } from "./tabsManager"

export class Assistant {
  private static instance: Assistant
  private genAI: GoogleGenerativeAI
  private model: any

  private constructor(){}

  public initModel (apiKey){
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction
    })
  }
  public static getInstance(apiKey?: string): Assistant {
    if (!Assistant.instance) {
      Assistant.instance = new Assistant()
    }
    return Assistant.instance
  }

  public async generateContent(data: Tab[]| LastAccessedTab[]| FrequencyTab[]): Promise<{ output: object }> {
    const result = await this.model.generateContent(JSON.stringify(data))
    return JSON.parse(this.sanitize(result.response.text()))
  }

  private sanitize(inputString: string){
    if(inputString.startsWith('```')){
      return inputString.replace(/^```json/, '').replace(/```$/, '');
    }else{
      return inputString
    }
  }
}
