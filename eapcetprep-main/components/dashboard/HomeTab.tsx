"use client"

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  PlayCircle,
  CheckCircle2,
  BookOpen,
  FileText,
  ChevronRight,
  Target,
  Trophy,
  Activity,
  BarChart2,
  Lock,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { isFreeTest } from '@/utils/free-tests';
import { createClient } from '@/utils/supabase/client';

const CACHE_KEY = 'dashboard_quizzes_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000;

const ENGINEERING_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry'];
const MEDICAL_SUBJECTS = ['Botany', 'Zoology', 'Physics', 'Chemistry'];

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
      .select('quiz_id, quiz_name, subject, chapter')
      .range(from, from + pageSize - 1);
    if (userField) query = query.eq('field', userField);
    const { data, error } = await query;
    if (error || !data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < pageSize) break;
    from += pageSize;
  }
  const seen = new Set<string>();
  const unique = allData.filter((q: any) => {
    if (seen.has(q.quiz_id)) return false;
    seen.add(q.quiz_id);
    return true;
  });
  try { localStorage.setItem(cacheKey, JSON.stringify({ data: unique, timestamp: Date.now() })); } catch {}
  return unique;
}

const subjectsForField = (field?: string) => field === 'medical' ? MEDICAL_SUBJECTS : ENGINEERING_SUBJECTS;

