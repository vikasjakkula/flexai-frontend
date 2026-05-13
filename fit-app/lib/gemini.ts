import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY?.trim();

const defaultModel =
  process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim().length ? process.env.EXPO_PUBLIC_GEMINI_MODEL!.trim() : 'gemini-2.0-flash';

export function getGeminiModel(model = defaultModel) {
  if (!apiKey) {
    throw new Error('Set EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY in .env');
  }
  const gen = new GoogleGenerativeAI(apiKey);
  return gen.getGenerativeModel({ model });
}

export async function askCoach(prompt: string): Promise<string> {
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text?.trim() ?? '';
}
