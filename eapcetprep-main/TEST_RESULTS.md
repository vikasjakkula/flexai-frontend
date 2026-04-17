# EAPCET Prep - Test Results Report

**Run Date:** March 2, 2026  
**Total Tests:** 284  
**Passed:** 199  
**Failed:** 80  
**Skipped:** 5  
**Duration:** 25.9 minutes  

---

## Summary

| Category | Passed | Failed | Skipped |
|----------|--------|--------|---------|
| API - Auth | 24 | 7 | 0 |
| API - Test/Attempt | 13 | 12 | 0 |
| API - Payments | 8 | 6 | 0 |
| API - Analytics | 4 | 10 | 0 |
| API - Affiliate | 12 | 1 | 5 |
| API - Other | 12 | 3 | 0 |
| API - Middleware | 14 | 4 | 0 |
| E2E - Landing | 9 | 1 | 0 |
| E2E - Auth | 8 | 7 | 0 |
| E2E - Onboarding | 1 | 5 | 0 |
| E2E - Dashboard | 10 | 13 | 0 |
| E2E - Test Taking | 11 | 2 | 0 |
| E2E - Payment | 4 | 5 | 0 |
| E2E - Affiliate | 10 | 2 | 0 |
| E2E - Static Pages | 14 | 1 | 0 |
| Responsive - Mobile | 13 | 2 | 0 |
| Responsive - Tablet | all pass | 0 | 0 |

---

## Failed Tests - Detailed Breakdown

### Category 1: Authentication Cookie Not Accessible via `set-cookie` Header

**Root Cause:** The `loginViaAPI` helper reads `set-cookie` from the response headers, but Next.js App Router sets cookies via `cookies().set()` which doesn't expose them in the response `set-cookie` header when accessed through Playwright's `request` context. This means the session token is never captured, causing all authenticated API tests to fail.

**Affected Tests (47 tests):**

#### API - Auth
| # | Test | File:Line | Error |
|---|------|-----------|-------|
| 1 | `returns 200 and sets session cookie on valid credentials` | `auth.api.spec.ts:38` | `set-cookie` header is empty; cookie set via `cookies()` not returned in response |
| 2 | `session cookie is httpOnly` | `auth.api.spec.ts:49` | Same — no `set-cookie` header |
| 3 | `returns 400 when user already exists with phone` | `auth.api.spec.ts:99` | Returns 200 instead of 400 — test user may not exist in DB |
| 4 | `returns authenticated: true when valid session exists` | `auth.api.spec.ts:147` | Token is empty string, so request has no auth |
| 5 | `successfully saves onboarding data` | `auth.api.spec.ts:237` | No valid token → 401/500 |
| 6 | `returns user profile with tests_taken count` | `auth.api.spec.ts:260` | No valid token → 401/500 |
| 7 | `returns isPremium field` | `auth.api.spec.ts:278` | No valid token → 401/500 |

#### API - Test Endpoints
| # | Test | File:Line | Error |
|---|------|-----------|-------|
| 8 | `returns tests grouped by year for TS state` | `test.api.spec.ts:10` | No valid token |
| 9 | `returns tests grouped by year for AP state` | `test.api.spec.ts:22` | No valid token |
| 10 | `handles empty / invalid state param` | `test.api.spec.ts:45` | No valid token |
| 11 | `returns 400 when testId is missing` | `test.api.spec.ts:64` | No valid token |
| 12 | `allows free tests for non-premium users` | `test.api.spec.ts:73` | No valid token |
| 13 | `returns 403 for non-premium user on premium test` | `test.api.spec.ts:102` | No valid token |
| 14 | `returns attempt with test data` | `test.api.spec.ts:126` | No valid token |
| 15 | `saves answers and current question` | `test.api.spec.ts:153` | No valid token |
| 16 | `POST saves question times` | `test.api.spec.ts:198` | No valid token |
| 17 | `GET returns times for attempt` | `test.api.spec.ts:213` | No valid token |
| 18 | `returns list of user results` | `test.api.spec.ts:236` | No valid token |
| 19 | `respects limit parameter` | `test.api.spec.ts:247` | No valid token |

