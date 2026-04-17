"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AreaChart } from '@/components/charts/AreaChart'
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'
import { RadarChart } from '@/components/charts/RadarChart'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import Paywall from '@/components/Paywall'
import { Shimmer } from '@/components/Shimmer'

export default function PerformancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [chartWidth, setChartWidth] = useState(800)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Check authentication first
        const authResponse = await fetch('/api/auth/check-session')
        const authData = await authResponse.json()
        
        if (!authData.authenticated) {
          router.push('/auth/login')
          return
        }
        
        // Check premium status
        const premiumResponse = await fetch('/api/auth/premium-check')
        const premiumData = await premiumResponse.json()
        setIsPremium(premiumData.isPremium || false)
        
        // Allow free users to see their performance data
        // Fetch all performance data in one request
        const performanceResponse = await fetch('/api/test/performance')
        const performanceData = await performanceResponse.json()

        if (performanceData.success) {
          setPerformanceData(performanceData)
        }
      } catch (error) {
        console.error('Error fetching performance data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate responsive chart width
  useEffect(() => {
    const calculateWidth = () => {
      if (typeof window !== 'undefined') {
        // Account for container padding (p-4 md:p-6 = 16px/24px), page padding, and margins
        const containerPadding = window.innerWidth >= 768 ? 48 : 32 // md:p-6 = 24px each side, p-4 = 16px each side
        const pagePadding = 32 // py-6 and other margins
        const calculatedWidth = Math.max(300, window.innerWidth - containerPadding - pagePadding)
        setChartWidth(calculatedWidth)
      }
    }

    calculateWidth()
    window.addEventListener('resize', calculateWidth)
    return () => window.removeEventListener('resize', calculateWidth)
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="mb-6">
            <Shimmer height="h-8" width="w-64" className="mb-2" />
            <Shimmer height="h-4" width="w-96" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                <Shimmer height="h-4" width="w-24" className="mb-1" />
                <Shimmer height="h-8" width="w-20" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <Shimmer height="h-6" width="w-48" className="mb-4" />
            <Shimmer height="h-64" width="w-full" rounded />
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <Shimmer height="h-6" width="w-40" className="mb-4" />
                <Shimmer height="h-48" width="w-full" rounded />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!performanceData || !performanceData.results || performanceData.results.length === 0) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No performance data available yet. Take some tests to see your progression!</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const { results, summary } = performanceData
  const totalQuestions = 160

  // Prepare chart data
  const scoreProgressionData = results.map((r: any, index: number) => ({
    x: index + 1,
    y: r.total_marks,
    label: `Test ${index + 1}`,
    tooltip: {
      testName: r.testName,
      date: new Date(r.submitted_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      score: r.total_marks,
    },
  }))

  const accuracyProgressionData = results.map((r: any, index: number) => ({
    x: index + 1,
    y: parseFloat(r.accuracy),
    label: `Test ${index + 1}`,
    tooltip: {
      label: r.testName,
    },
  }))

  const timeProgressionData = results.map((r: any, index: number) => ({
    x: index + 1,
    y: Math.round(r.time_taken / 60), // Convert to minutes
    label: `Test ${index + 1}`,
    tooltip: {
      label: r.testName,
    },
  }))

  const subjectComparisonData = [
    { label: 'Maths', value: summary.subjectAverages.maths, color: '#3b82f6' },
    { label: 'Physics', value: summary.subjectAverages.physics, color: '#10b981' },
    { label: 'Chemistry', value: summary.subjectAverages.chemistry, color: '#f59e0b' },
  ]

  const subjectTimeData = [
    { label: 'Maths', value: Math.round(summary.subjectTimeAverages.maths / 60), color: '#3b82f6' },
    { label: 'Physics', value: Math.round(summary.subjectTimeAverages.physics / 60), color: '#10b981' },
    { label: 'Chemistry', value: Math.round(summary.subjectTimeAverages.chemistry / 60), color: '#f59e0b' },
  ]

  const timeByStatusData = [
    { 
      label: 'Correct', 
      value: Math.round(summary.timeByStatus.correct / 60), 
      color: '#10b981' 
    },
    { 
      label: 'Wrong', 
      value: Math.round(summary.timeByStatus.wrong / 60), 
      color: '#ef4444' 
    },
    { 
      label: 'Unattempted', 
      value: Math.round(summary.timeByStatus.unattempted / 60), 
      color: '#9ca3af' 
    },
  ]

  // Subject-wise score trends
  const mathsScoreTrend = results.map((r: any, index: number) => ({
    x: index + 1,
    y: r.section_wise_marks?.maths || 0,
    label: `Test ${index + 1}`,
  }))

  const physicsScoreTrend = results.map((r: any, index: number) => ({
    x: index + 1,
    y: r.section_wise_marks?.physics || 0,
    label: `Test ${index + 1}`,
  }))

  const chemistryScoreTrend = results.map((r: any, index: number) => ({
    x: index + 1,
    y: r.section_wise_marks?.chemistry || 0,
    label: `Test ${index + 1}`,
  }))

  // Subject-wise time trends
  const mathsTimeTrend = results.map((r: any, index: number) => ({
    x: index + 1,
    y: Math.round((r.section_wise_analysis?.maths?.time_seconds || 0) / 60),
    label: `Test ${index + 1}`,
  }))

  const physicsTimeTrend = results.map((r: any, index: number) => ({
    x: index + 1,
    y: Math.round((r.section_wise_analysis?.physics?.time_seconds || 0) / 60),
    label: `Test ${index + 1}`,
  }))

  const chemistryTimeTrend = results.map((r: any, index: number) => ({
    x: index + 1,
    y: Math.round((r.section_wise_analysis?.chemistry?.time_seconds || 0) / 60),
    label: `Test ${index + 1}`,
  }))

  // Radar chart data
  const radarData = [
    { label: 'Maths', value: summary.subjectAverages.maths, maxValue: 80 },
    { label: 'Physics', value: summary.subjectAverages.physics, maxValue: 40 },
    { label: 'Chemistry', value: summary.subjectAverages.chemistry, maxValue: 40 },
  ]

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Performance Analytics</h1>
          <p className="text-sm md:text-base text-gray-600">Comprehensive analysis of your test performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Average Score</div>
            <div className="text-lg md:text-2xl font-bold text-blue-600">{summary.avgScore} / 160</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Best Score</div>
            <div className="text-lg md:text-2xl font-bold text-green-600">{summary.bestScore} / 160</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Total Tests</div>
            <div className="text-lg md:text-2xl font-bold text-gray-900">{summary.totalTests}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Avg Accuracy</div>
            <div className="text-lg md:text-2xl font-bold text-purple-600">{summary.avgAccuracy}%</div>
          </div>
        </div>

        {/* Score Progression */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Score Progression</h2>
          <div className="w-full overflow-hidden">
            <AreaChart 
              data={scoreProgressionData} 
              width={chartWidth}
              height={400}
              color="#3b82f6"
              showTooltip={true}
              showXAxisLabels={false}
            />
          </div>
        </div>

        {/* Subject Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Subject Score Comparison</h2>
            <div className="w-full overflow-x-auto">
              <BarChart data={subjectComparisonData} width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 80 : 600)} height={350} valueUnit="marks" showXAxisLabels={false} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Subject Time Comparison</h2>
            <div className="w-full overflow-x-auto">
              <BarChart data={subjectTimeData} width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 80 : 600)} height={350} valueUnit="mins" showXAxisLabels={false} />
            </div>
          </div>
        </div>

        {/* Accuracy & Time Trends */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Accuracy Trend</h2>
            <div className="w-full overflow-x-auto">
              <LineChart 
                data={accuracyProgressionData} 
                width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 80 : 600)} 
                height={350}
                color="#10b981"
                maxY={100}
                valueUnit="%"
                showXAxisLabels={false}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Time Per Test Trend</h2>
            <div className="w-full overflow-x-auto">
              <LineChart 
                data={timeProgressionData} 
                width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 80 : 600)} 
                height={350}
                color="#f59e0b"
                valueUnit="mins"
                showXAxisLabels={false}
              />
            </div>
          </div>
        </div>

        {/* Subject Score Trends */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Subject Score Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Maths</h3>
              <div className="w-full overflow-x-auto">
                <LineChart 
                  data={mathsScoreTrend} 
                  width={Math.min(400, typeof window !== 'undefined' ? window.innerWidth - 80 : 400)} 
                  height={280}
                  color="#3b82f6"
                  valueUnit="marks"
                  showXAxisLabels={true}
                />
              </div>
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Physics</h3>
              <div className="w-full overflow-x-auto">
                <LineChart 
                  data={physicsScoreTrend} 
                  width={Math.min(400, typeof window !== 'undefined' ? window.innerWidth - 80 : 400)} 
                  height={280}
                  color="#10b981"
                  valueUnit="marks"
                  showXAxisLabels={true}
                />
              </div>
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Chemistry</h3>
              <div className="w-full overflow-x-auto">
                <LineChart 
                  data={chemistryScoreTrend} 
                  width={Math.min(400, typeof window !== 'undefined' ? window.innerWidth - 80 : 400)} 
                  height={280}
                  color="#f59e0b"
                  valueUnit="marks"
                  showXAxisLabels={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subject Time Trends */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Subject Time Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Maths Time (min)</h3>
              <div className="w-full overflow-x-auto">
                <LineChart 
                  data={mathsTimeTrend} 
                  width={Math.min(400, typeof window !== 'undefined' ? window.innerWidth - 80 : 400)} 
                  height={280}
                  color="#3b82f6"
                  valueUnit="mins"
                  showXAxisLabels={true}
                />
              </div>
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Physics Time (min)</h3>
              <div className="w-full overflow-x-auto">
                <LineChart 
                  data={physicsTimeTrend} 
                  width={Math.min(400, typeof window !== 'undefined' ? window.innerWidth - 80 : 400)} 
                  height={280}
                  color="#10b981"
                  valueUnit="mins"
                  showXAxisLabels={true}
                />
              </div>
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Chemistry Time (min)</h3>
              <div className="w-full overflow-x-auto">
                <LineChart 
                  data={chemistryTimeTrend} 
                  width={Math.min(400, typeof window !== 'undefined' ? window.innerWidth - 80 : 400)} 
                  height={280}
                  color="#f59e0b"
                  valueUnit="mins"
                  showXAxisLabels={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Subject Performance Radar</h2>
          <div className="flex justify-center overflow-x-auto">
            <RadarChart data={radarData} width={Math.min(400, typeof window !== 'undefined' ? window.innerWidth - 80 : 400)} height={Math.min(400, typeof window !== 'undefined' ? window.innerWidth - 80 : 400)} />
          </div>
        </div>

        {/* Time by Status */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Avg Time by Answer Status</h2>
          <div className="w-full overflow-x-auto">
            <BarChart data={timeByStatusData} width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 80 : 600)} height={350} valueUnit="mins" showXAxisLabels={false} />
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Avg Time/Test</div>
            <div className="text-lg md:text-xl font-bold">{Math.round(summary.avgTimePerTest / 60)} min</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Avg Time/Question</div>
            <div className="text-lg md:text-xl font-bold">{summary.avgTimePerQuestion} sec</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Improvement Rate</div>
            <div className={`text-lg md:text-xl font-bold ${parseFloat(summary.improvementRate) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(summary.improvementRate) > 0 ? '+' : ''}{summary.improvementRate}
            </div>
          </div>
        </div>

        {/* Test History Table */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Test History</h2>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold">Test</th>
                  <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold">Score</th>
                  <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold hidden sm:table-cell">Maths</th>
                  <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold hidden sm:table-cell">Physics</th>
                  <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold hidden sm:table-cell">Chemistry</th>
                  <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold">Accuracy</th>
                  <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold">Time</th>
                  <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((test: any, index: number) => (
                  <tr key={test.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">{test.testName}</td>
                    <td className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold">
                      {test.total_marks} / 160
                    </td>
                    <td className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm hidden sm:table-cell">
                      {test.section_wise_marks?.maths || 0}
                    </td>
                    <td className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm hidden sm:table-cell">
                      {test.section_wise_marks?.physics || 0}
                    </td>
                    <td className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm hidden sm:table-cell">
                      {test.section_wise_marks?.chemistry || 0}
                    </td>
                    <td className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">
                      {test.accuracy}%
                    </td>
                    <td className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">
                      {Math.round(test.time_taken / 60)}m
                    </td>
                    <td className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 hidden md:table-cell">
                      {new Date(test.submitted_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
