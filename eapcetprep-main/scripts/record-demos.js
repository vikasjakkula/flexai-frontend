/**
 * EapcetPro Demo Video Recorder
 * Uses Playwright to record 4 fast-paced mobile demo videos.
 * Run: node scripts/record-demos.js
 * (Make sure `npm run dev` is running on localhost:3000 first)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const DEMO_PHONE = '9876543210';
const DEMO_PASSWORD = 'demo@123';
const VIDEO_DIR = path.join(__dirname, '..', 'demo-videos');

// iPhone 14 Pro mobile viewport
const VIEWPORT = { width: 390, height: 844 };

// Ensure output directory exists
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** Simulate natural typing with per-char delay */
async function typeNaturally(page, selector, text, delay = 50) {
  await page.click(selector);
  for (const char of text) {
    await page.keyboard.type(char);
    await sleep(delay + Math.random() * 30);
  }
}

/** Smooth scroll by amount pixels */
async function smoothScroll(page, amount, steps = 10, stepDelay = 60) {
  const step = amount / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step);
    await sleep(stepDelay);
  }
}

/** Scroll to bottom of page smoothly */
async function scrollToBottom(page, stepSize = 300, stepDelay = 400) {
  let previousHeight = 0;
  let currentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  while (previousHeight < currentHeight) {
    await smoothScroll(page, stepSize, 6, 50);
    await sleep(stepDelay);
    previousHeight = currentHeight;
    currentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  }
}

/** Scroll the main content container to bottom (for dashboard tabs) */
async function scrollContentToBottom(page, stepSize = 250, stepDelay = 350) {
  // The dashboard has overflow on the main container; use mouse wheel
  // First move mouse to center of viewport
  await page.mouse.move(195, 400);
  let lastScrollTop = -1;
  for (let i = 0; i < 20; i++) {
    const scrollTop = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop);
    if (scrollTop === lastScrollTop) break;
    lastScrollTop = scrollTop;
    await smoothScroll(page, stepSize, 6, 50);
    await sleep(stepDelay);
  }
}

/** Scroll back to top */
async function scrollToTop(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(500);
}

/** Click a bottom-nav tab by label */
async function clickTab(page, label) {
  await page.waitForSelector('nav', { timeout: 15000 }).catch(() => {});
  await sleep(300);
  // Use JS click to avoid overlay interception issues
  const clicked = await page.evaluate((lbl) => {
    const spans = document.querySelectorAll('nav button span');
    for (const span of spans) {
      if (span.textContent?.trim() === lbl) {
        const btn = span.closest('button');
        if (btn) { btn.click(); return true; }
      }
    }
    return false;
  }, label);
  if (clicked) {
    await sleep(800);
    return;
  }
  // Fallback: force click
  const btn = page.locator('nav button').filter({ hasText: label }).first();
  await btn.click({ force: true }).catch(() => {});
  await sleep(800);
}

/** Wait for dashboard to finish loading */
async function waitForDashboardLoad(page) {
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 25000 }).catch(() => {});
  await sleep(1500);
}