#### API - Payments
| # | Test | File:Line | Error |
|---|------|-----------|-------|
| 20 | `creates order with default PRO tier` | `payments.api.spec.ts:10` | No valid token |
| 21 | `creates order with BASIC tier` | `payments.api.spec.ts:24` | No valid token |
| 22 | `returns orderId, amount, currency` | `payments.api.spec.ts:36` | No valid token |
| 23 | `creates share link with token and URL` | `payments.api.spec.ts:92` | No valid token |
| 24 | `returns share link details for valid token` | `payments.api.spec.ts:111` | Depends on share-link creation which needs token |
| 25 | `creates order for valid share link` | `payments.api.spec.ts:134` | Depends on share-link creation |

#### API - Analytics
| # | Test | File:Line | Error |
|---|------|-----------|-------|
| 26 | `returns score trends` | `analytics.api.spec.ts:10` | No valid token |
| 27 | `respects limit parameter` | `analytics.api.spec.ts:21` | No valid token |
| 28 | `returns section-wise performance` | `analytics.api.spec.ts:40` | No valid token |
| 29 | `returns rank data for authenticated user` | `analytics.api.spec.ts:60` | No valid token |
| 30 | `returns 400 when attemptId is missing` | `analytics.api.spec.ts:77` | No valid token |
| 31 | `returns analytics for specific attempt` | `analytics.api.spec.ts:85` | No valid token |
| 32 | `returns user averages` | `analytics.api.spec.ts:107` | No valid token |
| 33 | `returns performance results and summary` | `analytics.api.spec.ts:124` | No valid token |
| 34 | `recalculates analytics for valid attempt` | `analytics.api.spec.ts:145` | No valid token |

#### API - Other
| # | Test | File:Line | Error |
|---|------|-----------|-------|
| 35 | `creates support ticket successfully` | `other.api.spec.ts:32` | No valid token |
| 36 | `updates pwa_installed flag to true` | `other.api.spec.ts:59` | No valid token |
| 37 | `updates pwa_installed flag to false` | `other.api.spec.ts:71` | No valid token |

#### API - Affiliate
| # | Test | File:Line | Error |
|---|------|-----------|-------|
| 38 | `returns error for existing affiliate user` | `affiliate.api.spec.ts:113` | Test affiliate user may not exist |

---

### Category 2: `loginAndSetCookie` Returns Empty Token → Dashboard Redirects to Login

**Root Cause:** Same as Category 1. The `loginAndSetCookie` helper calls `loginViaAPI` which fails to extract the session token. When the cookie is empty, navigating to `/dashboard` triggers the middleware redirect to `/auth/login`. All dashboard-dependent E2E tests fail because the page ends up on the login page instead of the dashboard.

**Affected Tests (24 tests):**

#### E2E - Dashboard
| # | Test | File:Line | Error |
|---|------|-----------|-------|
| 39 | `displays performance overview cards` | `dashboard.spec.ts:11` | Redirected to login — no `main` or card elements |
| 40 | `displays test scores chart or empty state` | `dashboard.spec.ts:30` | Redirected to login |
| 41 | `displays TS/AP tabs` | `dashboard.spec.ts:58` | On login page, no tabs |
| 42 | `shows tests grouped by year` | `dashboard.spec.ts:63` | On login page |
| 43 | `Analytics page loads successfully` | `dashboard.spec.ts:91` | On login page |
| 44 | `shows empty state or analytics content` | `dashboard.spec.ts:96` | On login page |
| 45 | `Performance page loads successfully` | `dashboard.spec.ts:109` | On login page |
| 46 | `shows summary cards or empty state` | `dashboard.spec.ts:114` | On login page |
| 47 | `displays user phone number` | `dashboard.spec.ts:127` | On login page |
| 48 | `shows error or content for invalid resultId` | `dashboard.spec.ts:162` | No `<main>` element found on login page |
| 49 | `navigation items are visible` | `dashboard.spec.ts:178` | No "Home" link on login page |
| 50 | `clicking Tests nav goes to tests page` | `dashboard.spec.ts:185` | Timeout — no Tests link on login page |
| 51 | `clicking Profile nav goes to profile page` | `dashboard.spec.ts:192` | Timeout — no Profile link on login page |

