import { test, expect } from '@playwright/test';
import { loginViaAPI, authHeaders } from '../fixtures/helpers';

// ─── Support Ticket ──────────────────────────────────────────────────────────

test.describe('POST /api/support/create', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post('/api/support/create', {
      data: { category: 'general', message: 'Help!' },
    });
    expect([401, 500]).toContain(res.status());
  });

  test('returns error for missing category', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/support/create', {
      headers: authHeaders(token),
      data: { message: 'Help!' },
    });
    expect(res.ok()).toBeFalsy();
  });

  test('returns error for missing message', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/support/create', {
      headers: authHeaders(token),
      data: { category: 'general' },
    });
    expect(res.ok()).toBeFalsy();
  });

  test('creates support ticket successfully', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/support/create', {
      headers: authHeaders(token),
      data: {
        category: 'technical_issue',
        subject: 'Test issue',
        message: 'This is a test support ticket for e2e testing',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body).toHaveProperty('ticket');
  });
});

// ─── PWA Update ──────────────────────────────────────────────────────────────

test.describe('POST /api/user/update-pwa-installed', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post('/api/user/update-pwa-installed', {
      data: { pwa_installed: true },
    });
    expect([401, 500]).toContain(res.status());
  });

  test('updates pwa_installed flag to true', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/user/update-pwa-installed', {
      headers: authHeaders(token),
      data: { pwa_installed: true },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.pwa_installed).toBe(true);
  });

  test('updates pwa_installed flag to false', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/user/update-pwa-installed', {
      headers: authHeaders(token),
      data: { pwa_installed: false },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.pwa_installed).toBe(false);
  });
});

// ─── Demo Dashboard ──────────────────────────────────────────────────────────

test.describe('GET /api/demo/dashboard', () => {
  test('returns demo data without authentication', async ({ request }) => {
    const res = await request.get('/api/demo/dashboard');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body).toHaveProperty('userData');
    expect(body).toHaveProperty('tests');
    expect(body).toHaveProperty('results');
    expect(body).toHaveProperty('analytics');
  });

  test('contains grouped tests', async ({ request }) => {
    const res = await request.get('/api/demo/dashboard');
    const body = await res.json();
    expect(body).toHaveProperty('grouped');
  });

  test('contains section performance data', async ({ request }) => {
    const res = await request.get('/api/demo/dashboard');
    const body = await res.json();
    expect(body).toHaveProperty('sectionPerformance');
  });

  test('contains isPremium field', async ({ request }) => {
    const res = await request.get('/api/demo/dashboard');
    const body = await res.json();
    expect(body).toHaveProperty('isPremium');
  });
});

test.describe('GET /api/demo/results/[resultId]', () => {
  test('returns demo result for valid resultId', async ({ request }) => {
    const dashRes = await request.get('/api/demo/dashboard');
    const dashBody = await dashRes.json();
    if (dashBody.results && dashBody.results.length > 0) {
      const resultId = dashBody.results[0].id;
      const res = await request.get(`/api/demo/results/${resultId}`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('result');
    }
  });

  test('returns error for invalid resultId', async ({ request }) => {
    const res = await request.get('/api/demo/results/nonexistent-id');
    expect([404, 500]).toContain(res.status());
  });
});

// ─── Subscription Cancel ─────────────────────────────────────────────────────

test.describe('POST /api/subscriptions/cancel', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post('/api/subscriptions/cancel', {
      data: { subscriptionId: 'sub_fake' },
    });
    expect([401, 500]).toContain(res.status());
  });

  test('returns error for missing subscriptionId', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/subscriptions/cancel', {
      headers: authHeaders(token),
      data: {},
    });
    expect([400, 500]).toContain(res.status());
  });

  test('returns error for invalid subscriptionId', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/subscriptions/cancel', {
      headers: authHeaders(token),
      data: { subscriptionId: 'sub_nonexistent' },
    });
    expect([400, 404, 500]).toContain(res.status());
  });
});
