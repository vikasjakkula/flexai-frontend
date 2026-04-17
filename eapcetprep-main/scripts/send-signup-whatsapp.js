/**
 * Send first signup WhatsApp message via Twilio using Content Template Builder.
 * Template: signup (HXebd4547c93d8927f3f658a421287380c)
 * Body variables: {{1}} = expected rank, {{2}} = name. CTA: "Start your first test" -> https://eapcetpro.com
 *
 * Usage: node scripts/send-signup-whatsapp.js [name] [expected_rank]
 * Example: node scripts/send-signup-whatsapp.js "John Doe" 5000
 *
 * Requires in .env.local:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_FROM  (WhatsApp sender, e.g. whatsapp:+15625348968)
 */

require("dotenv").config({ path: ".env.local" });
const twilio = require("twilio");

// Content Template from Twilio Content Template Builder (signup, English, Approved)
const SIGNUP_CONTENT_SID = "HXebd4547c93d8927f3f658a421287380c";

const TO_NUMBER = process.env.TWILIO_WHATSAPP_TO || "whatsapp:+919182607873";

async function main() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.error("Missing env. Set in .env.local:");
    console.error("  TWILIO_ACCOUNT_SID");
    console.error("  TWILIO_AUTH_TOKEN");
    console.error("  TWILIO_WHATSAPP_FROM (WhatsApp sender number, e.g. whatsapp:+15625348968)");
    process.exit(1);
  }

  const name = process.argv[2] || "John Doe";
  const expectedRank = process.argv[3] || "5000";

  // Template body: "Hi {{2}} ... goal of {{1}} rank."  -> {{1}} = rank, {{2}} = name
  const contentVariables = JSON.stringify({
    1: expectedRank,
    2: name,
  });

  const client = twilio(accountSid, authToken);

  const message = await client.messages.create({
    from,
    to: TO_NUMBER,
    contentSid: SIGNUP_CONTENT_SID,
    contentVariables,
  });

  console.log("Message sent. SID:", message.sid);
  console.log("Status:", message.status);
  console.log("To:", message.to);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
