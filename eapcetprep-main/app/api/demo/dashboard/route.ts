import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { TestService } from '@/lib/services/test.service'
import { TestRepository } from '@/lib/repositories/test.repository'

// Demo user ID - hardcoded for demo purposes (Demo test user with seeded results 40,60,80,110,90,120)
const DEMO_USER_ID = '83797683-ba94-4da4-a5f6-98c7cfcd15dd'

export async function GET() {
  try {
    const supabase = await createClient()
    const testService = new TestService()
    const repository = new TestRepository()

    // Fetch demo user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, phone, is_premium, premium_until, created_at, onboarding_completed')
      .eq('id', DEMO_USER_ID)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Demo user not found' },
        { status: 404 }
      )
    }

    // Get test count
    const { count: testCount } = await supabase
      .from('test_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', DEMO_USER_ID)

    const userData = {
      ...user,
      tests_taken: testCount || 0
    }

    // Fetch all tests (demo user should have premium access)
    const tests = await testService.getAllTests()

    // Get demo user's attempts and results
    const attempts = await repository.getUserAttempts(DEMO_USER_ID)
    const results = await repository.getUserResults(DEMO_USER_ID, 1000)

    // Create test status map
    const testStatusMap = new Map<number, {
      status: 'not_started' | 'in_progress' | 'completed'
      attemptId?: string
      resultId?: string
      score?: number
    }>()

    attempts.forEach(attempt => {
      if (attempt.status === 'in_progress') {
        testStatusMap.set(attempt.test_id, {
          status: 'in_progress',
          attemptId: attempt.id
        })
      }
    })

    results.forEach(result => {
      testStatusMap.set(result.test_id, {
        status: 'completed',
        resultId: result.id,
        score: result.total_marks
      })
    })

    // Group tests by year
    const grouped: Record<string, any[]> = {}
    tests.forEach((test: any) => {
      const year = test.year || 'Unknown'
      if (!grouped[year]) {
        grouped[year] = []
      }
      const status = testStatusMap.get(test.test_id) || { status: 'not_started' }
      grouped[year].push({
        ...test,
        status: status.status,
        attemptId: status.attemptId,
        resultId: status.resultId,
        score: status.score
      })
    })

    // Sort grouped tests
    Object.keys(grouped).forEach(year => {
      grouped[year].sort((a, b) => {
        const dateA = a.test_date ? new Date(a.test_date).getTime() : 0
        const dateB = b.test_date ? new Date(b.test_date).getTime() : 0
        return dateB - dateA
      })
    })

    // Calculate analytics
    let analytics = null
    if (results.length > 0) {
      const totalTests = results.length
      const totalScores = results.reduce((sum: number, r: any) => sum + (r.total_marks || 0), 0)
      const avgScore = totalScores / totalTests
      const totalCorrect = results.reduce((sum: number, r: any) => sum + (r.correct_answers || 0), 0)
      const totalQuestions = totalTests * 160
      const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

      const sortedResults = [...results].sort((a: any, b: any) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      )
      const resultsWithRank = sortedResults.filter((r: any) => r.estimated_rank && r.estimated_rank.estimatedRank)

      let avgEstimatedRank = null
      if (resultsWithRank.length > 0) {
        const decayRate = 0.5
        let totalWeightedRank = 0
        let totalWeight = 0

        resultsWithRank.forEach((result: any, index: number) => {
          const weight = Math.exp(-decayRate * index)
          const rank = result.estimated_rank.estimatedRank
          totalWeightedRank += rank * weight
          totalWeight += weight
        })

        avgEstimatedRank = Math.round(totalWeightedRank / totalWeight)
      }

      analytics = {
        total_tests_taken: totalTests,
        average_score: avgScore,
        total_correct: totalCorrect,
        accuracy: accuracy,
        average_estimated_rank: avgEstimatedRank
      }
    }

    // Fetch section-wise performance
    const { data: allResults } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .order('submitted_at', { ascending: true })

    let sectionPerformance = null
    if (allResults && allResults.length > 0) {
      const mathsScores: number[] = []
      const physicsScores: number[] = []
      const chemistryScores: number[] = []

      allResults.forEach((result: any) => {
        const sm = result.section_wise_marks
        if (sm?.maths != null) mathsScores.push(sm.maths)
        if (sm?.physics != null) physicsScores.push(sm.physics)
        if (sm?.chemistry != null) chemistryScores.push(sm.chemistry)
      })

      sectionPerformance = {
        maths: {
          average: mathsScores.length > 0 ? mathsScores.reduce((a, b) => a + b, 0) / mathsScores.length : 0,
          total: mathsScores.length
        },
        physics: {
          average: physicsScores.length > 0 ? physicsScores.reduce((a, b) => a + b, 0) / physicsScores.length : 0,
          total: physicsScores.length
        },
        chemistry: {
          average: chemistryScores.length > 0 ? chemistryScores.reduce((a, b) => a + b, 0) / chemistryScores.length : 0,
          total: chemistryScores.length
        }
      }
    }

    return NextResponse.json({
      success: true,
      userData,
      tests,
      grouped,
      results: results || [],
      analytics,
      sectionPerformance,
      isPremium: true // Demo user always has premium access for demo purposes
    })
  } catch (error) {
    console.error('Demo dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demo data' },
      { status: 500 }
    )
  }
}

