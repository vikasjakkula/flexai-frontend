import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { quiz_id, quiz_name, subject, chapter, answers, score, total, percentage } = body;

    const supabase = createClient();
    const { error } = await supabase.from('quiz_attempts').insert({
      user_id: userId,
      quiz_id,
      quiz_name,
      subject,
      chapter,
      answers,
      score,
      total,
      percentage,
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}
