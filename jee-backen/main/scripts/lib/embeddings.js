import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  
  // Request 768 dimensions explicitly (instead of default 3072)
  const result = await model.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 768,
  });
  
  return result.embedding.values; // 768-dim vector
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
