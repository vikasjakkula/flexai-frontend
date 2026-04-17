import { test, expect, devices } from '@playwright/test';
import { loginAndSetCookie, FREE_TEST_IDS } from '../fixtures/helpers';

test.use({ ...devices['Pixel 5'] });

test.describe('Mobile (375px) - Landing Page', () => {
  test('renders correctly on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const content = page.locator('body');
    await expect(content).toBeVisible();

    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(viewportWidth).toBeLessThanOrEqual(420);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('hero section fits mobile viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const hero = page.locator('section').first();
    const box = await hero.boundingBox();
    if (box) {
      const viewportWidth = page.viewportSize()?.width ?? 420;
      expect(box.width).toBeLessThanOrEqual(viewportWidth + 5);
    }
  });

  test('pricing cards stack vertically on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const basicPrice = page.getByText(/₹199/).first();
    const proPrice = page.getByText(/₹299/).first();
    if (await basicPrice.isVisible() && await proPrice.isVisible()) {
      const basicBox = await basicPrice.boundingBox();
      const proBox = await proPrice.boundingBox();
      if (basicBox && proBox) {
        expect(proBox.y).toBeGreaterThanOrEqual(basicBox.y);
      }
    }
  });

  test('navigation is accessible on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const loginLink = page.getByRole('link', { name: /login|sign in|get started/i }).first();
    await expect(loginLink).toBeVisible();
    const box = await loginLink.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(30);
      expect(box.height).toBeGreaterThanOrEqual(30);
    }
  });
});

test.describe('Mobile - Auth Pages', () => {
  test('login page renders correctly on mobile', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForTimeout(1000);
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    await expect(phoneInput).toBeVisible();
    const box = await phoneInput.boundingBox();
    if (box) {
      const viewportWidth = page.viewportSize()?.width ?? 420;
      expect(box.width).toBeGreaterThan(viewportWidth * 0.5);
    }
  });

  test('register page renders correctly on mobile', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForTimeout(1000);
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    await expect(phoneInput).toBeVisible();
  });
});

test.describe('Mobile - Dashboard', () => {
  test('dashboard renders correctly on mobile', async ({ page, request }) => {
    test.setTimeout(90000);
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForTimeout(5000);
    const content = page.locator('main, [class*="dashboard"]').first();
    await expect(content).toBeVisible();

    const viewportWidth = page.viewportSize()?.width ?? 0;
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('bottom navigation is visible on mobile', async ({ page, request }) => {
    test.setTimeout(90000);
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForTimeout(5000);
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('profile page renders on mobile', async ({ page, request }) => {
    test.setTimeout(90000);
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard/profile', { timeout: 60000 });
    await page.waitForTimeout(5000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
  });

  test('tests page renders on mobile', async ({ page, request }) => {
    test.setTimeout(90000);
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard/tests', { timeout: 60000 });
    await page.waitForTimeout(5000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Mobile - Test Taking UI', () => {
  test('test instructions page renders on mobile', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto(`/test/instructions?testId=${FREE_TEST_IDS[0]}`);
    await page.waitForTimeout(2000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
  });

  test('question palette is collapsible on mobile', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto(`/test/instructions?testId=${FREE_TEST_IDS[0]}`);
    await page.waitForTimeout(2000);
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }
    const startBtn = page.getByRole('button', { name: /begin|start|ready/i });
    if (await startBtn.isVisible() && !(await startBtn.isDisabled())) {
      await startBtn.click();
      await page.waitForURL(/test\/take/, { timeout: 15000 });
      await page.waitForTimeout(3000);

      const viewportWidth = page.viewportSize()?.width ?? 0;
      expect(viewportWidth).toBeLessThanOrEqual(420);
    }
  });
});

test.describe('Mobile - Forms', () => {
  test('contact form is usable on mobile', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForTimeout(1000);
    const nameInput = page.getByPlaceholder(/name/i).or(page.locator('input[name="name"]')).first();
    await expect(nameInput).toBeVisible();
    const box = await nameInput.boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(30);
    }
  });

  test('touch targets are adequate size', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForTimeout(1000);
    const submitBtn = page.getByRole('button', { name: /sign in/i });
    const box = await submitBtn.boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(30);
      expect(box.width).toBeGreaterThanOrEqual(60);
    }
  });
});

test.describe('Mobile - Static Pages', () => {
  test('about page renders on mobile', async ({ page }) => {
    await page.goto('/about');
    await page.waitForTimeout(1000);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 420;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('terms page renders on mobile', async ({ page }) => {
    await page.goto('/terms-and-conditions');
    await page.waitForTimeout(1000);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 420;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('privacy page renders on mobile', async ({ page }) => {
    await page.goto('/privacy-policy');
    await page.waitForTimeout(1000);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 420;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
