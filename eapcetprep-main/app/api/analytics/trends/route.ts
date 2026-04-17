import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(request: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const analyticsService = new AnalyticsService();
    // Get all test analytics and limit to recent ones
    const allAnalytics = await analyticsService.getUserTestAnalytics(userId);
    const trends = allAnalytics
      .slice(-limit)
      .map((test: any) => ({
        test_id: test.test_id,
        test_name: test.tests?.test_name || `Test ${test.test_id}`,
        score: test.total_score,
        submitted_at: test.submitted_at,
      }));

    return NextResponse.json({
      success: true,
      trends
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

