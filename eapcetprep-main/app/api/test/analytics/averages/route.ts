import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(request: Request) {
  try {
    const userId = await requireAuth();

    const analyticsService = new AnalyticsService();
    const averages = await analyticsService.getUserAverages(userId);

    if (!averages) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No test data available yet',
      });
    }

    return NextResponse.json({
      success: true,
      data: averages,
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}














