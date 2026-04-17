/**
 * Categorize all questions in the questions table by EAPCET chapter using Gemini 2.5 Flash.
 *
 * - Groups 5 questions together per API call (reduces API calls from 22k to ~4.4k)
 * - Uses section_id to determine subject (Mathematics, Physics, Chemistry) and only sends
 *   relevant chapter list to save tokens
 * - Resumable: skips questions that already have chapter set
 * - Rate limiting: configurable delay between batches (default 1.2s = ~50 RPM)
 *
 * Run: node scripts/categorize-questions-chapters.js
 * Env: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
 *
 * Options:
 *   --limit N         Process only N questions (for testing)
 *   --delay MS        Delay between API calls in ms (default 1200)
 *   --batch-size N    Questions per API call (default 5)
 *   --concurrency N   Parallel workers (default 1, use 3-5 for faster with paid tier)
 *   --dry-run         Fetch and log only, don't update DB
 */

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch (e) {
  console.log('Note: dotenv not found, using process.env');
}

const EAPCET_CHAPTERS = {
  Mathematics: [
    'Functions', 'Mathematical Induction', 'Matrices', 'Complex Numbers', "De Moivre's Theorem",
    'Quadratic Expressions', 'Theory of Equations', 'Permutations and Combinations', 'Binomial Theorem',
    'Trigonometric Ratios up to Transformations', 'Trigonometric Equations', 'Inverse Trigonometric Functions',
    'Hyperbolic Functions', 'Properties of Triangles', 'Addition of Vectors', 'Product of Vectors',
    'Measures of Dispersion', 'Probability', 'Random Variables and Probability Distributions',
    'Locus', 'Transformation of Axes', 'The Straight Line', 'Pair of Straight lines', 'Circle',
    'System of circles', 'Parabola', 'Ellipse', 'Hyperbola', 'Three Dimensional Coordinates',
    'Direction Cosines and Direction Ratios', 'Plane', 'Limits and Continuity', 'Differentiation',
    'Applications of Derivatives', 'Integration', 'Definite Integrals', 'Differential equations',
  ],
  Physics: [
    'Physical World', 'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane',
    'Laws of Motion', 'Work, Energy and Power', 'System of Particles and Rotational Motion',
    'Oscillations', "Gravitation: Kepler's Laws", 'Mechanical Properties of Solids',
    'Mechanical Properties of Fluids', 'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory',
    'Waves', 'Ray Optics and Optical Instruments', 'Wave Optics', 'Electric Charges and Fields',
    'Electrostatic Potential and Capacitance', 'Current Electricity', 'Moving Charges and Magnetism',
    'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves',
    'Dual Nature of Radiation and Matter', 'Atoms', 'Nuclei', 'Semiconductor Electronics', 'Communication Systems',
  ],
  Chemistry: [
    'Atomic Structure', 'Classification of Elements and Periodicity in Properties',
    'Chemical Bonding and Molecular Structure', 'States of Matter: Gases and Liquids', 'Stoichiometry',
    'Thermodynamics', 'Chemical Equilibrium and Acids-Bases', 'Hydrogen and its Compounds',
    'The s-Block Elements (Alkali and Alkaline Earth Metals)', 'p- Block Elements Group 13 (Boron Family)',
    'p-Block Elements – Group 14 (Carbon Family)', 'Environmental Chemistry', 'Organic Chemistry',
    'Solid State', 'Solutions', 'Electrochemistry and Chemical Kinetics', 'Surface Chemistry',
    'General Principles of Metallurgy', 'P-Block Elements', 'd And f Block Elements & Coordination Compounds',
    'Polymers', 'Biomolecules', 'Chemistry in Everyday Life', 'Halo Alkanes and Halo Arenes', 'Organic Compounds Containing C, H and O (Alcohols, Phenols, Ethers, Aldehydes, Ketones and Carboxylic acids)',
    'Organic Compounds Containing Nitrogen',
  ],
};

function getSubjectFromSectionId(sectionId) {
  const s = (sectionId || '').toLowerCase();
  if (s.includes('mathematics') || s.includes('maths')) return 'Mathematics';
  if (s.includes('physics')) return 'Physics';
  if (s.includes('chemistry')) return 'Chemistry';
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { limit: null, delay: 1200, batchSize: 5, concurrency: 1, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) opts.limit = parseInt(args[i + 1], 10);
    if (args[i] === '--delay' && args[i + 1]) opts.delay = parseInt(args[i + 1], 10);
    if (args[i] === '--batch-size' && args[i + 1]) opts.batchSize = parseInt(args[i + 1], 10);
    if (args[i] === '--concurrency' && args[i + 1]) opts.concurrency = Math.max(1, parseInt(args[i + 1], 10));
    if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
}

