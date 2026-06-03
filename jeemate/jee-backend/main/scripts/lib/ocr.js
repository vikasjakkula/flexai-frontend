import tesseract from "node-tesseract-ocr";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const TESSERACT_CONFIG = {
  lang: "eng",
  oem: 1,  // LSTM neural net — most accurate
  psm: 6,  // single uniform block of text
};

export async function runOcrOnImage(imagePath) {
  try {
    const text = await tesseract.recognize(imagePath, TESSERACT_CONFIG);
    return text.trim();
  } catch (err) {
    console.error(`OCR failed for ${imagePath}:`, err.message);
    return "";
  }
}

// ---------------------------------------------------------------------------
// Helpers used by test-ocr.js
// ---------------------------------------------------------------------------

export async function pdfToImages(pdfPath, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
  const baseName = path.basename(pdfPath, ".pdf");
  const outputPrefix = path.join(outputDir, baseName);
  await execAsync(`pdftoppm -r 200 -png "${pdfPath}" "${outputPrefix}"`);
  const files = await fs.readdir(outputDir);
  return files
    .filter((f) => f.startsWith(baseName) && f.endsWith(".png"))
    .sort()
    .map((f) => path.join(outputDir, f));
}

export async function ocrPdf(pdfPath, tempDir) {
  console.log(`   Converting PDF to images...`);
  const images = await pdfToImages(pdfPath, tempDir);
  console.log(`   ${images.length} pages found`);
  const results = [];
  for (let i = 0; i < images.length; i++) {
    process.stdout.write(`   OCR page ${i + 1}/${images.length}... `);
    const text = await runOcrOnImage(images[i]);
    results.push({ page: i + 1, text });
    console.log(`${text.length} chars`);
    await fs.unlink(images[i]).catch(() => {});
  }
  return results;
}
