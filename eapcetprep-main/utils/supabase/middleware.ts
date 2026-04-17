import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export const createClient = (request?: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request?.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // This will be used when implementing sign in/out
          // We'll handle this when needed
        },
        remove(name: string, options: CookieOptions) {
          // This will be used when implementing sign in/out
          // We'll handle this when needed
        },
      },
    }
  )
} 