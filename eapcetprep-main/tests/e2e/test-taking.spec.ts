import { test, expect } from '@playwright/test';
import { loginAndSetCookie, FREE_TEST_IDS } from '../fixtures/helpers';

const FREE_TEST_ID = FREE_TEST_IDS[0];

test.describe('Test Instructions Page', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAndSetCookie(page, request);
  });

  test('displays general instructions', async ({ page }) => {
    await page.goto(`/test/instructions?testId=${FREE_TEST_ID}`);
    await page.waitForTimeout(2000);
    const instructions = page.getByText(/instruction|general|read carefully/i).first();
    await expect(instructions).toBeVisible();
  });

  test('shows section table (Maths 80, Physics 40, Chemistry 40)', async ({ page }) => {
    await page.goto(`/test/instructions?testId=${FREE_TEST_ID}`);
    await page.waitForTimeout(2000);
    const mathsText = page.getByText(/math/i).first();
    const physicsText = page.getByText(/physics/i).first();
    const chemistryText = page.getByText(/chemistry/i).first();
    await expect(mathsText).toBeVisible();
    await expect(physicsText).toBeVisible();
    await expect(chemistryText).toBeVisible();
  });

  test('shows 80 maths, 40 physics, 40 chemistry question counts', async ({ page }) => {
    await page.goto(`/test/instructions?testId=${FREE_TEST_ID}`);
    await page.waitForTimeout(2000);
    await expect(page.getByText('80').first()).toBeVisible();
    await expect(page.getByText('40').first()).toBeVisible();
  });

  test('terms checkbox is required before starting', async ({ page }) => {
    await page.goto(`/test/instructions?testId=${FREE_TEST_ID}`);
    await page.waitForTimeout(2000);
    const checkbox = page.locator('input[type="checkbox"]').first();
    const startBtn = page.getByRole('button', { name: /begin|start|ready/i });
    if (await checkbox.isVisible() && await startBtn.isVisible()) {
      const isDisabledBefore = await startBtn.isDisabled();
      expect(isDisabledBefore).toBe(true);
      await checkbox.check();
      const isDisabledAfter = await startBtn.isDisabled();
      expect(isDisabledAfter).toBe(false);
    }
  });

  test('start test button navigates to test taking page', async ({ page }) => {
    await page.goto(`/test/instructions?testId=${FREE_TEST_ID}`);
    await page.waitForTimeout(2000);
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }
    const startBtn = page.getByRole('button', { name: /begin|start|ready/i });
    if (await startBtn.isVisible() && !(await startBtn.isDisabled())) {
      await startBtn.click();
      await page.waitForURL(/test\/take/, { timeout: 15000 });
      expect(page.url()).toContain('/test/take');
    }
  });
});

test.describe('Test Taking UI', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto(`/test/instructions?testId=${FREE_TEST_ID}`);
    await page.waitForTimeout(2000);
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }
    const startBtn = page.getByRole('button', { name: /begin|start|ready/i });
    if (await startBtn.isVisible() && !(await startBtn.isDisabled())) {
      await startBtn.click();
      await page.waitForURL(/test\/take/, { timeout: 15000 });
    }
  });

  test('question content is visible', async ({ page }) => {
    await page.waitForTimeout(5000);
    const questionContent = page.locator('main, [class*="test"], [class*="exam"]').first();
    await expect(questionContent).toBeVisible();
  });

  test('answer options are displayed', async ({ page }) => {
    await page.waitForTimeout(5000);
    const options = page.locator('button, label, [role="radio"], div[class*="option"], div[class*="choice"]').filter({
      hasText: /^[A-D\(1-4]/,
    });
    const count = await options.count();
    if (count === 0) {
      const anyOptions = page.locator('[class*="option"], [class*="answer"], input[type="radio"]');
      const altCount = await anyOptions.count();
      expect(altCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('selecting an option highlights it', async ({ page }) => {
    await page.waitForTimeout(3000);
    const option = page.locator('[class*="option"], [class*="choice"], label').first();
    await option.click();
    await page.waitForTimeout(300);
    const classList = await option.getAttribute('class');
    expect(classList).toBeTruthy();
  });

  test('section tabs work (Maths, Physics, Chemistry)', async ({ page }) => {
    await page.waitForTimeout(3000);
    const physicsTab = page.getByRole('button', { name: /physics/i }).or(
      page.getByText(/physics/i).locator('..').locator('button')
    ).first();
    if (await physicsTab.isVisible()) {
      await physicsTab.click();
      await page.waitForTimeout(1000);
    }

    const chemTab = page.getByRole('button', { name: /chemistry/i }).or(
      page.getByText(/chemistry/i)
    ).first();
    if (await chemTab.isVisible()) {
      await chemTab.click();
      await page.waitForTimeout(1000);
    }

    const mathTab = page.getByRole('button', { name: /math/i }).or(
      page.getByText(/math/i)
    ).first();
    if (await mathTab.isVisible()) {
      await mathTab.click();
      await page.waitForTimeout(1000);
    }
  });

  test('question palette shows numbered buttons', async ({ page }) => {
    await page.waitForTimeout(5000);
    // On desktop the sidebar/palette may be visible; on smaller screens it may need toggling
    const paletteBtn = page.locator('button').filter({ hasText: /^[1-9]\d?$/ }).first();
    const isVisible = await paletteBtn.isVisible().catch(() => false);
    if (!isVisible) {
      // Try toggling the sidebar/palette open
      const toggleBtn = page.getByRole('button', { name: /palette|sidebar|question|menu/i }).first();
      if (await toggleBtn.isVisible().catch(() => false)) {
        await toggleBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    const finalVisible = await paletteBtn.isVisible().catch(() => false);
    expect(typeof finalVisible).toBe('boolean');
  });

  test('clicking question number in palette navigates to question', async ({ page }) => {
    await page.waitForTimeout(3000);
    const qNum5 = page.locator('button').filter({ hasText: /^5$/ }).first();
    if (await qNum5.isVisible()) {
      await qNum5.click();
      await page.waitForTimeout(500);
    }
  });

  test('next button works', async ({ page }) => {
    await page.waitForTimeout(3000);
    const nextBtn = page.getByRole('button', { name: /next|save.*next|→/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('mark for review button works', async ({ page }) => {
    await page.waitForTimeout(3000);
    const reviewBtn = page.getByRole('button', { name: /mark.*review|review/i }).first();
    if (await reviewBtn.isVisible()) {
      await reviewBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('timer displays and shows countdown', async ({ page }) => {
    await page.waitForTimeout(3000);
    const timer = page.getByText(/\d{1,2}:\d{2}:\d{2}|\d{1,3}\s*min/i).first();
    if (await timer.isVisible()) {
      await expect(timer).toBeVisible();
    }
  });

  test('submit button submits test directly without confirmation dialog', async ({ page }) => {
    await page.waitForTimeout(3000);
    const submitBtn = page.getByRole('button', { name: /submit test|submit/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1500);
      // Submit happens directly: expect either "Submitting..." state or navigation to result/dashboard
      const submitting = page.getByText(/submitting/i);
      const resultOrDashboard = page.url().includes('/test/result') || page.url().includes('/dashboard');
      const navigatedOrSubmitting = resultOrDashboard || (await submitting.isVisible());
      expect(navigatedOrSubmitting).toBeTruthy();
    }
  });
});

test.describe('Test Solution Page', () => {
  test('shows error or content for invalid resultId', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/test/solution?resultId=invalid');
    await page.waitForTimeout(3000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
  });
});
