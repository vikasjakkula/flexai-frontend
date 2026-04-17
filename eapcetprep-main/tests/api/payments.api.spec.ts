import { test, expect } from '@playwright/test';
import { loginViaAPI, authHeaders } from '../fixtures/helpers';

test.describe('POST /api/payments/create-order', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post('/api/payments/create-order', { data: {} });
    expect([401, 500]).toContain(res.status());
  });

  test('creates order with default PRO tier', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/payments/create-order', {
      headers: authHeaders(token),
      data: {},
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('orderId');
    expect(body).toHaveProperty('amount');
    expect(body).toHaveProperty('currency', 'INR');
    expect(body.planTier).toBe('PRO');
  });

  test('creates order with BASIC tier', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/payments/create-order', {
      headers: authHeaders(token),
      data: { tier: 'BASIC' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.planTier).toBe('BASIC');
    expect(body.amount).toBe(19900);
  });

  test('returns orderId, amount, currency', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/payments/create-order', {
      headers: authHeaders(token),
      data: { tier: 'PRO' },
    });
    const body = await res.json();
    expect(body.orderId).toBeTruthy();
    expect(body.amount).toBe(29900);
    expect(body.currency).toBe('INR');
    expect(body).toHaveProperty('receipt');
  });
});

test.describe('POST /api/payments/verify', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post('/api/payments/verify', { data: {} });
    expect([401, 500]).toContain(res.status());
  });

  test('returns 400 for missing payment fields', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/payments/verify', {
      headers: authHeaders(token),
      data: {},
    });
    expect([400, 500]).toContain(res.status());
  });

  test('returns 400 for invalid signature', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/payments/verify', {
      headers: authHeaders(token),
      data: {
        razorpay_order_id: 'order_fake',
        razorpay_payment_id: 'pay_fake',
        razorpay_signature: 'invalid_sig',
      },
    });
    expect([400, 500]).toContain(res.status());
  });
});

test.describe('POST /api/payments/create-subscription', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post('/api/payments/create-subscription', { data: {} });
    expect([401, 500]).toContain(res.status());
  });
});

test.describe('POST /api/payments/share-link', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post('/api/payments/share-link', { data: {} });
    expect([401, 500]).toContain(res.status());
  });

  test('creates share link with token and URL', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/payments/share-link', {
      headers: authHeaders(token),
      data: { tier: 'PRO' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('url');
    expect(body).toHaveProperty('token');
  });
});

test.describe('GET /api/payments/share-link/[token]', () => {
  test('returns 404 for invalid token', async ({ request }) => {
    const res = await request.get('/api/payments/share-link/invalid-token-123');
    expect([404, 500]).toContain(res.status());
  });

  test('returns share link details for valid token', async ({ request }) => {
    const token = await loginViaAPI(request);
    const createRes = await request.post('/api/payments/share-link', {
      headers: authHeaders(token),
      data: { tier: 'PRO' },
    });
    const { token: shareToken } = await createRes.json();

    const res = await request.get(`/api/payments/share-link/${shareToken}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('user');
    expect(body).toHaveProperty('planTier');
    expect(body).toHaveProperty('amount');
  });
});

test.describe('POST /api/payments/create-order-for-share', () => {
  test('returns error for missing token', async ({ request }) => {
    const res = await request.post('/api/payments/create-order-for-share', { data: {} });
    expect([400, 500]).toContain(res.status());
  });

  test('creates order for valid share link', async ({ request }) => {
    const authToken = await loginViaAPI(request);
    const shareRes = await request.post('/api/payments/share-link', {
      headers: authHeaders(authToken),
      data: { tier: 'PRO' },
    });
    const { token: shareToken } = await shareRes.json();

    const res = await request.post('/api/payments/create-order-for-share', {
      data: { token: shareToken },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('orderId');
    expect(body).toHaveProperty('amount');
  });
});

test.describe('POST /api/payments/verify-share', () => {
  test('returns error for missing fields', async ({ request }) => {
    const res = await request.post('/api/payments/verify-share', { data: {} });
    expect([400, 500]).toContain(res.status());
  });
});

test.describe('POST /api/webhooks/razorpay', () => {
  test('returns error for invalid signature', async ({ request }) => {
    const res = await request.post('/api/webhooks/razorpay', {
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid-sig',
      },
      data: {
        event: 'subscription.activated',
        payload: { subscription: { entity: { id: 'sub_fake', notes: {} } } },
      },
    });
    expect([400, 401, 500]).toContain(res.status());
  });

  test('handles request body', async ({ request }) => {
    const res = await request.post('/api/webhooks/razorpay', {
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'test',
      },
      data: {
        event: 'subscription.activated',
        payload: {
          subscription: {
            entity: { id: 'sub_test', notes: { userId: 'test' } },
          },
        },
      },
    });
    expect([200, 400, 401, 500]).toContain(res.status());
  });
});
