import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import path from "path";
import fs from "fs/promises";
import { supabase } from "./lib/supabase.js";
import { downloadPdf, getPageCount, pdfPageToImage } from "./lib/pdf-utils.js";
import { runOcrOnImage } from "./lib/ocr.js";

const TEMP_DIR = "/tmp/jeemate-extract";

function filenameToChapter(filename) {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Download a PDF, OCR every page, and upload each page's text to the
 * `extracted-notes` Supabase Storage bucket at:
 *   {subject}/{chapter}/page_{N}.txt
 *
 * Updates ingestion_log throughout.
 * Returns { success: true, pages, filename, chapter } on success.
 */
export async function extractTextFromPdf(pdfUrlOrPath, subject) {
  const isUrl = /^https?:\/\//.test(pdfUrlOrPath);
  const filename = isUrl
    ? path.basename(new URL(pdfUrlOrPath).pathname)
    : path.basename(pdfUrlOrPath);
  const pdfPath = isUrl ? path.join(TEMP_DIR, filename) : pdfUrlOrPath;
  const chapter = filenameToChapter(filename);
  const imageDir = path.join(TEMP_DIR, `${filename}-images`);

  // Mark as processing
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
    if (isUrl) {
      await fs.mkdir(TEMP_DIR, { recursive: true });
      console.log(`   ⬇️  Downloading ${filename}...`);
      await downloadPdf(pdfUrlOrPath, pdfPath);
    }

    const totalPages = await getPageCount(pdfPath);
    console.log(`   📄 ${totalPages} pages`);

    await fs.mkdir(imageDir, { recursive: true });
    let pagesUploaded = 0;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      process.stdout.write(`   OCR page ${pageNum}/${totalPages}... `);

      try {
        const imagePath = await pdfPageToImage(pdfPath, pageNum, imageDir);
        const text = await runOcrOnImage(imagePath);
        await fs.unlink(imagePath).catch(() => {});

        const storagePath = `${subject}/${chapter}/page_${pageNum}.txt`;
        const { error: uploadError } = await supabase.storage
          .from("extracted-notes")
          .upload(storagePath, Buffer.from(text, "utf-8"), {
            contentType: "text/plain",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        pagesUploaded++;
        console.log(`${text.length} chars ✅`);

        await supabase
          .from("ingestion_log")
          .update({ pages_processed: pagesUploaded })
          .eq("id", logRow.id);
      } catch (pageErr) {
        console.log(`❌ ${pageErr.message}`);
      }
    }

    await fs.rm(imageDir, { recursive: true, force: true }).catch(() => {});

    await supabase
      .from("ingestion_log")
      .update({ status: "text_extracted", pages_processed: pagesUploaded })
      .eq("id", logRow.id);

    console.log(`   ✅ Text extracted: ${pagesUploaded}/${totalPages} pages uploaded`);
    return { success: true, pages: pagesUploaded, filename, chapter };
  } catch (err) {
    await supabase
      .from("ingestion_log")
      .update({ status: "failed", error_message: err.message })
      .eq("id", logRow.id);
    throw err;
  } finally {
    if (isUrl) await fs.unlink(pdfPath).catch(() => {});
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , pdfUrlOrPath, subject] = process.argv;
  if (!pdfUrlOrPath || !subject) {
    console.error("Usage: node scripts/extract-text.js <pdf-url-or-path> <subject>");
    process.exit(1);
  }
  extractTextFromPdf(pdfUrlOrPath, subject)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal:", err.message);
      process.exit(1);
    });
}
