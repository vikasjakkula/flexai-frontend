import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { TestService } from '@/lib/services/test.service'

// Demo user ID - hardcoded for demo purposes
const DEMO_USER_ID = 'd1f8016b-4f4c-4706-adfd-d722bb1846aa'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const { resultId } = await params

    if (!resultId) {
      return NextResponse.json(
        { error: 'resultId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch result for demo user
    const { data: result, error: resultError } = await supabase
      .from('test_results')
      .select('*')
      .eq('id', resultId)
      .eq('user_id', DEMO_USER_ID)
      .single()

    if (resultError || !result) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      )
    }

    // Fetch test details
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('test_id, test_name, test_date, test_type, year')
      .eq('test_id', result.test_id)
      .single()

    // Attach test to result
    const resultWithTest = {
      ...result,
      test: test || null
    }

    return NextResponse.json({
      success: true,
      result: resultWithTest
    })
  } catch (error) {
    console.error('Demo result error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demo result' },
      { status: 500 }
    )
  }
}

