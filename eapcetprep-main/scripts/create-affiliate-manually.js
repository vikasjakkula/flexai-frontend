/**
 * Script to manually create an affiliate account in the database
 * This bypasses OTP verification and creates the account directly
 * 
 * Usage: node scripts/create-affiliate-manually.js
 * 
 * Prerequisites:
 * - Install dependencies: npm install
 * - Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const crypto = require('crypto');

// Try to load nanoid, fallback to manual generation if not available
let nanoid;
try {
  nanoid = require('nanoid').nanoid;
} catch (e) {
  // Fallback: generate random code manually
  nanoid = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
}

// Load environment variables
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv might not be installed, try .env
  try {
    require('dotenv').config({ path: '.env' });
  } catch (e2) {
    // If dotenv fails, assume env vars are set in environment
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n📝 Manual Affiliate Account Creator\n');
  console.log('This script will create an affiliate account directly in the database.\n');

  try {
    // Get affiliate user details
    const phone = await question('Enter phone number (10 digits): ');
    
    // Validate phone
    if (!/^\d{10}$/.test(phone)) {
      console.error('❌ Error: Phone number must be exactly 10 digits');
      process.exit(1);
    }

    // Check if phone already exists
    const { data: existingUser } = await supabase
      .from('affiliate_users')
      .select('id, phone')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      console.error(`❌ Error: An affiliate account already exists with phone number ${phone}`);
      console.log('If you want to create an affiliate record for this user, use a different script.');
      process.exit(1);
    }

    const password = await question('Enter password (min 6 characters): ');
    
    if (password.length < 6) {
      console.error('❌ Error: Password must be at least 6 characters long');
      process.exit(1);
    }

    const name = await question('Enter name (optional, press Enter to skip): ');
    const email = await question('Enter email (optional, press Enter to skip): ');

    // Hash password
    console.log('\n🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert affiliate user
    console.log('\n📤 Creating affiliate user...');
    const { data: affiliateUser, error: userError } = await supabase
      .from('affiliate_users')
      .insert({
        phone: phone,
        password: hashedPassword,
        name: name || null,
        email: email || null
      })
      .select()
      .single();

    if (userError || !affiliateUser) {
      console.error('❌ Error creating affiliate user:', userError?.message || 'Unknown error');
      console.error('Details:', userError);
      process.exit(1);
    }

    console.log('✅ Affiliate user created successfully!');
    console.log(`   ID: ${affiliateUser.id}`);
    console.log(`   Phone: ${affiliateUser.phone}`);
    if (affiliateUser.name) console.log(`   Name: ${affiliateUser.name}`);
    if (affiliateUser.email) console.log(`   Email: ${affiliateUser.email}`);

    // Ask if they want to create affiliate record
    const createAffiliate = await question('\nCreate affiliate record (y/n)? This allows them to earn commissions: ');

    if (createAffiliate.toLowerCase() === 'y' || createAffiliate.toLowerCase() === 'yes') {
      const paymentMethod = await question('Enter payment method (upi/bank): ');
      
      if (!['upi', 'bank'].includes(paymentMethod.toLowerCase())) {
        console.error('❌ Error: Payment method must be "upi" or "bank"');
        process.exit(1);
      }

      let paymentDetails;

      if (paymentMethod.toLowerCase() === 'upi') {
        const upiId = await question('Enter UPI ID: ');
        paymentDetails = { upi_id: upiId };
      } else {
        const accountNumber = await question('Enter account number: ');
        const ifscCode = await question('Enter IFSC code: ');
        paymentDetails = {
          account_number: accountNumber,
          ifsc_code: ifscCode
        };
      }

      const statusInput = await question('Enter status (pending/active/suspended) [default: active]: ');
      const status = statusInput || 'active';

      if (!['pending', 'active', 'suspended'].includes(status.toLowerCase())) {
        console.error('❌ Error: Status must be "pending", "active", or "suspended"');
        process.exit(1);
      }

      // Generate affiliate code (8 characters, alphanumeric)
      const affiliateCode = nanoid(8).toUpperCase().replace(/[^A-Z0-9]/g, 'A').substring(0, 8);

      // Insert affiliate record
      console.log('\n📤 Creating affiliate record...');
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .insert({
          affiliate_user_id: affiliateUser.id,
          affiliate_code: affiliateCode,
          payment_method: paymentMethod.toLowerCase(),
          payment_details: paymentDetails,
          status: status.toLowerCase(),
          terms_accepted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (affiliateError || !affiliate) {
        console.error('❌ Error creating affiliate record:', affiliateError?.message || 'Unknown error');
        console.error('Details:', affiliateError);
        console.log('\n⚠️  Note: Affiliate user was created, but affiliate record failed.');
        console.log('   You can create the affiliate record manually using the SQL provided in the documentation.');
        process.exit(1);
      }

      console.log('✅ Affiliate record created successfully!');
      console.log(`   Affiliate ID: ${affiliate.id}`);
      console.log(`   Affiliate Code: ${affiliate.affiliate_code}`);
      console.log(`   Status: ${affiliate.status}`);
      console.log(`   Payment Method: ${affiliate.payment_method}`);
    } else {
      console.log('\nℹ️  Affiliate user created. Affiliate record was not created.');
      console.log('   The user can login and complete affiliate registration through the UI.');
    }

    console.log('\n✅ Account creation completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Phone: ${phone}`);
    console.log(`   Password: ${password} (store securely)`);
    console.log(`   Login URL: /affiliate/auth/login`);

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
main();

