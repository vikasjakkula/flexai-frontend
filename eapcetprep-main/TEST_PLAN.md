# EAPCET Prep - Comprehensive Test Plan

## Overview
This document lists every test that should be written for the EAPCET Prep application.  
Tests are organized by category. Each test has a checkbox to track completion.

---

## 1. API Tests - Authentication (`/api/auth/`)

### 1.1 Login (`POST /api/auth/login`)
- [x] Returns 400 when phone is missing
- [x] Returns 400 when password is missing
- [x] Returns 400 when both phone and password are missing
- [x] Returns 401 for non-existent phone number
- [x] Returns 401 for wrong password
- [x] Returns 200 and sets session cookie on valid credentials
- [x] Session cookie is httpOnly
- [x] Persists affiliate_id from cookie to user on login
- [x] Returns 500 on internal server error

### 1.2 Register (`POST /api/auth/register`)
- [x] Returns 400 when phone is missing
- [x] Returns 400 when password is missing
- [x] Returns 400 for invalid phone format (not 10 digits)
- [x] Returns 400 for short password (< 6 chars)
- [x] Returns 400 when user already exists with phone
- [x] Returns 200 with verificationId on valid new registration
- [x] Sets pending_registration cookie with phone and password

### 1.3 Verify OTP (`POST /api/auth/verify-otp`)
- [x] Returns 400 when verificationId is missing
- [x] Returns 400 when OTP code is missing
- [x] Returns 400 when phone is missing
- [x] Returns 400 for invalid OTP
- [x] Creates user and returns session on valid OTP
- [x] Links affiliate on successful verification
- [x] Handles redirectPath parameter

### 1.4 Check Session (`GET /api/auth/check-session`)
- [x] Returns authenticated: false when no session cookie
- [x] Returns authenticated: true when valid session exists
- [x] Returns authenticated: false for expired/invalid token

### 1.5 Forgot Password (`POST /api/auth/forgot-password`)
- [x] Returns 400 when phone is missing
- [x] Returns 400 for non-existent phone number
- [x] Returns 200 and sends OTP for valid phone
- [x] Sets reset_phone cookie

### 1.6 Verify Forgot Password (`POST /api/auth/verify-forgot-password`)
- [x] Returns 400 when verificationId is missing
- [x] Returns 400 for invalid OTP
- [x] Sets reset_verified cookie on valid OTP

### 1.7 Reset Password (`POST /api/auth/reset-password`)
- [x] Returns 400 when phone or password is missing
- [x] Returns 400 for short password
- [x] Updates password successfully
- [x] Clears reset cookies after successful reset

### 1.8 Onboarding (`POST /api/auth/onboarding`)
- [x] Returns 401 when not authenticated
- [x] Returns 400 when name is missing
- [x] Returns 400 when target_rank is missing
- [x] Successfully saves onboarding data
- [x] Saves optional fields (email, exam_type, etc.)

### 1.9 User (`GET /api/auth/user`)
- [x] Returns 401 when not authenticated
- [x] Returns user profile with tests_taken count

### 1.10 Premium Check (`GET /api/auth/premium-check`)
- [x] Returns 401 when not authenticated
- [x] Returns isPremium: false for free users
- [x] Returns isPremium: true for premium users
- [x] Correctly checks premium_until date

---

## 2. API Tests - Test Endpoints (`/api/test/`)

### 2.1 List Tests (`GET /api/test/list`)
- [x] Returns 401 when not authenticated
- [x] Returns tests grouped by year for TS state
- [x] Returns tests grouped by year for AP state
- [x] Includes test status (not_started, in_progress, completed)
- [x] Returns empty list for invalid state

### 2.2 Start Test (`POST /api/test/start`)
- [x] Returns 401 when not authenticated
- [x] Returns 400 when testId is missing
- [x] Returns 403 for non-premium user on premium test
- [x] Allows free tests for non-premium users
- [x] Creates new attempt for fresh test
- [x] Returns existing in-progress attempt
- [x] Enforces max attempt limit for BASIC plan

### 2.3 Get Attempt (`GET /api/test/attempt/[attemptId]`)
- [x] Returns 401 when not authenticated
- [x] Returns 404 for non-existent attempt
- [x] Returns 403 when attempt belongs to another user
- [x] Returns attempt with test data

### 2.4 Save Progress (`PUT /api/test/attempt/[attemptId]/save`)
- [x] Returns 401 when not authenticated
- [x] Returns 404 for non-existent attempt
- [x] Saves answers and current question
- [x] Returns 400 for already submitted attempt

