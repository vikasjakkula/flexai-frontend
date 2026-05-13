import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { supabase } from "./lib/supabase.js";
import { sleep } from "./lib/embeddings.js";
import { extractTextFromPdf } from "./extract-text.js";
import { chunkAndEmbed } from "./chunk-and-embed.js";

const SUPABASE_PUBLIC_BASE = `${process.env.SUPABASE_URL}/storage/v1/object/public/lesson-pdfs`;

const FOLDER_TO_SUBJECT = {
  mathamatics: "maths",
  physics: "physics",
  chemistry: "chemistry",
};

async function listPdfsInFolder(folder) {
  const { data, error } = await supabase.storage
    .from("lesson-pdfs")
    .list(folder, { limit: 200 });
  if (error) throw error;
  return data.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
}

async function getStatusMap() {
  const { data } = await supabase
    .from("ingestion_log")
    .select("pdf_filename, status");
  const map = {};
  for (const row of data || []) map[row.pdf_filename] = row.status;
  return map;
}

async function ensureBucket() {
  const { error } = await supabase.storage.createBucket("extracted-notes", {
    public: true,
  });
  // Error code 409 / "already exists" is fine — ignore it
  if (error && !error.message?.includes("already exists")) {
    throw error;
  }
}

(async () => {
  console.log("🚀 JeeMate mass ingestion starting\n");

  await ensureBucket();
  console.log("✅ extracted-notes bucket ready\n");

  const statusMap = await getStatusMap();
  const doneCount = Object.values(statusMap).filter((s) => s === "done").length;
  console.log(`Already done: ${doneCount} PDFs (will skip)\n`);

  // Collect all PDFs across subjects
  const allTasks = [];
  for (const [folder, subject] of Object.entries(FOLDER_TO_SUBJECT)) {
    const pdfs = await listPdfsInFolder(folder);
    console.log(`  ${folder}: ${pdfs.length} PDFs`);
    for (const pdf of pdfs) {
      allTasks.push({
        url: `${SUPABASE_PUBLIC_BASE}/${folder}/${encodeURIComponent(pdf.name)}`,
        subject,
        filename: pdf.name,
      });
    }
  }

  const total = allTasks.length;
  console.log(`\nTotal: ${total} PDFs\n`);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  const startTime = Date.now();

  for (let i = 0; i < allTasks.length; i++) {
    const { url, subject, filename } = allTasks[i];
    const status = statusMap[filename];
    const tag = `[${i + 1}/${total}]`;

    if (status === "done") {
      console.log(`⏭️  ${tag} Skipping (done): ${filename}`);
      skipped++;
      continue;
    }

    console.log(`\n${tag} ${subject}/${filename}`);

    try {
      // Step 1 — OCR + upload text (skip if already done in a prior run)
      if (status !== "text_extracted") {
        await extractTextFromPdf(url, subject);
      } else {
        console.log(`   ℹ️  Text already extracted — skipping OCR step`);
      }

      // Step 2 — Chunk + embed
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
  console.log(`   ⏭️  Skipped   : ${skipped}`);
  console.log(`   ❌ Failed    : ${failed}`);
})();
