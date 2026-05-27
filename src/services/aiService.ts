import { GoogleGenerativeAI } from "@google/generative-ai";
import * as SecureStore from "expo-secure-store";
import { SECURE_KEYS } from "../constants";
import { AIAction } from "../types";

const PROMPTS: Record<AIAction, (code: string, language: string) => string> = {
  explain: (code, language) =>
    `You are a senior developer. Explain the following ${language} code clearly and concisely. Break down what each part does, mention any patterns used, and highlight important details.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``,
  summarize: (code, language) =>
    `Provide a brief summary (3-5 sentences) of what this ${language} code does. Focus on the overall purpose and key functionality.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``,
  improve: (code, language) =>
    `Review this ${language} code and suggest specific improvements. Consider: performance, readability, best practices, potential bugs, and security. Provide the improved code with explanations.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``,
};

export async function getApiKey(): Promise<string | null> {
  return await SecureStore.getItemAsync(SECURE_KEYS.GEMINI_API_KEY);
}

export async function setApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEYS.GEMINI_API_KEY, key);
}

export async function deleteApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_KEYS.GEMINI_API_KEY);
}

export async function generateAIResponse(
  code: string,
  language: string,
  action: AIAction,
): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error(
      "API key not configured. Please add your Gemini API key in Settings.",
    );
  }

  console.log("[AI] API key found, length:", apiKey.length);
  console.log("[AI] Action:", action, "| Language:", language);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

  const prompt = PROMPTS[action](code, language);

  try {
    console.log("[AI] Sending request to Gemini...");
    const result = await model.generateContent(prompt);
    console.log("[AI] Response received successfully");
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("[AI] Error caught:", error);
    console.error("[AI] Error message:", error?.message);
    console.error("[AI] Error name:", error?.name);
    console.error("[AI] Error stack:", error?.stack);

    if (error?.message?.includes("API_KEY_INVALID")) {
      throw new Error(
        "Invalid API key. Please check your Gemini API key in Settings.",
      );
    }
    if (
      error?.message?.includes("Failed to fetch") ||
      error?.message?.includes("Network request failed")
    ) {
      throw new Error(
        "Network error. AI features require an internet connection.",
      );
    }
    throw new Error(
      `AI generation failed: ${error?.message || "Unknown error"}`,
    );
  }
}
