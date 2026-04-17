import React, { useState, useEffect } from 'react';
import { 
  Download, 
  PlayCircle, 
  CheckCircle2, 
  BookOpen, 
  FileText, 
  X,
  ChevronRight,
  Target,
  Trophy,
  Activity,
  BarChart2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { getTests, getQuizzes } from '../lib/dataStore';

export default function HomeTab({ 
  showDownloadBanner, 
  setShowDownloadDialog,
  setActiveTab
}: { 
  showDownloadBanner: boolean, 
  setShowDownloadDialog: (v: boolean) => void,
  setActiveTab: (v: string) => void
}) {
  const [activeSubject, setActiveSubject] = useState('Mathematics');
  const [activeRegion, setActiveRegion] = useState('AP');
  
  const [loading, setLoading] = useState(true);
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({ accuracy: 0, avgScore: 0, testsTaken: 0, avgRank: 0 });
  const [chapters, setChapters] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      // Fetch test results for history and stats
      const { data: resultsData } = await supabase
        .from('test_results')
        .select('*, tests(test_name)')
        .order('created_at', { ascending: true });

      if (resultsData && resultsData.length > 0) {
        const history = resultsData.map((r, i) => ({
          test: `T${i + 1}`,
          score: r.total_marks
        }));
        setTestHistory(history);
        
        setRecentActivity(resultsData.slice(-2).reverse());

        const totalScore = resultsData.reduce((acc, r) => acc + r.total_marks, 0);
        const totalCorrect = resultsData.reduce((acc, r) => acc + r.correct_answers, 0);
        const totalQuestions = resultsData.reduce((acc, r) => acc + r.correct_answers + r.wrong_answers + r.unattempted, 0);
        
        setStats({
          accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
          avgScore: Math.round(totalScore / resultsData.length),
          testsTaken: resultsData.length,
          avgRank: 152000 // Mocked for now as it's complex to calculate
        });
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchRecentTests() {
      setLoading(true);
      
      const allTests = await getTests();
      const filteredTests = allTests
        .filter((t: any) => t.state === activeRegion)
        .slice(0, 3);
        
      setRecentTests(filteredTests);
      setLoading(false);
    }
    fetchRecentTests();
  }, [activeRegion]);

  useEffect(() => {
    async function fetchChapters() {
      const allQuizzes = await getQuizzes();
      
      // Group quizzes by chapter for the active subject
      const subjectQuizzes = allQuizzes.filter((q: any) => q.subject === activeSubject);
      const chapterMap = new Map<string, Set<string>>();
      
      subjectQuizzes.forEach((q: any) => {
        if (!q.chapter) return;
        if (!chapterMap.has(q.chapter)) {
          chapterMap.set(q.chapter, new Set());
        }
        chapterMap.get(q.chapter)!.add(q.quiz_id);
      });
      
      const formattedChapters = Array.from(chapterMap.entries()).map(([chapter, quizIds]) => ({
        title: chapter,
        progress: 0,
        total: quizIds.size
      }));
      
      setChapters(formattedChapters.slice(0, 3));
    }
    fetchChapters();
  }, [activeSubject]);

  return (
    <div className="space-y-8 pb-24">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          hello <span className="text-2xl animate-wave origin-bottom-right">👋</span>
        </h1>
        <p className="text-lg text-gray-600 font-medium">Varun</p>
      </div>

      {/* Download Banner - No Gradients */}
      {showDownloadBanner && (
        <div 
          onClick={() => setShowDownloadDialog(true)}
          className="bg-indigo-600 rounded-2xl p-5 text-white shadow-sm cursor-pointer transform transition hover:scale-[1.02] active:scale-[0.98] border border-indigo-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Complete this step</p>
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
          <button 
            onClick={() => setActiveTab('analytics')}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
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
              <p className="text-2xl font-bold text-gray-900">{stats.avgRank > 0 ? `${Math.round(stats.avgRank / 1000)}k` : '-'}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Est. Rank</p>
            </div>
          </div>
        </div>

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
      </section>

      {/* Chapter wise quizzes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Chapter wise quizzes</h2>
          <button 
            onClick={() => setActiveTab('chapter')}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            See All
          </button>
        </div>
        
        {/* Subject Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {['Mathematics', 'Physics', 'Chemistry'].map(subject => (
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
          {loading ? (
            // Skeletons
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Actual Data
            chapters.map((quiz, i) => (
              <div key={i} onClick={() => setActiveTab('chapter')} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-base mb-1">{quiz.title}</h4>
                    <p className="text-xs text-gray-500 font-medium mb-2">{quiz.progress}/{quiz.total} Completed</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${(quiz.progress / quiz.total) * 100}%` }}
                      ></div>
                    </div>
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
          <button 
            onClick={() => setActiveTab('mock')}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            See All
          </button>
        </div>
        
        {/* Region Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
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
            // Skeletons
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
            // Actual Data
            recentTests.map((test, i) => (
              <div key={i} onClick={() => setActiveTab('mock')} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base mb-1">{new Date(test.test_date).toLocaleDateString()}</h4>
                    <p className="text-xs text-gray-500 font-medium">Shift {test.shift}</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <PlayCircle className="w-4 h-4" />
                  Start Test
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {loading ? (
            [1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
              </div>
            ))
          ) : (
            <>
              {recentActivity.map((activity, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-emerald-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Test Completed</p>
                      <h4 className="font-semibold text-gray-900 text-sm">{activity.tests?.test_name || 'Mock Test'}</h4>
                    </div>
                  </div>
                  <button className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                    Reattempt
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
