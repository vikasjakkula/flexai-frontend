import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(request.url);
    const quizIds = searchParams.get('quiz_ids')?.split(',').filter(Boolean) || [];

    const supabase = createClient();
    let query = supabase
      .from('quiz_attempts')
      .select('quiz_id, quiz_name, subject, chapter, percentage, score, total, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (quizIds.length > 0) {
      query = query.in('quiz_id', quizIds);
    }

    const { data, error } = await query.limit(100);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, attempts: data || [] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}
