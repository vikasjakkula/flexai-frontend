import { test, expect } from '@playwright/test';
import { loginAndSetCookie } from '../fixtures/helpers';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAndSetCookie(page, request);
  });

  test('step 1: name input is visible', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(1000);
    const nameInput = page.getByPlaceholder(/name/i).or(page.locator('input[type="text"]').first());
    await expect(nameInput).toBeVisible();
  });

  test('step 2: exam type selection (TS/AP)', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(1000);
    const nameInput = page.getByPlaceholder(/name/i).or(page.locator('input[type="text"]').first());
    await nameInput.fill('Test Student');

    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true });
    await continueBtn.click();
    await page.waitForTimeout(500);

    const tsOption = page.getByText(/TS EAPCET|TS EAMCET|Telangana/i).first();
    const apOption = page.getByText(/AP EAPCET|AP EAMCET|Andhra/i).first();
    const eitherVisible = await tsOption.isVisible().catch(() => false)
      || await apOption.isVisible().catch(() => false);
    expect(eitherVisible).toBe(true);
  });

  test('back button works between steps', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(1000);
    const nameInput = page.getByPlaceholder(/name/i).or(page.locator('input[type="text"]').first());
    await nameInput.fill('Test Student');
    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true });
    await continueBtn.click();
    await page.waitForTimeout(500);

    const backBtn = page.getByRole('button', { name: /back|previous/i }).or(page.getByText(/back/i));
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(500);
      await expect(nameInput).toBeVisible();
    }
  });

  test('continue button disabled until selection made', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(1000);
    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true });
    const nameInput = page.getByPlaceholder(/name/i).or(page.locator('input[type="text"]').first());
    const nameValue = await nameInput.inputValue();
    if (!nameValue) {
      const isDisabled = await continueBtn.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });
});

test.describe('Onboarding Summary', () => {
  test('displays action plan when navigated', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/onboarding/summary');
    await page.waitForTimeout(2000);
    const heading = page.getByText(/plan|summary|ready|action|goal/i).first();
    await expect(heading).toBeVisible();
  });
});

test.describe('Onboarding Paywall', () => {
  test('displays pricing plans', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/onboarding/paywall');
    await page.waitForTimeout(2000);
    const basicPrice = page.getByText(/₹199/);
    const proPrice = page.getByText(/₹299/);
    const eitherVisible = await basicPrice.first().isVisible().catch(() => false)
      || await proPrice.first().isVisible().catch(() => false);
    expect(eitherVisible).toBe(true);
  });

  test('try for free link is present', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/onboarding/paywall');
    await page.waitForTimeout(2000);
    const freeLink = page.getByText(/free|skip|later|try/i).first();
    await expect(freeLink).toBeVisible();
  });
});
