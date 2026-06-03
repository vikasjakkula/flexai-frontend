import { supabase } from "./supabase.js";
import { generateEmbedding } from "./embeddings.js";

/**
 * Find the K most relevant note chunks for a given question.
 * Optionally filter by subject for faster + more accurate retrieval.
 */
export async function findRelevantChunks(question, subject = null, k = 5) {
  if (!supabase) return [];

  // 1. Embed the question
  const queryEmbedding = await generateEmbedding(question);

  // 2. Search via pgvector cosine similarity
  const { data, error } = await supabase.rpc("match_notes", {
    query_embedding: queryEmbedding,
    filter_subject: subject,
    match_count: k,
  });

  if (error) {
    console.error("RAG search failed:", error.message);
    return [];
  }

  return data || [];
}