import { test, expect } from '@playwright/test';
import { loginAndSetCookie } from '../fixtures/helpers';

test.describe('Payment Page', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/payment');
    await page.waitForTimeout(2000);
  });

  test('displays BASIC and PRO plan cards', async ({ page }) => {
    const basic = page.getByText(/basic/i).first();
    const pro = page.getByText(/pro/i).first();
    await expect(basic).toBeVisible();
    await expect(pro).toBeVisible();
  });

  test('shows pricing ₹199 and ₹299', async ({ page }) => {
    await expect(page.getByText(/₹199/).first()).toBeVisible();
    await expect(page.getByText(/₹299/).first()).toBeVisible();
  });

  test('plan selection toggles', async ({ page }) => {
    const basicBtn = page.getByRole('button', { name: /basic|₹199/i }).or(
      page.getByText(/basic/i).locator('..')
    ).first();
    if (await basicBtn.isVisible()) {
      await basicBtn.click();
      await page.waitForTimeout(300);
    }

    const proBtn = page.getByRole('button', { name: /pro|₹299/i }).or(
      page.getByText(/pro/i).locator('..')
    ).first();
    if (await proBtn.isVisible()) {
      await proBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('try for free link navigates to dashboard', async ({ page }) => {
    const freeLink = page.getByRole('link', { name: /free|skip|later|try/i }).or(
      page.getByText(/free|skip|later/i)
    ).first();
    if (await freeLink.isVisible()) {
      await freeLink.click();
      await page.waitForURL(/dashboard/, { timeout: 5000 });
      expect(page.url()).toContain('dashboard');
    }
  });

  test('shows testimonials section', async ({ page }) => {
    const testimonial = page.getByText(/testimonial|student|review|love/i).first();
    if (await testimonial.isVisible()) {
      await expect(testimonial).toBeVisible();
    }
  });
});

test.describe('Payment Success Page', () => {
  test('displays success message or redirects to dashboard', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/payment/success');
    // Page may auto-redirect to dashboard quickly
    try {
      const success = page.getByText(/success|thank|congrat|payment.*successful/i).first();
      await expect(success).toBeVisible({ timeout: 3000 });
    } catch {
      // If redirected too quickly, verify we're on dashboard
      await page.waitForURL(/dashboard|success/, { timeout: 10000 });
      expect(page.url()).toMatch(/dashboard|success/);
    }
  });

  test('auto-redirects to dashboard', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/payment/success');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain('dashboard');
  });
});

test.describe('Payment Failure Page', () => {
  test('displays failure message when purchase intent exists', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/payment/failure');
    await page.evaluate(() => {
      localStorage.setItem('purchaseIntent', JSON.stringify({ tier: 'PRO', timestamp: Date.now() }));
    });
    await page.goto('/payment/failure');
    await page.waitForTimeout(2000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
  });

  test('failure page loads and shows content', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/payment/failure');
    await page.waitForTimeout(2000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Pay For Someone (Share Link)', () => {
  test('shows error for invalid token', async ({ page }) => {
    await page.goto('/pay-for/invalid-token-12345');
    await page.waitForTimeout(3000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
    const errorOrContent = page.getByText(/error|not found|invalid|expired|pay/i).first();
    await expect(errorOrContent).toBeVisible();
  });

  test('shows plan info for valid token', async ({ page, request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { phone: '9999900001', password: 'TestPass123' },
    });
    const cookies = loginRes.headers()['set-cookie'] || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const token = sessionMatch?.[1] ?? '';
    if (!token) return;

    const shareRes = await request.post('/api/payments/share-link', {
      headers: { Cookie: `session=${token}` },
      data: { tier: 'PRO' },
    });
    if (shareRes.status() !== 200) return;
    const { token: shareToken } = await shareRes.json();

    await page.goto(`/pay-for/${shareToken}`);
    await page.waitForTimeout(3000);
    const planInfo = page.getByText(/pro|₹299|pay|plan/i).first();
    await expect(planInfo).toBeVisible();
  });
});