async function categorizeBatch(ai, questions, subject) {
  const chapters = EAPCET_CHAPTERS[subject];
  if (!chapters) return null;

  const prompt = `You are categorizing EAPCET exam questions by chapter. The subject is ${subject}.

Valid chapters (pick EXACTLY one per question, must match exactly):
${chapters.map((c) => `- ${c}`).join('\n')}

Here are ${questions.length} questions. For each question, output ONLY the chapter name (exact match from the list above).
Format: Return a JSON array of strings, one per question in order. Example: ["Functions","Laws of Motion","Atomic Structure"]

Questions:
${questions
  .map(
    (q, i) =>
      `[${i + 1}] ${(q.question_text || '').replace(/\s+/g, ' ').slice(0, 500)}`
  )
  .join('\n\n')}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  let text = '';
  if (response?.candidates?.[0]?.content?.parts) {
    for (const p of response.candidates[0].content.parts) {
      if (p.text) text += p.text;
    }
  }
  if (!text) return null;

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  let arr;
  try {
    arr = JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
  if (!Array.isArray(arr) || arr.length !== questions.length) return null;

  return arr.map((ch) => (typeof ch === 'string' ? ch.trim() : null));
}

function validateChapter(ch, subject) {
  const list = EAPCET_CHAPTERS[subject];
  if (!list) return null;
  const s = (ch || '').trim();
  if (!s) return null;
  if (list.includes(s)) return s;
  const match = list.find((c) => c.toLowerCase() === s.toLowerCase());
  return match || null;
}

async function main() {
  const opts = parseArgs();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!geminiKey) {
    console.error('Missing GEMINI_API_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const ai = new GoogleGenAI({ apiKey: geminiKey });

  console.log('Fetching questions without chapter...');
  let query = supabase
    .from('questions')
    .select('question_id, section_id, question_text')
    .is('chapter', null);

  if (opts.limit) query = query.limit(opts.limit);
  let { data: questions, error } = await query;

  if (error && error.code === '42703') {
    console.log('Chapter column not found - using all questions (run migration to add chapter column).');
    query = supabase.from('questions').select('question_id, section_id, question_text');
    if (opts.limit) query = query.limit(opts.limit);
    const res = await query;
    questions = res.data;
    error = res.error;
  }
  if (error) {
    console.error('Supabase error:', error);
    process.exit(1);
  }

  const total = questions?.length || 0;
  const startTime = Date.now();

  console.log(`\n=== EAPCET Question Categorization ===`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Total questions to categorize: ${total}`);
  console.log(`Batch size: ${opts.batchSize} | Delay: ${opts.delay}ms | Concurrency: ${opts.concurrency}`);
  if (opts.dryRun) console.log(`DRY RUN - no DB updates`);
  console.log(`----------------------------------------\n`);

  const bySubject = { Mathematics: [], Physics: [], Chemistry: [] };
  let unknown = 0;
  for (const q of questions || []) {
    const subj = getSubjectFromSectionId(q.section_id);
    if (subj && bySubject[subj]) bySubject[subj].push(q);
    else unknown++;
  }
  const flat = [
    ...bySubject.Mathematics,
    ...bySubject.Physics,
    ...bySubject.Chemistry,
  ];

  console.log(`Subject breakdown:`);
  console.log(`  Mathematics: ${bySubject.Mathematics.length} questions`);
  console.log(`  Physics:     ${bySubject.Physics.length} questions`);
  console.log(`  Chemistry:   ${bySubject.Chemistry.length} questions`);
  if (unknown) console.log(`  Unknown:     ${unknown} (skipped)`);
  const numBatches = Math.ceil(flat.length / opts.batchSize);
  console.log(`\nTotal batches: ${numBatches} (estimated API calls)`);
  console.log(`----------------------------------------\n`);

  const stats = { processed: 0, failed: 0, apiCalls: 0, retries: 0, byChapter: {} };
  let statsLock = Promise.resolve();
  const withLock = (fn) => {
    const p = statsLock.then(fn);
    statsLock = p;
    return p;
  };
  const batches = [];
  for (let i = 0; i < flat.length; i += opts.batchSize) {
    batches.push({ index: i, batch: flat.slice(i, i + opts.batchSize) });
  }

  async function processOneBatch(batchInfo) {
    const { index, batch } = batchInfo;
    const subject = getSubjectFromSectionId(batch[0]?.section_id);
    if (!subject) {
      stats.failed += batch.length;
      return { batchIndex: index, ok: false, reason: 'unknown_subject' };
    }

    let chapters = await categorizeBatch(ai, batch, subject);
    await withLock(() => { stats.apiCalls++; return Promise.resolve(); });
    if (!chapters) {
      await withLock(() => { stats.retries++; return Promise.resolve(); });
      await sleep(opts.delay * 2);
      chapters = await categorizeBatch(ai, batch, subject);
      await withLock(() => { stats.apiCalls++; return Promise.resolve(); });
    }
    if (!chapters) {
      await withLock(() => { stats.failed += batch.length; return Promise.resolve(); });
      return { batchIndex: index, ok: false, reason: 'gemini_failed' };
    }

    let batchOk = 0;
    let batchFail = 0;
    const chapterCounts = {};
    for (let j = 0; j < batch.length; j++) {
      const rawCh = chapters[j];
      const ch = validateChapter(rawCh, subject);
      if (!ch) {
        batchFail++;
        if (opts.dryRun) {
          console.log(`  [${subject}] INVALID: "${rawCh}" for Q: ${(batch[j].question_text || '').replace(/\s+/g, ' ').slice(0, 60)}...`);
        }
        continue;
      }
      chapterCounts[ch] = (chapterCounts[ch] || 0) + 1;
      if (!opts.dryRun) {
        const { error: updErr } = await supabase
          .from('questions')
          .update({ chapter: ch })
          .eq('question_id', batch[j].question_id)
          .eq('section_id', batch[j].section_id);
        if (updErr) {
          batchFail++;
        } else {
          batchOk++;
        }
      } else {
        batchOk++;
        if (opts.dryRun) {
          console.log(`  [${subject}] Q: ${(batch[j].question_text || '').replace(/\s+/g, ' ').slice(0, 80)}... => ${ch}`);
        }
      }
    }
    await withLock(() => {
      stats.processed += batchOk;
      stats.failed += batchFail;
      for (const [ch, c] of Object.entries(chapterCounts)) {
        stats.byChapter[ch] = (stats.byChapter[ch] || 0) + c;
      }
      return Promise.resolve();
    });
    return { batchIndex: index, ok: true, batchOk, batchFail };
  }

  const delayBetweenStarts = Math.max(1, Math.floor(opts.delay / opts.concurrency)) | 0;

  async function runWithConcurrency() {
    let nextIndex = 0;

    async function worker() {
      while (true) {
        const i = nextIndex++;
        if (i >= batches.length) break;
        await processOneBatch(batches[i]);
        const done = stats.processed + stats.failed;
        const elapsed = ((Date.now() - startTime) / 1000) | 0;
        const rate = done > 0 ? elapsed / done : 0;
        const eta = flat.length - done > 0 ? Math.ceil((flat.length - done) * rate / opts.concurrency) : 0;
        if (done % 50 === 0 || done >= flat.length) {
          console.log(`[${new Date().toLocaleTimeString()}] Progress: ${done}/${flat.length} | OK: ${stats.processed} | Failed: ${stats.failed} | API: ${stats.apiCalls} | Elapsed: ${elapsed}s | ETA: ~${eta}s`);
        }
        if (nextIndex < batches.length) await sleep(delayBetweenStarts);
      }
    }

    await Promise.all(Array.from({ length: opts.concurrency }, () => worker()));
  }

  await runWithConcurrency();

  const elapsedMs = Date.now() - startTime;
  const elapsedSec = (elapsedMs / 1000).toFixed(1);
  console.log(`\n----------------------------------------`);
  console.log(`=== DONE ===`);
  console.log(`Processed: ${stats.processed}`);
  console.log(`Failed:    ${stats.failed}`);
  console.log(`API calls: ${stats.apiCalls} (retries: ${stats.retries})`);
  console.log(`Elapsed:   ${elapsedSec}s`);
  console.log(`Rate:      ${(stats.processed / (elapsedMs / 1000)).toFixed(1)} questions/sec`);
  if (Object.keys(stats.byChapter).length > 0) {
    console.log(`\nChapters tagged (top 15):`);
    const sorted = Object.entries(stats.byChapter).sort((a, b) => b[1] - a[1]).slice(0, 15);
    sorted.forEach(([ch, count]) => console.log(`  ${ch}: ${count}`));
  }
  console.log(`----------------------------------------\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
