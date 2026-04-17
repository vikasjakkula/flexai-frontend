"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, ChevronRight, PlayCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const ENGINEERING_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry'];
const MEDICAL_SUBJECTS = ['Botany', 'Zoology', 'Physics', 'Chemistry'];

const CACHE_KEY = 'dashboard_quizzes_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getQuizzes(userField?: string) {
  const cacheKey = userField ? `${CACHE_KEY}_${userField}` : CACHE_KEY;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return data;
    }
  } catch {}

  const supabase = createClient();
  let allData: any[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    let query = supabase
      .from('quizzes')
      .select('quiz_id, quiz_name, subject, chapter');

    if (userField) {
      query = query.eq('field', userField);
    }

    const { data, error } = await query.range(from, from + pageSize - 1);

    if (error || !data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < pageSize) break;
    from += pageSize;
  }

  // Deduplicate by quiz_id
  const seen = new Set<string>();
  const unique = allData.filter((q: any) => {
    if (seen.has(q.quiz_id)) return false;
    seen.add(q.quiz_id);
    return true;
  });

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data: unique, timestamp: Date.now() }));
  } catch {}

  return unique;
}

const subjectsForField = (field?: string) => field === 'medical' ? MEDICAL_SUBJECTS : ENGINEERING_SUBJECTS;

export default function ChapterTab({ setActiveQuiz, refreshKey, isPremium, onShowPaywall, userField }: { setActiveQuiz: (quiz: {id: string | number, title: string, subject?: string, chapter?: string}) => void, refreshKey?: number, isPremium?: boolean, onShowPaywall?: () => void, userField?: string }) {
  const subjects = subjectsForField(userField);
  const [activeSubject, setActiveSubject] = useState(subjects[0]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Map of quiz_id -> latest attempt { percentage, score, total }
  const [attemptMap, setAttemptMap] = useState<Map<string, { percentage: number; score: number; total: number }>>(new Map());
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getQuizzes(userField);
      if (data) setAllQuizzes(data);
      setLoading(false);
    }
    fetchData();
  }, [userField]);

  useEffect(() => {
    setExpandedChapter(null);
  }, [activeSubject]);

  // Reset active subject when userField changes (e.g. medical <-> engineering)
  useEffect(() => {
    const newSubjects = subjectsForField(userField);
    setActiveSubject(newSubjects[0]);
  }, [userField]);

  // Fetch latest attempts for quizzes in the expanded chapter
  useEffect(() => {
    if (!expandedChapter || allQuizzes.length === 0) return;

    const chapterQuizzes = allQuizzes.filter(q => q.subject === activeSubject && q.chapter === expandedChapter);
    const quizIds = [...new Set(chapterQuizzes.map((q: any) => q.quiz_id as string))];
    if (quizIds.length === 0) return;

    setLoadingAttempts(true);
    fetch(`/api/quiz/attempts?quiz_ids=${quizIds.join(',')}`)
      .then(r => r.json())
      .then(({ attempts }) => {
        if (attempts) {
          const map = new Map<string, { percentage: number; score: number; total: number }>();
          attempts.forEach((row: any) => {
            if (!map.has(row.quiz_id)) {
              map.set(row.quiz_id, { percentage: row.percentage, score: row.score, total: row.total });
            }
          });
          setAttemptMap(new Map(map));
        }
        setLoadingAttempts(false);
      })
      .catch(() => setLoadingAttempts(false));
  }, [expandedChapter, allQuizzes, activeSubject, refreshKey]);

  const chapterList = useMemo(() => {
    const filteredBySubject = allQuizzes.filter((q: any) => q.subject === activeSubject);
    const chapterGroups = new Map<string, Set<string>>();
    filteredBySubject.forEach((q: any) => {
      if (!q.chapter) return;
      if (!chapterGroups.has(q.chapter)) chapterGroups.set(q.chapter, new Set());
      chapterGroups.get(q.chapter)!.add(q.quiz_id);
    });
    return Array.from(chapterGroups.entries()).map(([chapter, quizIds]) => ({
      chapter,
      quizCount: quizIds.size
    }));
  }, [allQuizzes, activeSubject]);

  const expandedChapterQuizzes = useMemo(() => {
    if (!expandedChapter) return [];
    const filtered = allQuizzes.filter((q: any) => q.subject === activeSubject && q.chapter === expandedChapter);
    const uniqueQuizzes = new Map<string, string>();
    filtered.forEach((q: any) => uniqueQuizzes.set(q.quiz_id, q.quiz_name));
    return Array.from(uniqueQuizzes.entries()).map(([quiz_id, quiz_name]) => ({ quiz_id, quiz_name }));
  }, [allQuizzes, activeSubject, expandedChapter]);

  if (expandedChapter) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setExpandedChapter(null)}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">{expandedChapter}</h2>
        </div>

        <div className="space-y-3">
          {expandedChapterQuizzes.map((quiz) => {
            const attempt = attemptMap.get(quiz.quiz_id);
            const hasAttempt = !!attempt;
            const pct = attempt?.percentage ?? 0;
            const isGood = pct >= 60;

            return (
              <div key={quiz.quiz_id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{quiz.quiz_name}</h4>
                      {hasAttempt ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                          Last attempt: {Math.round(pct)}% ({attempt.score}/{attempt.total})
                        </span>
                      ) : (
                        <p className="text-xs text-gray-500 font-medium">Not attempted</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!isPremium && onShowPaywall) { onShowPaywall(); return; }
                      setActiveQuiz({ id: quiz.quiz_id, title: quiz.quiz_name, subject: activeSubject, chapter: expandedChapter });
                    }}
                    className={`flex-shrink-0 ml-3 text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                      hasAttempt
                        ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                        : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    {hasAttempt ? <><RotateCcw className="w-3.5 h-3.5" /> Reattempt</> : 'Start'}
                  </button>
                </div>
              </div>
            );
          })}
          {expandedChapterQuizzes.length === 0 && (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl border-dashed">
              <p className="text-gray-500 font-medium">No quizzes found for this chapter.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Chapter wise quizzes</h2>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{scrollbarWidth: 'none'}}>
        {subjects.map(subject => (
          <button
            key={subject}
            onClick={() => setActiveSubject(subject)}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
              activeSubject === subject
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl border-dashed">
            <p className="text-gray-500 font-medium">Loading chapters...</p>
          </div>
        ) : chapterList.length > 0 ? chapterList.map((item) => (
          <div
            key={item.chapter}
            onClick={() => {
              if (!isPremium && onShowPaywall) { onShowPaywall(); return; }
              setExpandedChapter(item.chapter);
            }}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1 pr-4">
                <h4 className="font-bold text-gray-900 text-base mb-1">{item.chapter}</h4>
                <p className="text-sm text-gray-500 font-medium">{item.quizCount} {item.quizCount === 1 ? 'Quiz' : 'Quizzes'}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          </div>
        )) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl border-dashed">
            <p className="text-gray-500 font-medium">No chapters available for {activeSubject}</p>
          </div>
        )}
      </div>
    </div>
  );
}
