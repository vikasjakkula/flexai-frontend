"use client"

import React, { useState, useEffect } from 'react';
import { FileText, PlayCircle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MockTab({
  isPremium,
  onShowPaywall,
}: {
  isPremium: boolean;
  onShowPaywall?: () => void;
}) {
  const router = useRouter();
  const [activeRegion, setActiveRegion] = useState<'TS' | 'AP'>('TS');
  const [activeYear, setActiveYear] = useState<string>('');
  const [tests, setTests] = useState<any[]>([]);
  const [groupedTests, setGroupedTests] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/test/list?state=${activeRegion}`);
        const data = await res.json();
        if (data.success) {
          setTests(data.tests || []);
          setGroupedTests(data.grouped || {});
          // Auto-select latest year
          const years = Object.keys(data.grouped || {})
            .filter(y => !isNaN(parseInt(y)))
            .sort((a, b) => parseInt(b) - parseInt(a));
          if (years.length > 0) setActiveYear(years[0]);
        }
      } catch {}
      setLoading(false);
    };
    fetchTests();
  }, [activeRegion]);

  const years = Object.keys(groupedTests)
    .filter(y => !isNaN(parseInt(y)))
    .sort((a, b) => parseInt(b) - parseInt(a));

  const filteredTests = activeYear ? (groupedTests[activeYear] || []) : [];

  const handleStartTest = async (testId: string, status?: string, resultId?: string) => {
    if (status === 'completed' && resultId) {
      router.push(`/dashboard/result?resultId=${resultId}`);
      return;
    }
    if (status === 'in_progress') {
      // Find attempt
      const test = tests.find((t: any) => t.test_id === parseInt(testId));
      if (test?.attemptId) {
        router.push(`/test/take?testId=${testId}&attemptId=${test.attemptId}`);
        return;
      }
    }

    if (!isPremium) {
      if (onShowPaywall) onShowPaywall();
      else router.push('/onboarding/paywall');
      return;
    }
    router.push(`/test/instructions?testId=${testId}`);
  };

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Mock Tests</h2>

      <div className="flex flex-col gap-3 mb-6">
        {/* Region tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth: 'none'}}>
          {(['TS', 'AP'] as const).map(region => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                activeRegion === region
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {region} EAPCET
            </button>
          ))}
        </div>

        {/* Year tabs */}
        {years.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth: 'none'}}>
            {years.map(year => (
              <button
                key={year}
                onClick={() => setActiveYear(year)}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeYear === year
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl border-dashed">
            <p className="text-gray-500 font-medium">Loading tests...</p>
          </div>
        ) : filteredTests.length > 0 ? filteredTests.map((test: any) => {
          const isCompleted = test.status === 'completed';
          const isInProgress = test.status === 'in_progress';
          const isLocked = !isPremium;

          return (
            <div
              key={test.test_id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-indigo-300 transition-colors group flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base mb-1">{test.test_name}</h4>
                    <div className="flex items-center gap-2">
                      {isCompleted && test.score !== undefined && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                          Score: {test.score}/160
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                          In Progress
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Premium
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Questions</p>
                    <p className="text-sm font-semibold text-gray-900">160</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Duration</p>
                    <p className="text-sm font-semibold text-gray-900">180m</p>
                  </div>
                </div>
                <button
                  onClick={() => handleStartTest(test.test_id.toString(), test.status, test.resultId)}
                  className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-colors ${
                    isCompleted
                      ? 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                      : isLocked
                      ? 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                      : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                  }`}
                >
                  {isCompleted ? (
                    'View Results'
                  ) : isInProgress ? (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Continue
                    </>
                  ) : isLocked ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Start Test
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl border-dashed">
            <p className="text-gray-500 font-medium">
              {activeYear ? `No mock tests available for ${activeYear}` : 'No tests available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
