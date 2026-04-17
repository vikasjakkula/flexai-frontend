import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { supabase } from '../lib/supabase';

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    avgScore: 0,
    bestScore: 0,
    totalTests: 0,
    avgAccuracy: 0,
    avgTimePerTest: 0,
    avgTimePerQuestion: 0
  });
  const [subjectComparisonData, setSubjectComparisonData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          *,
          tests (
            test_name
          )
        `)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        const history = data.map(r => {
          const totalQuestions = r.correct_answers + r.wrong_answers + r.unattempted;
          const accuracy = totalQuestions > 0 ? (r.correct_answers / totalQuestions) * 100 : 0;
          
          return {
            test: r.tests?.test_name || 'Unknown Test',
            score: r.total_marks,
            maths: r.section_wise_marks?.Mathematics || 0,
            physics: r.section_wise_marks?.Physics || 0,
            chemistry: r.section_wise_marks?.Chemistry || 0,
            accuracy: Number(accuracy.toFixed(1)),
            time: Math.round(r.time_taken / 60) // Assuming time_taken is in seconds
          };
        });
        
        setTestHistory(history);

        const totalScore = history.reduce((acc, r) => acc + r.score, 0);
        const bestScore = Math.max(...history.map(r => r.score));
        const totalAccuracy = history.reduce((acc, r) => acc + r.accuracy, 0);
        const totalTime = history.reduce((acc, r) => acc + r.time, 0);
        
        // Calculate average questions attempted per test
        const totalQuestionsAttempted = data.reduce((acc, r) => acc + r.correct_answers + r.wrong_answers, 0);

        setStats({
          avgScore: Math.round(totalScore / history.length),
          bestScore,
          totalTests: history.length,
          avgAccuracy: Number((totalAccuracy / history.length).toFixed(1)),
          avgTimePerTest: Math.round(totalTime / history.length),
          avgTimePerQuestion: totalQuestionsAttempted > 0 ? Math.round((totalTime * 60) / totalQuestionsAttempted) : 0
        });

        // Calculate subject averages
        const avgMaths = Math.round(history.reduce((acc, r) => acc + r.maths, 0) / history.length);
        const avgPhysics = Math.round(history.reduce((acc, r) => acc + r.physics, 0) / history.length);
        const avgChemistry = Math.round(history.reduce((acc, r) => acc + r.chemistry, 0) / history.length);

        // Mocking time per subject as it might not be in section_wise_marks directly
        const avgMathsTime = Math.round((stats.avgTimePerTest || 90) * 0.5);
        const avgPhysicsTime = Math.round((stats.avgTimePerTest || 90) * 0.25);
        const avgChemistryTime = Math.round((stats.avgTimePerTest || 90) * 0.25);

        setSubjectComparisonData([
          { subject: 'Maths', score: avgMaths, time: avgMathsTime },
          { subject: 'Physics', score: avgPhysics, time: avgPhysicsTime },
          { subject: 'Chemistry', score: avgChemistry, time: avgChemistryTime },
        ]);

        setRadarData([
          { subject: 'Maths', A: avgMaths, fullMark: 80 },
          { subject: 'Physics', A: avgPhysics, fullMark: 40 },
          { subject: 'Chemistry', A: avgChemistry, fullMark: 40 },
        ]);
      }
      
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  }

  if (testHistory.length === 0) {
    return <div className="p-8 text-center text-gray-500">No test data available yet. Take a test to see your analytics!</div>;
  }
  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Performance Analytics</h2>
        <p className="text-sm text-gray-500 mb-4">Comprehensive analysis of your test performance</p>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Average Score</p>
            <p className="text-lg font-bold text-gray-900">{stats.avgScore} <span className="text-sm text-gray-400 font-normal">/ 160</span></p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Best Score</p>
            <p className="text-lg font-bold text-gray-900">{stats.bestScore} <span className="text-sm text-gray-400 font-normal">/ 160</span></p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Total Tests</p>
            <p className="text-lg font-bold text-gray-900">{stats.totalTests}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Avg Accuracy</p>
            <p className="text-lg font-bold text-gray-900">{stats.avgAccuracy}%</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Avg Time/Test</p>
            <p className="text-lg font-bold text-gray-900">{stats.avgTimePerTest} min</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Avg Time/Question</p>
            <p className="text-lg font-bold text-gray-900">{stats.avgTimePerQuestion} sec</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Score Progression</h3>
        <div className="h-48 w-full">
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

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Subject Score Comparison</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectComparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="subject" tick={{fontSize: 10}} />
              <YAxis tick={{fontSize: 10}} width={30} />
              <Tooltip contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Subject Time Comparison (min)</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectComparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="subject" tick={{fontSize: 10}} />
              <YAxis tick={{fontSize: 10}} width={30} />
              <Tooltip contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="time" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Accuracy Trend (%)</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={testHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="test" hide />
              <YAxis tick={{fontSize: 10}} width={30} />
              <Tooltip contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Line type="monotone" dataKey="accuracy" stroke="#f59e0b" strokeWidth={2} dot={{r: 3}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Subject Performance Radar</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#f3f4f6" />
              <PolarAngleAxis dataKey="subject" tick={{fontSize: 10}} />
              <PolarRadiusAxis angle={30} domain={[0, 80]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
              <Tooltip contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Test History</h3>
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-transparent">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-gray-500 bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="py-2 px-3 font-medium">Test</th>
                <th className="py-2 px-3 font-medium">Score</th>
                <th className="py-2 px-3 font-medium">Maths</th>
                <th className="py-2 px-3 font-medium">Phy</th>
                <th className="py-2 px-3 font-medium">Chem</th>
                <th className="py-2 px-3 font-medium">Acc.</th>
                <th className="py-2 px-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {testHistory.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-2 px-3 max-w-[120px] truncate" title={row.test}>{row.test}</td>
                  <td className="py-2 px-3 font-semibold text-gray-900">{row.score}</td>
                  <td className="py-2 px-3">{row.maths}</td>
                  <td className="py-2 px-3">{row.physics}</td>
                  <td className="py-2 px-3">{row.chemistry}</td>
                  <td className="py-2 px-3">{row.accuracy}%</td>
                  <td className="py-2 px-3">{row.time}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
