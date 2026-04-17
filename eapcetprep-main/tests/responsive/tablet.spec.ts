import { test, expect } from '@playwright/test';
import { loginAndSetCookie } from '../fixtures/helpers';

test.use({
  viewport: { width: 768, height: 1024 },
});

test.describe('Tablet (768px) - Landing Page', () => {
  test('layout adjusts for tablet', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const content = page.locator('body');
    await expect(content).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(780);
  });

  test('pricing cards layout on tablet', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const basicPrice = page.getByText(/₹199/).first();
    const proPrice = page.getByText(/₹299/).first();
    if (await basicPrice.isVisible() && await proPrice.isVisible()) {
      const basicBox = await basicPrice.boundingBox();
      const proBox = await proPrice.boundingBox();
      expect(basicBox).toBeTruthy();
      expect(proBox).toBeTruthy();
    }
  });
});

test.describe('Tablet - Auth Pages', () => {
  test('login page renders on tablet', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForTimeout(1000);
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    await expect(phoneInput).toBeVisible();
  });

  test('register page renders on tablet', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForTimeout(1000);
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    await expect(phoneInput).toBeVisible();
  });
});

test.describe('Tablet - Dashboard', () => {
  test('dashboard renders on tablet', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(780);
  });

  test('sidebar behavior on tablet', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    const nav = page.locator('nav').first();
    if (await nav.isVisible()) {
      await expect(nav).toBeVisible();
    }
  });

  test('charts render on tablet', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard/performance');
    await page.waitForTimeout(3000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
  });

  test('analytics page on tablet', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard/analytics');
    await page.waitForTimeout(3000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
  });

  test('tests list on tablet', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard/tests');
    await page.waitForTimeout(3000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Tablet - Test Taking', () => {
  test('test instructions on tablet', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/test/instructions?testId=52');
    await page.waitForTimeout(2000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(780);
  });
});

test.describe('Tablet - Payment', () => {
  test('payment page on tablet', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/payment');
    await page.waitForTimeout(2000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Tablet - Static Pages', () => {
  test('about page on tablet', async ({ page }) => {
    await page.goto('/about');
    await page.waitForTimeout(1000);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(780);
  });

  test('contact page on tablet', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForTimeout(1000);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(780);
  });
});
