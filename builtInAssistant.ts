import { systemInstruction as categoryInstructions } from "./category_system"
import { systemInstruction as lastAccessInstructions} from "./last_access_system"
import { Emethod } from "~types";
export enum AI_STATUS {
  READY = "ready",
  DOWNLOADING = "downloading",
  NOT_READY = "not-ready",
}

export default class BuiltInAssistant {
  private static instance: BuiltInAssistant;
  private session: chrome.aiOriginTrial.languageModel.Session | null = null;
  private status: AI_STATUS = AI_STATUS.NOT_READY;
  private statusChangedCallback: ((status: AI_STATUS) => void) | null = null;

  private readonly keepSession: boolean; // Controls session reuse

  private constructor(keepSession: boolean = false) {
    this.keepSession = keepSession;
  }

  // Singleton instance getter
  public static getInstance(keepSession: boolean = false): BuiltInAssistant {
    if (!BuiltInAssistant.instance) {
      BuiltInAssistant.instance = new BuiltInAssistant(keepSession);
    }
    return BuiltInAssistant.instance;
  }

  // Set a callback to notify the client when the status changes
  public onStatusChanged(callback: (status: AI_STATUS) => void): void {
    this.statusChangedCallback = callback;
  }

  // Update the status and notify the client
  private updateStatus(newStatus: AI_STATUS): void {
    this.status = newStatus;
    console.log("Status changed:", newStatus);
    if (this.statusChangedCallback) {
      this.statusChangedCallback(newStatus);
    }
  }

  // Initialize the assistant
  public async initializeAssistant(): Promise<void> {

    const capabilities = await chrome.aiOriginTrial.languageModel.capabilities();

    if (capabilities.available === "readily") {
      this.updateStatus(AI_STATUS.READY);
      this.session = await chrome.aiOriginTrial.languageModel.create({
        systemPrompt: categoryInstructions,
        parameters: { temperature: 0 }

      });
      console.log("Assistant initialized");
    } else if (capabilities.available === "after-download") {
      this.updateStatus(AI_STATUS.DOWNLOADING);
      console.log("Model needs to be downloaded. Starting download...");
      await this.downloadModel();
    } else {
      this.updateStatus(AI_STATUS.NOT_READY);
      console.error("Prompt API not available on this browser.");
    }
  }

  // Download the model if necessary
  private async downloadModel(): Promise<void> {
    try {
      const session = await chrome.aiOriginTrial.languageModel.create({
        monitor(monitor) {
          monitor.addEventListener("downloadprogress", (e) => {
            console.log(`Downloading model: ${e.loaded}/${e.total} bytes.`);
          });
        },
      });
      session.destroy(); // Destroy temporary session used for download

      // Retry initialization after the model is downloaded
      await this.initializeAssistant();
    } catch (error) {
      console.error("Error downloading model:", error);
      this.updateStatus(AI_STATUS.NOT_READY);
    }
  }

  // Generate a prompt and return the response
  public async generatePrompt(userPrompt: string, method: Emethod ): Promise<string | null> {
    let systemInstructions = null
    switch(method){
      case Emethod.CATEGORY:
        systemInstructions = categoryInstructions
        break
      case Emethod.PREDICTION:
        systemInstructions = categoryInstructions
        break
      case Emethod.LAST_ACCESS:
        systemInstructions = lastAccessInstructions
        break
    }

    if (this.status !== AI_STATUS.READY) {
      console.warn("Assistant is not ready yet.");
      return null;
    }

    if (this.keepSession) {
      // Reuse the existing session
      if (!this.session) {
        console.error("Assistant session is not initialized.");
        return null;
      }

      try {
        const response = await this.session.prompt(userPrompt);
        return JSON.parse(this.sanitize(response));
      } catch (error) {
        console.error("Error generating prompt:", error);
        return null;
      }
    } else {
      // Create a new session for each prompt
      try {
        const tempSession = await chrome.aiOriginTrial.languageModel.create({
          systemPrompt: systemInstructions,
          parameters: { temperature: 0 }

        });
        const response = await tempSession.prompt(userPrompt);
        debugger
        tempSession.destroy(); // Clean up temporary session
        console.log("Prompt response:", response);
        return JSON.parse(this.sanitize(response));
      } catch (error) {
        console.error("Error generating prompt:", error);
        return null;
      }
    }
  }
  private sanitize(inputString: string) {
    if (inputString.startsWith("```")) {
      return inputString.replace(/^```json/, "").replace(/```$/, "")
    } else {
      return inputString
    }
  }

  // Reset the session to ensure a fresh context
  public async resetSession(): Promise<void> {
    if (this.session) {
      this.session.destroy();
    }
    await this.initializeAssistant();
  }
}
