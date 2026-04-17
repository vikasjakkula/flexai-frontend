/**
 * Populate question_chapters table from questions where chapter IS NOT NULL.
 * Run after categorize-questions-chapters.js has tagged questions.
 * Fetches ALL questions (paginated, 1000 per request).
 *
 * Run: node scripts/populate-question-chapters.js
 * Env: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch (e) {
  console.log('Note: dotenv not found, using process.env');
}

const FETCH_PAGE_SIZE = 1000;
const INSERT_BATCH = 500;

function getSubjectFromSectionId(sectionId) {
  const s = (sectionId || '').toLowerCase();
  if (s.includes('mathematics') || s.includes('maths')) return 'Mathematics';
  if (s.includes('physics')) return 'Physics';
  if (s.includes('chemistry')) return 'Chemistry';
  return null;
}

async function fetchAllWithChapter(supabase) {
  const all = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + FETCH_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('questions')
      .select('question_id, section_id, chapter')
      .not('chapter', 'is', null)
      .range(from, to);

    if (error) throw error;
    if (data && data.length > 0) all.push(...data);
    if (!data || data.length < FETCH_PAGE_SIZE) hasMore = false;
    else from += FETCH_PAGE_SIZE;

    if (from > 0) {
      console.log(`  Fetched ${all.length} questions so far...`);
    }
  }
  return all;
}

async function main() {
  const startTime = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n=== Populate question_chapters ===');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('Fetching ALL questions with chapter set (paginated, 1000 per request)...');

  const questions = await fetchAllWithChapter(supabase);
  console.log(`Fetched ${questions.length} questions with chapter in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  const rows = [];
  const bySubject = { Mathematics: 0, Physics: 0, Chemistry: 0 };
  let skipped = 0;
  for (const q of questions || []) {
    const subject = getSubjectFromSectionId(q.section_id);
    if (!subject) {
      skipped++;
      continue;
    }
    bySubject[subject]++;
    rows.push({
      question_id: q.question_id,
      section_id: q.section_id,
      subject,
      chapter: q.chapter.trim(),
      field: 'engineering',
    });
  }

  console.log(`\nSubject breakdown:`);
  console.log(`  Mathematics: ${bySubject.Mathematics}`);
  console.log(`  Physics:     ${bySubject.Physics}`);
  console.log(`  Chemistry:   ${bySubject.Chemistry}`);
  if (skipped) console.log(`  Skipped (unknown subject): ${skipped}`);
  console.log(`\nTotal rows to insert: ${rows.length}`);

  if (rows.length === 0) {
    console.log('\nNothing to insert. Done.');
    return;
  }

  console.log(`\nInserting in batches of ${INSERT_BATCH}...`);
  let inserted = 0;
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const batch = rows.slice(i, i + INSERT_BATCH);
    const { error: insertErr } = await supabase.from('question_chapters').upsert(batch, {
      onConflict: 'question_id,section_id',
      ignoreDuplicates: false,
    });
    if (insertErr) {
      console.error('Insert error:', insertErr);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${rows.length}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n----------------------------------------`);
  console.log(`=== DONE ===`);
  console.log(`Inserted: ${inserted} rows`);
  console.log(`Elapsed:  ${elapsed}s`);
  console.log(`----------------------------------------\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