### 2.5 Submit Attempt (`POST /api/test/attempt/[attemptId]/submit`)
- [x] Returns 401 when not authenticated
- [x] Returns 404 for non-existent attempt
- [x] Returns 400 for already submitted attempt
- [x] Evaluates answers correctly (correct/wrong/unattempted)
- [x] Creates test_results entry
- [x] Calculates section-wise scores
- [x] Triggers analytics calculation

### 2.6 Question Times (`/api/test/attempt/[attemptId]/time`)
- [x] GET returns 401 when not authenticated
- [x] GET returns times for attempt
- [x] POST saves question times
- [x] POST returns 400 for invalid data

### 2.7 Results (`GET /api/test/results`)
- [x] Returns 401 when not authenticated
- [x] Returns list of user results
- [x] Respects limit parameter
- [x] Orders by most recent

### 2.8 Single Result (`GET /api/test/results/[resultId]`)
- [x] Returns 401 when not authenticated
- [x] Returns 404 for non-existent result
- [x] Returns result with questions and answers
- [x] Returns 403 for other user's result

---

## 3. API Tests - Payment Endpoints (`/api/payments/`)

### 3.1 Create Order (`POST /api/payments/create-order`)
- [x] Returns 401 when not authenticated
- [x] Creates order with default PRO tier
- [x] Creates order with BASIC tier
- [x] Returns orderId, amount, currency
- [x] Stores order in database with affiliate

### 3.2 Verify Payment (`POST /api/payments/verify`)
- [x] Returns 401 when not authenticated
- [x] Returns 400 for missing payment fields
- [x] Returns 400 for invalid signature
- [x] Updates user premium on valid payment
- [x] Creates affiliate_sales on valid payment with affiliate

### 3.3 Create Subscription (`POST /api/payments/create-subscription`)
- [x] Returns 401 when not authenticated
- [x] Returns subscription details

### 3.4 Share Link (`POST /api/payments/share-link`)
- [x] Returns 401 when not authenticated
- [x] Creates share link with token and URL
- [x] Supports BASIC and PRO tiers

### 3.5 Get Share Link (`GET /api/payments/share-link/[token]`)
- [x] Returns 404 for invalid token
- [x] Returns share link details (user, plan, amount)

### 3.6 Create Order for Share (`POST /api/payments/create-order-for-share`)
- [x] Returns 400 for missing token
- [x] Creates order for share link

### 3.7 Verify Share Payment (`POST /api/payments/verify-share`)
- [x] Returns 400 for missing fields
- [x] Verifies share payment correctly

### 3.8 Razorpay Webhook (`POST /api/webhooks/razorpay`)
- [x] Returns 400 for invalid signature
- [x] Handles subscription.activated event
- [x] Handles subscription.charged event
- [x] Handles subscription.cancelled event

---

## 4. API Tests - Analytics Endpoints (`/api/analytics/`)

### 4.1 Trends (`GET /api/analytics/trends`)
- [x] Returns 401 when not authenticated
- [x] Returns score trends with limit
- [x] Returns empty array for user with no tests

### 4.2 Section-Wise (`GET /api/analytics/section-wise`)
- [x] Returns 401 when not authenticated
- [x] Returns section-wise performance breakdown

### 4.3 Rank Estimate (`POST /api/analytics/rank-estimate`)
- [x] Returns 401 when not authenticated
- [x] Returns 403 for non-PRO users
- [x] Returns estimated rank and range for valid score

### 4.4 Test Analytics (`GET /api/test/analytics`)
- [x] Returns 401 when not authenticated
- [x] Returns analytics for specific attempt
- [x] Returns 400 when attemptId is missing

### 4.5 Averages (`GET /api/test/analytics/averages`)
- [x] Returns 401 when not authenticated
- [x] Returns user averages

### 4.6 Performance (`GET /api/test/performance`)
- [x] Returns 401 when not authenticated
- [x] Returns performance results and summary

### 4.7 Recalculate (`POST /api/test/analytics/recalculate`)
- [x] Returns 401 when not authenticated
- [x] Recalculates analytics for attempt

---

## 5. API Tests - Affiliate Endpoints (`/api/affiliate/`)

### 5.1 Register Affiliate (`POST /api/affiliate/register`)
- [x] Returns 401 when not authenticated as affiliate
- [x] Returns 400 for missing payment method
- [x] Returns 400 for UPI without upiId
- [x] Returns 400 for bank without account details
- [x] Registers affiliate with UPI
- [x] Registers affiliate with bank account

### 5.2 Record Visit (`POST /api/affiliate/record-visit`)
- [x] Returns 400 for missing affiliate_code
- [x] Returns 404 for invalid affiliate code
- [x] Records visit and returns affiliate_id

