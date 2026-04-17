"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Shimmer } from '@/components/Shimmer';
import { NewDashboardShell } from '@/components/layouts/NewDashboardShell';

function TestResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams.get('resultId');
  const isDemo = searchParams?.get('demo') === 'true';
  
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
        // Fetch result - use demo API if in demo mode
        const apiEndpoint = isDemo 
          ? `/api/demo/results/${resultId}`
          : `/api/test/results/${resultId}`;
        const resultResponse = await fetch(apiEndpoint);
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
          // Fetch rank estimate from API (will also store it)
          setRankLoading(true);
          try {
            const rankResponse = await fetch('/api/analytics/rank-estimate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                score: resultData.result.total_marks,
                resultId: resultId 
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

  if (loading) {
    return (
      <NewDashboardShell>
        <div className="py-6 px-4">
          <div className="space-y-6">
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
        </div>
      </NewDashboardShell>
    );
  }

  if (error || !result) {
    return (
      <NewDashboardShell>
        <div className="py-6 px-4">
          <div className="text-center">
            <p className="text-red-600 text-xl mb-4">{error || 'Result not found'}</p>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
              Go back to Dashboard
            </Link>
          </div>
        </div>
      </NewDashboardShell>
    );
  }

  const testName = result.test?.test_name || `Test ${result.test_id}`;
  const totalQuestions = result.correct_answers + result.wrong_answers + result.unattempted;
  const accuracy = totalQuestions > 0 ? ((result.correct_answers / totalQuestions) * 100).toFixed(1) : '0';
  const timeTakenMinutes = Math.floor(result.time_taken / 60);
  const timeTakenSeconds = result.time_taken % 60;

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
    <NewDashboardShell>
      <div className="py-6 w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 w-full">
          {/* Test Info */}
          <div className="mb-4 px-2 sm:px-0">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Report Card</h1>
              {isDemo && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                  Demo Mode
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{testName}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-500">Attempt 1</span>
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {isDemo && (
            <div className="mb-4 px-2 sm:px-0 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-800 mb-2 font-medium">Experience the full power of eapcetpro results!</p>
              <button 
                onClick={() => router.push('/onboarding/paywall')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition w-full"
              >
                Get Full Access
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6 px-2 sm:px-0">
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

          {/* Tabs - Scrollable on mobile */}
          <div className="mb-6 border-b border-gray-200 bg-white rounded-t-lg overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 px-2 pt-2 min-w-max sm:min-w-0">
              <button
                onClick={() => setActiveTab('overall')}
                className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'overall'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Overall
              </button>
              <button
                onClick={() => setActiveTab('physics')}
                className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'physics'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">⚛</span> Physics
              </button>
              <button
                onClick={() => setActiveTab('chemistry')}
                className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'chemistry'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">🧪</span> Chemistry
              </button>
              <button
                onClick={() => setActiveTab('maths')}
                className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
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
            <div className="space-y-6 px-2 sm:px-0 overflow-x-hidden">
              {/* Marks Obtained Banner */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-4 sm:p-6 relative overflow-hidden shadow-lg w-full">
                <div className="relative">
                  <div className="text-xs sm:text-sm font-medium mb-2 opacity-90">MARKS OBTAINED</div>
                  <div className="text-3xl sm:text-5xl font-bold mb-3">
                    {result.total_marks} / 160
                  </div>
                  {/* Rank Estimate */}
                  {rankLoading ? (
                    <div className="space-y-1">
                      <Shimmer height="h-5" width="w-32" />
                      <Shimmer height="h-4" width="w-24" />
                    </div>
                  ) : rankEstimate ? (
                    <div className="space-y-1">
                      <div className="text-base sm:text-lg font-semibold">
                        Estimated Rank: {rankEstimate.estimatedRank?.toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm opacity-90">
                        Rank Range: {rankEstimate.rankRange}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full">
                <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm border border-gray-100 min-w-0">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 mb-1 break-words">
                    {result.correct_answers + result.wrong_answers}
                  </div>
                  <div className="text-xs text-gray-600 break-words">Qs attempted out of {totalQuestions}</div>
                </div>
                <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm border border-gray-100 min-w-0">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">{accuracy}%</div>
                  <div className="text-xs text-gray-600">Accuracy</div>
                </div>
                <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm border border-gray-100 min-w-0">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600 mb-1 break-words">
                    {timeTakenMinutes}m {timeTakenSeconds}s
                  </div>
                  <div className="text-xs text-gray-600 break-words">Time taken out of 180 min</div>
                </div>
              </div>

              {/* Attempt Analysis */}
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 w-full overflow-x-hidden">
                <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">Attempt Analysis (Overall)</h2>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-8 w-full">
                  <DonutChart data={donutData} total={totalQuestions} size={180} />
                  <div className="flex-1 w-full space-y-3 min-w-0">
                    {donutData.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition w-full">
                        <div
                          className="w-5 h-5 rounded flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{item.label}</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-700 flex-shrink-0">{item.value}Qs</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quality of Time Spent - ALWAYS SHOW */}
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 w-full overflow-x-auto">
                <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900">Quality of Time Spent (Overall)</h2>
                <p className="text-sm text-gray-600 mb-4 sm:mb-6">
                  Total Time Spent: {Math.floor(totalTimeSpent / 60)}m {totalTimeSpent % 60}s
                </p>
                {totalTimeSpent > 0 ? (
                  <>
                    <div className="w-full min-w-[280px]">
                      <TimeBarChart
                        data={[
                          { label: 'Correct', value: Math.round(timeCorrect), color: '#10b981' },
                          { label: 'Incorrect', value: Math.round(timeWrong), color: '#ef4444' },
                          { label: 'Not Attempted', value: Math.round(timeUnattempted), color: '#9ca3af' },
                        ]}
                        maxValue={Math.max(Math.round(timeCorrect), Math.round(timeWrong), Math.round(timeUnattempted), 1)}
                        height={200}
                      />
                    </div>
                    <div className="mt-4 sm:mt-6 space-y-2.5 text-sm">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                        <div className="w-4 h-4 bg-green-500 rounded flex-shrink-0"></div>
                        <span className="text-gray-700 break-words">Time spent on correct qs: <span className="font-semibold">{Math.floor(Math.round(timeCorrect) / 60)}m {Math.round(timeCorrect) % 60}s</span></span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                        <div className="w-4 h-4 bg-red-500 rounded flex-shrink-0"></div>
                        <span className="text-gray-700 break-words">Time spent on incorrect qs: <span className="font-semibold">{Math.floor(Math.round(timeWrong) / 60)}m {Math.round(timeWrong) % 60}s</span></span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                        <div className="w-4 h-4 bg-gray-400 rounded flex-shrink-0"></div>
                        <span className="text-gray-700 break-words">Time spent on not attempted qs: <span className="font-semibold">{Math.floor(Math.round(timeUnattempted) / 60)}m {Math.round(timeUnattempted) % 60}s</span></span>
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
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 w-full overflow-x-auto">
                <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900">Subject Wise Time Spent</h2>
                <p className="text-sm text-gray-600 mb-4 sm:mb-6">
                  Total Time Spent: {Math.floor(totalSubjectTime / 60)}m {totalSubjectTime % 60}s
                </p>
                {totalSubjectTime > 0 ? (
                  <>
                    <div className="w-full min-w-[280px]">
                      <TimeBarChart
                        data={[
                          { label: 'Physics', value: Math.round(physicsTime), color: '#f97316' },
                          { label: 'Chemistry', value: Math.round(chemistryTime), color: '#10b981' },
                          { label: 'Mathematics', value: Math.round(mathsTime), color: '#3b82f6' },
                        ]}
                        maxValue={Math.max(Math.round(mathsTime), Math.round(physicsTime), Math.round(chemistryTime), 1)}
                        height={200}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Time data not available
                  </div>
                )}
                <div className="mt-4 sm:mt-6 space-y-2.5 text-sm">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                    <div className="w-4 h-4 bg-orange-500 rounded flex-shrink-0"></div>
                    <span className="text-gray-700 break-words">Physics: <span className="font-semibold">{Math.floor(physicsTime / 60)}m {physicsTime % 60}s</span></span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                    <div className="w-4 h-4 bg-green-500 rounded flex-shrink-0"></div>
                    <span className="text-gray-700 break-words">Chemistry: <span className="font-semibold">{Math.floor(chemistryTime / 60)}m {chemistryTime % 60}s</span></span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                    <div className="w-4 h-4 bg-blue-500 rounded flex-shrink-0"></div>
                    <span className="text-gray-700 break-words">Mathematics: <span className="font-semibold">{Math.floor(mathsTime / 60)}m {mathsTime % 60}s</span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subject Tabs Content */}
          {activeTab !== 'overall' && (() => {
            // Get subject-specific data
            const subjectMap: Record<string, { name: string; range: [number, number]; color: string; icon: string }> = {
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
            const maxQuestions = activeTab === 'maths' ? 80 : 40;
            const subjectTime = activeTab === 'maths' ? mathsTime : activeTab === 'physics' ? physicsTime : chemistryTime;

            // Subject donut data
            const subjectDonutData = [
              { label: 'Correct', value: sectionAnalysis.correct, color: '#10b981' },
              { label: 'Incorrect', value: sectionAnalysis.wrong, color: '#ef4444' },
              { label: 'Not Answered', value: sectionAnalysis.unattempted, color: '#9ca3af' },
            ];

            return (
              <div className="space-y-6 px-2 sm:px-0 overflow-x-hidden">
                {/* Subject Marks Banner */}
                <div className="bg-gradient-to-br rounded-xl p-4 sm:p-6 relative overflow-hidden shadow-lg text-white w-full" style={{ background: `linear-gradient(135deg, ${subject.color} 0%, ${subject.color}dd 100%)` }}>
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20" style={{ backgroundColor: subject.color, transform: 'translate(20px, -20px)' }}></div>
                  <div className="relative">
                    <div className="text-xs sm:text-sm font-medium mb-2 opacity-90">{subject.name.toUpperCase()} MARKS</div>
                    <div className="text-3xl sm:text-5xl font-bold mb-3">
                      {sectionMarks} / {maxQuestions}
                    </div>
                    <div className="text-base sm:text-lg opacity-90">
                      {((sectionMarks / maxQuestions) * 100).toFixed(1)}% Accuracy
                    </div>
                  </div>
                </div>

                {/* Subject Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full">
                  <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm border border-gray-100 min-w-0">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                      {sectionAnalysis.correct}
                    </div>
                    <div className="text-xs text-gray-600">Correct</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm border border-gray-100 min-w-0">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 mb-1">
                      {sectionAnalysis.wrong}
                    </div>
                    <div className="text-xs text-gray-600">Wrong</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm border border-gray-100 min-w-0">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-600 mb-1">
                      {sectionAnalysis.unattempted}
                    </div>
                    <div className="text-xs text-gray-600">Unattempted</div>
                  </div>
                </div>

                {/* Subject Attempt Analysis */}
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 w-full overflow-x-hidden">
                  <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">Attempt Analysis ({subject.name})</h2>
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-8 w-full">
                    <DonutChart data={subjectDonutData} total={maxQuestions} size={180} />
                    <div className="flex-1 w-full space-y-3 min-w-0">
                      {subjectDonutData.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition w-full">
                          <div
                            className="w-5 h-5 rounded flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{item.label}</div>
                          </div>
                          <div className="text-sm font-semibold text-gray-700 flex-shrink-0">{item.value}Qs</div>
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
                    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 w-full overflow-x-auto">
                      <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900">Quality of Time Spent ({subject.name})</h2>
                      <p className="text-sm text-gray-600 mb-4 sm:mb-6">
                        Total Time Spent: {Math.floor(totalSubjectTimeDisplay / 60)}m {totalSubjectTimeDisplay % 60}s
                      </p>
                      {totalSubjectTimeDisplay > 0 ? (
                        <>
                          <div className="w-full min-w-[280px]">
                            <TimeBarChart
                              data={[
                                { label: 'Correct', value: Math.round(subjectTimeCorrect), color: '#10b981' },
                                { label: 'Incorrect', value: Math.round(subjectTimeWrong), color: '#ef4444' },
                                { label: 'Not Attempted', value: Math.round(subjectTimeUnattempted), color: '#9ca3af' },
                              ]}
                              maxValue={Math.max(Math.round(subjectTimeCorrect), Math.round(subjectTimeWrong), Math.round(subjectTimeUnattempted), 1)}
                              height={200}
                            />
                          </div>
                          <div className="mt-4 sm:mt-6 space-y-2.5 text-sm">
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                              <div className="w-4 h-4 bg-green-500 rounded flex-shrink-0"></div>
                              <span className="text-gray-700 break-words">Time spent on correct qs: <span className="font-semibold">{Math.floor(Math.round(subjectTimeCorrect) / 60)}m {Math.round(subjectTimeCorrect) % 60}s</span></span>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                              <div className="w-4 h-4 bg-red-500 rounded flex-shrink-0"></div>
                              <span className="text-gray-700 break-words">Time spent on incorrect qs: <span className="font-semibold">{Math.floor(Math.round(subjectTimeWrong) / 60)}m {Math.round(subjectTimeWrong) % 60}s</span></span>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                              <div className="w-4 h-4 bg-gray-400 rounded flex-shrink-0"></div>
                              <span className="text-gray-700 break-words">Time spent on not attempted qs: <span className="font-semibold">{Math.floor(Math.round(subjectTimeUnattempted) / 60)}m {Math.round(subjectTimeUnattempted) % 60}s</span></span>
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

          {isDemo && (
            <div className="mt-6 px-2 sm:px-0 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to unlock your full potential?</h3>
              <p className="text-sm text-gray-700 mb-4">Get access to all tests, detailed analytics, and performance tracking!</p>
              <button 
                onClick={() => router.push('/onboarding/paywall')}
                className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium text-base hover:bg-blue-700 transition"
              >
                Continue to Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </NewDashboardShell>
  );
}

export default function TestResultPage() {
  return (
    <Suspense fallback={
      <NewDashboardShell>
        <div className="py-6 px-4">
          <div className="text-center">
            <div className="text-xl">Loading result...</div>
          </div>
        </div>
      </NewDashboardShell>
    }>
      <TestResultContent />
    </Suspense>
  );
}





