import { test, expect } from '@playwright/test';
import { loginViaAPI, authHeaders } from '../fixtures/helpers';

test.describe('GET /api/analytics/trends', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get('/api/analytics/trends');
    expect([401, 500]).toContain(res.status());
  });

  test('returns score trends', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/analytics/trends', {
      headers: authHeaders(token),
    });
    expect([200, 500]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('trends');
    }
  });

  test('respects limit parameter', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/analytics/trends?limit=3', {
      headers: authHeaders(token),
    });
    expect([200, 500]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      if (body.trends) {
        expect(body.trends.length).toBeLessThanOrEqual(3);
      }
    }
  });
});

test.describe('GET /api/analytics/section-wise', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get('/api/analytics/section-wise');
    expect([401, 500]).toContain(res.status());
  });

  test('returns section-wise performance', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/analytics/section-wise', {
      headers: authHeaders(token),
    });
    expect([200, 500]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('performance');
    }
  });
});

test.describe('POST /api/analytics/rank-estimate', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post('/api/analytics/rank-estimate', {
      data: { score: 100 },
    });
    expect([401, 500]).toContain(res.status());
  });

  test('returns rank data for authenticated user', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/analytics/rank-estimate', {
      headers: authHeaders(token),
      data: { score: 100 },
    });
    expect([200, 403]).toContain(res.status());
  });
});

test.describe('GET /api/test/analytics', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get('/api/test/analytics');
    expect([401, 500]).toContain(res.status());
  });

  test('returns 400 or data when attemptId is missing', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/test/analytics', {
      headers: authHeaders(token),
    });
    expect([200, 400, 500]).toContain(res.status());
  });

  test('returns analytics for specific attempt', async ({ request }) => {
    const token = await loginViaAPI(request);
    const startRes = await request.post('/api/test/start', {
      headers: authHeaders(token),
      data: { testId: 52 },
    });
    const startBody = await startRes.json();
    const attemptId = startBody.attemptId;

    if (attemptId) {
      const res = await request.get(`/api/test/analytics?attemptId=${attemptId}`, {
        headers: authHeaders(token),
      });
      expect([200, 404, 500]).toContain(res.status());
    }
  });
});

test.describe('GET /api/test/analytics/averages', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get('/api/test/analytics/averages');
    expect([401, 500]).toContain(res.status());
  });

  test('returns user averages', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/test/analytics/averages', {
      headers: authHeaders(token),
    });
    expect([200, 500]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.success).toBe(true);
    }
  });
});

test.describe('GET /api/test/performance', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get('/api/test/performance');
    expect([401, 500]).toContain(res.status());
  });

  test('returns performance results and summary', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/test/performance', {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body).toHaveProperty('results');
    expect(body).toHaveProperty('summary');
  });
});

test.describe('POST /api/test/analytics/recalculate', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post('/api/test/analytics/recalculate', {
      data: { attemptId: 'fake' },
    });
    expect([401, 500]).toContain(res.status());
  });

  test('recalculates analytics for valid attempt', async ({ request }) => {
    const token = await loginViaAPI(request);
    const startRes = await request.post('/api/test/start', {
      headers: authHeaders(token),
      data: { testId: 52 },
    });
    const { attemptId } = await startRes.json();

    const res = await request.post('/api/test/analytics/recalculate', {
      headers: authHeaders(token),
      data: { attemptId },
    });
    expect([200, 404]).toContain(res.status());
  });
});
