import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./lib/supabase.js";
import { generateEmbedding, sleep } from "./lib/embeddings.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CHUNKING_PROMPT = `You are processing OCR-extracted text from a JEE/EAMCET topper's handwritten notes. The OCR is noisy but recognizable. Extract clean, structured chunks.

For each chunk identify the type:
- "formula" — equations, identities, formulas
- "theorem" — named laws/principles
- "example" — worked examples with solutions
- "theory" — concepts/definitions

Output STRICT JSON:
{"chunks": [{"type": "...", "title": "...", "content": "clean LaTeX content"}]}

Rules:
- Convert math to proper LaTeX (\\\\frac, \\\\sqrt, ^{}, _{}, etc.)
- Wrap formulas in \\\\boxed{}
- Fix obvious OCR errors using physics/math/chem context
- Skip OCR garbage that has no meaning
- 2-8 chunks per page
- Double-escape backslashes in JSON strings

Page text:
`;

function isRetryableError(err) {
  const msg = String(err?.message || err || "");
  return (
    msg.includes("[503") ||
    msg.includes("503") ||
    msg.includes("Service Unavailable") ||
    msg.toLowerCase().includes("high demand") ||
    msg.includes("[429") ||
    msg.includes("429") ||
    msg.toLowerCase().includes("rate limit") ||
    msg.toLowerCase().includes("quota") ||
    msg.toLowerCase().includes("timeout") ||
    msg.toLowerCase().includes("timed out") ||
    msg.toLowerCase().includes("econnreset") ||
    msg.toLowerCase().includes("fetch")
  );
}

async function withRetries(fn, { retries = 6, baseDelayMs = 800, maxDelayMs = 15000 } = {}) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries || !isRetryableError(err)) throw err;
      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * 250);
      await sleep(backoff + jitter);
    }
  }
}

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        const fixed = jsonMatch[0].replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
        try {
          return JSON.parse(fixed);
        } catch (e) {
          throw new Error(`JSON parse failed: ${e.message}`);
        }
      }
    }
    throw new Error("No JSON object found in Gemini response");
  }
}

function filenameToChapter(filename) {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

async function chunkPageText(pageText) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });
  const result = await withRetries(
    () => model.generateContent(CHUNKING_PROMPT + pageText),
    { retries: 6, baseDelayMs: 1200 }
  );
  return safeParseJSON(result.response.text());
}

/**
 * Read page_*.txt files from `extracted-notes` bucket, chunk each page with
 * Gemini, embed each chunk, and insert into notes_chunks.
 *
 * @param {string} filename  e.g. "kinamatics.pdf"
 * @param {string} subject   e.g. "physics"
 */
export async function chunkAndEmbed(filename, subject) {
  const chapter = filenameToChapter(filename);
  const folderPath = `${subject}/${chapter}`;

  console.log(`   📂 Reading from extracted-notes/${folderPath}/`);

  const { data: files, error: listError } = await supabase.storage
    .from("extracted-notes")
    .list(folderPath);

  if (listError) throw listError;

  const pageFiles = (files || [])
    .filter((f) => /^page_\d+\.txt$/.test(f.name))
    .sort((a, b) => {
      const na = parseInt(a.name.match(/\d+/)[0], 10);
      const nb = parseInt(b.name.match(/\d+/)[0], 10);
      return na - nb;
    });

  if (pageFiles.length === 0) {
    throw new Error(`No page_*.txt files found in extracted-notes/${folderPath}`);
  }

  console.log(`   📄 ${pageFiles.length} pages to chunk`);

  // Get existing log row (created by extract-text step) or create one
  let logRow;
  const { data: existing } = await supabase
    .from("ingestion_log")
    .select("id")
    .eq("pdf_filename", filename)
    .single();

  if (existing) {
    await supabase
      .from("ingestion_log")
      .update({ status: "embedding" })
      .eq("id", existing.id);
    logRow = existing;
  } else {
    const { data: created } = await supabase
      .from("ingestion_log")
      .insert({
        pdf_filename: filename,
        subject,
        status: "embedding",
        started_at: new Date().toISOString(),
        pages_processed: 0,
        chunks_created: 0,
      })
      .select()
      .single();
    logRow = created;
  }

  let totalChunks = 0;

  for (let i = 0; i < pageFiles.length; i++) {
    const pageFile = pageFiles[i];
    const pageNum = parseInt(pageFile.name.match(/\d+/)[0], 10);

    process.stdout.write(`   Page ${i + 1}/${pageFiles.length} (p${pageNum})... `);

    try {
      // Download the page text from storage
      const { data: blob, error: dlError } = await supabase.storage
        .from("extracted-notes")
        .download(`${folderPath}/${pageFile.name}`);
      if (dlError) throw dlError;

      const pageText = await blob.text();
      if (!pageText.trim()) {
        console.log("(empty, skipped)");
        continue;
      }

      // Gemini: extract structured chunks
      const extracted = await chunkPageText(pageText);
      const chunks = extracted.chunks || [];

      if (chunks.length === 0) {
        console.log("(no chunks)");
        await sleep(200);
        continue;
      }

      // Idempotency: clear prior chunks for this PDF page before re-inserting.
      // This makes re-runs safe after transient Gemini errors.
      const { error: deleteError } = await withRetries(
        () =>
          supabase
            .from("notes_chunks")
            .delete()
            .eq("pdf_filename", filename)
            .eq("subject", subject)
            .eq("chapter", chapter)
            .eq("page_number", pageNum),
        { retries: 4, baseDelayMs: 500 }
      );
      if (deleteError) throw deleteError;

      // Embed + insert each chunk
      for (const chunk of chunks) {
        const textForEmbedding = `${chunk.title}\n${chunk.content}`;
        const embedding = await withRetries(
          () => generateEmbedding(textForEmbedding),
          { retries: 6, baseDelayMs: 1200 }
        );

        const { error: insertError } = await withRetries(
          () =>
            supabase.from("notes_chunks").insert({
              subject,
              chapter,
              pdf_filename: filename,
              page_number: pageNum,
              chunk_type: chunk.type,
              content: `${chunk.title}\n\n${chunk.content}`,
              embedding,
            }),
          { retries: 6, baseDelayMs: 800 }
        );

        if (insertError) throw insertError;
        totalChunks++;
        await sleep(100);
      }

      console.log(`✅ ${chunks.length} chunks`);

      await supabase
        .from("ingestion_log")
        .update({ pages_processed: i + 1, chunks_created: totalChunks })
        .eq("id", logRow.id);
    } catch (pageErr) {
      console.log(`❌ ${pageErr.message}`);
    }

    // Stay under Gemini free tier (~10 RPM for thinking models)
    await sleep(200);
  }

  await supabase
    .from("ingestion_log")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
      chunks_created: totalChunks,
    })
    .eq("id", logRow.id);

  console.log(`   ✅ Done: ${totalChunks} chunks embedded`);
  return { success: true, chunks: totalChunks };
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , filename, subject] = process.argv;
  if (!filename || !subject) {
    console.error("Usage: node scripts/chunk-and-embed.js <filename.pdf> <subject>");
    process.exit(1);
  }
  chunkAndEmbed(filename, subject)
    .then((result) => {
      console.log("\nResult:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Fatal:", err.message);
      process.exit(1);
    });
}
