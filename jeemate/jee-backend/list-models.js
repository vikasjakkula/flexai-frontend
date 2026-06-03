import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

(async () => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  const data = await res.json();

  if (!data.models) {
    console.error("Error:", JSON.stringify(data, null, 2));
    return;
  }

  console.log(`\n📋 Found ${data.models.length} models on your key.\n`);

  // Filter to only embedding-capable models
  const embeddingModels = data.models.filter((m) =>
    m.supportedGenerationMethods?.includes("embedContent")
  );

  console.log("🎯 EMBEDDING MODELS (use one of these):");
  embeddingModels.forEach((m) => {
    console.log(`   ${m.name}  (output dim: ${m.outputDimensions || "n/a"})`);
  });

  console.log("\n📚 ALL MODELS:");
  data.models.forEach((m) => {
    console.log(`   ${m.name}`);
  });
})();