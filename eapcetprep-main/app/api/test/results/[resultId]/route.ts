import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { TestService } from '@/lib/services/test.service';
import { handleApiError } from '@/lib/utils/errors';

/** Demo result ID — view solution works for anyone (including unauthenticated). */
const DEMO_RESULT_ID = '7719b2bc-33a4-4c12-a65d-cfdd5313629f';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const { resultId } = await params;

    if (!resultId) {
      return NextResponse.json(
        { error: 'resultId is required' },
        { status: 400 }
      );
    }

    const testService = new TestService();

    // Allow unauthenticated access only for the demo result (landing-b "View solution")
    if (resultId === DEMO_RESULT_ID) {
      const result = await testService.getResultByIdForDemo(resultId);
      return NextResponse.json({
        success: true,
        result
      });
    }

    const userId = await requireAuth();
    const result = await testService.getResultById(resultId, userId);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

