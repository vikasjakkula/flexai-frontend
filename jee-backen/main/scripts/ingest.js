import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { supabase } from "./lib/supabase.js";
import { generateEmbedding, sleep } from "./lib/embeddings.js";
import { getPageCount, pdfPageToImage, fileToBase64 } from "./lib/pdf-utils.js";
import { PAGE_EXTRACTION_PROMPT } from "./prompts/ingest.js";

/**
 * Parse JSON from Gemini, with fallback for LaTeX-heavy content.
 * Gemini sometimes returns invalid JSON when LaTeX backslashes aren't double-escaped.
 */
function safeParseJSON(text) {
    // First try: direct parse
    try {
      return JSON.parse(text);
    } catch (e1) {
      // Second try: extract just the JSON object/array
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          // Third try: escape unescaped backslashes (the LaTeX problem)
          const fixed = jsonMatch[0].replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
          try {
            return JSON.parse(fixed);
          } catch (e3) {
            throw new Error(`JSON parse failed even after cleanup: ${e3.message}`);
          }
        }
      }
      throw new Error("No JSON object found in response");
    }
  }

dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const TEMP_DIR = "/tmp/jeemate-ingest";

/**
 * Process a single page: send image to Gemini, get back chunks.
 */
async function extractPageChunks(imagePath) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1, // low = more consistent extraction
      responseMimeType: "application/json",
    },
  });

  const base64 = await fileToBase64(imagePath);
  const result = await model.generateContent([
    { text: PAGE_EXTRACTION_PROMPT },
    { inlineData: { mimeType: "image/png", data: base64 } },
  ]);

  const text = result.response.text();
  return safeParseJSON(text);
}

/**
 * Filename → chapter name (e.g., "binomial_theorem.pdf" → "Binomial Theorem").
 */
function filenameToChapter(filename) {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Ingest one PDF: every page → chunks → embeddings → Supabase.
 */
export async function ingestPdf(pdfUrlOrPath, subject) {

  // Detect if input is a URL or local path
  const isUrl = pdfUrlOrPath.startsWith("http://") || pdfUrlOrPath.startsWith("https://");

  let pdfPath;
  let filename;

  if (isUrl) {
    filename = path.basename(new URL(pdfUrlOrPath).pathname);
    pdfPath = path.join(TEMP_DIR, filename);
    await fs.mkdir(TEMP_DIR, { recursive: true });

    console.log(`\n📘 Ingesting: ${subject}/${filename}`);
    console.log(`   ⬇️  Downloading from Supabase...`);

    const { downloadPdf } = await import("../../lib/pdf-utils.js");
    await downloadPdf(pdfUrlOrPath, pdfPath);

  } else {
    pdfPath = pdfUrlOrPath;
    filename = path.basename(pdfPath);
    console.log(`\n📘 Ingesting: ${subject}/${filename}`);
  }

  const chapter = filenameToChapter(filename);

  // 1. Mark as processing
  const { data: logRow } = await supabase
    .from("ingestion_log")
    .upsert(
      {
        pdf_filename: filename,
        subject,
        status: "processing",
        started_at: new Date().toISOString(),
        pages_processed: 0,
        chunks_created: 0,
      },
      { onConflict: "pdf_filename" }
    )
    .select()
    .single();

  try {
    // 2. Get page count
    const totalPages = await getPageCount(pdfPath);
    console.log(`   Pages: ${totalPages}`);

    let totalChunks = 0;

    // 3. Process each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        process.stdout.write(`   Page ${pageNum}/${totalPages}... `);

        // Convert page → PNG
        const imagePath = await pdfPageToImage(pdfPath, pageNum, TEMP_DIR);

        // Extract chunks via Gemini
        const extracted = await extractPageChunks(imagePath);
        const chunks = extracted.chunks || [];

        if (chunks.length === 0) {
          console.log("(empty)");
          await fs.unlink(imagePath).catch(() => {});
          continue;
        }

        // 4. Embed + insert each chunk
        for (const chunk of chunks) {
          const textForEmbedding = `${chunk.title}\n${chunk.content}`;
          const embedding = await generateEmbedding(textForEmbedding);

          const { error: insertError } = await supabase.from("notes_chunks").insert({
            subject,
            chapter,
            pdf_filename: filename,
            page_number: pageNum,
            chunk_type: chunk.type,
            content: `${chunk.title}\n\n${chunk.content}`,
            embedding,
          });
          
          if (insertError) {
            console.log(`\n      ❌ INSERT FAILED: ${insertError.message}`);
            throw insertError; // bubble up so we see it
          }

          totalChunks++;

          // Tiny delay to respect Gemini rate limits (free tier ~15 RPM)
          await sleep(100);
        }

        console.log(`✅ ${chunks.length} chunks`);

        // Cleanup temp image
        await fs.unlink(imagePath).catch(() => {});

        // Update progress
        await supabase
          .from("ingestion_log")
          .update({
            pages_processed: pageNum,
            chunks_created: totalChunks,
          })
          .eq("id", logRow.id);

      } catch (pageErr) {
        console.log(`❌ ${pageErr.message}`);
        // Continue to next page — don't kill the whole PDF for one bad page
      }

      // Pause between pages to stay under rate limits
      await sleep(500);
    }

    // 5. Mark as done
    await supabase
      .from("ingestion_log")
      .update({
        status: "done",
        completed_at: new Date().toISOString(),
        chunks_created: totalChunks,
      })
      .eq("id", logRow.id);

    console.log(`   ✅ Done: ${totalChunks} chunks created`);
    return { success: true, chunks: totalChunks };

  } catch (err) {
    console.error(`   ❌ Failed: ${err.message}`);
    await supabase
      .from("ingestion_log")
      .update({
        status: "failed",
        error_message: err.message,
      })
      .eq("id", logRow.id);
    return { success: false, error: err.message };
  }
}

// CLI usage: `node scripts/ingest.js <pdf-path> <subject>`
const __ingestFilename = fileURLToPath(import.meta.url);
const isIngestCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__ingestFilename);
if (isIngestCli) {
  const [, , pdfPath, subject] = process.argv;
  if (!pdfPath || !subject) {
    console.error("Usage: node scripts/ingest.js <pdf-path> <subject>");
    process.exit(1);
  }
  ingestPdf(pdfPath, subject)
    .then((result) => {
      console.log("\nResult:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Fatal:", err);
      process.exit(1);
    });
}