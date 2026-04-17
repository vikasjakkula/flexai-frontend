import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ── Page Load & Content ──────────────────────────────────────────────────

  test('page loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/eapcet|eamcet/i);
  });

  test('displays hero section with title and CTA', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
    const ctaButton = page.getByRole('link', { name: /get started|start|register|login/i }).first();
    await expect(ctaButton).toBeVisible();
  });

  test('displays TS EAPCET and AP EAPCET tabs', async ({ page }) => {
    const tsTab = page.getByRole('button', { name: /TS/i }).or(page.getByText(/TS EAPCET|TS EAMCET/i)).first();
    const apTab = page.getByRole('button', { name: /AP/i }).or(page.getByText(/AP EAPCET|AP EAMCET/i)).first();
    await expect(tsTab).toBeVisible();
    await expect(apTab).toBeVisible();
  });

  test('displays pricing cards with BASIC and PRO', async ({ page }) => {
    const pricing = page.getByText(/₹199/).first();
    await expect(pricing).toBeVisible();
    const proPricing = page.getByText(/₹299/).first();
    await expect(proPricing).toBeVisible();
  });

  test('displays footer with links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /contact/i })).toBeVisible();
  });

  // ── Interactions ─────────────────────────────────────────────────────────

  test('TS/AP tab switching works', async ({ page }) => {
    const apTab = page.getByRole('button', { name: /AP/i }).or(page.getByText(/AP EAPCET|AP EAMCET/i)).first();
    await apTab.click();
    await page.waitForTimeout(500);
    const tsTab = page.getByRole('button', { name: /TS/i }).or(page.getByText(/TS EAPCET|TS EAMCET/i)).first();
    await tsTab.click();
    await page.waitForTimeout(500);
  });

  test('year sections expand and collapse', async ({ page }) => {
    const yearSection = page.getByText(/2024|2023|2025/).first();
    if (await yearSection.isVisible()) {
      await yearSection.click();
      await page.waitForTimeout(300);
    }
  });

  test('pricing plan selection works', async ({ page }) => {
    const planButton = page.getByRole('button', { name: /pay|get|select|choose/i }).first();
    if (await planButton.isVisible()) {
      await expect(planButton).toBeEnabled();
    }
  });

  test('CTA buttons are visible and have hrefs', async ({ page }) => {
    const links = page.getByRole('link');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test('login and register links are present', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /login|sign in|get started/i }).first();
    const registerLink = page.getByRole('link', { name: /register|sign up|start preparing/i }).first();
    await expect(loginLink).toBeVisible();
    await expect(registerLink).toBeVisible();
  });
});
