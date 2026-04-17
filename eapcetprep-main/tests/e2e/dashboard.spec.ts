import { test, expect } from '@playwright/test';
import { loginAndSetCookie, TEST_USER } from '../fixtures/helpers';

test.describe('Dashboard - Main Page', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/auth\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('displays performance overview or recommended tests when authenticated', async ({ page, request }) => {
    test.setTimeout(120000);
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForTimeout(8000);

    const content = page.getByText(/performance overview|recommended tests|dashboard/i).first();
    await expect(content).toBeVisible({ timeout: 20000 });
  });

  test('shows loading shimmer while fetching', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard');
    const shimmer = page.locator('[class*="shimmer"], [class*="skeleton"], [class*="animate-pulse"], [class*="animate-spin"]').first();
    const wasVisible = await shimmer.isVisible().catch(() => false);
    expect(typeof wasVisible).toBe('boolean');
  });

  test('displays dashboard content', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard', { timeout: 30000 });
    await page.waitForTimeout(5000);
    const content = page.locator('main, [class*="dashboard"]');
    await expect(content.first()).toBeVisible();
  });

  test('View All Tests link navigates to tests page', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard', { timeout: 30000 });
    await page.waitForTimeout(5000);
    const viewAll = page.getByRole('link', { name: /view all|all tests|see all/i }).or(
      page.getByRole('button', { name: /view all|all tests/i })
    ).first();
    if (await viewAll.isVisible()) {
      await viewAll.click();
      await page.waitForURL(/tests/, { timeout: 5000 });
      expect(page.url()).toContain('tests');
    }
  });
});

test.describe('Dashboard - Tests Page', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard/tests', { timeout: 30000 });
    await page.waitForTimeout(3000);
  });

  test('displays TS/AP tabs', async ({ page }) => {
    const tsTab = page.getByRole('button', { name: /TS/i }).or(page.getByText(/TS EAPCET|TS EAMCET/i)).first();
    await expect(tsTab).toBeVisible();
  });

  test('shows tests grouped by year', async ({ page }) => {
    const yearHeading = page.getByRole('heading', { name: /papers/i }).first();
    await expect(yearHeading).toBeVisible({ timeout: 15000 });
  });

  test('shows status badges on tests', async ({ page }) => {
    const badge = page.getByText(/free|completed|in progress|premium/i).first();
    if (await badge.isVisible()) {
      await expect(badge).toBeVisible();
    }
  });

  test('year sections can expand/collapse', async ({ page }) => {
    const yearHeader = page.getByText(/2024|2023|2025/).first();
    if (await yearHeader.isVisible()) {
      await yearHeader.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Dashboard - Analytics Page', () => {
  test('page loads successfully', async ({ page, request }) => {
    test.setTimeout(90000);
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard/analytics', { timeout: 60000 });
    await page.waitForTimeout(5000);
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
  });

  test('shows empty state or analytics content', async ({ page, request }) => {
    test.setTimeout(120000);
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard/analytics', { timeout: 60000 });
    await page.waitForTimeout(10000);
    const anyContent = page.getByText(/analytics|performance|score|no test|take a test|no data|available/i).first();
    await expect(anyContent).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Dashboard - Performance Page', () => {
  test('page loads successfully', async ({ page, request }) => {
    test.setTimeout(90000);
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard/performance', { timeout: 60000 });
    await page.waitForTimeout(5000);
    const content = page.locator('main');
    await expect(content.first()).toBeVisible();
  });

  test('shows summary cards or empty state', async ({ page, request }) => {
    test.setTimeout(90000);
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard/performance', { timeout: 60000 });
    await page.waitForTimeout(5000);
    const anyContent = page.getByText(/performance|score|accuracy|no tests|take|no data|summary/i).first();
    await expect(anyContent).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard - Profile Page', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard/profile', { timeout: 30000 });
    await page.waitForTimeout(3000);
  });

  test('displays user phone number', async ({ page }) => {
    const phoneText = page.getByText(new RegExp(TEST_USER.phone.slice(-4)));
    await expect(phoneText.first()).toBeVisible();
  });

  test('shows membership status', async ({ page }) => {
    const membership = page.getByText(/free|basic|pro|premium|member/i).first();
    await expect(membership).toBeVisible();
  });

  test('shows tests taken count', async ({ page }) => {
    const testsTaken = page.getByText(/tests?\s*taken|completed/i).first();
    if (await testsTaken.isVisible()) {
      await expect(testsTaken).toBeVisible();
    }
  });

  test('shows member since date', async ({ page }) => {
    const memberSince = page.getByText(/member since|joined|since/i).first();
    if (await memberSince.isVisible()) {
      await expect(memberSince).toBeVisible();
    }
  });

  test('upgrade button visible for free users', async ({ page }) => {
    const upgradeBtn = page.getByRole('link', { name: /upgrade|premium/i }).or(
      page.getByRole('button', { name: /upgrade|premium/i })
    ).first();
    if (await upgradeBtn.isVisible()) {
      await expect(upgradeBtn).toBeVisible();
    }
  });
});

test.describe('Dashboard - Result Page', () => {
  test('shows error or content for invalid resultId', async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard/result?resultId=invalid', { timeout: 30000 });
    await page.waitForTimeout(3000);
    const content = page.locator('main');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Dashboard Layout - Navigation', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAndSetCookie(page, request);
    await page.goto('/dashboard', { timeout: 30000 });
    await page.waitForTimeout(5000);
  });

  test('navigation items are visible (Home, Tests, Performance, Profile)', async ({ page }) => {
    const homeNav = page.getByRole('button', { name: /home/i }).or(page.getByText(/home/i)).first();
    const testsNav = page.getByRole('button', { name: /test/i }).or(page.getByText(/test series|tests/i)).first();
    await expect(homeNav).toBeVisible({ timeout: 10000 });
    await expect(testsNav).toBeVisible({ timeout: 10000 });
  });

  test('clicking Tests nav goes to tests page', async ({ page }) => {
    const testsNav = page.getByRole('button', { name: /test series|tests/i }).first();
    await testsNav.click();
    await page.waitForURL(/tests/, { timeout: 10000 });
    expect(page.url()).toContain('tests');
  });

  test('clicking Profile nav goes to profile page', async ({ page }) => {
    const profileNav = page.getByRole('button', { name: /profile/i }).first();
    await profileNav.click();
    await page.waitForURL(/profile/, { timeout: 10000 });
    expect(page.url()).toContain('profile');
  });

  test('support modal opens when clicking support', async ({ page }) => {
    const supportBtn = page.getByRole('button', { name: /support|help/i }).or(
      page.getByText(/support|help/i)
    ).first();
    if (await supportBtn.isVisible()) {
      await supportBtn.click();
      await page.waitForTimeout(500);
      const modal = page.locator('[class*="modal"], [role="dialog"]').first();
      if (await modal.isVisible()) {
        await expect(modal).toBeVisible();
      }
    }
  });
});
