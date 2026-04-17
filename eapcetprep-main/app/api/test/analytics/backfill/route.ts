import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { handleApiError } from '@/lib/utils/errors';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const userId = await requireAuth();
    const supabase = createClient();
    const analyticsService = new AnalyticsService();

    // Get all submitted test results for this user
    const { data: results, error: resultsError } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: true });

    if (resultsError) throw resultsError;
    if (!results || results.length === 0) {
      return NextResponse.json({ success: true, backfilled: 0 });
    }

    // Get attempt IDs that already have analytics
    const { data: existingAnalytics, error: existingError } = await supabase
      .from('test_result_analytics')
      .select('attempt_id')
      .eq('user_id', userId);

    if (existingError) throw existingError;

    const existingAttemptIds = new Set((existingAnalytics || []).map((a: any) => a.attempt_id));

    // Find results missing from analytics
    const missing = results.filter((r: any) => r.attempt_id && !existingAttemptIds.has(r.attempt_id));

    let backfilled = 0;
    for (const result of missing) {
      try {
        await analyticsService.calculateAndStoreTestAnalytics(result.attempt_id, result as any);
        backfilled++;
      } catch (err) {
        console.error(`Failed to backfill analytics for attempt ${result.attempt_id}:`, err);
      }
    }

    return NextResponse.json({ success: true, backfilled, total: results.length });
  } catch (error) {
    const { status, message } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
