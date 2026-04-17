import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(request: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get('attemptId');

    const analyticsService = new AnalyticsService();

    // If attemptId provided, get single test analytics
    if (attemptId) {
      const analytics = await analyticsService.getTestAnalytics(attemptId);
      if (!analytics) {
        return NextResponse.json({ error: 'Analytics not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: analytics,
      });
    }

    // Otherwise get all test analytics for user
    const analytics = await analyticsService.getUserTestAnalytics(userId);
    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}














