import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { handleApiError } from '@/lib/utils/errors';

export async function GET() {
  try {
    const userId = await requireAuth();

    const analyticsService = new AnalyticsService();
    const performance = await analyticsService.getSectionWisePerformance(userId);

    return NextResponse.json({
      success: true,
      performance
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

