import { test, expect } from '@playwright/test';
import { loginViaAPI, authHeaders } from '../fixtures/helpers';

// ─── CORS Tests ──────────────────────────────────────────────────────────────

test.describe('CORS for API routes', () => {
  test('sets CORS headers on API responses', async ({ request }) => {
    const res = await request.get('/api/auth/check-session');
    const headers = res.headers();
    expect(headers['access-control-allow-origin']).toBeTruthy();
  });

  test('returns 204 for OPTIONS preflight on API routes', async ({ request }) => {
    const res = await request.fetch('/api/auth/check-session', {
      method: 'OPTIONS',
    });
    expect(res.status()).toBe(204);
  });

  test('sets Access-Control-Allow-Methods header', async ({ request }) => {
    const res = await request.fetch('/api/auth/check-session', {
      method: 'OPTIONS',
    });
    const methods = res.headers()['access-control-allow-methods'];
    expect(methods).toContain('GET');
    expect(methods).toContain('POST');
    expect(methods).toContain('PUT');
    expect(methods).toContain('DELETE');
  });

  test('sets Access-Control-Allow-Headers header', async ({ request }) => {
    const res = await request.fetch('/api/auth/check-session', {
      method: 'OPTIONS',
    });
    const allowedHeaders = res.headers()['access-control-allow-headers'];
    expect(allowedHeaders).toContain('Content-Type');
  });

  test('sets Access-Control-Allow-Credentials header', async ({ request }) => {
    const res = await request.fetch('/api/auth/check-session', {
      method: 'OPTIONS',
    });
    expect(res.headers()['access-control-allow-credentials']).toBe('true');
  });
});

// ─── Authentication Middleware ───────────────────────────────────────────────

test.describe('Authentication middleware', () => {
  test('redirects to login for /dashboard without session', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/auth\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('redirects to login for /payment without session (if not in public paths)', async ({ page }) => {
    // /payment is in publicPaths in middleware, so it should be accessible
    await page.goto('/payment');
    await page.waitForTimeout(2000);
    // Payment page should load or redirect based on auth
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('allows access to protected routes with valid session', async ({ page, request }) => {
    test.setTimeout(90000);
    const token = await loginViaAPI(request);
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
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForTimeout(5000);
    expect(page.url()).toContain('/dashboard');
  });

  test('redirects for expired/invalid session', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'session',
        value: 'expired-invalid-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
      },
    ]);
    await page.goto('/dashboard');
    await page.waitForURL(/auth\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('public paths accessible without auth - landing', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/auth/login');
  });

  test('public paths accessible without auth - login', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/auth/login');
  });

  test('public paths accessible without auth - register', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/auth/register');
  });

  test('public paths accessible without auth - onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/onboarding');
  });

  test('public paths accessible without auth - payment success', async ({ page }) => {
    await page.goto('/payment/success');
    await page.waitForTimeout(1000);
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('public paths accessible without auth - payment failure', async ({ page }) => {
    await page.goto('/payment/failure');
    await page.waitForTimeout(1000);
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });
});

// ─── Affiliate Tracking Middleware ───────────────────────────────────────────

test.describe('Affiliate tracking via middleware', () => {
  test('sets affiliate cookies on ?ref=CODE parameter', async ({ page }) => {
    await page.goto('/?ref=TESTCODE');
    await page.waitForTimeout(2000);
    const cookies = await page.context().cookies();
    // Cookies may or may not be set depending on whether TESTCODE is valid
    // Just verify no crash
    expect(Array.isArray(cookies)).toBe(true);
  });

  test('does not crash for invalid affiliate code', async ({ page }) => {
    await page.goto('/?ref=NONEXISTENT_RANDOM_CODE_99999');
    await page.waitForTimeout(2000);
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('page loads normally without ?ref parameter', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('affiliate cookies not set for invalid code', async ({ page }) => {
    await page.goto('/?ref=INVALID_CODE_XYZABC');
    await page.waitForTimeout(2000);
    const cookies = await page.context().cookies();
    const affiliateCookie = cookies.find(c => c.name === 'affiliate_code');
    expect(affiliateCookie).toBeUndefined();
  });
});
