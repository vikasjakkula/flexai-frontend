import { NextResponse } from 'next/server'
import { requireAuth } from '@/utils/auth'
import { isPremiumActive } from '@/utils/premium'

export async function GET() {
  try {
    const userId = await requireAuth()
    const isPremium = await isPremiumActive(userId)

    return NextResponse.json({
      isPremium,
      message: isPremium ? 'User has active premium' : 'User does not have active premium'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        isPremium: false,
        error: error instanceof Error ? error.message : 'Failed to check premium status' 
      },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}


















