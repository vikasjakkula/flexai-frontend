/**
 * Populate question_chapters table from medical questions where chapter IS NOT NULL.
 * Run after categorize-questions-chapters-medical.js has tagged questions.
 * Supports Physics, Chemistry, Botany, Zoology (medical syllabus).
 *
 * Run: node scripts/populate-question-chapters-medical.js
 * Env: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Prerequisite: Run migration 041_add_medical_to_quizzes.sql first (adds Botany/Zoology to constraints).
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
  if (s.includes('physics')) return 'Physics';
  if (s.includes('chemistry') || s.includes('chem')) return 'Chemistry';
  if (s.includes('botany') || s.includes('bot')) return 'Botany';
  if (s.includes('zoology') || s.includes('zoo')) return 'Zoology';
  return null;
}

async function getMedicalSectionIds(supabase) {
  const { data: tests, error: testsErr } = await supabase
    .from('tests')
    .select('test_id')
    .eq('field', 'medical');
  if (testsErr || !tests || tests.length === 0) {
    return null;
  }
  const testIds = tests.map((t) => t.test_id);
  const { data: sections, error: sectionsErr } = await supabase
    .from('sections')
    .select('section_id')
    .in('test_id', testIds);
  if (sectionsErr || !sections || sections.length === 0) {
    return null;
  }
  return sections.map((s) => s.section_id);
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

  console.log('\n=== Populate question_chapters (Medical) ===');
  console.log(`Started at: ${new Date().toISOString()}`);

  const medicalSectionIds = await getMedicalSectionIds(supabase);
  if (!medicalSectionIds || medicalSectionIds.length === 0) {
    console.log('No medical tests found (tests.field=medical). Nothing to do.');
    return;
  }
  console.log(`Found ${medicalSectionIds.length} medical section(s)`);

  const all = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + FETCH_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('questions')
      .select('question_id, section_id, chapter')
      .not('chapter', 'is', null)
      .in('section_id', medicalSectionIds)
      .range(from, to);

    if (error) throw error;
    if (data && data.length > 0) all.push(...data);
    if (!data || data.length < FETCH_PAGE_SIZE) hasMore = false;
    else from += FETCH_PAGE_SIZE;

    if (all.length > 0 && all.length % 2000 === 0) {
      console.log(`  Fetched ${all.length} questions so far...`);
    }
  }

  console.log(`Fetched ${all.length} medical questions with chapter in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  const rows = [];
  const bySubject = { Physics: 0, Chemistry: 0, Botany: 0, Zoology: 0 };
  let skipped = 0;

  for (const q of all) {
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
      field: 'medical',
    });
  }

  console.log(`\nSubject breakdown:`);
  console.log(`  Physics:   ${bySubject.Physics}`);
  console.log(`  Chemistry: ${bySubject.Chemistry}`);
  console.log(`  Botany:    ${bySubject.Botany}`);
  console.log(`  Zoology:   ${bySubject.Zoology}`);
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
