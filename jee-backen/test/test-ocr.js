import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import path from "path";
import fs from "fs/promises";
import { ocrPdf } from "../main/scripts/lib/ocr.js";
import { downloadPdf } from "../main/scripts/lib/pdf-utils.js";

const TEMP_DIR = "/tmp/jeemate-ocr-test";

// First PDF we know exists — swap this out to test another file
const PDF_URL = `${process.env.SUPABASE_URL}/storage/v1/object/public/lesson-pdfs/physics/kinamatics.pdf`;

(async () => {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  const pdfPath = path.join(TEMP_DIR, "kinamatics.pdf");

  console.log("Downloading kinamatics.pdf...");
  await downloadPdf(PDF_URL, pdfPath);

  console.log("\nRunning OCR...\n");
  const pages = await ocrPdf(pdfPath, TEMP_DIR);

  const fullText = pages
    .map((p) => `=== PAGE ${p.page} ===\n${p.text}`)
    .join("\n\n");

  await fs.writeFile("./kinamatics-ocr-output.txt", fullText);

  const totalChars = pages.reduce((s, p) => s + p.text.length, 0);
  console.log("\n--- Summary ---");
  console.log(`Pages:          ${pages.length}`);
  console.log(`Total chars:    ${totalChars}`);
  console.log(`Avg chars/page: ${Math.round(totalChars / pages.length)}`);

  console.log("\n--- Page 1 preview (first 400 chars) ---");
  console.log(pages[0]?.text.slice(0, 400) || "(empty)");
  console.log("---");
  console.log("\nFull output saved to: kinamatics-ocr-output.txt");
  console.log("Open it and check if the text looks readable.");
})();
