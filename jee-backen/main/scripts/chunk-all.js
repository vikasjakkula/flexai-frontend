import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { supabase } from "./lib/supabase.js";
import { sleep } from "./lib/embeddings.js";
import { chunkAndEmbed } from "./chunk-and-embed.js";

(async () => {
  console.log("🧩 Chunk + embed all (status = text_extracted)\n");

  const { data: rows, error } = await supabase
    .from("ingestion_log")
    .select("pdf_filename, subject")
    .eq("status", "text_extracted")
    .order("pdf_filename");

  if (error) throw error;

  const list = rows || [];
  if (list.length === 0) {
    console.log("No rows with status text_extracted. Run extract-text / ingest-all OCR first.");
    process.exit(0);
  }

  console.log(`Found ${list.length} PDF(s) ready to chunk\n`);

  let succeeded = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < list.length; i++) {
    const { pdf_filename: filename, subject } = list[i];
    const tag = `[${i + 1}/${list.length}]`;

    console.log(`\n${tag} ${subject}/${filename}`);

    try {
      await chunkAndEmbed(filename, subject);
      succeeded++;
    } catch (err) {
      console.error(`   💥 Failed: ${err.message}`);
      failed++;
    }

    await sleep(1000);
  }

  const mins = Math.round((Date.now() - startTime) / 60000);
  console.log(`\n${"─".repeat(40)}`);
  console.log(`🎉 Done in ${mins} minutes`);
  console.log(`   ✅ Succeeded : ${succeeded}`);
  console.log(`   ❌ Failed    : ${failed}`);
})();
