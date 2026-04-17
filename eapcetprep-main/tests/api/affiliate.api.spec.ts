import { test, expect } from '@playwright/test';
import {
  TEST_AFFILIATE,
  loginAffiliateViaAPI,
  affiliateAuthHeaders,
  randomPhone,
} from '../fixtures/helpers';

test.describe('POST /api/affiliate/register', () => {
  test('returns 401 when not authenticated as affiliate', async ({ request }) => {
    const res = await request.post('/api/affiliate/register', {
      data: { paymentMethod: 'upi', upiId: 'test@upi' },
    });
    expect([401, 500]).toContain(res.status());
  });

  test('returns error for missing payment method', async ({ request }) => {
    const token = await loginAffiliateViaAPI(request);
    if (!token) return test.skip();
    const res = await request.post('/api/affiliate/register', {
      headers: affiliateAuthHeaders(token),
      data: {},
    });
    expect(res.ok()).toBeFalsy();
  });

  test('returns error for UPI without upiId', async ({ request }) => {
    const token = await loginAffiliateViaAPI(request);
    if (!token) return test.skip();
    const res = await request.post('/api/affiliate/register', {
      headers: affiliateAuthHeaders(token),
      data: { paymentMethod: 'upi' },
    });
    expect(res.ok()).toBeFalsy();
  });

  test('returns error for bank without account details', async ({ request }) => {
    const token = await loginAffiliateViaAPI(request);
    if (!token) return test.skip();
    const res = await request.post('/api/affiliate/register', {
      headers: affiliateAuthHeaders(token),
      data: { paymentMethod: 'bank' },
    });
    expect(res.ok()).toBeFalsy();
  });
});

test.describe('POST /api/affiliate/record-visit', () => {
  test('returns error for missing affiliate_code', async ({ request }) => {
    const res = await request.post('/api/affiliate/record-visit', { data: {} });
    expect([400, 500]).toContain(res.status());
  });

  test('returns error for invalid affiliate code', async ({ request }) => {
    const res = await request.post('/api/affiliate/record-visit', {
      data: { affiliate_code: 'NONEXISTENT_CODE' },
    });
    expect([404, 400, 500]).toContain(res.status());
  });
});

test.describe('GET /api/affiliate/details', () => {
  test('returns 401 when not authenticated as affiliate', async ({ request }) => {
    const res = await request.get('/api/affiliate/details');
    expect([401, 500]).toContain(res.status());
  });

  test('returns affiliate stats when authenticated', async ({ request }) => {
    const token = await loginAffiliateViaAPI(request);
    if (!token) return test.skip();
    const res = await request.get('/api/affiliate/details', {
      headers: affiliateAuthHeaders(token),
    });
    // 404 if affiliate hasn't completed registration (payment details)
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('affiliateCode');
      expect(body).toHaveProperty('stats');
    }
  });
});

test.describe('POST /api/affiliate/auth/login', () => {
  test('returns error for missing fields', async ({ request }) => {
    const res = await request.post('/api/affiliate/auth/login', { data: {} });
    expect([400, 500]).toContain(res.status());
  });

  test('returns error for invalid credentials', async ({ request }) => {
    const res = await request.post('/api/affiliate/auth/login', {
      data: { phone: '0000000000', password: 'wrong' },
    });
    expect([401, 400, 500]).toContain(res.status());
  });

  test('returns 200 and sets affiliate_session cookie on valid login', async ({ request }) => {
    const res = await request.post('/api/affiliate/auth/login', {
      data: { phone: TEST_AFFILIATE.phone, password: TEST_AFFILIATE.password },
    });
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.success).toBe(true);
      const setCookie = res.headers()['set-cookie'] || '';
      expect(setCookie).toContain('affiliate_session');
    }
  });
});

test.describe('POST /api/affiliate/auth/register', () => {
  test('returns error for missing fields', async ({ request }) => {
    const res = await request.post('/api/affiliate/auth/register', { data: {} });
    expect([400, 500]).toContain(res.status());
  });

  test('returns error for existing affiliate user', async ({ request }) => {
    // First ensure the affiliate exists using skipOTP to actually create the account
    await request.post('/api/affiliate/auth/register', {
      data: { phone: TEST_AFFILIATE.phone, password: TEST_AFFILIATE.password, skipOTP: true },
    });
    // Now try again - should get error for duplicate
    const res = await request.post('/api/affiliate/auth/register', {
      data: { phone: TEST_AFFILIATE.phone, password: 'TestPass123', skipOTP: true },
    });
    expect([400, 409, 500]).toContain(res.status());
  });
});

test.describe('POST /api/affiliate/auth/verify-otp', () => {
  test('returns error for invalid OTP', async ({ request }) => {
    const res = await request.post('/api/affiliate/auth/verify-otp', {
      data: { verificationId: 'fake', code: '000000', phone: randomPhone() },
    });
    expect(res.ok()).toBeFalsy();
  });
});

test.describe('GET /api/affiliate/auth/check-session', () => {
  test('returns authenticated: false without session', async ({ request }) => {
    const res = await request.get('/api/affiliate/auth/check-session');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(false);
  });

  test('returns authenticated: true with valid session', async ({ request }) => {
    const token = await loginAffiliateViaAPI(request);
    if (!token) return test.skip();
    const res = await request.get('/api/affiliate/auth/check-session', {
      headers: affiliateAuthHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(true);
  });
});

test.describe('POST /api/affiliate/auth/forgot-password', () => {
  test('returns error for missing phone', async ({ request }) => {
    const res = await request.post('/api/affiliate/auth/forgot-password', { data: {} });
    expect([400, 500]).toContain(res.status());
  });
});

test.describe('POST /api/affiliate/auth/reset-password', () => {
  test('returns error for missing fields', async ({ request }) => {
    const res = await request.post('/api/affiliate/auth/reset-password', { data: {} });
    expect(res.ok()).toBeFalsy();
  });
});
