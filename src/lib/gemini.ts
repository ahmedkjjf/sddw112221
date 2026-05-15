import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing. Please check Settings > Secrets.');
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey });
  }
  return aiInstance;
}

export async function analyzeCodeStream(code: string, type: string, onChunk: (text: string) => void) {
  try {
    const ai = getAi();
    const prompt = `[TASK: FULL_SOURCE_RECONSTRUCTION] TYPE: ${type}\nOBJECTIVE: 1. RECONSTRUCT FULL LOGIC. 2. ORGANIZE BEAUTIFULLY. 3. RESTORE FLOW.\nINPUT:\n${code}`;
    
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

export async function normalizeVariablesStream(code: string, onChunk: (text: string) => void) {
  try {
    const ai = getAi();
    const prompt = `[TASK: HUMAN_VARIABLES] 1. RENAME GENERIC VARS. 2. DO NOT CHANGE LOGIC. 3. OUTPUT ONLY CODE BLOCK.\nINPUT:\n${code}`;
    
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("Variable Normalization Error:", error);
    throw error;
  }
}

export async function scanVulnerabilitiesStream(code: string, onChunk: (text: string) => void) {
  try {
    const ai = getAi();
    const prompt = `[TASK: SECURITY_VULNERABILITY_SCAN] ANALYZE FOR FLAWS, BACKDOORS. PROVIDE RISK LEVELS. OUTPUT IN ARABIC MARKDOWN.\nINPUT CODE:\n${code}`;
    
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("Vulnerability Scan Error:", error);
    throw error;
  }
}
