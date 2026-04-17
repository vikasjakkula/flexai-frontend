/**
 * Script to fetch all tests from the database and save them to JSON files
 * This can be used to generate static data for the landing page
 * 
 * Run with: node scripts/fetch-tests.js
 * 
 * Make sure to set up your environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * 
 * This script generates two files:
 * - tests-data.json: TS EAPCET tests (state='TS' or null)
 * - tests-data-ap.json: AP EAPCET tests (state='AP')
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables (dotenv is optional)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch (e) {
  // dotenv not installed, try to read from process.env directly
  console.log('Note: dotenv not found, using process.env directly');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchTests(state) {
  try {
    const stateLabel = state === 'AP' ? 'AP EAPCET' : 'TS EAPCET';
    console.log(`Fetching ${stateLabel} tests from database...`);
    
    // Build query based on state
    let query = supabase
      .from('tests')
      .select('*');
    
    if (state === 'AP') {
      // Fetch AP tests (state = 'AP')
      query = query.eq('state', 'AP');
    } else {
      // Fetch TS tests (state = 'TS' or null/undefined)
      // Use PostgREST filter syntax: state is null OR state equals 'TS'
      query = query.or('state.is.null,state.eq.TS');
    }
    
    const { data: tests, error } = await query.order('test_date', { ascending: false });
    
    // Additional filtering in JavaScript for TS (in case the OR query doesn't work as expected)
    let filteredTests = tests;
    if (state !== 'AP' && tests) {
      // Filter for TS: state is 'TS' or null/undefined
      filteredTests = tests.filter(test => !test.state || test.state === 'TS');
    }

    if (error) {
      throw error;
    }

    console.log(`Found ${filteredTests.length} ${stateLabel} tests`);

    // Group tests by year/type (similar to how it's done in the API)
    const grouped = filteredTests.reduce((acc, test) => {
      const key = test.year || test.test_type || 'other';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        test_id: test.test_id,
        test_name: test.test_name,
        test_date: test.test_date,
        shift: test.shift,
        test_type: test.test_type,
        year: test.year,
        set_name: test.set_name,
        state: test.state
      });
      return acc;
    }, {});

    // Prepare output data
    const output = {
      lastUpdated: new Date().toISOString(),
      totalTests: filteredTests.length,
      state: state || 'TS',
      tests: filteredTests.map(t => ({
        test_id: t.test_id,
        test_name: t.test_name,
        test_date: t.test_date,
        shift: t.shift,
        test_type: t.test_type,
        year: t.year,
        set_name: t.set_name,
        state: t.state
      })),
      grouped: grouped
    };

    // Save to JSON file
    const filename = state === 'AP' ? 'tests-data-ap.json' : 'tests-data.json';
    const outputPath = path.join(__dirname, '..', 'public', filename);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✅ Successfully saved ${filteredTests.length} ${stateLabel} tests to ${outputPath}`);
    console.log(`📊 Grouped into ${Object.keys(grouped).length} categories:`);
    Object.keys(grouped).forEach(key => {
      console.log(`   - ${key}: ${grouped[key].length} tests`);
    });

    return output;
  } catch (error) {
    console.error(`Error fetching ${state === 'AP' ? 'AP' : 'TS'} tests:`, error);
    throw error;
  }
}

// Run the script - fetch both TS and AP tests
async function run() {
  try {
    console.log('='.repeat(50));
    console.log('Fetching TS EAPCET tests...');
    console.log('='.repeat(50));
    await fetchTests('TS');
    
    console.log('\n' + '='.repeat(50));
    console.log('Fetching AP EAPCET tests...');
    console.log('='.repeat(50));
    await fetchTests('AP');
    
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

run();


