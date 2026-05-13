import express from "express";
import { Buffer } from "node:buffer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SOLVER_SYSTEM_PROMPT, IMAGE_SOLVER_SYSTEM_PROMPT, CLASSIFIER_PROMPT } from "../prompts/solver.js";
import { findRelevantChunks } from "../lib/retrieval.js";

const router = express.Router();
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_REQUEST_TIMEOUT_MS) || 90_000;

const PRIMARY_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

/** Comma-separated fallback models; will be tried if previous models return 429. */
function fallbackModelIds() {
  const raw =
    process.env.GEMINI_FALLBACK_MODELS?.trim() ||
    "gemini-2.5-pro,gemini-2.0-flash-lite,gemini-2.0-flash";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

function uniqueModelTryOrder(primary) {
  const seen = new Set();
  const out = [];
  for (const id of [primary, ...fallbackModelIds()]) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

async function generateWithModelRolling(genAI, parts, preferredModelIds) {
  let lastErr;
  for (const modelId of preferredModelIds) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelId,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });
      console.log("[/api/solve] calling Gemini model:", modelId);
      const result = await model.generateContent(parts, {
        timeout: GEMINI_TIMEOUT_MS,
      });
      return { result, modelId };
    } catch (e) {
      lastErr = e;
      if (e?.status !== 429) throw e;
      console.warn("[/api/solve] 429 from", modelId, "— trying next model if any");
    }
  }
  throw lastErr;
}

/** Cleans up a base64 image string (removes data URL prefixes and whitespace/copy-paste issues). */
function normalizeImageBase64(raw) {
  if (typeof raw !== "string") return "";
  let s = raw.trim().replace(/^\uFEFF/, "");
  const dataUrl = s.match(/^data:([^;]+);base64,(.*)$/is);
  if (dataUrl) s = dataUrl[2].trim();
  s = s.replace(/\r\n|\r|\n|\t|\v|\f/g, "");
  s = s.replace(/\u00A0|\u200B|\u200C|\u200D|\uFEFF/g, "");
  s = s.replace(/ /g, "+");
  return s;
}

/** Make URL-safe base64 into standard form and pad for Buffer decoding. */
function standardizeBase64Payload(s) {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  const rem = t.length % 4;
  if (rem) t += "=".repeat(4 - rem);
  return t;
}

/** Checks if the base64-decoded image looks legit before calling Gemini. */
function validateDecodedImage(bytes, asciiHint) {
  if (!asciiHint || asciiHint.length < 80) {
    return "imageBase64 is too short. Paste the full output of: base64 -w 0 backend/test.png";
  }
  if (
    /<paste|paste full contents|img_base64\.txt|example\.(png|jpg)/i.test(
      asciiHint
    )
  ) {
    return "You pasted placeholder text, not real base64. Run `base64 -w 0 backend/test.png` and paste the entire output into imageBase64 (no angle brackets or instructions).";
  }
  const junk = asciiHint.replace(/[A-Za-z0-9+/=]/g, "");
  if (junk.length) {
    const u = [...junk][0];
    const hex = u.codePointAt(0).toString(16).padStart(4, "0");
    return (
      "imageBase64 still has non-base64 characters after cleanup (e.g. U+" +
      hex +
      "). Use raw base64 only. Tips: (1) In Postman use Body → raw → JSON and one JSON string for imageBase64. (2) Prefer pasting from a file created with `base64 -w 0 backend/test.png > img.txt` so '+' is not lost. (3) Do not wrap the value in extra quotes or HTML."
    );
  }
  if (bytes.length < 24) {
    return "Decoded image is too small — base64 may be truncated or wrong.";
  }
  const png =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!png && !jpeg) {
    return "Decoded bytes are not PNG or JPEG. Set imageMimeType (e.g. image/png) and use correct base64 for that file.";
  }
  return null;
}

