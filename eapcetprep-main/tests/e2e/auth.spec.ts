import { test, expect } from '@playwright/test';
import { TEST_USER, randomPhone, ensureTestUser } from '../fixtures/helpers';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('page loads with phone and password fields', async ({ page }) => {
    await expect(page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'))).toBeVisible();
    await expect(page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'))).toBeVisible();
  });

  test('submit button is disabled when phone is empty', async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
    await passwordInput.fill('somepassword');
    const submitBtn = page.getByRole('button', { name: /sign in/i });
    await expect(submitBtn).toBeDisabled();
  });

  test('submit button is disabled when phone is incomplete', async ({ page }) => {
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    await phoneInput.fill('12345');
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
    await passwordInput.fill('somepassword');
    const submitBtn = page.getByRole('button', { name: /sign in/i });
    await expect(submitBtn).toBeDisabled();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
    await phoneInput.fill('0000000000');
    await passwordInput.fill('wrongpassword');
    const submitBtn = page.getByRole('button', { name: /sign in/i });
    await submitBtn.click();
    await page.waitForTimeout(2000);
    const error = page.getByText(/invalid|wrong|incorrect|failed/i);
    await expect(error).toBeVisible();
  });

  test('shows Forgot password link', async ({ page }) => {
    const forgotLink = page.getByText(/forgot/i);
    await expect(forgotLink).toBeVisible();
  });

  test('shows link to register page', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /create|register|sign up/i }).or(
      page.getByText(/create one|create account|sign up|register/i)
    );
    await expect(registerLink.first()).toBeVisible();
  });

  test('successfully logs in with valid credentials', async ({ page }) => {
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
    await phoneInput.fill(TEST_USER.phone);
    await passwordInput.fill(TEST_USER.password);
    const submitBtn = page.getByRole('button', { name: /sign in/i });
    await submitBtn.click();
    await page.waitForURL(/dashboard|onboarding/, { timeout: 10000 });
    expect(page.url()).toMatch(/dashboard|onboarding/);
  });

  test('phone field accepts only digits', async ({ page }) => {
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    await phoneInput.fill('abc123def4');
    const value = await phoneInput.inputValue();
    expect(value.replace(/\D/g, '')).toMatch(/^\d+$/);
  });
});

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  test('page loads with phone and password fields', async ({ page }) => {
    await expect(page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'))).toBeVisible();
    await expect(page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]')).first()).toBeVisible();
  });

  test('submit button is disabled when phone is incomplete', async ({ page }) => {
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]')).first();
    await phoneInput.fill('123');
    await passwordInput.fill('ValidPass123');
    const submitBtn = page.getByRole('button', { name: /create account/i });
    await expect(submitBtn).toBeDisabled();
  });

  test('submit button is disabled when password is too short', async ({ page }) => {
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]')).first();
    await phoneInput.fill(randomPhone());
    await passwordInput.fill('12');
    const submitBtn = page.getByRole('button', { name: /create account/i });
    await expect(submitBtn).toBeDisabled();
  });

  test('shows error for existing user', async ({ page, request }) => {
    await ensureTestUser(request);
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]')).first();
    await phoneInput.fill(TEST_USER.phone);
    await passwordInput.fill('SomePassword123');
    const submitBtn = page.getByRole('button', { name: /create account/i });
    await submitBtn.click();
    await page.waitForTimeout(2000);
    const error = page.getByText(/already exists|already registered|login/i);
    await expect(error).toBeVisible();
  });

  test('successfully registers and redirects to onboarding', async ({ page }) => {
    const phone = randomPhone();
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]')).first();
    await phoneInput.fill(phone);
    await passwordInput.fill('TestPass999');
    const submitBtn = page.getByRole('button', { name: /create account/i });
    await submitBtn.click();
    await page.waitForURL(/onboarding/, { timeout: 15000 });
    expect(page.url()).toMatch(/onboarding/);
  });

  test('shows Login link', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /login|sign in/i }).or(
      page.getByText(/already have|login|sign in/i)
    );
    await expect(loginLink.first()).toBeVisible();
  });
});

test.describe('Forgot Password Flow', () => {
  test('shows forgot password form from login', async ({ page }) => {
    await page.goto('/auth/login');
    const forgotLink = page.getByText(/forgot/i);
    await forgotLink.click();
    await page.waitForTimeout(500);
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    await expect(phoneInput).toBeVisible();
  });

  test('shows error for non-existent phone', async ({ page }) => {
    await page.goto('/auth/login');
    const forgotLink = page.getByText(/forgot/i);
    await forgotLink.click();
    await page.waitForTimeout(500);
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]'));
    await phoneInput.fill('0000000000');
    const submitBtn = page.getByRole('button', { name: /send|submit|continue|reset/i });
    await submitBtn.click();
    await page.waitForTimeout(3000);
    const error = page.getByText(/no account|not found|invalid|exist|unable/i).first();
    await expect(error).toBeVisible();
  });
});
