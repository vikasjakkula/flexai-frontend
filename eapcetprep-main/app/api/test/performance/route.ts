import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { handleApiError } from '@/lib/utils/errors';

export async function GET() {
  try {
    const userId = await requireAuth();
    const supabase = await createClient();

    // Fetch all test results
    const { data: results, error: resultsError } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: true });

    if (resultsError) {
      throw resultsError;
    }

    if (!results || results.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        summary: null,
      });
    }

    // Fetch test details for all unique test_ids
    const testIds = [...new Set(results.map((r: any) => r.test_id))];
    const { data: tests, error: testsError } = await supabase
      .from('tests')
      .select('test_id, test_name, test_date, test_type, year')
      .in('test_id', testIds);

    // Create a map of test details
    const testMap = new Map();
    if (tests) {
      tests.forEach((test: any) => {
        testMap.set(test.test_id, test);
      });
    }

    // Merge test details with results
    const resultsWithTests = results.map((result: any) => ({
      ...result,
      tests: testMap.get(result.test_id) || null,
    }));

    // Calculate summary statistics
    const totalTests = resultsWithTests.length;
    const totalQuestions = 160;
    
    // Overall metrics
    const totalScores = resultsWithTests.map((r: any) => r.total_marks);
    const totalCorrect = resultsWithTests.map((r: any) => r.correct_answers);
    const totalWrong = resultsWithTests.map((r: any) => r.wrong_answers);
    const totalUnattempted = resultsWithTests.map((r: any) => r.unattempted);
    const totalTimes = resultsWithTests.map((r: any) => r.time_taken);
    
    const avgScore = totalScores.reduce((a: number, b: number) => a + b, 0) / totalTests;
    const bestScore = Math.max(...totalScores);
    const worstScore = Math.min(...totalScores);
    const avgAccuracy = resultsWithTests.reduce((sum: number, r: any) => {
      const accuracy = ((r.correct_answers / totalQuestions) * 100);
      return sum + accuracy;
    }, 0) / totalTests;
    
    const totalTimeSpent = totalTimes.reduce((a: number, b: number) => a + b, 0);
    const avgTimePerTest = totalTimeSpent / totalTests;
    const avgTimePerQuestion = totalTimeSpent / (totalTests * totalQuestions);
    
    // Subject-wise averages
    const mathsScores = resultsWithTests.map((r: any) => r.section_wise_marks?.maths || 0);
    const physicsScores = resultsWithTests.map((r: any) => r.section_wise_marks?.physics || 0);
    const chemistryScores = resultsWithTests.map((r: any) => r.section_wise_marks?.chemistry || 0);
    
    const avgMaths = mathsScores.reduce((a: number, b: number) => a + b, 0) / totalTests;
    const avgPhysics = physicsScores.reduce((a: number, b: number) => a + b, 0) / totalTests;
    const avgChemistry = chemistryScores.reduce((a: number, b: number) => a + b, 0) / totalTests;
    
    // Subject-wise time averages
    const mathsTimes = resultsWithTests.map((r: any) => r.section_wise_analysis?.maths?.time_seconds || 0);
    const physicsTimes = resultsWithTests.map((r: any) => r.section_wise_analysis?.physics?.time_seconds || 0);
    const chemistryTimes = resultsWithTests.map((r: any) => r.section_wise_analysis?.chemistry?.time_seconds || 0);
    
    const avgMathsTime = mathsTimes.reduce((a: number, b: number) => a + b, 0) / totalTests;
    const avgPhysicsTime = physicsTimes.reduce((a: number, b: number) => a + b, 0) / totalTests;
    const avgChemistryTime = chemistryTimes.reduce((a: number, b: number) => a + b, 0) / totalTests;
    
    // Time by status averages
    const timeCorrect = resultsWithTests.map((r: any) => {
      const analysis = r.section_wise_analysis;
      return (analysis?.maths?.time_correct || 0) + 
             (analysis?.physics?.time_correct || 0) + 
             (analysis?.chemistry?.time_correct || 0);
    });
    const timeWrong = resultsWithTests.map((r: any) => {
      const analysis = r.section_wise_analysis;
      return (analysis?.maths?.time_wrong || 0) + 
             (analysis?.physics?.time_wrong || 0) + 
             (analysis?.chemistry?.time_wrong || 0);
    });
    const timeUnattempted = resultsWithTests.map((r: any) => {
      const analysis = r.section_wise_analysis;
      return (analysis?.maths?.time_unattempted || 0) + 
             (analysis?.physics?.time_unattempted || 0) + 
             (analysis?.chemistry?.time_unattempted || 0);
    });
    
    const avgTimeCorrect = timeCorrect.reduce((a: number, b: number) => a + b, 0) / totalTests;
    const avgTimeWrong = timeWrong.reduce((a: number, b: number) => a + b, 0) / totalTests;
    const avgTimeUnattempted = timeUnattempted.reduce((a: number, b: number) => a + b, 0) / totalTests;
    
    // Improvement rate (score change over time)
    let improvementRate = 0;
    if (totalTests > 1) {
      const firstHalf = totalScores.slice(0, Math.ceil(totalTests / 2));
      const secondHalf = totalScores.slice(Math.ceil(totalTests / 2));
      const firstAvg = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length;
      improvementRate = secondAvg - firstAvg;
    }
    
    // Best and worst subjects
    const subjectAverages = {
      maths: avgMaths,
      physics: avgPhysics,
      chemistry: avgChemistry,
    };
    const sortedSubjects = Object.entries(subjectAverages).sort((a, b) => b[1] - a[1]);
    const strongestSubject = sortedSubjects[0][0];
    const weakestSubject = sortedSubjects[sortedSubjects.length - 1][0];
    
    // Latest test data
    const latestTest = resultsWithTests[resultsWithTests.length - 1];
    
    return NextResponse.json({
      success: true,
      results: resultsWithTests.map((r: any) => ({
        ...r,
        accuracy: ((r.correct_answers / totalQuestions) * 100).toFixed(1),
        testName: r.tests?.test_name || `Test ${r.test_id}`,
        testDate: r.tests?.test_date || r.submitted_at,
      })),
      summary: {
        totalTests,
        avgScore: Math.round(avgScore),
        bestScore,
        worstScore,
        avgAccuracy: avgAccuracy.toFixed(1),
        totalTimeSpent,
        avgTimePerTest: Math.round(avgTimePerTest),
        avgTimePerQuestion: Math.round(avgTimePerQuestion),
        avgCorrect: Math.round(totalCorrect.reduce((a, b) => a + b, 0) / totalTests),
        avgWrong: Math.round(totalWrong.reduce((a, b) => a + b, 0) / totalTests),
        avgUnattempted: Math.round(totalUnattempted.reduce((a, b) => a + b, 0) / totalTests),
        subjectAverages: {
          maths: Math.round(avgMaths),
          physics: Math.round(avgPhysics),
          chemistry: Math.round(avgChemistry),
        },
        subjectTimeAverages: {
          maths: Math.round(avgMathsTime),
          physics: Math.round(avgPhysicsTime),
          chemistry: Math.round(avgChemistryTime),
        },
        timeByStatus: {
          correct: Math.round(avgTimeCorrect),
          wrong: Math.round(avgTimeWrong),
          unattempted: Math.round(avgTimeUnattempted),
        },
        improvementRate: improvementRate.toFixed(1),
        strongestSubject,
        weakestSubject,
        latestTest: latestTest ? {
          score: latestTest.total_marks,
          accuracy: ((latestTest.correct_answers / totalQuestions) * 100).toFixed(1),
          date: latestTest.submitted_at,
        } : null,
      },
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

