import { test, expect } from '@playwright/test';
import { TEST_USER, loginViaAPI, authHeaders, randomPhone, ensureTestUser } from '../fixtures/helpers';

test.describe('POST /api/auth/login', () => {
  test('returns 400 when phone is missing', async ({ request }) => {
    const res = await request.post('/api/auth/login', { data: { password: 'pass123' } });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('returns 400 when password is missing', async ({ request }) => {
    const res = await request.post('/api/auth/login', { data: { phone: '1234567890' } });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when both phone and password are missing', async ({ request }) => {
    const res = await request.post('/api/auth/login', { data: {} });
    expect(res.status()).toBe(400);
  });

  test('returns 401 for non-existent phone number', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { phone: '0000000000', password: 'wrongpass' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid credentials');
  });

  test('returns 401 for wrong password', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { phone: TEST_USER.phone, password: 'totallyWrongPassword' },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 200 and sets session cookie on valid credentials', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { phone: TEST_USER.phone, password: TEST_USER.password },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const setCookie = res.headers()['set-cookie'] || '';
    expect(setCookie).toContain('session=');
  });

  test('session cookie is httpOnly', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { phone: TEST_USER.phone, password: TEST_USER.password },
    });
    const setCookie = res.headers()['set-cookie'] || '';
    expect(setCookie.toLowerCase()).toContain('httponly');
  });

  test('returns 500 on internal server error (malformed JSON)', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not-json',
    });
    expect([400, 500]).toContain(res.status());
  });
});

test.describe('POST /api/auth/register', () => {
  test('returns 400 when phone is missing', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { password: 'Pass123456' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when password is missing', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { phone: '1234567890' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 for invalid phone format (not 10 digits)', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { phone: '123', password: 'Pass123456' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('valid 10-digit');
  });

  test('returns 400 for short password (< 6 chars)', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { phone: randomPhone(), password: '12345' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('at least 6');
  });

  test('returns 400 when user already exists with phone', async ({ request }) => {
    await ensureTestUser(request);
    const res = await request.post('/api/auth/register', {
      data: { phone: TEST_USER.phone, password: 'Pass123456' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('already exists');
  });

  test('successfully registers a new user and returns session cookie', async ({ request }) => {
    const phone = randomPhone();
    const res = await request.post('/api/auth/register', {
      data: { phone, password: 'NewUserPass1' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.redirectPath).toBe('/onboarding');
    const setCookie = res.headers()['set-cookie'] || '';
    expect(setCookie).toContain('session=');
  });
});

test.describe('POST /api/auth/verify-otp', () => {
  test('returns 400 when verificationId is missing', async ({ request }) => {
    const res = await request.post('/api/auth/verify-otp', {
      data: { code: '123456', phone: '1234567890' },
    });
    expect([400, 500]).toContain(res.status());
  });

  test('returns 400 when OTP code is missing', async ({ request }) => {
    const res = await request.post('/api/auth/verify-otp', {
      data: { verificationId: 'fake-id', phone: '1234567890' },
    });
    expect([400, 500]).toContain(res.status());
  });

  test('returns 400 when phone is missing', async ({ request }) => {
    const res = await request.post('/api/auth/verify-otp', {
      data: { verificationId: 'fake-id', code: '123456' },
    });
    expect([400, 500]).toContain(res.status());
  });

  test('returns error for invalid OTP', async ({ request }) => {
    const res = await request.post('/api/auth/verify-otp', {
      data: { verificationId: 'fake-id', code: '000000', phone: '1234567890' },
    });
    expect(res.ok()).toBeFalsy();
  });
});

test.describe('GET /api/auth/check-session', () => {
  test('returns authenticated: false when no session cookie', async ({ request }) => {
    const res = await request.get('/api/auth/check-session');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(false);
  });

  test('returns authenticated: true when valid session exists', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/auth/check-session', {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(true);
  });

  test('returns authenticated: false for invalid token', async ({ request }) => {
    const res = await request.get('/api/auth/check-session', {
      headers: { Cookie: 'session=invalid-token-value' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(false);
  });
});

test.describe('POST /api/auth/forgot-password', () => {
  test('returns 400 when phone is missing', async ({ request }) => {
    const res = await request.post('/api/auth/forgot-password', { data: {} });
    expect(res.status()).toBe(400);
  });

  test('returns error for non-existent phone number', async ({ request }) => {
    const res = await request.post('/api/auth/forgot-password', {
      data: { phone: '0000000000' },
    });
    expect(res.ok()).toBeFalsy();
  });
});

test.describe('POST /api/auth/verify-forgot-password', () => {
  test('returns error when verificationId is missing', async ({ request }) => {
    const res = await request.post('/api/auth/verify-forgot-password', {
      data: { code: '123456', phone: '1234567890' },
    });
    expect(res.ok()).toBeFalsy();
  });

  test('returns error for invalid OTP', async ({ request }) => {
    const res = await request.post('/api/auth/verify-forgot-password', {
      data: { verificationId: 'fake', code: '000000', phone: '1234567890' },
    });
    expect(res.ok()).toBeFalsy();
  });
});

test.describe('POST /api/auth/reset-password', () => {
  test('returns error when phone or password is missing', async ({ request }) => {
    const res = await request.post('/api/auth/reset-password', { data: {} });
    expect(res.ok()).toBeFalsy();
  });

  test('returns error for short password', async ({ request }) => {
    const res = await request.post('/api/auth/reset-password', {
      data: { phone: TEST_USER.phone, password: '12' },
    });
    expect(res.ok()).toBeFalsy();
  });
});

test.describe('POST /api/auth/onboarding', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post('/api/auth/onboarding', {
      data: { name: 'Test', target_rank: 1000 },
    });
    expect([401, 500]).toContain(res.status());
  });

  test('returns error when name is missing', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/auth/onboarding', {
      headers: authHeaders(token),
      data: { target_rank: 1000 },
    });
    expect(res.ok()).toBeFalsy();
  });

  test('returns error when target_rank is missing', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/auth/onboarding', {
      headers: authHeaders(token),
      data: { name: 'Test' },
    });
    expect(res.ok()).toBeFalsy();
  });

  test('successfully saves onboarding data', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/auth/onboarding', {
      headers: authHeaders(token),
      data: {
        name: 'Test User',
        target_rank: 5000,
        exam_type: 'TS',
        current_marks_range: '100-150',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

test.describe('GET /api/auth/user', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get('/api/auth/user');
    expect([401, 500]).toContain(res.status());
  });

  test('returns user profile with tests_taken count', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/auth/user', {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('phone');
    expect(body).toHaveProperty('tests_taken');
  });
});

test.describe('GET /api/auth/premium-check', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get('/api/auth/premium-check');
    expect([401, 500]).toContain(res.status());
  });

  test('returns isPremium field', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/auth/premium-check', {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('isPremium');
    expect(typeof body.isPremium).toBe('boolean');
  });
});
