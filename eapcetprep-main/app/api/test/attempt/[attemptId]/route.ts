import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { TestService } from '@/lib/services/test.service';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { attemptId } = await params;

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId is required' },
        { status: 400 }
      );
    }

    const testService = new TestService();
    const result = await testService.getAttempt(attemptId, userId);

    return NextResponse.json({
      success: true,
      attempt: result.attempt,
      testData: result.testData
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

