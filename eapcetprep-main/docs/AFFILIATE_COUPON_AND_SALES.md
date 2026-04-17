# Affiliate coupon and sales – conditions and behaviour

## When is an affiliate attributed to a sale?

Attribution uses this **priority order** (first match wins):

1. **`affiliate_id` in create-order request body**  
   - Set when the user applied a valid coupon at checkout and had no `affiliate_id` in cookie/localStorage.  
   - The coupon validate API returns `affiliate_id` for that affiliate; the paywall/payment page sends it in the create-order body so the order is tied to that affiliate.

2. **`affiliate_id` cookie**  
   - Set when the user visited `/ref/[code]` and record-visit ran.  
   - Used on paywall/payment and for create-order if body does not send `affiliate_id`.

3. **`affiliate_code` cookie**  
   - Looked up in `affiliates` to resolve `affiliate_id` if no `affiliate_id` cookie.

4. **`users.affiliate_id`**  
   - Stored at registration when the user had an affiliate cookie/code.  
   - Used if no cookie/body affiliate.

5. **Latest `affiliate_visits` for this user**  
   - If the user has no cookie and no body `affiliate_id`, we use the most recent visit row for that `user_id` so we still attribute after cookie clear.

So: **if there was no affiliate in storage but the user entered a coupon that matches an affiliate, we use the coupon’s `affiliate_id` (via body) and the sale is attributed to that affiliate.**

---

## Coupon behaviour

- **Valid coupon**  
  - Exists in `affiliates.coupon_code` for an active affiliate.  
  - Gives a fixed **₹100 off** in the UI (display only: show e.g. ₹299 −₹100 = ₹199, ₹399 −₹100 = ₹299).  
  - Actual amount charged is unchanged (₹199 / ₹299); the coupon is for attribution and display.

- **Special case: `SAVE100`**  
  - Default coupon auto-applied for everyone when no affiliate-specific coupon is present.  
  - Always returns `affiliate_id: null` from `/api/coupon/validate`.  
  - Frontend never sends an `affiliate_id` from `SAVE100` in the create-order body.  
  - **Result**: `SAVE100` only shows the discount; it never attributes the sale to any affiliate. Attribution still follows the normal priority (cookie → user → visits) and if none exist, the sale is unattributed.

- **Auto-apply**  
  - On paywall/payment load we call `GET /api/paywall/affiliate-coupon`.  
  - If the request has an `affiliate_id` cookie and that affiliate has a `coupon_code`, we return it.  
  - The frontend pre-fills and “applies” that code (validate + show -₹100 and store `affiliate_id` for create-order).

- **Manual apply**  
  - User enters a code and clicks Apply.  
  - Frontend calls `GET /api/coupon/validate?code=XXX`.  
  - If valid, we return `{ valid: true, discount: 100, affiliate_id }`.  
  - Frontend shows -₹100 and keeps `affiliate_id`; on create-order it sends this `affiliate_id` in the body so the order is attributed to that affiliate even if there was no ref link/cookie.

- **No coupon but ref link**  
  - If the user came via `/ref/[code]` and that affiliate has no `coupon_code`, we still have `affiliate_id` from the cookie.  
  - Create-order uses that cookie; no coupon is applied, but the sale is attributed to that affiliate.

---

## How affiliate sales are managed

1. **Order creation**  
   - Create-order API resolves `affiliate_id` using the priority above (body from coupon → cookie → users → visits).  
   - The order row is stored with `affiliate_id` set when we have one.

2. **Payment success**  
   - `handle_successful_payment` (DB) runs on verify.  
   - It reads `order.affiliate_id`.  
   - If present, it inserts into `affiliate_sales` (user_id, order_id, amount, commission_amount, status) and updates the order.  
   - Commission is calculated from the affiliate’s `commission_rate_first` / `commission_rate_second` and sales count.

3. **Payouts**  
   - Admin marks `affiliate_sales.status` as `paid` when paying out.  
   - Dashboard shows total commission, pending, and paid from `affiliate_sales` for that affiliate.

So: **who gets the sale** is determined only by which `affiliate_id` we store on the order (from body or cookie or user or visits). **Coupon only affects attribution and UI discount display; it does not change the Razorpay amount.**

---

## Summary table

| Scenario | Affiliate from | Coupon shown | Order.affiliate_id |
|----------|----------------|-------------|--------------------|
| User came via ref link, affiliate has coupon | Cookie | Auto-applied (from API) | From cookie |
| User came via ref link, affiliate has no coupon | Cookie | None | From cookie |
| User has no ref/cookie, enters valid coupon | Validate API → body | Applied | From body (coupon’s affiliate) |
| User has ref cookie and also enters same affiliate’s coupon | Cookie (or body) | Applied | Same affiliate |
| User has ref cookie and enters different affiliate’s coupon | Body (coupon) | Applied for display | From body (coupon’s affiliate) |

When the user explicitly applies a coupon, that coupon’s `affiliate_id` is sent in the request body and takes precedence over the cookie, so the sale is attributed to the coupon’s affiliate.
