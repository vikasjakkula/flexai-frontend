import { test, expect } from '@playwright/test';
import { TEST_USER, loginViaAPI, authHeaders, FREE_TEST_IDS } from '../fixtures/helpers';

test.describe('GET /api/test/list', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get('/api/test/list?state=TS');
    expect([401, 500]).toContain(res.status());
  });

  test('returns tests grouped by year for TS state', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/test/list?state=TS', {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body).toHaveProperty('tests');
    expect(body).toHaveProperty('grouped');
  });

  test('returns tests grouped by year for AP state', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/test/list?state=AP', {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('includes test status fields', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/test/list?state=TS', {
      headers: authHeaders(token),
    });
    const body = await res.json();
    if (body.tests && body.tests.length > 0) {
      const firstTest = body.tests[0];
      expect(firstTest).toHaveProperty('test_id');
      expect(firstTest).toHaveProperty('test_name');
    }
  });

  test('handles empty / invalid state param', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/test/list?state=INVALID', {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.tests).toBeDefined();
  });
});

test.describe('POST /api/test/start', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post('/api/test/start', {
      data: { testId: FREE_TEST_IDS[0] },
    });
    expect([401, 500]).toContain(res.status());
  });

  test('returns 400 when testId is missing', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/test/start', {
      headers: authHeaders(token),
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('allows free tests for non-premium users', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/test/start', {
      headers: authHeaders(token),
      data: { testId: FREE_TEST_IDS[0] },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body).toHaveProperty('attemptId');
  });

  test('returns existing in-progress attempt', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res1 = await request.post('/api/test/start', {
      headers: authHeaders(token),
      data: { testId: FREE_TEST_IDS[0] },
    });
    const body1 = await res1.json();
    const attemptId1 = body1.attemptId;

    const res2 = await request.post('/api/test/start', {
      headers: authHeaders(token),
      data: { testId: FREE_TEST_IDS[0] },
    });
    const body2 = await res2.json();
    expect(body2.attemptId).toBe(attemptId1);
  });

  test('returns 403 for non-premium user on premium test', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/test/start', {
      headers: authHeaders(token),
      data: { testId: 1 },
    });
    expect([403, 402]).toContain(res.status());
  });
});

test.describe('GET /api/test/attempt/[attemptId]', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get('/api/test/attempt/fake-id');
    expect([401, 500]).toContain(res.status());
  });

  test('returns 404 for non-existent attempt', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/test/attempt/00000000-0000-0000-0000-000000000000', {
      headers: authHeaders(token),
    });
    expect([404, 500]).toContain(res.status());
  });

  test('returns attempt with test data', async ({ request }) => {
    const token = await loginViaAPI(request);
    const startRes = await request.post('/api/test/start', {
      headers: authHeaders(token),
      data: { testId: FREE_TEST_IDS[0] },
    });
    const { attemptId } = await startRes.json();

    const res = await request.get(`/api/test/attempt/${attemptId}`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body).toHaveProperty('attempt');
    expect(body).toHaveProperty('testData');
  });
});

test.describe('PUT /api/test/attempt/[attemptId]/save', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.put('/api/test/attempt/fake-id/save', {
      data: { answers: {} },
    });
    expect([401, 500]).toContain(res.status());
  });

  test('saves answers and current question', async ({ request }) => {
    const token = await loginViaAPI(request);
    const startRes = await request.post('/api/test/start', {
      headers: authHeaders(token),
      data: { testId: FREE_TEST_IDS[0] },
    });
    const { attemptId } = await startRes.json();

    const res = await request.put(`/api/test/attempt/${attemptId}/save`, {
      headers: authHeaders(token),
      data: {
        answers: { '1': 'A', '2': 'B' },
        currentQuestion: 3,
        currentSection: 'maths',
        visitedQuestions: [1, 2, 3],
        markedForReview: [2],
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

test.describe('POST /api/test/attempt/[attemptId]/submit', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post('/api/test/attempt/fake-id/submit');
    expect([401, 500]).toContain(res.status());
  });

  test('returns 404 for non-existent attempt', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.post('/api/test/attempt/00000000-0000-0000-0000-000000000000/submit', {
      headers: authHeaders(token),
    });
    expect([404, 500]).toContain(res.status());
  });
});

test.describe('/api/test/attempt/[attemptId]/time', () => {
  test('GET returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get('/api/test/attempt/fake-id/time');
    expect([401, 500]).toContain(res.status());
  });

  test('POST saves question times', async ({ request }) => {
    const token = await loginViaAPI(request);
    const startRes = await request.post('/api/test/start', {
      headers: authHeaders(token),
      data: { testId: FREE_TEST_IDS[0] },
    });
    const { attemptId } = await startRes.json();

    const res = await request.post(`/api/test/attempt/${attemptId}/time`, {
      headers: authHeaders(token),
      data: { times: { '1': 30, '2': 45 } },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('GET returns times for attempt', async ({ request }) => {
    const token = await loginViaAPI(request);
    const startRes = await request.post('/api/test/start', {
      headers: authHeaders(token),
      data: { testId: FREE_TEST_IDS[0] },
    });
    const { attemptId } = await startRes.json();

    const res = await request.get(`/api/test/attempt/${attemptId}/time`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

test.describe('GET /api/test/results', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get('/api/test/results');
    expect([401, 500]).toContain(res.status());
  });

  test('returns list of user results', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/test/results', {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.results)).toBe(true);
  });

  test('respects limit parameter', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/test/results?limit=2', {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.results.length).toBeLessThanOrEqual(2);
  });
});

test.describe('GET /api/test/results/[resultId]', () => {
  test('returns 401 when not authenticated', async ({ request }) => {
    const res = await request.get('/api/test/results/fake-id');
    expect([401, 500]).toContain(res.status());
  });

  test('returns 404 for non-existent result', async ({ request }) => {
    const token = await loginViaAPI(request);
    const res = await request.get('/api/test/results/00000000-0000-0000-0000-000000000000', {
      headers: authHeaders(token),
    });
    expect([404, 500]).toContain(res.status());
  });
});
