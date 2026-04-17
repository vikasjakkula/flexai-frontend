import { supabase } from './supabase';

const CACHE_KEY_TESTS = 'eapcet_tests_cache_v2';
const CACHE_KEY_QUIZZES = 'eapcet_quizzes_cache_v2';
const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

export async function getTests() {
  try {
    const cached = localStorage.getItem(CACHE_KEY_TESTS);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }

  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('test_type', 'previous_year')
    .order('test_date', { ascending: false });

  if (data) {
    localStorage.setItem(CACHE_KEY_TESTS, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  }
  return [];
}

export async function getQuizzes() {
  try {
    const cached = localStorage.getItem(CACHE_KEY_QUIZZES);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }

  let allData: any[] = [];
  let hasMore = true;
  let page = 0;
  const pageSize = 1000;

  while (hasMore) {
    const { data, error } = await supabase
      .from('quizzes')
      .select('quiz_id, quiz_name, subject, chapter')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      allData = [...allData, ...data];
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  if (allData.length > 0) {
    // Deduplicate by quiz_id since the table has one row per question
    const uniqueQuizzesMap = new Map();
    allData.forEach(q => {
      if (!uniqueQuizzesMap.has(q.quiz_id)) {
        uniqueQuizzesMap.set(q.quiz_id, q);
      }
    });
    const uniqueQuizzes = Array.from(uniqueQuizzesMap.values());
    
    localStorage.setItem(CACHE_KEY_QUIZZES, JSON.stringify({ data: uniqueQuizzes, timestamp: Date.now() }));
    return uniqueQuizzes;
  }
  return [];
}
