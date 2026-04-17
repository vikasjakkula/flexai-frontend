/**
 * Populate quizzes table from question_chapters.
 * Creates up to 30 quizzes per chapter, 5 questions each.
 * Quiz names: "Quiz 1", "Quiz 2", ...
 *
 * Run: node scripts/populate-quizzes.js
 * Env: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const path = require('path');

function randomUUID() {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch (e) {
  console.log('Note: dotenv not found, using process.env');
}

const QUESTIONS_PER_QUIZ = 5;
const MAX_QUIZZES_PER_CHAPTER = 30;
const FETCH_PAGE_SIZE = 1000;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchAllForChapter(supabase, subject, chapter, field) {
  const all = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + FETCH_PAGE_SIZE - 1;
    let query = supabase
      .from('question_chapters')
      .select('question_id, section_id')
      .eq('subject', subject)
      .eq('chapter', chapter)
      .range(from, to);
    if (field) query = query.eq('field', field);
    const { data, error } = await query;

    if (error) throw error;
    if (data && data.length > 0) all.push(...data);
    if (!data || data.length < FETCH_PAGE_SIZE) hasMore = false;
    else from += FETCH_PAGE_SIZE;
  }
  return all;
}

async function fetchDistinctChapters(supabase) {
  const seen = new Set();
  const chapters = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + FETCH_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('question_chapters')
      .select('subject, chapter, field')
      .range(from, to);
    if (error) throw error;

    for (const row of data || []) {
      const key = `${row.subject}|${row.chapter}|${row.field || 'engineering'}`;
      if (!seen.has(key)) {
        seen.add(key);
        chapters.push({ subject: row.subject, chapter: row.chapter, field: row.field || 'engineering' });
      }
    }
    if (!data || data.length < FETCH_PAGE_SIZE) hasMore = false;
    else from += FETCH_PAGE_SIZE;
  }
  return chapters;
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

  console.log('\n=== Populate quizzes ===');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Config: ${QUESTIONS_PER_QUIZ} questions/quiz, max ${MAX_QUIZZES_PER_CHAPTER} quizzes/chapter\n`);

  console.log('Fetching distinct (subject, chapter) from question_chapters...');
  const chapters = await fetchDistinctChapters(supabase);
  console.log(`Found ${chapters.length} chapters\n`);

  let totalQuizzes = 0;
  let totalRows = 0;

  for (let c = 0; c < chapters.length; c++) {
    const { subject, chapter, field } = chapters[c];
    const questions = await fetchAllForChapter(supabase, subject, chapter, field);
    const shuffled = shuffle(questions);

    const numQuizzes = Math.min(
      MAX_QUIZZES_PER_CHAPTER,
      Math.floor(shuffled.length / QUESTIONS_PER_QUIZ)
    );

    if (numQuizzes === 0) {
      console.log(`  [${c + 1}/${chapters.length}] ${subject} / ${chapter} (${field || 'eng'}): ${questions.length} questions - SKIP (need at least ${QUESTIONS_PER_QUIZ})`);
      continue;
    }

    const rows = [];
    const quizField = field || 'engineering';
    for (let q = 0; q < numQuizzes; q++) {
      const quizId = randomUUID();
      const quizName = `Quiz ${q + 1}`;
      const start = q * QUESTIONS_PER_QUIZ;
      const batch = shuffled.slice(start, start + QUESTIONS_PER_QUIZ);
      for (let i = 0; i < batch.length; i++) {
        rows.push({
          quiz_id: quizId,
          quiz_name: quizName,
          subject,
          chapter,
          field: quizField,
          question_id: batch[i].question_id,
          section_id: batch[i].section_id,
          question_order: i + 1,
        });
      }
    }

    const { error } = await supabase.from('quizzes').insert(rows);
    if (error) {
      console.error(`  [${subject}/${chapter}] Insert error:`, error);
      process.exit(1);
    }

    totalQuizzes += numQuizzes;
    totalRows += rows.length;
    console.log(`  [${c + 1}/${chapters.length}] ${subject} / ${chapter}: ${questions.length} questions -> ${numQuizzes} quizzes (${rows.length} rows)`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n----------------------------------------`);
  console.log(`=== DONE ===`);
  console.log(`Chapters processed: ${chapters.length}`);
  console.log(`Total quizzes: ${totalQuizzes}`);
  console.log(`Total rows: ${totalRows}`);
  console.log(`Elapsed: ${elapsed}s`);
  console.log(`----------------------------------------\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
