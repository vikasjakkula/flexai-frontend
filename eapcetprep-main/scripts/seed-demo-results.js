/**
 * Seed demo user with 6 simulated test results (scores: 40, 60, 80, 110, 90, 120).
 *
 * Requirements:
 * - Tests: state IS NOT NULL, exactly 160 questions
 * - Scoring: +1 correct, 0 wrong/unattempted
 * - 180 min test, 160 questions; question_times distributed across questions
 *
 * Run: node scripts/seed-demo-results.js
 * Env: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch (e) {
  console.log('Note: dotenv not found, using process.env');
}

const DEMO_USER_ID = '83797683-ba94-4da4-a5f6-98c7cfcd15dd';
const TARGET_SCORES = [40, 60, 80, 110, 90, 120];
const DURATION_SECONDS = 180 * 60; // 10800
const TOTAL_QUESTIONS = 160;
const OPTIONS = ['A', 'B', 'C', 'D'];

// Section ranges (question_number): maths 1-80, physics 81-120, chemistry 121-160
function getSection(questionNumber) {
  if (questionNumber >= 1 && questionNumber <= 80) return 'maths';
  if (questionNumber >= 81 && questionNumber <= 120) return 'physics';
  if (questionNumber >= 121 && questionNumber <= 160) return 'chemistry';
  return 'maths';
}

function getWrongOption(correctOption) {
  const wrong = OPTIONS.filter((o) => o.toUpperCase() !== (correctOption || 'A').toString().toUpperCase());
  return wrong[Math.floor(Math.random() * wrong.length)];
}

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1) Find tests: answer_exists = true, order by test_date desc, then require 160 questions
  console.log('Finding tests with answer_exists = true (desc by test_date), 160 questions...');
  const { data: allTests, error: testsError } = await supabase
    .from('tests')
    .select('test_id, test_name, test_date, state')
    .eq('answer_exists', true)
    .order('test_date', { ascending: false });

  if (testsError) {
    console.error('Failed to fetch tests:', testsError);
    process.exit(1);
  }

  const testsWith160 = [];
  for (const test of allTests || []) {
    const sectionRes = await supabase.from('sections').select('section_id').eq('test_id', test.test_id);
    const sectionIds = (sectionRes.data || []).map((s) => s.section_id);
    if (sectionIds.length === 0) continue;
    const qRes = await supabase.from('questions').select('question_id').in('section_id', sectionIds);
    const total = (qRes.data || []).length;
    if (total === 160) {
      testsWith160.push(test);
      if (testsWith160.length >= 6) break;
    }
  }

  if (testsWith160.length < 6) {
    console.error(`Found only ${testsWith160.length} tests with answer_exists=true and 160 questions. Need 6.`);
    process.exit(1);
  }

  const selectedTests = testsWith160.slice(0, 6);
  console.log('Selected tests:', selectedTests.map((t) => ({ id: t.test_id, name: t.test_name, date: t.test_date })));

  // 2) Delete existing demo results/attempts for this user (so we can re-run script)
  const { data: existingAttempts } = await supabase.from('test_attempts').select('id').eq('user_id', DEMO_USER_ID);
  if (existingAttempts && existingAttempts.length > 0) {
    const attemptIds = existingAttempts.map((a) => a.id);
    await supabase.from('test_results').delete().in('attempt_id', attemptIds);
    await supabase.from('test_attempts').delete().eq('user_id', DEMO_USER_ID);
    console.log('Cleaned up', existingAttempts.length, 'existing attempts for demo user.');
  }

  const baseTime = new Date();
  baseTime.setDate(baseTime.getDate() - 14);

  for (let i = 0; i < 6; i++) {
    const test = selectedTests[i];
    const targetMarks = TARGET_SCORES[i];

    // Load questions for this test (order by question_number)
    const { data: sections } = await supabase.from('sections').select('section_id').eq('test_id', test.test_id);
    const sectionIds = (sections || []).map((s) => s.section_id);
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('question_id, question_number, correct_option, section_id')
      .in('section_id', sectionIds)
      .order('question_number', { ascending: true });

    if (qErr || !questions || questions.length !== 160) {
      console.error(`Test ${test.test_id}: expected 160 questions, got ${(questions || []).length}`, qErr);
      continue;
    }

    // Normalize correct_option to single letter
    const qList = questions.map((q) => ({
      question_number: q.question_number,
      correct_option: (q.correct_option || 'A').toString().trim().toUpperCase().slice(0, 1),
    }));

    // Decide correct / wrong / unattempted: targetMarks correct, most of rest wrong, few unattempted
    const numWrong = Math.min(
      TOTAL_QUESTIONS - targetMarks,
      Math.max(0, Math.floor((TOTAL_QUESTIONS - targetMarks) * 0.85))
    );
    const numUnattempted = TOTAL_QUESTIONS - targetMarks - numWrong;

    const indices = Array.from({ length: 160 }, (_, j) => j);
    const shuffled = shuffle(indices);
    const correctSet = new Set(shuffled.slice(0, targetMarks));
    const wrongSet = new Set(shuffled.slice(targetMarks, targetMarks + numWrong));
    // rest unattempted

    const answers = {};
    const sectionStats = { maths: { correct: 0, wrong: 0, unattempted: 0 }, physics: { correct: 0, wrong: 0, unattempted: 0 }, chemistry: { correct: 0, wrong: 0, unattempted: 0 } };

    for (let j = 0; j < qList.length; j++) {
      const q = qList[j];
      const sec = getSection(q.question_number);
      if (correctSet.has(j)) {
        answers[q.question_number] = q.correct_option;
        sectionStats[sec].correct++;
      } else if (wrongSet.has(j)) {
        answers[q.question_number] = getWrongOption(q.correct_option);
        sectionStats[sec].wrong++;
      } else {
        sectionStats[sec].unattempted++;
      }
    }

    // question_times: ~67.5 sec per question total 10800, with small variation (keys as strings for JSONB)
    const totalTimeTaken = DURATION_SECONDS - 0; // time_remaining 0
    const perQuestion = totalTimeTaken / 160;
    const questionTimes = {};
    let sum = 0;
    for (let k = 1; k <= 160; k++) {
      const variation = (Math.random() - 0.5) * 20;
      const t = Math.round(Math.max(30, perQuestion + variation));
      questionTimes[String(k)] = t;
      sum += t;
    }
    const diff = totalTimeTaken - sum;
    if (diff !== 0) {
      questionTimes['160'] = (questionTimes['160'] || 0) + diff;
    }

    const section_wise_marks = {
      maths: sectionStats.maths.correct,
      physics: sectionStats.physics.correct,
      chemistry: sectionStats.chemistry.correct,
    };

    const section_wise_analysis = {
      maths: {
        correct: sectionStats.maths.correct,
        wrong: sectionStats.maths.wrong,
        unattempted: sectionStats.maths.unattempted,
        marks: sectionStats.maths.correct,
        time_seconds: 0,
        time_correct: 0,
        time_wrong: 0,
        time_unattempted: 0,
      },
      physics: {
        correct: sectionStats.physics.correct,
        wrong: sectionStats.physics.wrong,
        unattempted: sectionStats.physics.unattempted,
        marks: sectionStats.physics.correct,
        time_seconds: 0,
        time_correct: 0,
        time_wrong: 0,
        time_unattempted: 0,
      },
      chemistry: {
        correct: sectionStats.chemistry.correct,
        wrong: sectionStats.chemistry.wrong,
        unattempted: sectionStats.chemistry.unattempted,
        marks: sectionStats.chemistry.correct,
        time_seconds: 0,
        time_correct: 0,
        time_wrong: 0,
        time_unattempted: 0,
      },
    };

    for (let k = 1; k <= 160; k++) {
      const sec = getSection(k);
      const t = questionTimes[String(k)] || questionTimes[k] || 0;
      section_wise_analysis[sec].time_seconds += t;
      const qIdx = qList.findIndex((q) => q.question_number === k);
      if (qIdx === -1) continue;
      const isCorrect = correctSet.has(qIdx);
      const isWrong = wrongSet.has(qIdx);
      if (isCorrect) section_wise_analysis[sec].time_correct += t;
      else if (isWrong) section_wise_analysis[sec].time_wrong += t;
      else section_wise_analysis[sec].time_unattempted += t;
    }

    const startedAt = new Date(baseTime);
    startedAt.setDate(startedAt.getDate() + i * 2);
    startedAt.setHours(10, 0, 0, 0);
    const submittedAt = new Date(startedAt.getTime() + totalTimeTaken * 1000);

    const attemptRow = {
      user_id: DEMO_USER_ID,
      test_id: test.test_id,
      status: 'submitted',
      started_at: startedAt.toISOString(),
      submitted_at: submittedAt.toISOString(),
      time_remaining: 0,
      current_question_id: 160,
      answers,
      marked_for_review: [],
      answered_and_marked: [],
      visited_questions: Array.from({ length: 160 }, (_, k) => k + 1),
      question_times: questionTimes,
    };

    const { data: attempt, error: attemptErr } = await supabase.from('test_attempts').insert(attemptRow).select('id').single();
    if (attemptErr) {
      console.error('Insert attempt failed for test', test.test_id, attemptErr);
      continue;
    }

    const resultRow = {
      attempt_id: attempt.id,
      user_id: DEMO_USER_ID,
      test_id: test.test_id,
      submitted_at: submittedAt.toISOString(),
      time_taken: totalTimeTaken,
      answers,
      section_wise_marks,
      total_marks: targetMarks,
      correct_answers: targetMarks,
      wrong_answers: numWrong,
      unattempted: numUnattempted,
      section_wise_analysis,
    };

    const { error: resultErr } = await supabase.from('test_results').insert(resultRow);
    if (resultErr) {
      console.error('Insert result failed for test', test.test_id, resultErr);
      continue;
    }

    console.log(`  Test ${test.test_id} (${test.test_name}): target=${targetMarks}, got ${targetMarks} marks. attempt=${attempt.id}`);
  }

  console.log('Done. Verifying...');
  const { data: results } = await supabase
    .from('test_results')
    .select('test_id, total_marks, section_wise_marks')
    .eq('user_id', DEMO_USER_ID)
    .order('submitted_at', { ascending: true });

  console.log('Demo user results (order by submitted_at):', (results || []).map((r) => ({ test_id: r.test_id, total_marks: r.total_marks })));
  const scores = (results || []).map((r) => r.total_marks);
  const expected = [40, 60, 80, 110, 90, 120];
  const ok = scores.length === 6 && scores.every((s, idx) => s === expected[idx]);
  if (!ok) {
    console.warn('Expected scores', expected, 'got', scores);
  } else {
    console.log('Verification passed: scores match [40, 60, 80, 110, 90, 120].');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
