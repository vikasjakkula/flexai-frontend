"use client";

import { useState, useEffect, Suspense } from 'react';
import { Inter } from 'next/font/google';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Shimmer, TestQuestionShimmer } from '@/components/Shimmer';
import { TrialResultPricingSection } from '@/components/TrialResultPricingSection';
import { trackTrialCompleted } from '@/lib/facebook-pixel';

const inter = Inter({ subsets: ['latin'] });

function TestResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams.get('resultId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overall' | 'physics' | 'chemistry' | 'maths'>('overall');
  const [rankEstimate, setRankEstimate] = useState<{ estimatedRank: number; rankRange: string } | null>(null);
  const [rankLoading, setRankLoading] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!resultId) {
        setError('Result ID is required');
        setLoading(false);
        return;
      }

      try {
        // Fetch result
        const resultResponse = await fetch(`/api/test/results/${resultId}`);
        const resultData = await resultResponse.json();

        if (!resultData.success) {
          throw new Error(resultData.error || 'Failed to fetch result');
        }

        setResult(resultData.result);

        // Fetch analytics
        const analyticsResponse = await fetch(`/api/test/analytics?attemptId=${resultData.result.attempt_id}`);
        const analyticsData = await analyticsResponse.json();

        if (analyticsData.success) {
          setAnalytics(analyticsData.data);
        }

        // Fetch question times for subject-specific breakdown
        try {
          const timesResponse = await fetch(`/api/test/attempt/${resultData.result.attempt_id}/time`);
          const timesData = await timesResponse.json();
          if (timesData.success) {
            setQuestionTimes(timesData.times || {});
          }
        } catch (err) {
          console.error('Error fetching question times:', err);
        }

        // Check if estimated_rank exists in result, if not fetch from API
        if (resultData.result.estimated_rank) {
          // Use existing estimated rank from database
          setRankEstimate(resultData.result.estimated_rank);
          setRankLoading(false);
        } else {
          // For trial (15 marks), normalize to 160 scale for rank API; full test already out of 160
          const isTrial = !!resultData.result.is_trial;
          const scoreForRank = isTrial
            ? Math.round((resultData.result.total_marks / 15) * 160)
            : resultData.result.total_marks;
          setRankLoading(true);
          try {
            const rankResponse = await fetch('/api/analytics/rank-estimate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                score: scoreForRank,
                resultId: resultId,
              }),
            });
            const rankData = await rankResponse.json();
            if (rankData.success) {
              setRankEstimate(rankData.data);
            }
          } catch (err) {
            console.error('Error fetching rank estimate:', err);
          } finally {
            setRankLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load result');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resultId]);

  // Track completion of 15-min trial using Facebook Pixel custom event.
  // Placed before any early returns so hook order is stable across renders.
  useEffect(() => {
    if (!resultId || !result?.is_trial) return;

    const normalizedMarks160 =
      result.total_marks != null ? Math.round((result.total_marks / 15) * 160) : undefined;

    trackTrialCompleted({
      resultId: String(resultId),
      testId: result.test_id,
      totalMarks: result.total_marks,
      normalizedMarks160,
    });
  }, [resultId, result]);

  if (loading) {
    return (
      <div className={`${inter.className} min-h-screen bg-gray-50`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <Shimmer height="h-5" width="w-5" rounded />
            <Shimmer height="h-6" width="w-32" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Shimmer height="h-8" width="w-48" className="mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center">
                    <Shimmer height="h-8" width="w-16" className="mx-auto mb-2" />
                    <Shimmer height="h-4" width="w-20" className="mx-auto" />
                  </div>
                ))}
              </div>
              <Shimmer height="h-32" width="w-full" rounded className="mb-4" />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Shimmer height="h-6" width="w-40" className="mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-3 border border-gray-100 rounded">
                    <Shimmer height="h-4" width="w-32" />
                    <Shimmer height="h-4" width="w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={`${inter.className} min-h-screen flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || 'Result not found'}</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Go back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isTrial = !!result.is_trial;
  const maxMarks = isTrial ? 15 : 160;
  const testName = result.test?.test_name || `Test ${result.test_id}`;
  const totalQuestions = result.correct_answers + result.wrong_answers + result.unattempted;
  const accuracy = totalQuestions > 0 ? ((result.correct_answers / totalQuestions) * 100).toFixed(1) : '0';
  const timeTakenMinutes = Math.floor(result.time_taken / 60);
  const timeTakenSeconds = result.time_taken % 60;
  const normalizedMarksForRank = isTrial ? Math.round((result.total_marks / 15) * 160) : result.total_marks;

  // Trial: compute rank improvement multiple (2x–9x) and target from current rank
  const getTrialImprovementMessage = (): { multiple: number; targetRank: number; mockTests: number } | null => {
    if (!isTrial || !rankEstimate?.estimatedRank) return null;
    const currentRank = rankEstimate.estimatedRank;
    const targetRank = currentRank < 60000 ? 5000 : 10000;
    const rawMultiple = currentRank / targetRank;
    const multiple = Math.min(9, Math.max(2, Math.round(rawMultiple)));
    const mockTests = 12;
    return { multiple, targetRank, mockTests };
  };
  const trialImprovement = getTrialImprovementMessage();

  // Time data - prefer from section_wise_analysis, fallback to analytics
  const sectionAnalysis = result.section_wise_analysis;
  
  // Calculate time by status from section_wise_analysis
  let timeCorrect = (sectionAnalysis?.maths?.time_correct || 0) + 
                    (sectionAnalysis?.physics?.time_correct || 0) + 
                    (sectionAnalysis?.chemistry?.time_correct || 0);
  let timeWrong = (sectionAnalysis?.maths?.time_wrong || 0) + 
                  (sectionAnalysis?.physics?.time_wrong || 0) + 
                  (sectionAnalysis?.chemistry?.time_wrong || 0);
  let timeUnattempted = (sectionAnalysis?.maths?.time_unattempted || 0) + 
                        (sectionAnalysis?.physics?.time_unattempted || 0) + 
                        (sectionAnalysis?.chemistry?.time_unattempted || 0);
  let totalTimeSpent = timeCorrect + timeWrong + timeUnattempted;

  // Fallback to analytics if section_wise_analysis times are 0
  if (totalTimeSpent === 0) {
    timeCorrect = analytics?.time_correct_seconds || 0;
    timeWrong = analytics?.time_wrong_seconds || 0;
    timeUnattempted = analytics?.time_unattempted_seconds || 0;
    totalTimeSpent = timeCorrect + timeWrong + timeUnattempted;
  }

  // If all times are still 0 but we have total time, distribute proportionally
  if (totalTimeSpent === 0 && result.time_taken > 0) {
    const totalAnswered = result.correct_answers + result.wrong_answers;
    
    // Distribute 90% of time to answered questions, 10% to unattempted
    if (totalAnswered > 0) {
      const timePerAnswered = (result.time_taken * 0.9) / totalAnswered;
      timeCorrect = Math.round(result.correct_answers * timePerAnswered);
      timeWrong = Math.round(result.wrong_answers * timePerAnswered);
    }
    if (result.unattempted > 0) {
      timeUnattempted = Math.round((result.time_taken * 0.1) / result.unattempted) * result.unattempted;
    }
    totalTimeSpent = result.time_taken;
  } else if (totalTimeSpent === 0) {
    totalTimeSpent = result.time_taken;
  }

  // Subject time data - prefer from section_wise_analysis, fallback to analytics
  let mathsTime = sectionAnalysis?.maths?.time_seconds || analytics?.maths_time_seconds || 0;
  let physicsTime = sectionAnalysis?.physics?.time_seconds || analytics?.physics_time_seconds || 0;
  let chemistryTime = sectionAnalysis?.chemistry?.time_seconds || analytics?.chemistry_time_seconds || 0;
  let totalSubjectTime = mathsTime + physicsTime + chemistryTime;

  // If subject times are 0, distribute total time proportionally
  if (totalSubjectTime === 0 && totalTimeSpent > 0) {
    // Distribute based on question counts
    const mathsQuestions = 80;
    const physicsQuestions = 40;
    const chemistryQuestions = 40;
    const totalQ = mathsQuestions + physicsQuestions + chemistryQuestions;
    
    mathsTime = Math.round((totalTimeSpent * mathsQuestions) / totalQ);
    physicsTime = Math.round((totalTimeSpent * physicsQuestions) / totalQ);
    chemistryTime = Math.round((totalTimeSpent * chemistryQuestions) / totalQ);
    totalSubjectTime = totalTimeSpent;
  } else if (totalSubjectTime === 0) {
    totalSubjectTime = totalTimeSpent;
  }

  // Calculate donut chart data
  const donutData = [
    { label: 'Correct', value: result.correct_answers, color: '#10b981' },
    { label: 'Incorrect', value: result.wrong_answers, color: '#ef4444' },
    { label: 'Not Answered', value: result.unattempted, color: '#9ca3af' },
  ];

  // ============================================
  // DONUT CHART COMPONENT
  // ============================================
  const DonutChart = ({ data, total, size = 200 }: { data: Array<{label: string; value: number; color: string}>; total: number; size?: number }) => {
    const strokeWidth = 24;
    const radius = (size / 2) - strokeWidth;
    const centerX = size / 2;
    const centerY = size / 2;
    const gapAngle = 4;

    const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
      const rad = (angle - 90) * Math.PI / 180.0;
      return {
        x: cx + (r * Math.cos(rad)),
        y: cy + (r * Math.sin(rad))
      };
    };

    const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
      const start = polarToCartesian(x, y, r, endAngle);
      const end = polarToCartesian(x, y, r, startAngle);
      const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
      return "M " + start.x + " " + start.y + " A " + r + " " + r + " 0 " + largeArc + " 0 " + end.x + " " + end.y;
    };

    const nonZeroData = data.filter(item => item.value > 0);
    const totalGapAngle = gapAngle * nonZeroData.length;
    const availableAngle = 360 - totalGapAngle;
    
    let currentAngle = 0;
    const segments: Array<{path: string; color: string}> = [];
    
    nonZeroData.forEach((item, index) => {
      if (index > 0) currentAngle += gapAngle;
      const segmentAngle = (item.value / total) * availableAngle;
      const endAngle = currentAngle + segmentAngle;
      segments.push({
        path: describeArc(centerX, centerY, radius, currentAngle, endAngle),
        color: item.color,
      });
      currentAngle = endAngle;
    });

    return (
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
          {segments.map((seg, i) => (
            <path key={i} d={seg.path} fill="none" stroke={seg.color} strokeWidth={strokeWidth} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-gray-900">{total}</div>
          <div className="text-sm text-gray-600">Total Qs</div>
        </div>
      </div>
    );
  };

  // ============================================
  // TIME BAR CHART COMPONENT
  // ============================================
  const TimeBarChart = ({ data, maxValue, height = 200 }: { data: Array<{ label: string; value: number; color: string }>; maxValue: number; height?: number }) => {
    const maxVal = Math.max(maxValue, 1);
    
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return mins + "m " + secs + "s";
    };

    return (
      <div className="w-full">
        <div className="flex items-end gap-4" style={{ height }}>
          {data.map((item, index) => {
            const percentage = (item.value / maxVal) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-end" style={{ height: height - 40 }}>
                  {item.value > 0 && (
                    <div className="text-xs font-semibold text-gray-700 mb-1 whitespace-nowrap">
                      {formatTime(item.value)}
                    </div>
                  )}
                  <div
                    className="w-full rounded-t-lg"
                    style={{ 
                      height: Math.max(percentage, item.value > 0 ? 5 : 2) + '%',
                      backgroundColor: item.color, 
                      minHeight: item.value > 0 ? 8 : 2,
                    }}
                  />
                </div>
                <div className="mt-3 text-sm text-gray-700 font-medium text-center whitespace-nowrap">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`${inter.className} min-h-screen bg-gray-50 w-full max-w-[100vw] overflow-x-hidden ${isTrial ? 'pb-[calc(33vh+80px)] sm:pb-[calc(33vh+60px)]' : ''}`}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Report Card</h1>
          </div>
        </div>
      </header>

      <main className={`max-w-4xl mx-auto px-3 sm:px-4 py-6 min-w-0 w-full ${isTrial ? 'pb-8' : ''}`}>
        {/* Test Info */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 truncate">{testName}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-500">Attempt 1</span>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Link
            href={`/test/solution?resultId=${resultId}`}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-center hover:bg-blue-700 transition font-medium text-sm shadow-sm"
          >
            View Solution
          </Link>
          <Link
            href={`/test/take?testId=${result.test_id}`}
            className="flex-1 bg-gray-100 text-gray-800 px-4 py-3 rounded-lg text-center hover:bg-gray-200 transition font-medium text-sm shadow-sm"
          >
            Reattempt
          </Link>
        </div>

        {/* Tabs - scrollable on small screens so Mathematics is not trimmed */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 bg-white rounded-t-lg px-2 pt-2 overflow-x-auto min-w-0">
          <div className="flex gap-1 flex-nowrap">
            <button
              onClick={() => setActiveTab('overall')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex-shrink-0 whitespace-nowrap ${
                activeTab === 'overall'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => setActiveTab('physics')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap ${
                activeTab === 'physics'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">⚛</span> Physics
            </button>
            <button
              onClick={() => setActiveTab('chemistry')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap ${
                activeTab === 'chemistry'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">🧪</span> Chemistry
            </button>
            <button
              onClick={() => setActiveTab('maths')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap ${
                activeTab === 'maths'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">🔢</span> Mathematics
            </button>
          </div>
        </div>

        {/* Overall Tab Content */}
        {activeTab === 'overall' && (
          <div className="space-y-6">
            {/* Marks Obtained Banner */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-6 relative overflow-hidden shadow-lg">
              <div className="relative">
                <div className="text-sm font-medium mb-2 opacity-90">MARKS OBTAINED</div>
                <div className="text-5xl font-bold mb-3">
                  {result.total_marks} / {maxMarks}
                  {isTrial && (
                    <span className="block text-lg font-normal mt-1 opacity-90">
                      (~{normalizedMarksForRank}/160 equivalent for rank)
                    </span>
                  )}
                </div>
                {/* Rank Estimate */}
                {rankLoading ? (
                  <div className="space-y-1">
                    <Shimmer height="h-5" width="w-32" />
                    <Shimmer height="h-4" width="w-24" />
                  </div>
                ) : rankEstimate ? (
                  <div className="space-y-1">
                    <div className="text-lg font-semibold">
                      Estimated Rank: {rankEstimate.estimatedRank?.toLocaleString()}
                    </div>
                    <div className="text-sm opacity-90">
                      Rank Range: {rankEstimate.rankRange}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">
                  {result.correct_answers + result.wrong_answers}
                </div>
                <div className="text-xs text-gray-600">Qs attempted out of {totalQuestions}</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">{accuracy}%</div>
                <div className="text-xs text-gray-600">Accuracy</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">
                  {timeTakenMinutes}m {timeTakenSeconds}s
                </div>
                <div className="text-xs text-gray-600">Time taken out of {isTrial ? '15' : '180'} min</div>
              </div>
            </div>

            {/* Attempt Analysis */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Attempt Analysis (Overall)</h2>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                <DonutChart data={donutData} total={totalQuestions} size={180} />
                <div className="flex-1 w-full space-y-3">
                  {donutData.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                      <div
                        className="w-5 h-5 rounded flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{item.label}</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">{item.value}Qs</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality of Time Spent - ALWAYS SHOW */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-2 text-gray-900">Quality of Time Spent (Overall)</h2>
              <p className="text-sm text-gray-600 mb-6">
                Total Time Spent: {Math.floor(totalTimeSpent / 60)}m {totalTimeSpent % 60}s
              </p>
              {totalTimeSpent > 0 ? (
                <>
                  <TimeBarChart
                    data={[
                      { label: 'Correct', value: Math.round(timeCorrect), color: '#10b981' },
                      { label: 'Incorrect', value: Math.round(timeWrong), color: '#ef4444' },
                      { label: 'Not Attempted', value: Math.round(timeUnattempted), color: '#9ca3af' },
                    ]}
                    maxValue={Math.max(Math.round(timeCorrect), Math.round(timeWrong), Math.round(timeUnattempted), 1)}
                    height={200}
                  />
                  <div className="mt-6 space-y-2.5 text-sm">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                      <div className="w-4 h-4 bg-green-500 rounded flex-shrink-0"></div>
                      <span className="text-gray-700">Time spent on correct qs: <span className="font-semibold">{Math.floor(Math.round(timeCorrect) / 60)}m {Math.round(timeCorrect) % 60}s</span></span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                      <div className="w-4 h-4 bg-red-500 rounded flex-shrink-0"></div>
                      <span className="text-gray-700">Time spent on incorrect qs: <span className="font-semibold">{Math.floor(Math.round(timeWrong) / 60)}m {Math.round(timeWrong) % 60}s</span></span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                      <div className="w-4 h-4 bg-gray-400 rounded flex-shrink-0"></div>
                      <span className="text-gray-700">Time spent on not attempted qs: <span className="font-semibold">{Math.floor(Math.round(timeUnattempted) / 60)}m {Math.round(timeUnattempted) % 60}s</span></span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Time data not available
                </div>
              )}
            </div>

            {/* Subject Wise Time Spent - ALWAYS SHOW */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-2 text-gray-900">Subject Wise Time Spent</h2>
              <p className="text-sm text-gray-600 mb-6">
                Total Time Spent: {Math.floor(totalSubjectTime / 60)}m {totalSubjectTime % 60}s
              </p>
              {totalSubjectTime > 0 ? (
                <>
                  <TimeBarChart
                    data={[
                      { label: 'Physics', value: Math.round(physicsTime), color: '#f97316' },
                      { label: 'Chemistry', value: Math.round(chemistryTime), color: '#10b981' },
                      { label: 'Mathematics', value: Math.round(mathsTime), color: '#3b82f6' },
                    ]}
                    maxValue={Math.max(Math.round(mathsTime), Math.round(physicsTime), Math.round(chemistryTime), 1)}
                    height={200}
                  />
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Time data not available
                </div>
              )}
              <div className="mt-6 space-y-2.5 text-sm">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="w-4 h-4 bg-orange-500 rounded flex-shrink-0"></div>
                  <span className="text-gray-700">Physics: <span className="font-semibold">{Math.floor(physicsTime / 60)}m {physicsTime % 60}s</span></span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="w-4 h-4 bg-green-500 rounded flex-shrink-0"></div>
                  <span className="text-gray-700">Chemistry: <span className="font-semibold">{Math.floor(chemistryTime / 60)}m {chemistryTime % 60}s</span></span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="w-4 h-4 bg-blue-500 rounded flex-shrink-0"></div>
                  <span className="text-gray-700">Mathematics: <span className="font-semibold">{Math.floor(mathsTime / 60)}m {mathsTime % 60}s</span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subject Tabs Content */}
        {activeTab !== 'overall' && (() => {
          // Get subject-specific data
          const subjectMap: Record<string, { name: string; range: [number, number]; color: string; icon: string }> = isTrial
            ? {
                maths: { name: 'Mathematics', range: [1, 5], color: '#3b82f6', icon: '🔢' },
                physics: { name: 'Physics', range: [6, 10], color: '#f97316', icon: '⚛' },
                chemistry: { name: 'Chemistry', range: [11, 15], color: '#10b981', icon: '🧪' },
              }
            : {
                maths: { name: 'Mathematics', range: [1, 80], color: '#3b82f6', icon: '🔢' },
                physics: { name: 'Physics', range: [81, 120], color: '#f97316', icon: '⚛' },
                chemistry: { name: 'Chemistry', range: [121, 160], color: '#10b981', icon: '🧪' },
              };

          const subject = subjectMap[activeTab];
          if (!subject) return null;

          // Get section-wise analysis from result
          const sectionAnalysis = result.section_wise_analysis?.[activeTab] || {
            correct: 0,
            wrong: 0,
            unattempted: 0,
            marks: 0,
          };

          const sectionMarks = result.section_wise_marks?.[activeTab] || 0;
          const maxQuestions = isTrial ? 5 : (activeTab === 'maths' ? 80 : 40);
          const subjectTime = activeTab === 'maths' ? mathsTime : activeTab === 'physics' ? physicsTime : chemistryTime;

          // Subject donut data
          const subjectDonutData = [
            { label: 'Correct', value: sectionAnalysis.correct, color: '#10b981' },
            { label: 'Incorrect', value: sectionAnalysis.wrong, color: '#ef4444' },
            { label: 'Not Answered', value: sectionAnalysis.unattempted, color: '#9ca3af' },
          ];

          return (
            <div className="space-y-6">
              {/* Subject Marks Banner */}
              <div className="bg-gradient-to-br rounded-xl p-6 relative overflow-hidden shadow-lg text-white" style={{ background: `linear-gradient(135deg, ${subject.color} 0%, ${subject.color}dd 100%)` }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20" style={{ backgroundColor: subject.color, transform: 'translate(20px, -20px)' }}></div>
                <div className="relative">
                  <div className="text-sm font-medium mb-2 opacity-90">{subject.name.toUpperCase()} MARKS</div>
                  <div className="text-5xl font-bold mb-3">
                    {sectionMarks} / {maxQuestions}
                  </div>
                  <div className="text-lg opacity-90">
                    {((sectionMarks / maxQuestions) * 100).toFixed(1)}% Accuracy
                  </div>
                </div>
              </div>

              {/* Subject Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
                    {sectionAnalysis.correct}
                  </div>
                  <div className="text-xs text-gray-600">Correct</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100">
                  <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">
                    {sectionAnalysis.wrong}
                  </div>
                  <div className="text-xs text-gray-600">Wrong</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-600 mb-1">
                    {sectionAnalysis.unattempted}
                  </div>
                  <div className="text-xs text-gray-600">Unattempted</div>
                </div>
              </div>

              {/* Subject Attempt Analysis */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Attempt Analysis ({subject.name})</h2>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                  <DonutChart data={subjectDonutData} total={maxQuestions} size={180} />
                  <div className="flex-1 w-full space-y-3">
                    {subjectDonutData.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                        <div
                          className="w-5 h-5 rounded flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{item.label}</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-700">{item.value}Qs</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subject Time Analysis - Quality of Time Spent */}
              {(() => {
                // Calculate subject-specific time breakdown
                let subjectTimeCorrect = 0;
                let subjectTimeWrong = 0;
                let subjectTimeUnattempted = 0;

                // Get questions for this subject
                const subjectQuestions = result.questions?.filter((q: any) => 
                  q.question_number >= subject.range[0] && q.question_number <= subject.range[1]
                ) || [];

                // Calculate time by status for this subject
                subjectQuestions.forEach((q: any) => {
                  const timeSpent = questionTimes[q.question_number] || 0;
                  const userAnswer = result.answers?.[q.question_number];
                  const isCorrect = userAnswer?.toUpperCase() === q.correct_option?.toUpperCase();
                  const isUnattempted = !userAnswer;

                  if (isCorrect) {
                    subjectTimeCorrect += timeSpent;
                  } else if (isUnattempted) {
                    subjectTimeUnattempted += timeSpent;
                  } else {
                    subjectTimeWrong += timeSpent;
                  }
                });

                // Fallback: if no times, distribute subject time proportionally
                const totalSubjectTimeCalculated = subjectTimeCorrect + subjectTimeWrong + subjectTimeUnattempted;
                if (totalSubjectTimeCalculated === 0 && subjectTime > 0) {
                  const totalAnswered = sectionAnalysis.correct + sectionAnalysis.wrong;
                  if (totalAnswered > 0) {
                    const timePerAnswered = (subjectTime * 0.9) / totalAnswered;
                    subjectTimeCorrect = Math.round(sectionAnalysis.correct * timePerAnswered);
                    subjectTimeWrong = Math.round(sectionAnalysis.wrong * timePerAnswered);
                  }
                  if (sectionAnalysis.unattempted > 0) {
                    subjectTimeUnattempted = Math.round((subjectTime * 0.1) / sectionAnalysis.unattempted) * sectionAnalysis.unattempted;
                  }
                }

                const totalSubjectTimeDisplay = totalSubjectTimeCalculated > 0 ? totalSubjectTimeCalculated : subjectTime;

                return (
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-2 text-gray-900">Quality of Time Spent ({subject.name})</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Total Time Spent: {Math.floor(totalSubjectTimeDisplay / 60)}m {totalSubjectTimeDisplay % 60}s
                    </p>
                    {totalSubjectTimeDisplay > 0 ? (
                      <>
                        <TimeBarChart
                          data={[
                            { label: 'Correct', value: Math.round(subjectTimeCorrect), color: '#10b981' },
                            { label: 'Incorrect', value: Math.round(subjectTimeWrong), color: '#ef4444' },
                            { label: 'Not Attempted', value: Math.round(subjectTimeUnattempted), color: '#9ca3af' },
                          ]}
                          maxValue={Math.max(Math.round(subjectTimeCorrect), Math.round(subjectTimeWrong), Math.round(subjectTimeUnattempted), 1)}
                          height={200}
                        />
                        <div className="mt-6 space-y-2.5 text-sm">
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                            <div className="w-4 h-4 bg-green-500 rounded flex-shrink-0"></div>
                            <span className="text-gray-700">Time spent on correct qs: <span className="font-semibold">{Math.floor(Math.round(subjectTimeCorrect) / 60)}m {Math.round(subjectTimeCorrect) % 60}s</span></span>
                          </div>
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                            <div className="w-4 h-4 bg-red-500 rounded flex-shrink-0"></div>
                            <span className="text-gray-700">Time spent on incorrect qs: <span className="font-semibold">{Math.floor(Math.round(subjectTimeWrong) / 60)}m {Math.round(subjectTimeWrong) % 60}s</span></span>
                          </div>
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                            <div className="w-4 h-4 bg-gray-400 rounded flex-shrink-0"></div>
                            <span className="text-gray-700">Time spent on not attempted qs: <span className="font-semibold">{Math.floor(Math.round(subjectTimeUnattempted) / 60)}m {Math.round(subjectTimeUnattempted) % 60}s</span></span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Time data not available
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })()}
      </main>

      {/* Sticky pricing section for trial (includes improvement banner when rank is available) */}
      {isTrial && <TrialResultPricingSection trialImprovement={trialImprovement ?? undefined} />}
    </div>
  );
}

export default function TestResultPage() {
  return (
    <Suspense fallback={
      <div className={`${inter.className} min-h-screen flex items-center justify-center bg-gray-50`}>
        <div className="text-xl">Loading result...</div>
      </div>
    }>
      <TestResultContent />
    </Suspense>
  );
}
