// DEPRECATED: This route is kept for backward compatibility
// New implementation uses attempt-based flow: POST /api/test/attempt/:attemptId/submit
// This route will be removed in a future version

import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { handleApiError } from '@/lib/utils/errors';
import { ValidationError } from '@/lib/utils/errors';

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { testId, attemptId } = body;

    // If attemptId is provided, use the new flow
    if (attemptId) {
      // Redirect to new endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/test/attempt/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || ''
        }
      });
      return response;
    }

    // Legacy flow - return error asking to use new API
    throw new ValidationError(
      'This endpoint is deprecated. Please use the attempt-based flow: POST /api/test/start to create an attempt, then POST /api/test/attempt/:attemptId/submit to submit.'
    );
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}