### 5.3 Affiliate Details (`GET /api/affiliate/details`)
- [x] Returns 401 when not authenticated as affiliate
- [x] Returns affiliate stats (visits, sales, commission)
- [x] Returns recent sales

### 5.4 Affiliate Auth Login (`POST /api/affiliate/auth/login`)
- [x] Returns 400 for missing fields
- [x] Returns 401 for invalid credentials
- [x] Returns 200 and sets affiliate_session cookie

### 5.5 Affiliate Auth Register (`POST /api/affiliate/auth/register`)
- [x] Returns 400 for missing fields
- [x] Returns 400 for existing user
- [x] Returns 200 with verificationId

### 5.6 Affiliate Auth Verify OTP (`POST /api/affiliate/auth/verify-otp`)
- [x] Returns 400 for invalid OTP
- [x] Creates affiliate user on valid OTP

### 5.7 Affiliate Auth Check Session (`GET /api/affiliate/auth/check-session`)
- [x] Returns authenticated: false without session
- [x] Returns authenticated: true with valid session

### 5.8 Affiliate Forgot/Reset Password
- [x] Forgot password sends OTP
- [x] Verify forgot password validates OTP
- [x] Reset password updates password

---

## 6. API Tests - Other Endpoints

### 6.1 Support Ticket (`POST /api/support/create`)
- [x] Returns 401 when not authenticated
- [x] Returns 400 for missing category
- [x] Returns 400 for missing message
- [x] Creates support ticket

### 6.2 PWA Update (`POST /api/user/update-pwa-installed`)
- [x] Returns 401 when not authenticated
- [x] Updates pwa_installed flag

### 6.3 Demo Dashboard (`GET /api/demo/dashboard`)
- [x] Returns demo data without authentication
- [x] Contains userData, tests, results, analytics

### 6.4 Demo Result (`GET /api/demo/results/[resultId]`)
- [x] Returns demo result without authentication
- [x] Returns 404 for invalid resultId

### 6.5 Subscription Cancel (`POST /api/subscriptions/cancel`)
- [x] Returns 401 when not authenticated
- [x] Returns 400 for missing subscriptionId
- [x] Cancels subscription

---

## 7. E2E Tests - Landing Page

### 7.1 Page Load & Content
- [x] Page loads successfully (200)
- [x] Displays hero section with title and CTA
- [x] Displays TS EAPCET and AP EAPCET tabs
- [x] Displays test collection with expandable year sections
- [x] Displays features section
- [x] Displays pricing cards (BASIC ₹199, PRO ₹299)
- [x] Displays footer with links (About, Contact, Terms, Privacy, Refund)

### 7.2 Interactions
- [x] TS/AP tab switching works
- [x] Year sections expand and collapse
- [x] Take Test button redirects to login when not authenticated
- [x] Take Test button works for authenticated users
- [x] Pricing plan selection works
- [x] CTA buttons navigate correctly
- [x] Scroll banner appears on scroll

### 7.3 Responsive
- [x] Renders correctly on mobile viewport (375px)
- [x] Renders correctly on tablet viewport (768px)
- [x] Navigation is accessible on mobile

---

## 8. E2E Tests - Authentication Flow

### 8.1 Login Page
- [x] Page loads with phone and password fields
- [x] Shows validation error for empty phone
- [x] Shows validation error for empty password
- [x] Shows error for invalid credentials
- [x] Shows "Forgot password?" link
- [x] Shows "Register" link
- [x] Successfully logs in with valid credentials
- [x] Redirects to dashboard after login
- [x] Phone field accepts only digits

### 8.2 Register Page
- [x] Page loads with phone and password fields
- [x] Shows validation for invalid phone (not 10 digits)
- [x] Shows validation for short password (< 6 chars)
- [x] Shows error for existing user
- [x] Shows OTP step after valid submission
- [x] OTP input accepts 6 digits
- [x] Resend OTP button works
- [x] Shows "Login" link

### 8.3 Forgot Password Flow
- [x] Shows forgot password form
- [x] Sends OTP for valid phone
- [x] Shows OTP verification step
- [x] Shows new password step after OTP
- [x] Resets password successfully
- [x] Returns to login after reset

---

## 9. E2E Tests - Onboarding Flow

### 9.1 Onboarding Steps
- [x] Step 1: Name input
- [x] Step 2: Exam type selection (TS/AP)
- [x] Step 3: Current marks range selection
- [x] Step 4: Target rank selection
- [x] Step 5: Journey visualization
- [x] Back button works between steps
- [x] Continue button disabled until selection made
- [x] Redirects to summary after completion

