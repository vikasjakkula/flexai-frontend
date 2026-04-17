import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { TestService } from '@/lib/services/test.service';
import { handleApiError } from '@/lib/utils/errors';
import { validateTestId } from '@/lib/utils/validation';
import { ValidationError } from '@/lib/utils/errors';

/** POST /api/test/trial/start — Start a 15-min trial (5 random Q per subject). No premium required. */
export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { testId } = body;

    if (testId == null) {
      throw new ValidationError('testId is required');
    }

    const id = typeof testId === 'string' ? parseInt(testId, 10) : testId;
    validateTestId(id);

    const testService = new TestService();
    const { attempt, testData } = await testService.startTrialTest(userId, id);

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      attempt,
      testData,
      isTrial: true
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
