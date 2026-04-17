import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { TestService } from '@/lib/services/test.service';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { handleApiError } from '@/lib/utils/errors';
import { ValidationError } from '@/lib/utils/errors';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { attemptId } = await params;

    if (!attemptId) {
      throw new ValidationError('attemptId is required');
    }

    const testService = new TestService();
    const result = await testService.submitTest(attemptId, userId);

    // Wait a moment to ensure all time data is saved
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calculate and store analytics
    try {
      const analyticsService = new AnalyticsService();
      await analyticsService.calculateAndStoreTestAnalytics(attemptId, result);
    } catch (error) {
      console.error('Failed to calculate analytics:', error);
      // Don't fail the submission if analytics calculation fails
    }

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        total_marks: result.total_marks,
        correct_answers: result.correct_answers,
        wrong_answers: result.wrong_answers,
        unattempted: result.unattempted,
        section_wise_marks: result.section_wise_marks,
        submitted_at: result.submitted_at
      }
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

