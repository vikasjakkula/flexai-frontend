import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { TestService } from '@/lib/services/test.service';
import { TestRepository } from '@/lib/repositories/test.repository';
import { handleApiError } from '@/lib/utils/errors';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const userId = await requireAuth();

    // Allow free users to see tests (they just can't start non-free ones)
    const { isPremiumActive } = await import('@/utils/premium');
    const isPremium = await isPremiumActive(userId);

    // Get state query parameter (TS or AP)
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') as 'TS' | 'AP' | null;

    // Get user's field for filtering
    const supabase = createClient();
    const { data: userRow } = await supabase
      .from('users')
      .select('field')
      .eq('id', userId)
      .single();
    const userField = userRow?.field as string | undefined;

    const testService = new TestService();
    const tests = await testService.getAllTests(state || undefined, userField);

    // Get user's attempts to show status (works for both free and premium users)
    const repository = new TestRepository();
    const attempts = await repository.getUserAttempts(userId);
    const results = await repository.getUserResults(userId, 100);

    // Create a map of test statuses
    const testStatusMap = new Map<number, {
      status: 'not_started' | 'in_progress' | 'completed';
      attemptId?: string;
      resultId?: string;
      score?: number;
    }>();

    attempts.forEach(attempt => {
      if (attempt.status === 'in_progress') {
        testStatusMap.set(attempt.test_id, {
          status: 'in_progress',
          attemptId: attempt.id
        });
      }
    });

    results.forEach(result => {
      const existing = testStatusMap.get(result.test_id);
      if (!existing || existing.status !== 'in_progress') {
        testStatusMap.set(result.test_id, {
          status: 'completed',
          resultId: result.id,
          score: result.total_marks
        });
      }
    });

    // Format response
    const testsWithStatus = tests.map(test => {
      const status = testStatusMap.get(test.test_id) || { status: 'not_started' as const };
      return {
        ...test,
        ...status
      };
    });

    // Group by year/type
    const grouped = testsWithStatus.reduce((acc, test) => {
      const key = test.year || test.test_type || 'other';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(test);
      return acc;
    }, {} as Record<string, typeof testsWithStatus>);

    return NextResponse.json({
      success: true,
      tests: testsWithStatus,
      grouped
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

