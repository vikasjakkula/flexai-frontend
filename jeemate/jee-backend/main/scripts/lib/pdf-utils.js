import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

const execAsync = promisify(exec);

/**
 * Get the number of pages in a PDF.
 */
export async function getPageCount(pdfPath) {
  const bytes = await fs.readFile(pdfPath);
  const pdf = await PDFDocument.load(bytes);
  return pdf.getPageCount();
}

/**
 * Convert one PDF page to a PNG image.
 * Returns the path to the generated PNG.
 */
export async function pdfPageToImage(pdfPath, pageNumber, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
  const baseName = path.basename(pdfPath, ".pdf");
  const outputPrefix = path.join(outputDir, `${baseName}-page`);

  // pdftoppm: -f start_page, -l end_page, -r DPI (150 = good balance), -png format
  const cmd = `pdftoppm -f ${pageNumber} -l ${pageNumber} -r 150 -png "${pdfPath}" "${outputPrefix}"`;
  await execAsync(cmd);

  // pdftoppm names files like "prefix-1.png" or "prefix-01.png" depending on total pages
  // Find the file it created
  const files = await fs.readdir(outputDir);
  const pageFile = files.find((f) => 
    f.startsWith(path.basename(outputPrefix)) && 
    f.includes(`-${pageNumber}.png`) || 
    f.includes(`-0${pageNumber}.png`) ||
    f.includes(`-00${pageNumber}.png`)
  );
  
  if (!pageFile) {
    throw new Error(`Could not find generated PNG for page ${pageNumber}`);
  }
  
  return path.join(outputDir, pageFile);
}

/**
 * Read a file as base64.
 */
export async function fileToBase64(filePath) {
  const buffer = await fs.readFile(filePath);
  return buffer.toString("base64");
}

export async function downloadPdf(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  await pipeline(res.body, createWriteStream(outputPath));
  return outputPath;
}