#### E2E - Payment
| # | Test | File:Line | Error |
|---|------|-----------|-------|
| 52 | `displays BASIC and PRO plan cards` | `payment.spec.ts:11` | Page doesn't show plan cards (may be on login page) |
| 53 | `shows pricing ₹199 and ₹299` | `payment.spec.ts:18` | No pricing text visible |
| 54 | `displays success message` | `payment.spec.ts:61` | `/payment/success` doesn't show success text |
| 55 | `auto-redirects to dashboard` | `payment.spec.ts:69` | Redirected to `/auth/login` instead of `/dashboard` |
| 56 | `try again button is visible` | `payment.spec.ts:90` | `SecurityError: Failed to read localStorage` — page is on about:blank or login |

#### Responsive - Mobile
| # | Test | File:Line | Error |
|---|------|-----------|-------|
| 57 | `dashboard renders correctly on mobile` | `mobile.spec.ts:82` | Redirected to login — `main` not found |
| 58 | `bottom navigation is visible on mobile` | `mobile.spec.ts:94` | Redirected to login — `nav` not found |

---

### Category 3: Next.js Dev Tools Button Causing Strict Mode Violations

**Root Cause:** In development mode, Next.js 16.x adds a floating "Open Next.js Dev Tools" button to the page. When tests use `getByRole('button', { name: /continue|next/i })`, the selector matches BOTH the app's "Continue" button AND the Next.js Dev Tools button (which has `aria-label="Open Next.js Dev Tools"` and matches `/next/i`). This causes Playwright's strict mode to reject the selector.

**Affected Tests (3 tests):**

| # | Test | File:Line | Error |
|---|------|-----------|-------|
| 59 | `step 2: exam type selection (TS/AP)` | `onboarding.spec.ts:16` | `strict mode violation: resolved to 2 elements` — "Continue" and "Open Next.js Dev Tools" |
| 60 | `back button works between steps` | `onboarding.spec.ts:33` | Same strict mode violation |
| 61 | `continue button disabled until selection made` | `onboarding.spec.ts:50` | Same strict mode violation |

---

### Category 4: Page Content Not Matching Expected Text/Selectors

**Root Cause:** The test locators expect specific text patterns or element selectors that don't match the actual page content (different wording, different element structure, or page redirecting elsewhere).

**Affected Tests (9 tests):**

| # | Test | File:Line | Error | Details |
|---|------|-----------|-------|---------|
| 62 | `login and register links are present` | `landing.spec.ts:74` | `getByRole('link', { name: /login|sign in/i })` not found | Landing page may use buttons instead of links, or use different text like "Log In" vs "Login" |
| 63 | `displays action plan when navigated` | `onboarding.spec.ts:64` | Text `/plan\|summary\|ready\|action\|goal/i` not found | Onboarding summary page may use different wording or redirects elsewhere |
| 64 | `try for free link is present` | `onboarding.spec.ts:85` | Text `/free\|skip\|later\|try/i` not found | Paywall page content doesn't contain these words |
| 65 | `shows validation error for empty phone` | `auth.spec.ts:14` | Text `/phone\|required\|enter/i` not found after submit | Login form may not show client-side validation messages for empty fields |
| 66 | `shows validation error for empty password` | `auth.spec.ts:24` | Text `/password\|required\|enter/i` not found | Same — no visible validation message |
| 67 | `successfully logs in with valid credentials` | `auth.spec.ts:58` | `waitForURL(/dashboard\|onboarding/)` timeout | Test user `9999900001` doesn't exist in DB |
| 68 | `shows validation for invalid phone` | `auth.spec.ts:87` | Text `/10.digit\|valid\|phone/i` not found | Register page may use different validation message or not show it client-side |
| 69 | `shows validation for short password` | `auth.spec.ts:99` | Text `/6 char\|short\|minimum\|longer/i` not found | Same — may rely on server-side validation |
| 70 | `shows error for existing user` | `auth.spec.ts:111` | Text `/already exists\|already registered\|login/i` not found | Test user doesn't exist so no "already exists" error is triggered |

---

### Category 5: Middleware/Navigation Behavior Differences

**Root Cause:** Some pages have different behavior than expected — `/payment` is in the public paths list but tests expect it to redirect, or vice versa. Cookie handling with `addCookies` may not work as expected with the middleware.

