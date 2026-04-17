import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { TestService } from '@/lib/services/test.service';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(request: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const testService = new TestService();
    const results = await testService.getUserResults(userId, limit);

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