export default function HomeTab({
  showDownloadBanner,
  setShowDownloadDialog,
  setActiveTab,
  isPremium,
  userData,
  userField,
  testResults,
  analytics,
  onStartTest,
  onShowPaywall,
}: {
  showDownloadBanner: boolean;
  setShowDownloadDialog: (v: boolean) => void;
  setActiveTab: (v: string) => void;
  isPremium: boolean;
  userData: any;
  userField?: string;
  testResults: any[];
  analytics: any;
  onStartTest: (testId: string) => void;
  onShowPaywall: () => void;
}) {
  const router = useRouter();
  const subjects = subjectsForField(userField);
  const [activeSubject, setActiveSubject] = useState(subjects[0]);
  const [activeRegion, setActiveRegion] = useState('AP');
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [chapters, setChapters] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [freeTests, setFreeTests] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHasShared(localStorage.getItem('eapcetpro_shared') === '1');
  }, []);

  // Build chart data from testResults
  const testHistory = (testResults || [])
    .slice()
    .sort((a: any, b: any) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
    .map((r: any, i: number) => ({ test: `T${i + 1}`, score: r.total_marks }));

  const stats = analytics ? {
    accuracy: analytics.total_tests_taken > 0
      ? Math.round((analytics.average_score / 160) * 100)
      : 0,
    avgScore: Math.round(analytics.average_score || 0),
    testsTaken: analytics.total_tests_taken || 0,
    avgRank: analytics.average_estimated_rank || 0,
  } : { accuracy: 0, avgScore: 0, testsTaken: 0, avgRank: 0 };

  // Recent activity: merge test results + quiz attempts, sort by date, top 5
  useEffect(() => {
    async function buildRecentActivity() {
      const testItems = (testResults || []).map((r: any) => ({
        type: 'test' as const,
        title: r.tests?.test_name || `Test ${r.test_id}`,
        subtitle: `Score: ${r.total_marks}/160`,
        date: r.submitted_at,
        raw: r,
      }));

      try {
        const attemptsRes = await fetch('/api/quiz/attempts');
        const attemptsData = attemptsRes.ok ? await attemptsRes.json() : {};
        const quizAttempts = attemptsData.attempts || null;

        const quizItems = (quizAttempts || []).map((r: any) => ({
          type: 'quiz' as const,
          title: r.quiz_name,
          subtitle: `${Math.round(r.percentage)}% · ${r.score}/${r.total} correct`,
          chapter: r.chapter,
          subject: r.subject,
          date: r.completed_at,
          raw: r,
        }));

        const all = [...testItems, ...quizItems]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        setRecentActivity(all);
      } catch {
        const sorted = testItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
        setRecentActivity(sorted);
      }
    }
    buildRecentActivity();
  }, [testResults]);

  // Load free tests
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/tests-data.json');
        const data = await res.json();
        if (data?.tests) {
          const free = data.tests.filter((t: any) => isFreeTest(t.test_id.toString())).slice(0, 2);
          setFreeTests(free);
        }
      } catch {}
    };
    load();
  }, []);

  // Fetch recent tests by region
  useEffect(() => {
    const fetchTests = async () => {
      setTestsLoading(true);
      try {
        const res = await fetch(`/api/test/list?state=${activeRegion}`);
        const data = await res.json();
        if (data.success) {
          setRecentTests((data.tests || []).slice(0, 3));
        }
      } catch {}
      setTestsLoading(false);
    };
    fetchTests();
  }, [activeRegion]);

  // Reset active subject when userField changes
  useEffect(() => {
    const newSubjects = subjectsForField(userField);
    setActiveSubject(newSubjects[0]);
  }, [userField]);

  // Fetch chapters by subject
  useEffect(() => {
    const fetchChapters = async () => {
      const allQuizzes = await getQuizzes(userField);
      const subjectQuizzes = allQuizzes.filter((q: any) => q.subject === activeSubject);
      const chapterMap = new Map<string, Set<string>>();
      subjectQuizzes.forEach((q: any) => {
        if (!q.chapter) return;
        if (!chapterMap.has(q.chapter)) chapterMap.set(q.chapter, new Set());
        chapterMap.get(q.chapter)!.add(q.quiz_id);
      });
      const formatted = Array.from(chapterMap.entries()).map(([chapter, quizIds]) => ({
        title: chapter,
        progress: 0,
        total: quizIds.size,
      }));
      setChapters(formatted.slice(0, 3));
    };
    fetchChapters();
  }, [activeSubject, userField]);

  const loading = testsLoading;

  return (
    <div className="space-y-8 pb-24">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          hello <span className="text-2xl" style={{display: 'inline-block', animation: 'wave 2.5s infinite', transformOrigin: 'bottom right'}}>👋</span>
        </h1>
        <div className="flex items-center gap-2">
          <p className="text-lg text-gray-600 font-medium">{userData?.name || 'Student'}</p>
          <button
            onClick={() => setShowShareModal(true)}
            title={hasShared ? 'Pro member' : 'Become a Pro by sharing'}
            className="flex items-center gap-1 transition-all"
          >
            {hasShared ? (
              /* Indigo filled Twitter-style starburst with white checkmark */
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0">
                <path fill="#6366f1" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.733 2.73 1.838 3.42-.06.284-.093.578-.093.88 0 2.21 1.71 4 3.918 4 .52 0 1.01-.115 1.46-.32.553 1.25 1.812 2.12 3.25 2.12s2.697-.87 3.25-2.12c.45.205.94.32 1.46.32 2.21 0 3.918-1.79 3.918-4 0-.302-.033-.596-.093-.88 1.105-.69 1.838-1.96 1.838-3.42z"/>
                <path fill="#fff" d="M16.965 8.35c-.328-.327-.857-.327-1.185 0L10.5 13.635 8.22 11.355c-.328-.327-.857-.327-1.185 0-.328.328-.328.858 0 1.186l2.872 2.872c.164.164.38.246.593.246.213 0 .43-.082.593-.246l5.872-5.872c.328-.328.328-.858 0-1.186z"/>
              </svg>
            ) : (
              /* Gray dotted starburst outline with dashed checkmark */
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0">
                <path fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="2.5 2" strokeLinecap="round" strokeLinejoin="round" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.733 2.73 1.838 3.42-.06.284-.093.578-.093.88 0 2.21 1.71 4 3.918 4 .52 0 1.01-.115 1.46-.32.553 1.25 1.812 2.12 3.25 2.12s2.697-.87 3.25-2.12c.45.205.94.32 1.46.32 2.21 0 3.918-1.79 3.918-4 0-.302-.033-.596-.093-.88 1.105-.69 1.838-1.96 1.838-3.42z"/>
                <path fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="2.5 2" strokeLinecap="round" strokeLinejoin="round" d="M8.5 11.5 L11 14.2 L16.5 8.5"/>
              </svg>
            )}
            {!hasShared && (
              <span className="text-[11px] text-gray-400 font-medium leading-none">Become Pro</span>
            )}
          </button>
        </div>
      </div>

      {/* Share Bottom Sheet — rendered via portal so parent overflow:hidden doesn't clip it */}
      {showShareModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="relative bg-white w-full rounded-t-3xl p-6 pb-safe shadow-2xl"
            style={{ maxWidth: 448, paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-5 right-5 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
                  <path fill="#6366f1" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.733 2.73 1.838 3.42-.06.284-.093.578-.093.88 0 2.21 1.71 4 3.918 4 .52 0 1.01-.115 1.46-.32.553 1.25 1.812 2.12 3.25 2.12s2.697-.87 3.25-2.12c.45.205.94.32 1.46.32 2.21 0 3.918-1.79 3.918-4 0-.302-.033-.596-.093-.88 1.105-.69 1.838-1.96 1.838-3.42z"/>
                  <path fill="#fff" d="M16.965 8.35c-.328-.327-.857-.327-1.185 0L10.5 13.635 8.22 11.355c-.328-.327-.857-.327-1.185 0-.328.328-.328.858 0 1.186l2.872 2.872c.164.164.38.246.593.246.213 0 .43-.082.593-.246l5.872-5.872c.328-.328.328-.858 0-1.186z"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Get your Pro badge</h2>
              <p className="text-sm text-gray-500 mt-1 px-4">
                Share eapcetpro with your friends on WhatsApp to unlock your indigo verified badge.
              </p>
            </div>

            {/* Message preview */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-600 border border-gray-100 whitespace-pre-line">
              {`Hey! I'm using eapcetpro to prepare for EAPCET — it has chapter-wise quizzes and full mock tests. Check it out 👇\n`}
              <span className="text-indigo-600 font-medium">https://eapcetpro.com</span>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    "Hey! I'm using eapcetpro to prepare for EAPCET — it has chapter-wise quizzes and full mock tests. Check it out 👇\nhttps://eapcetpro.com"
                  );
                  setCopied(true);
                  setHasShared(true);
                  localStorage.setItem('eapcetpro_shared', '1');
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy message'}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent("Hey! I'm using eapcetpro to prepare for EAPCET — it has chapter-wise quizzes and full mock tests. Check it out 👇\nhttps://eapcetpro.com")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setHasShared(true);
                  localStorage.setItem('eapcetpro_shared', '1');
                }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share on WhatsApp
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Download Banner */}
      {showDownloadBanner && (
        <div
          onClick={() => isPremium ? setShowDownloadDialog(true) : onShowPaywall()}
          className="bg-indigo-600 rounded-2xl p-5 text-white shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform border border-indigo-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Optional</p>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download as App
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Performance Overview</h2>
          <button onClick={() => setActiveTab('analytics')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            View Details
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.accuracy}%</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Accuracy</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgScore}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Score</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.testsTaken}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tests Taken</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgRank > 0 ? `${Math.round(stats.avgRank / 1000)}k` : '-'}
              </p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Est. Rank</p>
            </div>
          </div>
        </div>

        {testHistory.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-gray-500" />
              Test Scores Over Time
            </h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={testHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="test" hide />
                  <YAxis tick={{fontSize: 10}} width={30} />
                  <Tooltip contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="score" stroke="#4f46e5" fill="#e0e7ff" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {/* Recommended free tests when no data yet */}
      {stats.testsTaken === 0 && freeTests.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Get Started</h2>
          <div className="space-y-3">
            {freeTests.map((test: any) => (
              <div key={test.test_id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{test.test_name}</h4>
                  </div>
                </div>
                <button
                  onClick={() => onStartTest(test.test_id.toString())}
                  className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <PlayCircle className="w-4 h-4" />
                  Start
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Chapter wise quizzes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Chapter wise quizzes</h2>
          <button onClick={() => setActiveTab('chapter')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            See All
          </button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{scrollbarWidth: 'none'}}>
          {subjects.map(subject => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeSubject === subject
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {subject}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {chapters.length === 0 ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            chapters.map((ch, i) => (
              <div key={i} onClick={() => setActiveTab('chapter')} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-base mb-1">{ch.title}</h4>
                    <p className="text-xs text-gray-500 font-medium">{ch.total} Quizzes</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 ml-4 group-hover:text-indigo-600 transition-colors" />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Previous Year Mock tests */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Previous Year Mock tests</h2>
          <button onClick={() => setActiveTab('mock')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            See All
          </button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{scrollbarWidth: 'none'}}>
          {['AP', 'TS'].map(region => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeRegion === region
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {region} EAPCET
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
              </div>
            ))
          ) : (
            recentTests.map((test: any, i: number) => {
              const isCompleted = test.status === 'completed';
              const isInProgress = test.status === 'in_progress';
              const isLocked = !isPremium;
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{test.test_name}</h4>
                      {isCompleted && test.score !== undefined && (
                        <p className="text-xs text-emerald-600 font-semibold">Score: {test.score}/160</p>
                      )}
                      {isInProgress && (
                        <p className="text-xs text-amber-600 font-semibold">In Progress</p>
                      )}
                      {!isCompleted && !isInProgress && isLocked && (
                        <p className="text-xs text-gray-400 font-semibold">Premium</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onStartTest(test.test_id.toString())}
                    className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    {isCompleted ? (
                      'Results'
                    ) : isLocked ? (
                      <>
                        <Lock className="w-3 h-3" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        {isInProgress ? 'Continue' : 'Start'}
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity: any, i: number) => {
              const isQuiz = activity.type === 'quiz';
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isQuiz ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                      {isQuiz
                        ? <BookOpen className="w-5 h-5 text-blue-500" />
                        : <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isQuiz ? 'text-blue-600' : 'text-emerald-600'}`}>
                        {isQuiz ? 'Quiz Completed' : 'Test Completed'}
                      </p>
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{activity.title}</h4>
                      <p className="text-xs text-gray-500">{activity.subtitle}</p>
                    </div>
                  </div>
                  {!isQuiz && (
                    <button
                      onClick={() => router.push(`/dashboard/result?resultId=${activity.raw.id}`)}
                      className="flex-shrink-0 ml-3 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      View Result
                    </button>
                  )}
                  {isQuiz && (
                    <button
                      onClick={() => setActiveTab('chapter')}
                      className="flex-shrink-0 ml-3 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Practice
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