### 9.2 Onboarding Summary
- [x] Displays personalized action plan
- [x] Shows goal and marks info
- [x] CTA to pricing works

### 9.3 Onboarding Paywall
- [x] Displays BASIC and PRO plans
- [x] Plan selection works
- [x] "Try for free" link works
- [x] Share payment link works

---

## 10. E2E Tests - Dashboard

### 10.1 Main Dashboard
- [x] Redirects to login when not authenticated
- [x] Displays performance overview cards (accuracy, avg score, tests taken)
- [x] Displays test scores chart
- [x] Displays recent tests
- [x] Displays recommended tests
- [x] Shows loading shimmer while fetching
- [x] "View All Tests" link works

### 10.2 Tests Page
- [x] Displays TS/AP tabs
- [x] Shows tests grouped by year
- [x] Shows correct status badges (completed, in progress, free, premium)
- [x] Start button works for free tests
- [x] Shows unlock/upgrade for premium tests
- [x] Year sections expand/collapse

### 10.3 Analytics Page
- [x] Displays overall averages
- [x] Shows performance growth chart
- [x] Shows time analysis
- [x] Shows subject-wise performance
- [x] Shows test comparison table
- [x] Shows rank estimate (PRO only)
- [x] Shows empty state for no tests

### 10.4 Performance Page
- [x] Displays summary cards (avg score, best score, total tests, avg accuracy)
- [x] Shows score progression chart
- [x] Shows subject comparison bar chart
- [x] Shows accuracy and time trends
- [x] Shows radar chart
- [x] Shows test history table

### 10.5 Profile Page
- [x] Displays user name and phone
- [x] Shows membership status (Free/BASIC/PRO)
- [x] Shows tests taken count
- [x] Shows member since date
- [x] "Upgrade to Premium" button for free users
- [x] "Manage Subscription" link for BASIC users

### 10.6 Result Page
- [x] Displays test marks and max marks
- [x] Shows attempt analysis (attempted, accuracy, time)
- [x] Shows donut chart (correct/wrong/unattempted)
- [x] Shows time by status
- [x] Shows subject-wise tabs (Overall, Physics, Chemistry, Maths)
- [x] Tab switching works
- [x] "View Solution" button works
- [x] "Reattempt" button works

### 10.7 Dashboard Layout
- [x] Navigation works (Home, Tests, Performance, Profile)
- [x] Active tab is highlighted
- [x] Support modal opens
- [x] PWA install prompt appears (when applicable)

---

## 11. E2E Tests - Test Taking Flow

### 11.1 Instructions Page
- [x] Displays general instructions
- [x] Shows section table (Maths 80, Physics 40, Chemistry 40)
- [x] Language selector works
- [x] Terms checkbox required before starting
- [x] "I am ready to begin" button starts test
- [x] Non-premium user blocked from premium tests
- [x] Free tests accessible to all

### 11.2 Test Taking UI
- [x] Question text renders correctly
- [x] 4 answer options displayed per question
- [x] Selecting an option highlights it
- [x] Can change selected answer
- [x] Can clear selected answer
- [x] Section tabs work (Maths, Physics, Chemistry)
- [x] Question palette shows question statuses
- [x] Clicking question number in palette navigates to question
- [x] Next/Previous buttons work
- [x] "Mark for Review" button works
- [x] Timer displays and counts down
- [x] Auto-save triggers periodically
- [x] Submit confirmation dialog appears
- [x] Submitting redirects to result page

### 11.3 Question Palette
- [x] Not Visited (default) style shown correctly
- [x] Visited but not answered style
- [x] Answered style
- [x] Marked for review style
- [x] Answered and marked for review style
- [x] Collapsible sidebar works
- [x] Shows correct section counts

### 11.4 Solution Page
- [x] Displays questions with correct answers highlighted
- [x] Shows user's answer
- [x] Shows correct/wrong indicator
- [x] Section navigation works
- [x] Question palette navigation works

---

## 12. E2E Tests - Payment Flow

### 12.1 Payment Page
- [x] Displays BASIC and PRO plan cards
- [x] Shows pricing (₹199 / ₹299)
- [x] Plan selection toggles
- [x] "Try for free" navigates to dashboard
- [x] Shows testimonials section
- [x] Shows analytics preview carousel

### 12.2 Payment Success
- [x] Displays success message
- [x] Auto-redirects to dashboard
- [x] "Need Help?" link works

### 12.3 Payment Failure
- [x] Displays failure message
- [x] "Try Again" button works
- [x] "Contact Support" link works
- [x] Redirects if no purchase intent

### 12.4 Pay-for-Someone (Share Link)
- [x] Displays plan info for valid token
- [x] Shows beneficiary name
- [x] Pay button initiates checkout
- [x] Shows error for invalid token
- [x] Success redirects appropriately

