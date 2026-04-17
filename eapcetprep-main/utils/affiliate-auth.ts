import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Cookie settings for affiliate sessions
const AFFILIATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7 // 7 days
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createAffiliateSession(affiliateUserId: string): Promise<string> {
  const token = await new SignJWT({ affiliateUserId, type: 'affiliate' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(JWT_SECRET))
  
  return token
}

export async function verifyAffiliateSession(token: string): Promise<string | null> {
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
    const payload = verified.payload as { affiliateUserId?: string; type?: string }
    
    // Verify it's an affiliate session
    if (payload.type !== 'affiliate' || !payload.affiliateUserId) {
      return null
    }
    
    return payload.affiliateUserId
  } catch (error) {
    return null
  }
}

export async function setAffiliateSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('affiliate_session', token, AFFILIATE_COOKIE_OPTIONS)
}

export async function getAffiliateSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('affiliate_session')?.value
}

export async function clearAffiliateSession() {
  const cookieStore = await cookies()
  cookieStore.delete('affiliate_session')
}

export async function requireAffiliateAuth() {
  const token = await getAffiliateSessionToken()
  if (!token) {
    throw new Error('Unauthorized')
  }
  
  const affiliateUserId = await verifyAffiliateSession(token)
  if (!affiliateUserId) {
    throw new Error('Invalid session')
  }
  
  return affiliateUserId
}
















