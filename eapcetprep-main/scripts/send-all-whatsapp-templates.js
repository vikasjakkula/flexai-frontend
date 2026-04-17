/**
 * Send ALL WhatsApp templates to a test phone number via Twilio.
 * Uses all WA_SID_* env vars from .env.local.
 *
 * Usage: node scripts/send-all-whatsapp-templates.js [phone]
 * Example: node scripts/send-all-whatsapp-templates.js +919182607873
 *
 * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 *
 * Optional: WA_TEST_SEND_DELAY_MS (default 3000) — space out sends; bursts often only deliver 1–2 msgs.
 *
 * "View more" / truncated preview: WhatsApp’s app collapses long template bodies (client-side).
 * There is no API flag to show full text by default. Fix: shorten copy in Twilio Content /
 * Meta template editor (fewer lines, tighter wording); put key CTA in the first ~4–6 lines.
 */

require("dotenv").config({ path: ".env.local" });
const twilio = require("twilio");

const TO_NUMBER = process.argv[2] || "+919182607873";
/** Twilio requires E.164 with + prefix, e.g. whatsapp:+919182607873 */
function toWhatsAppE164(raw) {
  if (raw.startsWith("whatsapp:")) return raw;
  const digits = raw.replace(/\D/g, "");
  return `whatsapp:+${digits}`;
}
const TO_WHATSAPP = toWhatsAppE164(TO_NUMBER);

/** Delay between sends (ms) — WhatsApp often drops or delays bursts to the same user */
const DELAY_MS = parseInt(process.env.WA_TEST_SEND_DELAY_MS || "3000", 10);

// All WA_SID_* templates from .env.local with placeholder variables
// Most templates use {{1}}, {{2}}, etc. - we use generic test values
const DEFAULT_VARS = { 1: "Test User", 2: "5000", 3: "https://eapcetprep.com", 4: "₹900", 5: "eapcetpro" };

const TEMPLATES = [
  { key: "WA_SID_SIGNUP_WELCOME", name: "Signup Welcome" },
  { key: "WA_SID_SIGNUP_NO_ACTION_NUDGE", name: "Signup No Action Nudge" },
  { key: "WA_SID_SIGNUP_48HR_NUDGE", name: "Signup 48hr Nudge" },
  { key: "WA_SID_CHECKOUT_OPENED_1HR", name: "Checkout Opened 1hr" },
  { key: "WA_SID_CHECKOUT_OPENED_24HR", name: "Checkout Opened 24hr" },
  { key: "WA_SID_PAYMENT_FAILED_INSTANT", name: "Payment Failed Instant" },
  { key: "WA_SID_PAYMENT_FAILED_RETRY_24HR", name: "Payment Failed Retry 24hr" },
  { key: "WA_SID_PAYMENT_SUCCESS", name: "Payment Success" },
  { key: "WA_SID_ONBOARDING_NOT_STARTED", name: "Onboarding Not Started" },
  { key: "WA_SID_FEATURE_DISCOVERY", name: "Feature Discovery" },
  { key: "WA_SID_INACTIVE_3DAYS", name: "Inactive 3 Days" },
  { key: "WA_SID_OLD_SIGNUP_REACTIVATION", name: "Old Signup Reactivation" },
  { key: "WA_SID_OLD_PAYMENT_FAILED", name: "Old Payment Failed" },
  { key: "WA_SID_INACTIVE_7DAYS", name: "Inactive 7 Days" },
];

async function main() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.error("Missing env. Set in .env.local:");
    console.error("  TWILIO_ACCOUNT_SID");
    console.error("  TWILIO_AUTH_TOKEN");
    console.error("  TWILIO_WHATSAPP_FROM");
    process.exit(1);
  }

  const client = twilio(accountSid, authToken);
  const contentVariables = JSON.stringify(DEFAULT_VARS);

  console.log(`Sending ${TEMPLATES.length} templates to ${TO_WHATSAPP} (${DELAY_MS}ms between each)...\n`);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  for (let i = 0; i < TEMPLATES.length; i++) {
    const t = TEMPLATES[i];
    if (i > 0) await sleep(DELAY_MS);
    const contentSid = process.env[t.key];
    if (!contentSid) {
      console.log(`⏭️  ${t.name}: SKIP (${t.key} not set)`);
      continue;
    }

    try {
      const message = await client.messages.create({
        from,
        to: TO_WHATSAPP,
        contentSid,
        contentVariables,
      });
      console.log(`✅ ${t.name}: SID ${message.sid}`);
    } catch (err) {
      // Some templates may not need contentVariables - retry without
      try {
        const message = await client.messages.create({
          from,
          to: TO_WHATSAPP,
          contentSid,
        });
        console.log(`✅ ${t.name}: SID ${message.sid} (no vars)`);
      } catch (err2) {
        console.error(`❌ ${t.name}: ${err.message}`);
      }
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
