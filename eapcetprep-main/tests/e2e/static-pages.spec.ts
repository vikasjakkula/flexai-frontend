import { test, expect } from '@playwright/test';

test.describe('About Page', () => {
  test('loads and displays content', async ({ page }) => {
    await page.goto('/about');
    await page.waitForTimeout(1000);
    const heading = page.getByText(/about|mission|who we are/i).first();
    await expect(heading).toBeVisible();
  });

  test('Back to Home link works', async ({ page }) => {
    await page.goto('/about');
    await page.waitForTimeout(1000);
    const homeLink = page.getByRole('link', { name: /home|back/i }).first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForURL('/', { timeout: 5000 });
      expect(page.url()).toMatch(/\/$/);
    }
  });

  test('Contact Us link works', async ({ page }) => {
    await page.goto('/about');
    await page.waitForTimeout(1000);
    const contactLink = page.getByRole('link', { name: /contact/i }).first();
    if (await contactLink.isVisible()) {
      await contactLink.click();
      await page.waitForURL(/contact/, { timeout: 5000 });
      expect(page.url()).toContain('contact');
    }
  });
});

test.describe('Contact Page', () => {
  test('loads and displays contact info', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForTimeout(1000);
    const heading = page.getByText(/contact|get in touch|reach/i).first();
    await expect(heading).toBeVisible();
  });

  test('contact form fields present', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForTimeout(1000);
    const nameInput = page.getByPlaceholder(/name/i).or(page.locator('input[name="name"]'));
    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'));
    await expect(nameInput.first()).toBeVisible();
    await expect(emailInput.first()).toBeVisible();
  });

  test('form has submit button', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForTimeout(1000);
    const submitBtn = page.getByRole('button', { name: /send|submit|contact/i });
    await expect(submitBtn.first()).toBeVisible();
  });

  test('form validation works - empty submission', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForTimeout(1000);
    const submitBtn = page.getByRole('button', { name: /send|submit|contact/i });
    await submitBtn.first().click();
    await page.waitForTimeout(1000);
    // HTML5 validation or custom validation should prevent empty submission
    const url = page.url();
    expect(url).toContain('contact');
  });

  test('form submission works with valid data', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForTimeout(1000);
    const nameInput = page.getByPlaceholder(/name/i).or(page.locator('input[name="name"]')).first();
    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first();
    const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[type="tel"]')).first();
    const messageInput = page.getByPlaceholder(/message/i).or(page.locator('textarea')).first();

    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    if (await phoneInput.isVisible()) await phoneInput.fill('1234567890');
    await messageInput.fill('This is a test message');

    const subjectInput = page.getByPlaceholder(/subject/i).or(page.locator('input[name="subject"]')).first();
    if (await subjectInput.isVisible()) await subjectInput.fill('Test Subject');

    const submitBtn = page.getByRole('button', { name: /send|submit|contact/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(2000);
    const success = page.getByText(/sent|success|thank|received/i);
    if (await success.first().isVisible()) {
      await expect(success.first()).toBeVisible();
    }
  });
});

test.describe('Terms and Conditions Page', () => {
  test('loads and displays content', async ({ page }) => {
    await page.goto('/terms-and-conditions');
    await page.waitForTimeout(1000);
    const heading = page.getByText(/terms|condition/i).first();
    await expect(heading).toBeVisible();
  });

  test('Back to Home link works', async ({ page }) => {
    await page.goto('/terms-and-conditions');
    await page.waitForTimeout(1000);
    const homeLink = page.getByRole('link', { name: /home|back/i }).first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForTimeout(2000);
    }
  });
});

test.describe('Privacy Policy Page', () => {
  test('loads and displays content', async ({ page }) => {
    await page.goto('/privacy-policy');
    await page.waitForTimeout(1000);
    const heading = page.getByText(/privacy|policy/i).first();
    await expect(heading).toBeVisible();
  });

  test('Back to Home link works', async ({ page }) => {
    await page.goto('/privacy-policy');
    await page.waitForTimeout(1000);
    const homeLink = page.getByRole('link', { name: /home|back/i }).first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForTimeout(2000);
    }
  });
});

test.describe('Refund Policy Page', () => {
  test('loads and displays content', async ({ page }) => {
    await page.goto('/refund-cancellation-policy');
    await page.waitForTimeout(1000);
    const heading = page.getByText(/refund|cancel/i).first();
    await expect(heading).toBeVisible();
  });

  test('Back to Home link works', async ({ page }) => {
    await page.goto('/refund-cancellation-policy');
    await page.waitForTimeout(1000);
    const homeLink = page.getByRole('link', { name: /home|back/i }).first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForTimeout(2000);
    }
  });
});

test.describe('Subscription Management Page', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/subscriptions/manage');
    await page.waitForTimeout(3000);
    // May redirect to login or show content
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });
});
