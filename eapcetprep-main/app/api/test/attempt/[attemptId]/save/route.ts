import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { TestService } from '@/lib/services/test.service';
import { handleApiError } from '@/lib/utils/errors';
import { ValidationError } from '@/lib/utils/errors';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { attemptId } = await params;
    const body = await request.json();

    if (!attemptId) {
      throw new ValidationError('attemptId is required');
    }

    const testService = new TestService();
    const updatedAttempt = await testService.saveProgress(attemptId, userId, body);

    return NextResponse.json({
      success: true,
      attempt: updatedAttempt
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