/** Dismiss all overlays (paywall, spin wheel, download dialog, PWA modal) */
async function dismissAllOverlays(page) {
  for (let attempt = 0; attempt < 5; attempt++) {
    // Check for any fixed overlay blocking the page
    const hasOverlay = await page.evaluate(() => {
      const overlays = document.querySelectorAll('.fixed, [class*="fixed"]');
      for (const el of overlays) {
        const style = window.getComputedStyle(el);
        if (style.zIndex && parseInt(style.zIndex) >= 40 && style.display !== 'none') {
          return true;
        }
      }
      return false;
    }).catch(() => false);

    if (!hasOverlay) break;

    // Try close button with aria-label
    const ariaClose = page.locator('button[aria-label="Close"]').first();
    if (await ariaClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await ariaClose.click({ force: true });
      await sleep(800);
      continue;
    }

    // Try X icon buttons in overlays (click parent button of svg)
    const xBtnParent = page.locator('.fixed button:has(svg)').first();
    if (await xBtnParent.isVisible({ timeout: 1000 }).catch(() => false)) {
      await xBtnParent.click({ force: true }).catch(() => {});
      await sleep(800);
      continue;
    }

    // Try "Not now", "Maybe later", "Skip", "Don't show", "I have already downloaded" type buttons
    const dismissBtn = page.locator('button').filter({ hasText: /not now|maybe later|skip|no thanks|close|dismiss|don't show|already downloaded/i }).first();
    if (await dismissBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dismissBtn.click({ force: true });
      await sleep(800);
      continue;
    }

    // Try Escape key as last resort
    await page.keyboard.press('Escape');
    await sleep(500);
  }
}

/** Record a single demo video */
async function recordDemo(name, description, fn) {
  console.log(`\n🎬 Recording: ${name} — ${description}`);
  const browser = await chromium.launch({ headless: false, slowMo: 20 });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    recordVideo: { dir: VIDEO_DIR, size: VIEWPORT },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  try {
    await fn(page);
    await sleep(1500); // linger on final frame
  } catch (err) {
    console.error(`  ❌ Error in ${name}:`, err.message);
  }

  const video = page.video();
  await context.close();
  await browser.close();

  if (video) {
    const src = await video.path();
    if (src && fs.existsSync(src)) {
      const dest = path.join(VIDEO_DIR, `${name}.webm`);
      fs.renameSync(src, dest);
      const stat = fs.statSync(dest);
      console.log(`  ✅ Saved ${name}.webm (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO 1 — Onboarding: Landing → Register → Onboarding → Dashboard → Paywall → Spin → Dashboard Tour
// ─────────────────────────────────────────────────────────────────────────────
async function video1_onboarding(page) {
  // 1. Start on the landing page
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  // Scroll down a bit to showcase landing
  await smoothScroll(page, 400, 8, 80);
  await sleep(800);
  await smoothScroll(page, -400, 8, 60);
  await sleep(600);

  // 2. Click "get started" button (has shake animation, use force click)
  const getStarted = page.locator('text=get started').first();
  if (await getStarted.isVisible({ timeout: 3000 }).catch(() => false)) {
    await getStarted.click({ force: true });
  } else {
    // Fallback: navigate directly
    await page.goto(`${BASE_URL}/auth/register`, { waitUntil: 'domcontentloaded' });
  }
  await sleep(2000);

  // 3. Register with random 10-digit phone
  const randomPhone = '98' + Math.floor(10000000 + Math.random() * 90000000).toString();
  await typeNaturally(page, '#phone', randomPhone, 45);
  await sleep(400);
  await typeNaturally(page, '#password', 'Demo@1234', 50);
  await sleep(600);

  // Click "Create Account"
  const createBtn = page.locator('button[type="submit"]');
  await createBtn.click();
  await sleep(3000);

  // 4. Onboarding flow
  // Wait for onboarding page
  await page.waitForURL(/onboarding/, { timeout: 15000 }).catch(() => {});
  await sleep(1500);

  // Step 1: Enter name (Telugu boy name)
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.fill('');
  await typeNaturally(page, 'input[type="text"]', 'Venkata Sai Krishna', 40);
  await sleep(400);
  // Click Continue
  const continueBtn = page.locator('button').filter({ hasText: 'Continue' }).first();
  await continueBtn.click();
  await sleep(800);

  // Step 2: Select exam type - TS EAPCET
  await sleep(500);
  const tsEapcet = page.locator('button').filter({ hasText: 'TS EAPCET' }).first();
  await tsEapcet.click();
  await sleep(800);

  // Step 3: Select field - Engineering
  await sleep(500);
  const engineering = page.locator('button').filter({ hasText: 'Engineering' }).first();
  await engineering.click();
  await sleep(800);

  // Step 4: Current marks range - 60-80
  await sleep(500);
  const marksRange = page.locator('button').filter({ hasText: '60-80' }).first();
  await marksRange.click();
  await sleep(800);

  // Step 5: Expected rank - Less than 5K
  await sleep(500);
  const expectedRank = page.locator('button').filter({ hasText: 'less than 5k' }).first();
  if (await expectedRank.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expectedRank.click();
  } else {
    // Try case-insensitive
    const rankBtn = page.locator('button').filter({ hasText: /less than 5k/i }).first();
    await rankBtn.click();
  }
  await sleep(1000);

  // Step 6: Plan summary → click "Start preparing"
  await sleep(1500);
  const startPrep = page.locator('button').filter({ hasText: /start preparing/i }).first();
  if (await startPrep.isVisible({ timeout: 5000 }).catch(() => false)) {
    await startPrep.click();
  }
  await sleep(3000);

  // 5. Dashboard with paywall modal (auto-opens because ?paywall=1)
  await page.waitForURL(/dashboard/, { timeout: 20000 }).catch(() => {});
  await waitForDashboardLoad(page);
  await sleep(2000);

  // Paywall modal should be visible, show it briefly
  await sleep(2000);

  // 6. Click X (close) on paywall — this triggers spin wheel
  // The close button can be intercepted by child divs, use force click
  const paywallClose = page.locator('button[aria-label="Close"]').first();
  if (await paywallClose.isVisible({ timeout: 3000 }).catch(() => false)) {
    await paywallClose.click({ force: true });
  }
  await sleep(2000);

  // 7. Spin wheel should appear — click the spin button
  const spinBtn = page.locator('button').filter({ hasText: /spin/i }).first();
  if (await spinBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await spinBtn.click({ force: true });
    // Wait for spin animation (7.5 seconds)
    await sleep(8500);
    // Show the result for a moment
    await sleep(2000);
  }

  // 8. Dismiss spin wheel — click the dark backdrop (outside the card)
  // The SpinWheel backdrop div has onClick={onClose}, but inner card stops propagation
  // Click at coordinates outside the card (top of screen where backdrop is visible)
  await sleep(1000);
  await page.mouse.click(195, 15); // Click top-center where only backdrop is
  await sleep(1500);

  // 9. If paywall is back, dismiss it. The handleClose logic means:
  // First close shows spin wheel, second close actually dismisses.
  // After spin wheel is dismissed via backdrop, we're back to paywall.
  // Click close on paywall to truly dismiss.
  const paywallClose2 = page.locator('button[aria-label="Close"]').first();
  if (await paywallClose2.isVisible({ timeout: 3000 }).catch(() => false)) {
    // This second click on paywall close should actually close it (spinWheelShownRef is true)
    await paywallClose2.click({ force: true });
    await sleep(1000);
  }

  // Extra: dismiss any remaining overlays via JS
  await page.evaluate(() => {
    document.querySelectorAll('.fixed').forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.zIndex && parseInt(style.zIndex) >= 40) {
        el.style.display = 'none';
      }
    });
  }).catch(() => {});
  await sleep(500);

  // 10. Now on dashboard — show Home tab scrolled to bottom
  await sleep(1000);
  await scrollContentToBottom(page, 250, 350);
  await sleep(800);
  await scrollToTop(page);
  await sleep(600);

  // 11. Go to Chapter wise (Quizzes) tab
  await clickTab(page, 'Chapter wise');
  await sleep(1500);
  // Wait for chapters to load
  await page.waitForFunction(() => !document.body.innerText.includes('Loading chapters...'), { timeout: 15000 }).catch(() => {});
  await sleep(800);
  await scrollContentToBottom(page, 250, 350);
  await sleep(800);
  await scrollToTop(page);
  await sleep(600);

  // 12. Go to Mock tests tab
  await clickTab(page, 'Mock tests');
  await sleep(1500);
  // Wait for tests to load
  await page.waitForFunction(() => !document.body.innerText.includes('Loading...'), { timeout: 15000 }).catch(() => {});
  await sleep(800);
  await scrollContentToBottom(page, 250, 350);
  await sleep(1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO 2 — Dashboard Demo with demo account
// ─────────────────────────────────────────────────────────────────────────────
async function video2_dashboardDemo(page) {
  // 1. Login with demo credentials
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(1500);
  await typeNaturally(page, '#phone', DEMO_PHONE, 45);
  await sleep(400);
  await typeNaturally(page, '#password', DEMO_PASSWORD, 50);
  await sleep(600);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 30000 }).catch(async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  });
  await waitForDashboardLoad(page);
  // Dismiss any overlays (paywall, download dialog, PWA modal)
  await dismissAllOverlays(page);

  // 2. Show Home tab — scroll to bottom then back
  await sleep(1000);
  await scrollContentToBottom(page, 200, 300);
  await sleep(600);
  await scrollToTop(page);
  await sleep(600);

  // 3. Go to Chapter wise tab
  await clickTab(page, 'Chapter wise');
  await sleep(1500);
  await page.waitForFunction(() => !document.body.innerText.includes('Loading chapters...'), { timeout: 15000 }).catch(() => {});
  await sleep(1000);

  // Show chapter list
  await smoothScroll(page, 200, 6, 60);
  await sleep(600);
  await scrollToTop(page);
  await sleep(400);

  // Click on first chapter
  const chapterRow = page.locator('div[class*="cursor-pointer"]').first();
  if (await chapterRow.isVisible({ timeout: 3000 }).catch(() => false)) {
    await chapterRow.click();
    await sleep(1500);
    // Show quizzes in this chapter
    await smoothScroll(page, 200, 6, 60);
    await sleep(800);
    await scrollToTop(page);
    await sleep(500);

    // Go back to chapter list
    const backBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backBtn.click();
      await sleep(800);
    }
  }

  // 4. Go to Mock tests tab
  await dismissAllOverlays(page);
  await clickTab(page, 'Mock tests');
  await sleep(1500);
  await page.waitForFunction(() => !document.body.innerText.includes('Loading...'), { timeout: 15000 }).catch(() => {});
  await sleep(1000);
  // Wait for test cards to appear
  await sleep(1000);
  await scrollContentToBottom(page, 200, 300);
  await sleep(600);
  await scrollToTop(page);
  await sleep(600);

  // 5. Go to Performance tab
  await dismissAllOverlays(page);
  await clickTab(page, 'Performance');
  await sleep(1500);
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
  await sleep(1000);
  // Scroll through performance data
  await scrollContentToBottom(page, 200, 400);
  await sleep(1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO 3 — Quiz Demo: Chapter wise → Click chapter → Click quiz → Answer → Submit → Result
// ─────────────────────────────────────────────────────────────────────────────
async function video3_quizDemo(page) {
  // Login with demo account
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(1000);
  await typeNaturally(page, '#phone', DEMO_PHONE, 45);
  await sleep(300);
  await typeNaturally(page, '#password', DEMO_PASSWORD, 50);
  await sleep(500);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 30000 }).catch(async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  });
  await waitForDashboardLoad(page);
  await dismissAllOverlays(page);

  // 1. Go to Chapter wise tab
  await clickTab(page, 'Chapter wise');
  await sleep(1500);
  await page.waitForFunction(() => !document.body.innerText.includes('Loading chapters...'), { timeout: 15000 }).catch(() => {});
  await sleep(1000);

  // 2. Click on a chapter
  const chapterRow = page.locator('div[class*="cursor-pointer"]').first();
  if (await chapterRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    await chapterRow.click();
    await sleep(1500);
  }

  // If paywall appeared, dismiss it
  const paywallVisible = await page.locator('text=Unlock Full Access').isVisible({ timeout: 2000 }).catch(() => false);
  if (paywallVisible) {
    await dismissAllOverlays(page);
    console.log('  ⚠️ Paywall appeared — demo account may not be premium. Attempting to continue...');
    // Try clicking the chapter again after dismissing
    const chapterRow2 = page.locator('div[class*="cursor-pointer"]').first();
    if (await chapterRow2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chapterRow2.click();
      await sleep(1500);
    }
    // If paywall appears again, give up
    const paywallAgain = await page.locator('text=Unlock Full Access').isVisible({ timeout: 2000 }).catch(() => false);
    if (paywallAgain) {
      await dismissAllOverlays(page);
      console.log('  ❌ Paywall persists — demo account is not premium. Quiz demo limited.');
      return;
    }
  }

  // 3. Click Start on first quiz
  await sleep(800);
  const startQuiz = page.locator('button').filter({ hasText: /^Start$/ }).first();
  const reattemptQuiz = page.locator('button').filter({ hasText: /Reattempt/ }).first();
  if (await startQuiz.isVisible({ timeout: 3000 }).catch(() => false)) {
    await startQuiz.click();
  } else if (await reattemptQuiz.isVisible({ timeout: 3000 }).catch(() => false)) {
    await reattemptQuiz.click();
  }
  await sleep(2000);

  // Wait for quiz questions to load
  await page.waitForFunction(() => !document.body.innerText.includes('Loading quiz questions...'), { timeout: 20000 }).catch(() => {});
  await sleep(1000);

  // 4. Answer quiz questions with random options — with natural pacing
  const maxQuestions = 20; // quizzes have up to 20 questions
  for (let i = 0; i < maxQuestions; i++) {
    // Check if quiz is complete
    const isComplete = await page.locator('text=Quiz Complete!').isVisible({ timeout: 500 }).catch(() => false);
    if (isComplete) break;

    // Brief pause to show the question
    await sleep(800);

    // Select a random option (a, b, c, or d) — click one of the option buttons
    const options = page.locator('main button[class*="rounded-xl"][class*="border-2"]');
    const optCount = await options.count().catch(() => 0);
    if (optCount > 0) {
      const randomIdx = Math.floor(Math.random() * Math.min(optCount, 4));
      await options.nth(randomIdx).click();
      await sleep(800); // Show the answer feedback (correct/wrong)
    }

    // Check if this is the last question (Finish button visible)
    const finishBtn = page.locator('footer button').filter({ hasText: /Finish/ }).first();
    const isLast = await finishBtn.isVisible({ timeout: 500 }).catch(() => false);

    if (isLast) {
      // Click Finish
      await sleep(600);
      await finishBtn.click();
      await sleep(2500);
      break;
    } else {
      // Click Next
      const nextBtn = page.locator('footer button').filter({ hasText: /Next/ }).first();
      if (await nextBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextBtn.click();
        await sleep(600);
      }
    }
  }

  // 5. Show result screen
  await sleep(3000);
  // Result should show "Quiz Complete!" with score
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO 4 — Mock Test Demo: Mock tests → Select paper → Instructions → Answer 5 per subject → Submit → Result
// ─────────────────────────────────────────────────────────────────────────────
async function video4_mockTestDemo(page) {
  // Login with demo account
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(1000);
  await typeNaturally(page, '#phone', DEMO_PHONE, 45);
  await sleep(300);
  await typeNaturally(page, '#password', DEMO_PASSWORD, 50);
  await sleep(500);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 30000 }).catch(async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  });
  await waitForDashboardLoad(page);
  await dismissAllOverlays(page);

  // 1. Go to Mock tests tab
  await clickTab(page, 'Mock tests');
  await sleep(1500);
  await page.waitForFunction(() => !document.body.innerText.includes('Loading...'), { timeout: 15000 }).catch(() => {});
  await sleep(1500);

  // 2. Click on first available test (previous year paper)
  // Find a test card with a start/play button
  const testCards = page.locator('button').filter({ hasText: /Start|Take Test|Attempt/i });
  const cardCount = await testCards.count().catch(() => 0);
  if (cardCount > 0) {
    await testCards.first().click();
  } else {
    // Try clicking any test card link
    const anyTestBtn = page.locator('button[class*="rounded"]').filter({ hasText: /Start/ }).first();
    await anyTestBtn.click().catch(async () => {
      // Last resort: find any clickable test
      const testItem = page.locator('div[class*="rounded-xl"]').filter({ hasText: /EAPCET|EAMCET/ }).first();
      await testItem.click().catch(() => {});
    });
  }
  await sleep(2000);

  // Check for paywall
  const paywallVisible2 = await page.locator('text=Unlock Full Access').isVisible({ timeout: 3000 }).catch(() => false);
  if (paywallVisible2) {
    await dismissAllOverlays(page);
    console.log('  ⚠️ Paywall appeared — demo account may not be premium. Retrying...');
    // Try clicking test again
    const testCards2 = page.locator('button').filter({ hasText: /Start|Take Test|Attempt/i });
    if (await testCards2.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await testCards2.first().click();
      await sleep(2000);
    }
    const paywallAgain = await page.locator('text=Unlock Full Access').isVisible({ timeout: 2000 }).catch(() => false);
    if (paywallAgain) {
      await dismissAllOverlays(page);
      console.log('  ❌ Paywall persists — demo account is not premium. Mock test demo limited.');
      return;
    }
  }

  // 3. Instructions page - scroll down and agree
  await page.waitForURL(/instructions|test/, { timeout: 15000 }).catch(() => {});
  await sleep(1500);

  // Scroll through instructions
  await smoothScroll(page, 300, 6, 80);
  await sleep(800);

  // Check the agreement checkbox
  const checkbox = page.locator('input[type="checkbox"]#terms');
  if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    await checkbox.check();
    await sleep(500);
  }

  // Click "I am ready to begin"
  const beginBtn = page.locator('button').filter({ hasText: /ready to begin|Start Test|Begin/i }).first();
  if (await beginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await beginBtn.click();
  }
  await sleep(3000);

  // 4. Test page loaded — answer 5 questions per subject
  await page.waitForURL(/test\/take/, { timeout: 20000 }).catch(() => {});
  await sleep(2000);

  // Wait for test to load (shimmer disappears)
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 30000 }).catch(() => {});
  await sleep(1500);

  // Close sidebar if open on mobile (use JS click since it may be outside viewport)
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Close sidebar"]');
    if (btn) btn.click();
  }).catch(() => {});
  await sleep(500);

  // Answer 5 Maths questions (Q1-Q5)
  console.log('  📝 Answering Maths questions...');
  for (let q = 0; q < 5; q++) {
    await answerCurrentQuestion(page);
    await sleep(300);
    // Click Save & Next
    const saveNext = page.locator('button').filter({ hasText: /Save & Next/i }).first();
    if (await saveNext.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveNext.click();
      await sleep(600);
    }
  }

  // Jump to Physics section (question 81)
  console.log('  📝 Jumping to Physics...');
  const physicsSection = page.locator('button').filter({ hasText: 'Physics' }).first();
  if (await physicsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
    await physicsSection.click();
    await sleep(1500);
  }

  // Answer 5 Physics questions
  for (let q = 0; q < 5; q++) {
    await answerCurrentQuestion(page);
    await sleep(300);
    const saveNext = page.locator('button').filter({ hasText: /Save & Next/i }).first();
    if (await saveNext.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveNext.click();
      await sleep(600);
    }
  }

  // Jump to Chemistry section (question 121)
  console.log('  📝 Jumping to Chemistry...');
  const chemSection = page.locator('button').filter({ hasText: 'Chemistry' }).first();
  if (await chemSection.isVisible({ timeout: 3000 }).catch(() => false)) {
    await chemSection.click();
    await sleep(1500);
  }

  // Answer 5 Chemistry questions
  for (let q = 0; q < 5; q++) {
    await answerCurrentQuestion(page);
    await sleep(300);
    const saveNext = page.locator('button').filter({ hasText: /Save & Next/i }).first();
    if (await saveNext.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveNext.click();
      await sleep(600);
    }
  }

  // 5. Submit the test — open sidebar via "Question List" button (mobile bottom nav)
  await sleep(1000);

  // Open sidebar and submit test
  // First open the sidebar via "Question List" button
  console.log('  📤 Submitting test...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent?.includes('Question List')) { btn.click(); return; }
    }
  }).catch(() => {});
  await sleep(1500); // Wait for sidebar slide animation

  // Try clicking SUBMIT TEST with retries
  let submitted = false;
  for (let retry = 0; retry < 3; retry++) {
    submitted = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent?.trim() === 'SUBMIT TEST') {
          btn.scrollIntoView();
          btn.click();
          return true;
        }
      }
      return false;
    });
    if (submitted) {
      console.log('  ✓ SUBMIT TEST clicked');
      break;
    }
    await sleep(1000);
  }

  if (!submitted) {
    console.log('  ⚠️ SUBMIT TEST not found in sidebar, trying alternative...');
    // Alternative: navigate directly to question 160 and use the Submit button
    // Close sidebar first
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Close sidebar"]');
      if (btn) btn.click();
    }).catch(() => {});
    await sleep(500);

    // Click Save & Next rapidly until we reach Q160 and it shows Submit Test
    for (let i = 0; i < 40; i++) {
      const found = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent?.trim() === 'Submit Test') { btn.click(); return true; }
        }
        // Click Save & Next if available
        for (const btn of buttons) {
          if (btn.textContent?.trim() === 'Save & Next') { btn.click(); return false; }
        }
        return false;
      });
      if (found) {
        submitted = true;
        break;
      }
      await sleep(150);
    }
  }
  await sleep(3000);

  // 6. Wait for result page
  await sleep(5000);
  await page.waitForURL(/result/, { timeout: 30000 }).catch(() => {});
  await sleep(3000);

  // 7. Show the result page — scroll to bottom
  await scrollContentToBottom(page, 200, 400);
  await sleep(1500);
}

/** Helper: select a random answer option on current question */
async function answerCurrentQuestion(page) {
  // Radio button options: #option-a, #option-b, #option-c, #option-d
  const options = ['#option-a', '#option-b', '#option-c', '#option-d'];
  const randomOption = options[Math.floor(Math.random() * options.length)];
  const radio = page.locator(randomOption);
  if (await radio.isVisible({ timeout: 2000 }).catch(() => false)) {
    await radio.click();
    await sleep(200);
  } else {
    // Fallback: click the label
    const label = page.locator(`label[for="${randomOption.slice(1)}"]`).first();
    await label.click().catch(() => {});
    await sleep(200);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 EapcetPro Demo Video Recorder');
  console.log(`📁 Output directory: ${VIDEO_DIR}`);
  console.log('─'.repeat(60));

  await recordDemo('01_onboarding',       'Landing → Register → Onboarding → Dashboard Tour', video1_onboarding);
  await recordDemo('02_dashboard_demo',    'Demo Account Dashboard Tour',                       video2_dashboardDemo);
  await recordDemo('03_quiz_demo',         'Chapter Quiz Answer & Result',                      video3_quizDemo);
  await recordDemo('04_mock_test_demo',    'Mock Test: 5 Qs per Subject → Submit → Result',    video4_mockTestDemo);

  console.log('\n✨ All demo videos recorded!');
  console.log(`📂 Find your videos in: ${VIDEO_DIR}`);
  console.log('\nFiles:');
  if (fs.existsSync(VIDEO_DIR)) {
    fs.readdirSync(VIDEO_DIR)
      .filter(f => f.endsWith('.webm'))
      .forEach(f => {
        const stat = fs.statSync(path.join(VIDEO_DIR, f));
        console.log(`  • ${f} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
      });
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
