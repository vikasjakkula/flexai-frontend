import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { TestService } from '@/lib/services/test.service';
import { handleApiError } from '@/lib/utils/errors';

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { attemptId } = body;

    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
    }

    const testService = new TestService();
    const analyticsService = new AnalyticsService();

    // Get the result for this attempt
    const { data: resultData } = await analyticsService['supabase']
      .from('test_results')
      .select('*')
      .eq('attempt_id', attemptId)
      .single();

    if (!resultData) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Recalculate analytics
    await analyticsService.calculateAndStoreTestAnalytics(attemptId, resultData as any);

    return NextResponse.json({
      success: true,
      message: 'Analytics recalculated successfully',
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}














