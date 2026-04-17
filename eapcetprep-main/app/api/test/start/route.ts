import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { canAttemptTest, getPremiumStatus } from '@/utils/premium';
import { isFreeTest } from '@/utils/free-tests';
import { TestService } from '@/lib/services/test.service';
import { handleApiError } from '@/lib/utils/errors';
import { validateTestId } from '@/lib/utils/validation';
import { ValidationError } from '@/lib/utils/errors';

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();

    const body = await request.json();
    const { testId } = body;

    if (!testId) {
      throw new ValidationError('testId is required');
    }

    validateTestId(testId);

    // Allow free tests without premium check
    if (!isFreeTest(testId)) {
      // Get premium status to check tier
      const premiumStatus = await getPremiumStatus(userId);

      if (!premiumStatus.isPremium) {
        return NextResponse.json(
          { error: 'Premium subscription required' },
          { status: 403 }
        );
      }

      // Check if BASIC user has attempts remaining
      if (premiumStatus.tier === 'BASIC') {
        const { canAttempt, reason } = await canAttemptTest(userId, testId);
        if (!canAttempt) {
          return NextResponse.json(
            { error: reason || 'Upgrade to PRO for unlimited attempts', requiresUpgrade: true },
            { status: 403 }
          );
        }
      }
    }

    const testService = new TestService();
    const result = await testService.startTest(userId, testId);

    return NextResponse.json({
      success: true,
      attemptId: result.attempt.id,
      attempt: result.attempt,
      testData: result.testData
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
