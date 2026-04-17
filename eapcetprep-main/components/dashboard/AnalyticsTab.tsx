"use client"

import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    avgScore: 0,
    bestScore: 0,
    totalTests: 0,
    avgAccuracy: 0,
    avgTimePerTest: 0,
    avgTimePerQuestion: 0,
  });
  const [subjectComparisonData, setSubjectComparisonData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/test/results?limit=1000');
        const data = await res.json();

        if (!data.success || !data.results || data.results.length === 0) {
          setLoading(false);
          return;
        }

        // Filter out trial tests and sort oldest-first for charts
        const results = [...data.results]
          .filter((r: any) => !r.is_trial)
          .sort((a: any, b: any) =>
            new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
          );

        if (results.length === 0) {
          setLoading(false);
          return;
        }

        const history = results.map((r: any) => {
          const totalQ = r.correct_answers + r.wrong_answers + r.unattempted;
          const accuracy = totalQ > 0 ? (r.correct_answers / totalQ) * 100 : 0;
          return {
            test: `Test ${r.test_id}`,
            score: r.total_marks,
            maths: r.section_wise_marks?.maths ?? 0,
            physics: r.section_wise_marks?.physics ?? 0,
            chemistry: r.section_wise_marks?.chemistry ?? 0,
            accuracy: Number(accuracy.toFixed(1)),
            time: Math.round((r.time_taken || 0) / 60),
          };
        });

        setTestHistory(history);

        const totalScore = history.reduce((acc: number, r: any) => acc + r.score, 0);
        const bestScore = Math.max(...history.map((r: any) => r.score));
        const totalAccuracy = history.reduce((acc: number, r: any) => acc + r.accuracy, 0);
        const totalTime = history.reduce((acc: number, r: any) => acc + r.time, 0);
        const totalQuestionsAttempted = results.reduce(
          (acc: number, r: any) => acc + r.correct_answers + r.wrong_answers,
          0
        );

        setStats({
          avgScore: Math.round(totalScore / history.length),
          bestScore,
          totalTests: history.length,
          avgAccuracy: Number((totalAccuracy / history.length).toFixed(1)),
          avgTimePerTest: Math.round(totalTime / history.length),
          avgTimePerQuestion:
            totalQuestionsAttempted > 0
              ? Math.round((totalTime * 60) / totalQuestionsAttempted)
              : 0,
        });

        const avgMaths = Math.round(history.reduce((acc: number, r: any) => acc + r.maths, 0) / history.length);
        const avgPhysics = Math.round(history.reduce((acc: number, r: any) => acc + r.physics, 0) / history.length);
        const avgChemistry = Math.round(history.reduce((acc: number, r: any) => acc + r.chemistry, 0) / history.length);
        const avgTime = Math.round(totalTime / history.length);

        setSubjectComparisonData([
          { subject: 'Maths', score: avgMaths, time: Math.round(avgTime * 0.5) },
          { subject: 'Physics', score: avgPhysics, time: Math.round(avgTime * 0.25) },
          { subject: 'Chemistry', score: avgChemistry, time: Math.round(avgTime * 0.25) },
        ]);

        setRadarData([
          { subject: 'Maths', A: avgMaths, fullMark: 80 },
          { subject: 'Physics', A: avgPhysics, fullMark: 40 },
          { subject: 'Chemistry', A: avgChemistry, fullMark: 40 },
        ]);
      } catch (e) {
        console.error('Analytics fetch error:', e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 pb-24 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (testHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center pb-24">
        <p className="text-gray-500 text-lg font-medium mb-2">No test data yet</p>
        <p className="text-gray-400 text-sm">Take a mock test to see your analytics here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Stats grid */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Performance Analytics</h2>
        <p className="text-sm text-gray-500 mb-4">Comprehensive analysis of your test performance</p>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Average Score', value: `${stats.avgScore}`, sub: '/ 160' },
            { label: 'Best Score', value: `${stats.bestScore}`, sub: '/ 160' },
            { label: 'Total Tests', value: `${stats.totalTests}`, sub: '' },
            { label: 'Avg Accuracy', value: `${stats.avgAccuracy}%`, sub: '' },
            { label: 'Avg Time/Test', value: `${stats.avgTimePerTest}`, sub: 'min' },
            { label: 'Avg Time/Q', value: `${stats.avgTimePerQuestion}`, sub: 'sec' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">{item.label}</p>
              <p className="text-lg font-bold text-gray-900">
                {item.value} <span className="text-sm text-gray-400 font-normal">{item.sub}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Score progression */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Score Progression</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={testHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="test" hide />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="score" stroke="#4f46e5" fill="#e0e7ff" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject score comparison */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Subject Score Comparison</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectComparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time comparison */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Subject Time Comparison (min)</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectComparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="time" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accuracy trend */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Accuracy Trend (%)</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={testHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="test" hide />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="accuracy" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Subject Performance Radar</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#f3f4f6" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 80]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Test history table */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Test History</h3>
        <div className="overflow-x-auto -mx-4 px-4" style={{ scrollbarWidth: 'thin' }}>
          <table className="w-full text-left text-xs whitespace-nowrap text-gray-900">
            <thead className="text-gray-700 bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="py-2 px-3 font-semibold">Test</th>
                <th className="py-2 px-3 font-semibold">Score</th>
                <th className="py-2 px-3 font-semibold">Maths</th>
                <th className="py-2 px-3 font-semibold">Phy</th>
                <th className="py-2 px-3 font-semibold">Chem</th>
                <th className="py-2 px-3 font-semibold">Acc.</th>
                <th className="py-2 px-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {testHistory.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-2 px-3 max-w-[120px] truncate font-medium" title={row.test}>{row.test}</td>
                  <td className="py-2 px-3 font-bold">{row.score}</td>
                  <td className="py-2 px-3 font-medium">{row.maths}</td>
                  <td className="py-2 px-3 font-medium">{row.physics}</td>
                  <td className="py-2 px-3 font-medium">{row.chemistry}</td>
                  <td className="py-2 px-3 font-medium">{row.accuracy}%</td>
                  <td className="py-2 px-3 font-medium">{row.time}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
