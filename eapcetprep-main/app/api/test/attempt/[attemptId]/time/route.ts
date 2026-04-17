import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { attemptId } = await params;

    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get question_times from test_attempts
    const { data: attempt, error } = await supabase
      .from('test_attempts')
      .select('question_times, user_id')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Convert JSONB to Record<number, number> (keys are strings in JSONB)
    const times: Record<number, number> = {};
    if (attempt.question_times && typeof attempt.question_times === 'object') {
      Object.entries(attempt.question_times).forEach(([qNumStr, time]) => {
        times[parseInt(qNumStr)] = time as number;
      });
    }

    return NextResponse.json({
      success: true,
      times,
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { attemptId } = await params;
    
    // Handle both JSON and FormData (for sendBeacon)
    let times: Record<number, number>;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      times = body.times;
    } else {
      // FormData from sendBeacon
      const formData = await request.formData();
      const timesStr = formData.get('times') as string;
      times = JSON.parse(timesStr);
    }

    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
    }

    if (!times || typeof times !== 'object') {
      return NextResponse.json({ error: 'times object is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify attempt belongs to user and get current question_times
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .select('id, user_id, question_times')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Merge new times with existing question_times JSONB
    const existingTimes = (attempt.question_times as Record<string, number>) || {};
    const updatedTimes: Record<string, number> = { ...existingTimes };
    
    // Update with new times (convert keys to strings for JSONB)
    Object.entries(times).forEach(([qNumStr, time]) => {
      updatedTimes[qNumStr] = time as number;
    });

    // Update test_attempts with merged question_times
    const { error: updateError } = await supabase
      .from('test_attempts')
      .update({ question_times: updatedTimes })
      .eq('id', attemptId)
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Times saved successfully',
    });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

