import { generateEmbedding } from "./lib/embeddings.js";

(async () => {
  console.log("Testing embedding...");
  try {
    const vec = await generateEmbedding("Newton's second law of motion");
    console.log("✅ Got embedding!");
    console.log("Dimensions:", vec.length);
    console.log("First 5 values:", vec.slice(0, 5));
  } catch (e) {
    console.error("❌ Failed:", e.message);
  }
})();