---

## 13. E2E Tests - Affiliate Flow

### 13.1 Referral Redirect (`/ref/[code]`)
- [x] Records visit for valid code
- [x] Stores affiliate in localStorage
- [x] Redirects to home page
- [x] Handles invalid affiliate code gracefully

### 13.2 Affiliate Auth
- [x] Login page loads
- [x] Register page loads
- [x] Login with valid credentials
- [x] Register new affiliate account
- [x] OTP verification flow
- [x] Forgot password flow

### 13.3 Affiliate Registration
- [x] Terms acceptance required
- [x] UPI payment method form
- [x] Bank account payment method form
- [x] Validation for required fields
- [x] Redirects to dashboard after registration

### 13.4 Affiliate Dashboard
- [x] Displays affiliate link
- [x] Copy link button works
- [x] Share buttons (WhatsApp, Telegram, Twitter)
- [x] Shows stats (visits, sales, conversion, commission)
- [x] Shows recent sales table
- [x] Shows loading state

---

## 14. E2E Tests - Static Pages

### 14.1 About Page
- [x] Loads and displays content
- [x] "Back to Home" link works
- [x] "Contact Us" link works

### 14.2 Contact Page
- [x] Loads and displays contact info
- [x] Contact form fields present (name, email, phone, subject, message)
- [x] Form validation works
- [x] Form submission works

### 14.3 Terms and Conditions
- [x] Loads and displays content
- [x] "Back to Home" link works

### 14.4 Privacy Policy
- [x] Loads and displays content
- [x] "Back to Home" link works

### 14.5 Refund Policy
- [x] Loads and displays content
- [x] "Back to Home" link works

---

## 15. Middleware Tests

### 15.1 CORS
- [x] Sets CORS headers for API routes
- [x] Returns 204 for OPTIONS preflight
- [x] Allows configured origins

### 15.2 Authentication
- [x] Redirects to login for protected routes without session
- [x] Allows access to protected routes with valid session
- [x] Redirects for expired/invalid session
- [x] Public paths accessible without auth

### 15.3 Affiliate Tracking
- [x] Sets affiliate cookies on ?ref=CODE
- [x] Records affiliate visit in database
- [x] Does not set cookies for invalid affiliate code
- [x] Cookies have 30-day expiry

---

## 16. Responsive & Mobile Tests

### 16.1 Mobile Viewport (375px)
- [x] Landing page renders correctly
- [x] Auth pages render correctly
- [x] Dashboard renders correctly
- [x] Test taking UI renders correctly (question palette collapsible)
- [x] Navigation works on mobile
- [x] Forms are usable on mobile
- [x] Touch targets are adequate size

### 16.2 Tablet Viewport (768px)
- [x] Layout adjusts for tablet
- [x] Sidebar behavior correct
- [x] Charts render correctly

---

## 17. Subscriptions

### 17.1 Manage Subscription Page
- [x] Displays subscription info
- [x] Cancel button for BASIC plan
- [x] Cancel confirmation dialog
- [x] Redirects if no subscription
- [x] Shows profile link

---

## 18. Component Tests

### 18.1 QuestionContent
- [x] Renders HTML content correctly
- [x] Handles sprite images
- [x] Sanitizes dangerous HTML

### 18.2 KaTeX
- [x] Renders inline math
- [x] Renders block math
- [x] Handles invalid LaTeX gracefully

### 18.3 Shimmer
- [x] Renders loading skeleton

### 18.4 Charts
- [x] AreaChart renders with data
- [x] BarChart renders with data
- [x] LineChart renders with data
- [x] RadarChart renders with data
- [x] StackedBarChart renders with data
- [x] Charts handle empty data

### 18.5 Paywall
- [x] Displays premium gate message
- [x] CTA button navigates to payment

### 18.6 SupportTicketModal
- [x] Opens and closes correctly
- [x] Category selection works
- [x] Subject and message fields work
- [x] Submit creates ticket
- [x] Shows success/error states

---

## Test Infrastructure

- **Framework:** Playwright
- **Config:** `playwright.config.ts`
- **Test Directory:** `tests/`
  - `tests/api/` - API route tests
  - `tests/e2e/` - End-to-end UI tests
  - `tests/responsive/` - Mobile/tablet responsive tests

---

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific category
npx playwright test tests/api/
npx playwright test tests/e2e/
npx playwright test tests/responsive/

# Run with UI mode
npx playwright test --ui

# Run in headed mode
npx playwright test --headed

# Run specific test file
npx playwright test tests/api/auth.api.spec.ts
```
