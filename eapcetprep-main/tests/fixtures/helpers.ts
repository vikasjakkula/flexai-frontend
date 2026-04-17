import { type APIRequestContext, type Page } from '@playwright/test';

/**
 * Test user credentials – created automatically via ensureTestUser()
 * which calls POST /api/auth/register (no OTP required).
 */
export const TEST_USER = {
  phone: '1234567890',
  password: 'test@123',
  name: 'Test User',
};

export const TEST_USER_2 = {
  phone: '9999900002',
  password: 'TestPass456',
  name: 'Test User 2',
};

export const TEST_AFFILIATE = {
  phone: '9999900003',
  password: 'AffPass123',
  name: 'Test Affiliate',
};

export const FREE_TEST_IDS = [52, 53];

/**
 * Ensure the test user exists by attempting registration.
 * If the user already exists the API returns 400 — that's fine, we ignore it.
 */
export async function ensureTestUser(
  request: APIRequestContext,
  phone = TEST_USER.phone,
  password = TEST_USER.password,
): Promise<void> {
  await request.post('/api/auth/register', {
    data: { phone, password },
  });
}

/**
 * Extract session token from the `set-cookie` header string.
 */
function extractSession(setCookie: string): string {
  const match = setCookie.match(/session=([^;,\s]+)/);
  return match?.[1] ?? '';
}

/**
 * Login via API and return the session cookie value.
 * Automatically ensures the test user exists first.
 */
export async function loginViaAPI(
  request: APIRequestContext,
  phone = TEST_USER.phone,
  password = TEST_USER.password,
): Promise<string> {
  await ensureTestUser(request, phone, password);

  const res = await request.post('/api/auth/login', {
    data: { phone, password },
  });
  const cookies = res.headers()['set-cookie'] || '';
  return extractSession(cookies);
}

/**
 * Register a brand-new user and return the session cookie from the register response.
 */
export async function registerViaAPI(
  request: APIRequestContext,
  phone: string,
  password: string,
): Promise<string> {
  const res = await request.post('/api/auth/register', {
    data: { phone, password },
  });
  const cookies = res.headers()['set-cookie'] || '';
  return extractSession(cookies);
}

/**
 * Login via API and set the session cookie on the browser context so subsequent
 * page navigations are authenticated.
 */
export async function loginAndSetCookie(
  page: Page,
  request: APIRequestContext,
  phone = TEST_USER.phone,
  password = TEST_USER.password,
): Promise<void> {
  const token = await loginViaAPI(request, phone, password);
  if (token) {
    await page.context().addCookies([
      {
        name: 'session',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
      },
    ]);
  }
}

/**
 * Login as affiliate via API and return session cookie.
 */
export async function loginAffiliateViaAPI(
  request: APIRequestContext,
  phone = TEST_AFFILIATE.phone,
  password = TEST_AFFILIATE.password,
): Promise<string> {
  const res = await request.post('/api/affiliate/auth/login', {
    data: { phone, password },
  });
  const cookies = res.headers()['set-cookie'] || '';
  const sessionMatch = cookies.match(/affiliate_session=([^;]+)/);
  return sessionMatch?.[1] ?? '';
}

/**
 * Create authenticated API request headers.
 */
export function authHeaders(sessionToken: string) {
  return {
    Cookie: `session=${sessionToken}`,
  };
}

export function affiliateAuthHeaders(sessionToken: string) {
  return {
    Cookie: `affiliate_session=${sessionToken}`,
  };
}

/**
 * Generate a random 10-digit phone number for test isolation.
 */
export function randomPhone(): string {
  return '99' + Math.floor(10000000 + Math.random() * 90000000).toString();
}