router.post("/", async (req, res) => {
  console.log("[/api/solve] request received");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY in environment." });
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    let { text, imageBase64, imageMimeType } = req.body;

    // Validation
    if (!text && !imageBase64) {
      return res.status(400).json({ error: "Provide either text or image" });
    }
    if (text && text.length > 5000) {
      return res.status(400).json({ error: "Text too long (max 5000 chars)" });
    }
    if (text && text.trim().length < 10) {
      return res.status(400).json({ error: "Question too short" });
    }

    let imageData = "";
    if (imageBase64) {
      imageData = standardizeBase64Payload(normalizeImageBase64(imageBase64));
      const fromDataUrl =
        typeof imageBase64 === "string" &&
        /^data:([^;]+);base64,/i.test(imageBase64.trim());
      if (fromDataUrl && !imageMimeType) {
        const m = imageBase64.trim().match(/^data:([^;]+);base64,/i);
        if (m?.[1]) imageMimeType = m[1];
      }
      const decoded = Buffer.from(imageData, "base64");
      const bad = validateDecodedImage(decoded, imageData);
      if (bad) {
        return res.status(400).json({ error: bad });
      }
    }

    // Step 1: Classify subject (for RAG/notes retrieval context)
    console.log("[/api/solve] Classifying subject...");
    const subject = await classifySubject({ genAI, text, imageBase64: imageData, imageMimeType });
    console.log(`   Subject: ${subject || "unknown"}`);

    // Step 2: Find relevant notes (RAG)
    console.log("[/api/solve] Retrieving relevant notes...");
    const queryText = text || "math/physics/chemistry problem from image";
    const chunks = await findRelevantChunks(queryText, subject, 5);
    console.log(`   Found ${chunks.length} relevant chunks`);

    // Step 3: Compose the prompt, adding context from user and notes
    const notesContext =
      chunks.length > 0
        ? `\n\nRELEVANT NOTES FROM TOPPER'S HANDWRITTEN NOTES (use these as primary reference for formulas and approach):\n\n${chunks
            .map(
              (c, i) =>
                `[${i + 1}] ${c.chapter} (${c.subject}):\n${c.content}`
            )
            .join("\n\n---\n\n")}`
        : "";

    const systemPrompt = imageBase64 ? IMAGE_SOLVER_SYSTEM_PROMPT : SOLVER_SYSTEM_PROMPT;
    const parts = [
      { text: systemPrompt + notesContext + "\n\nSolve this question:\n" }
    ];

    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType || "image/png",
          data: imageData,
        },
      });
    }
    if (text) {
      parts.push({ text });
    }

    // Step 4: Call Gemini via rolling fallback
    const modelsToTry = uniqueModelTryOrder(PRIMARY_MODEL);
    const { result, modelId } = await generateWithModelRolling(
      genAI,
      parts,
      modelsToTry
    );
    const responseText = result.response.text();

    // Step 5: Try to parse the JSON
    let solution;
    try {
      solution = JSON.parse(responseText);
    } catch {
      return res.status(500).json({
        error: "Failed to parse AI response",
        raw: responseText,
      });
    }

    // Step 6: Respond to client
    return res.json({
      success: true,
      model: modelId,
      solution,
      meta: {
        subject_detected: subject,
        chunks_used: chunks.length,
        sources: chunks.map((c) => ({
          chapter: c.chapter,
          similarity: Math.round(c.similarity * 100) / 100,
        })),
      },
    });

  } catch (err) {
    console.error("Solve error:", err);
    const msg = String(err.message || "");
    const timedOut =
      err.name === "GoogleGenerativeAIAbortError" || /aborted|timeout/i.test(msg);
    if (timedOut) {
      return res.status(504).json({
        error: `Model request timed out after ${GEMINI_TIMEOUT_MS} ms. Increase GEMINI_REQUEST_TIMEOUT_MS if needed.`,
      });
    }
    const upstream =
      typeof err.status === "number" && err.status >= 400 && err.status < 600
        ? err.status
        : 500;
    const quotaHint =
      upstream === 429
        ? "Free-tier / project quota exhausted for these models; wait ~1 minute, try fewer requests, enable billing on Google AI Studio, or switch API key / project."
        : undefined;
    return res.status(upstream).json({
      error: "Solve failed: " + (msg || "Unknown error"),
      ...(quotaHint && { hint: quotaHint }),
    });
  }
});

export default router;

/**
 * Classify the problem to math/physics/chemistry or unknown using Gemini.
 * Accepts a destructured argument for easier future expansion.
 * Requires genAI instance.
 */
async function classifySubject({ genAI, text, imageBase64, imageMimeType }) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { temperature: 0 },
  });

  const parts = [{ text: CLASSIFIER_PROMPT }];
  if (text) parts.push({ text });
  if (imageBase64) {
    parts.push({
      inlineData: { mimeType: imageMimeType || "image/png", data: imageBase64 },
    });
  }

  const result = await model.generateContent(parts);
  const subject = result.response.text().trim().toLowerCase();

  // Only valid if one of these
  if (["maths", "physics", "chemistry"].includes(subject)) {
    return subject;
  }
  return null;
}