**Affected Tests (4 tests):**

| # | Test | File:Line | Error | Details |
|---|------|-----------|-------|---------|
| 71 | `redirects to login for /payment without session` | `middleware.spec.ts:56` | Payment is a public path in middleware, so no redirect | Test expected redirect but `/payment` is listed in `publicPaths` |
| 72 | `allows access to protected routes with valid session` | `middleware.spec.ts:65` | Token from `loginViaAPI` is empty | Same cookie extraction issue |
| 73 | `public paths accessible without auth - login` | `middleware.spec.ts:104` | Timeout (1 min) | Page took too long to load / compile |
| 74 | `sets affiliate cookies on ?ref=CODE` | `middleware.spec.ts:140` | Timeout | Page with `?ref=TESTCODE` took too long / TESTCODE is invalid |

---

### Category 6: Auth Form E2E Tests Failing Due to Missing Test Data

**Root Cause:** The test user (`9999900001` / `TestPass123`) doesn't exist in the database. Tests that try to log in, check existing user errors, or complete the forgot-password flow all fail.

**Affected Tests (3 tests):**

| # | Test | File:Line | Error |
|---|------|-----------|-------|
| 75 | `shows error for invalid credentials` | `auth.spec.ts:33` | May pass or fail depending on whether validation text matches |
| 76 | `shows error for non-existent phone` | `auth.spec.ts:141` | Text `/not found\|invalid\|error\|exist/i` not found after forgot password |
| 77 | `shows validation for short password (affiliate)` | `affiliate.spec.ts:69` | Validation text not matching actual UI |

---

### Category 7: Miscellaneous / Timeout Issues

| # | Test | File:Line | Error | Details |
|---|------|-----------|-------|---------|
| 78 | `handles invalid affiliate code gracefully` | `affiliate.spec.ts:14` | Timeout | `/ref/NONEXISTENT_CODE_12345` page took >45s |
| 79 | `question text renders` | `test-taking.spec.ts:82` | Selector `[class*="question"]` not found | Test-taking UI uses different class naming (e.g., Tailwind classes, not `question` prefix) |
| 80 | `4 answer options displayed per question` | `test-taking.spec.ts:88` | Count is 0 instead of >= 4 | Same — option elements don't have `option`/`choice` class or `role="radio"` |
| 81 | `loads and displays content (Refund Policy)` | `static-pages.spec.ts:134` | Timeout during page setup | `browserContext.newPage` timed out at 60s — likely resource exhaustion |

---

## Root Cause Summary

| Root Cause | # Tests Affected | Fix Needed |
|-----------|-----------------|------------|
| **Cookie extraction fails** — `loginViaAPI` cannot read `set-cookie` from Next.js App Router response | **47** | Change `loginViaAPI` to use browser-based login (navigate to login page, fill form, submit) or use direct Supabase DB insertion to create session |
| **Dashboard redirects to login** — Consequence of empty session token from cookie extraction failure | **24** | Fixed by solving #1 |
| **Next.js Dev Tools button** — Dev mode adds a button matching `/next/i` regex | **3** | Use more specific selectors: `getByRole('button', { name: 'Continue', exact: true })` |
| **Selector/text mismatch** — Locators don't match actual page content | **9** | Inspect actual page and update locator text/selectors |
| **Test user doesn't exist** — `9999900001` not in database | **8** | Create test user in DB via setup script or use an existing user's credentials |
| **Middleware/timeout** — Pages slow to compile or have unexpected routing | **4** | Increase timeouts, fix middleware expectations |
| **Resource exhaustion** — Late tests time out due to system load from 284 parallel tests | **1** | Reduce parallelism or increase timeout |

---

## Recommended Fix Priority

1. **Fix `loginViaAPI` helper** (fixes 71 tests / 89% of failures) — Use browser-based login flow instead of API-based cookie extraction
2. **Create test user seed data** — Add a setup script that creates `9999900001` / `TestPass123` in the database
3. **Fix onboarding selectors** — Use `exact: true` to avoid Next.js Dev Tools button collision
4. **Update E2E selectors** — Inspect actual UI text and element structure for auth, payment, dashboard pages
5. **Increase timeouts** — For slow-compiling pages like refund policy
