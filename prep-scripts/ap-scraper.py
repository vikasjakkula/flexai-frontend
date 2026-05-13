"""
TS EAMCET Question Scraper - SEQUENTIAL VERSION
Scrapes questions, extracts sprite sheets + CSS, uploads to Supabase
No parallel execution - simple and reliable
"""

import asyncio
import json
import os
import re
import time
import httpx
from datetime import datetime
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

# ============== SUPABASE CONFIGURATION ==============
SUPABASE_URL = "https://bnnpmfdnsngxhxydvecx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubnBtZmRuc25neGh4eWR2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg5Nzc1MCwiZXhwIjoyMDgxNDczNzUwfQ.wYXy4tK9-CXzXb8fb85tz6pK6M95w8jrROWyoNljTZY"
SUPABASE_BUCKET = "images"
SPRITES_FOLDER = "sprites"

# ============== SCRAPER CONFIGURATION ==============
BASE_URL = "https://www.examsnet.com"
TEST_LIST_URL = f"{BASE_URL}/exams/ap-eapcet-previous-question-papers-online"
OUTPUT_DIR = "ap_scraped_data"
SPRITES_DIR = os.path.join(OUTPUT_DIR, "sprites")
PROGRESS_FILE = os.path.join(OUTPUT_DIR, "progress.json")
ALL_DATA_FILE = os.path.join(OUTPUT_DIR, "all_questions.json")

# TIMING
DELAY_BETWEEN_REQUESTS = 0.5
MAX_RETRIES = 3


def log(message, level="INFO"):
    """Print log message with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


def log_sprite(message):
    """Print sprite-related log message"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [SPRITE] {message}")


def ensure_output_dirs():
    """Create output directories if they don't exist"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(SPRITES_DIR, exist_ok=True)
    log(f"Output directory: {OUTPUT_DIR}")
    log(f"Sprites directory: {SPRITES_DIR}")


def load_json(filepath, default):
    """Load JSON file"""
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return default
    return default


def save_json(filepath, data):
    """Save JSON file"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_progress():
    return load_json(PROGRESS_FILE, {
        "completed_tests": [],
        "uploaded_sprite_sheets": []
    })


def save_progress(progress):
    save_json(PROGRESS_FILE, progress)


def load_test_data(test_slug):
    filepath = os.path.join(OUTPUT_DIR, f"{test_slug}.json")
    return load_json(filepath, None)


def save_test_data(test_slug, test_data):
    filepath = os.path.join(OUTPUT_DIR, f"{test_slug}.json")
    save_json(filepath, test_data)


def question_exists(test_slug, question_num):
    """Check if question already exists in test data"""
    test_data = load_test_data(test_slug)
    if test_data is None:
        return False
    return any(q['question_number'] == question_num for q in test_data.get('questions', []))


def add_question(test_slug, question_data):
    """Add question to test data"""
    filepath = os.path.join(OUTPUT_DIR, f"{test_slug}.json")
    
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            test_data = json.load(f)
    else:
        test_data = {"slug": test_slug, "questions": []}
    
    q_num = question_data['question_number']
    exists = any(q['question_number'] == q_num for q in test_data['questions'])
    
    if not exists:
        test_data['questions'].append(question_data)
        test_data['questions'].sort(key=lambda x: x['question_number'])
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(test_data, f, indent=2, ensure_ascii=False)
        
        return True
    return False


def is_empty_solution(solution_html):
    """Check if solution_html is empty or just an empty div wrapper"""
    if not solution_html or solution_html.strip() == "":
        return True
    
    # Check for empty div pattern: <div style="position: relative;z-index:1"> </div>
    stripped = solution_html.strip()
    empty_div_pattern = r'^<div[^>]*style[^>]*position[^>]*relative[^>]*z-index[^>]*>\s*</div>$'
    if re.match(empty_div_pattern, stripped, re.IGNORECASE | re.DOTALL):
        return True
    
    # Check if it's just whitespace or empty tags
    no_whitespace = re.sub(r'\s+', '', stripped)
    if no_whitespace == "" or no_whitespace == "<div></div>":
        return True
    
    return False


def find_questions_with_empty_solutions(test_slug):
    """Find questions in test data that have empty or empty div solutions"""
    test_data = load_test_data(test_slug)
    if not test_data:
        return []
    
    empty_solution_questions = []
    for q in test_data.get('questions', []):
        solution_html = q.get('solution_html', '')
        if is_empty_solution(solution_html):
            empty_solution_questions.append(q['question_number'])
    
    return empty_solution_questions


# ============== SUPABASE UPLOAD FUNCTIONS ==============

async def upload_to_supabase(file_path: str, file_data: bytes, content_type: str):
    """
    Upload a file to Supabase Storage
    
    Args:
        file_path: Path in bucket (e.g., "sprites/filename.png")
        file_data: Binary data to upload
        content_type: MIME type - "image/png" for images, "text/css" for CSS files
    
    Returns:
        Public URL if successful, None otherwise
    """
    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{file_path}"
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true"  # Overwrite if exists
    }
    
    log_sprite(f"Uploading to Supabase...")
    log_sprite(f"  - Target path: {SUPABASE_BUCKET}/{file_path}")
    log_sprite(f"  - Content-Type: {content_type}")
    log_sprite(f"  - Size: {len(file_data)} bytes")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(url, content=file_data, headers=headers, timeout=60.0)
            
            if response.status_code in [200, 201]:
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{file_path}"
                log_sprite(f"  - Status: SUCCESS (HTTP {response.status_code})")
                log_sprite(f"  - Public URL: {public_url}")
                return public_url
            else:
                log_sprite(f"  - Status: FAILED (HTTP {response.status_code})")
                log_sprite(f"  - Error: {response.text[:200]}")
                return None
    except Exception as e:
        log_sprite(f"  - Status: ERROR")
        log_sprite(f"  - Exception: {str(e)}")
        return None


async def download_file(url: str) -> bytes:
    """Download a file from URL"""
    log_sprite(f"Downloading: {url}")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=60.0, follow_redirects=True)
            if response.status_code == 200:
                log_sprite(f"  - Downloaded: {len(response.content)} bytes")
                return response.content
            else:
                log_sprite(f"  - Failed: HTTP {response.status_code}")
                return None
    except Exception as e:
        log_sprite(f"  - Error: {str(e)}")
        return None


async def extract_and_upload_sprites(page, test_slug: str, progress: dict):
    """
    Extract sprite CSS and PNG by directly constructing URLs for AP EAPCET.
    
    Handles multiple URL pattern variations:
    - eap21May2025s1.css (compact format: eap + day + Month + year + s + shift)
    - eap-18-May-2024-s1.css (with dashes: eap-day-Month-year-s-shift)
    - eap-15-may-2023-Shift1.css (with capital Shift: eap-day-month-year-Shift-shift)
    - eap-4-Jul-2022-Shift1.css (capital month: eap-day-Month-year-Shift-shift)
    - 19-Aug-2021-Shift1.css (no eap prefix: day-Month-year-Shift-shift)
    
    Tries multiple patterns until one works.
    """
    
    log_sprite("=" * 60)
    log_sprite(f"SPRITE EXTRACTION FOR: {test_slug}")
    log_sprite("=" * 60)
    
    # Check if already uploaded for this test
    if test_slug in progress.get('uploaded_sprite_sheets', []):
        log_sprite(f"Already uploaded - skipping")
        return
    
    try:
        # Extract components from test slug (e.g., "ap-eapcet-21-may-2025-shift-1-paper")
        slug_parts = test_slug.lower().split('-')
        
        day = None
        month = None
        month_capital = None  # Capitalized month name (May, Jul, Aug, etc.)
        year = None
        shift = "1"
        
        # Month name mapping (lowercase to capitalized abbreviations)
        month_map = {
            'jan': 'Jan', 'january': 'Jan',
            'feb': 'Feb', 'february': 'Feb',
            'mar': 'Mar', 'march': 'Mar',
            'apr': 'Apr', 'april': 'Apr',
            'may': 'May',
            'jun': 'Jun', 'june': 'Jun',
            'jul': 'Jul', 'july': 'Jul',
            'aug': 'Aug', 'august': 'Aug',
            'sep': 'Sep', 'sept': 'Sep', 'september': 'Sep',
            'oct': 'Oct', 'october': 'Oct',
            'nov': 'Nov', 'november': 'Nov',
            'dec': 'Dec', 'december': 'Dec'
        }
        
        # Find day, month, year (for date-based pattern - day-month-year order)
        day_raw = None
        for i, part in enumerate(slug_parts):
            # Extract numeric day - handle ordinals like "18th", "15th" and plain numbers like "04", "4"
            day_match = re.match(r'^(\d{1,2})', part)  # Extract leading digits (1-2 digits)
            if day_match:
                day_str = day_match.group(1)
                # Remove leading zeros (e.g., "04" -> "4", "08" -> "8")
                day = str(int(day_str))  # Convert to int then back to string to remove leading zeros
                day_raw = day
                if i + 2 < len(slug_parts):
                    month_name = slug_parts[i + 1]
                    month = month_name.lower()  # lowercase for some patterns
                    month_capital = month_map.get(month_name, month_name.capitalize())  # Capitalized for patterns
                    year = slug_parts[i + 2]
                    break
        
        # Find shift
        for i, part in enumerate(slug_parts):
            if part == 'shift' and i + 1 < len(slug_parts):
                shift = slug_parts[i + 1]
                break
        
        # If no date found, try to find just year
        if not year:
            for part in slug_parts:
                if part.isdigit() and len(part) == 4:  # 4-digit year
                    year = part
                    break
        
        cdn_base = "https://examsnet.github.io/cdn/img/engg/eamcet/apeap/prev"
        
        # Build all possible URL patterns for AP EAPCET
        url_patterns = []
        
        if day and month and year and month_capital:
            # Pattern 1: Compact format - eap21May2025s1.css (eap + day + Month + year + s + shift)
            base_compact = f"eap{day}{month_capital}{year}s{shift}"
            url_patterns.append({
                "name": base_compact,
                "css": f"{cdn_base}/{base_compact}.css",
                "png_variants": [
                    f"{cdn_base}/{base_compact}_0.png",  # eap21May2025s1_0.png
                    f"{cdn_base}/{base_compact}.png",
                    f"{cdn_base}/{base_compact}-{shift}.png",
                    f"{cdn_base}/{base_compact}-1.png",
                    f"{cdn_base}/{base_compact}-0.png"
                ]
            })
            
            # Pattern 2: With dashes - eap-18-May-2024-s1.css (eap-day-Month-year-s-shift)
            base_dash = f"eap-{day}-{month_capital}-{year}-s{shift}"
            url_patterns.append({
                "name": base_dash,
                "css": f"{cdn_base}/{base_dash}.css",
                "png_variants": [
                    f"{cdn_base}/{base_dash}_0.png",  # eap-22-May-2024-s1_0.png
                    f"{cdn_base}/{base_dash}.png",
                    f"{cdn_base}/{base_dash}-{shift}.png",
                    f"{cdn_base}/{base_dash}-1.png",
                    f"{cdn_base}/{base_dash}-0.png"
                ]
            })
            
            # Pattern 3: Lowercase month with capital Shift - eap-15-may-2023-Shift1.css
            base_shift = f"eap-{day}-{month}-{year}-Shift{shift}"
            url_patterns.append({
                "name": base_shift,
                "css": f"{cdn_base}/{base_shift}.css",
                "png_variants": [
                    f"{cdn_base}/{base_shift}_0.png",  # eap-15-may-2023-Shift1_0.png
                    f"{cdn_base}/{base_shift}.png",
                    f"{cdn_base}/{base_shift}-{shift}.png",
                    f"{cdn_base}/{base_shift}-1.png",
                    f"{cdn_base}/{base_shift}-0.png"
                ]
            })
            
            # Pattern 4: Capital month with capital Shift - eap-4-Jul-2022-Shift1.css
            base_cap_shift = f"eap-{day}-{month_capital}-{year}-Shift{shift}"
            url_patterns.append({
                "name": base_cap_shift,
                "css": f"{cdn_base}/{base_cap_shift}.css",
                "png_variants": [
                    f"{cdn_base}/{base_cap_shift}_0.png",  # eap-4-Jul-2022-Shift1_0.png
                    f"{cdn_base}/{base_cap_shift}.png",
                    f"{cdn_base}/{base_cap_shift}-{shift}.png",
                    f"{cdn_base}/{base_cap_shift}-1.png",
                    f"{cdn_base}/{base_cap_shift}-0.png"
                ]
            })
            
            # Pattern 5: No eap prefix - 19-Aug-2021-Shift1.css (day-Month-year-Shift-shift)
            base_no_prefix = f"{day}-{month_capital}-{year}-Shift{shift}"
            url_patterns.append({
                "name": base_no_prefix,
                "css": f"{cdn_base}/{base_no_prefix}.css",
                "png_variants": [
                    f"{cdn_base}/{base_no_prefix}_0.png",  # 19-Aug-2021-Shift1_0.png
                    f"{cdn_base}/{base_no_prefix}.png",
                    f"{cdn_base}/{base_no_prefix}-{shift}.png",
                    f"{cdn_base}/{base_no_prefix}-1.png",
                    f"{cdn_base}/{base_no_prefix}-0.png"
                ]
            })
            
            # Pattern 6: Try with lowercase shift format - eap-18-May-2024-shift1.css
            base_lower_shift = f"eap-{day}-{month_capital}-{year}-shift{shift}"
            url_patterns.append({
                "name": base_lower_shift,
                "css": f"{cdn_base}/{base_lower_shift}.css",
                "png_variants": [
                    f"{cdn_base}/{base_lower_shift}_0.png",  # eap-18-May-2024-shift1_0.png
                    f"{cdn_base}/{base_lower_shift}.png",
                    f"{cdn_base}/{base_lower_shift}-{shift}.png",
                    f"{cdn_base}/{base_lower_shift}-1.png"
                ]
            })
        
        if not url_patterns:
            log_sprite("ERROR: Could not extract date/year from test slug")
            return
        
        log_sprite(f"Extracted: day={day}, month={month} (capital: {month_capital}), year={year}, shift={shift}")
        log_sprite(f"Generated {len(url_patterns)} URL pattern(s)...")
        
        # Try each pattern until one works
        css_content = None
        css_text = None
        png_content = None
        working_pattern = None
        
        for pattern in url_patterns:
            log_sprite("")
            log_sprite(f"Trying pattern: {pattern['name']}")
            log_sprite(f"  CSS URL: {pattern['css']}")
            
            # Try downloading CSS
            css_content = await download_file(pattern['css'])
            if not css_content:
                log_sprite("  CSS download failed, trying next pattern...")
                continue
            
            try:
                css_text = css_content.decode('utf-8')
                log_sprite(f"  CSS SUCCESS! Downloaded {len(css_content)} bytes")
            except:
                log_sprite("  CSS decode failed, trying next pattern...")
                continue
            
            # Try downloading PNG - try all variants
            png_content = None
            for png_url in pattern['png_variants']:
                log_sprite(f"  Trying PNG: {png_url}")
                png_content = await download_file(png_url)
                if png_content and len(png_content) >= 1000:
                    log_sprite(f"  PNG SUCCESS! Downloaded {len(png_content)} bytes from {png_url}")
                    break
            
            if not png_content or len(png_content) < 1000:
                log_sprite("  All PNG variants failed, trying next pattern...")
                continue
            
            working_pattern = pattern
            break
        
        if not css_content or not css_text or not png_content:
            log_sprite("")
            log_sprite("ERROR: All URL patterns failed. Could not download sprite files.")
            return
        
        log_sprite("")
        log_sprite(f"Working pattern: {working_pattern['name']}")
        
        # STEP 2: Save and upload files
        log_sprite("")
        log_sprite("STEP 2: Saving and uploading sprite files...")
        log_sprite("-" * 40)
        
        # Generate sprite sheet ID from test slug (matches what's in JSON)
        sprite_sheet_id = test_slug.replace('-', '_')  # tg_eamcet_2_may_2025_shift_1_paper
        
        # Parse CSS to extract rules and update URLs
        log_sprite("Parsing CSS and updating URLs...")
        rule_pattern = re.compile(r'\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}', re.MULTILINE)
        all_sprite_rules = []
        
        for match in rule_pattern.finditer(css_text):
            class_name = match.group(1)
            css_body = match.group(2)
            all_sprite_rules.append({
                'selector': f'.{class_name}',
                'cssText': f'.{class_name} {{{css_body}}}'
            })
        
        log_sprite(f"  Parsed {len(all_sprite_rules)} CSS rules")
        
        # Helper to replace URLs with Supabase URLs
        # Replace any PNG URL in CSS with our Supabase PNG URL (using test slug format)
        def replace_url(match):
            # Use our sprite_sheet_id format for the PNG filename
            png_filename = f"{sprite_sheet_id}.png"  # tg_eamcet_2_may_2025_shift_1_paper.png
            new_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{png_filename}"
            return f"url('{new_url}')"
        
        # Update CSS to point to Supabase PNG URL
        # Replace any background-image URL with our Supabase PNG URL
        updated_css_text = re.sub(r"url\(['\"]?([^'\")\s]+)['\"]?\)", replace_url, css_text)
        
        # Save CSS locally
        css_filename = f"{sprite_sheet_id}.css"
        local_css_path = os.path.join(SPRITES_DIR, css_filename)
        with open(local_css_path, 'w', encoding='utf-8') as f:
            f.write(updated_css_text)
        log_sprite(f"Saved CSS locally: {local_css_path}")
        
        # Save PNG locally (use test slug format, not CDN format)
        png_filename = f"{sprite_sheet_id}.png"  # tg_eamcet_2_may_2025_shift_1_paper.png
        local_png_path = os.path.join(SPRITES_DIR, png_filename)
        with open(local_png_path, 'wb') as f:
            f.write(png_content)
        log_sprite(f"Saved PNG locally: {local_png_path}")
        
        # Upload PNG to Supabase
        log_sprite("")
        log_sprite("Uploading PNG to Supabase...")
        supabase_png_path = f"{SPRITES_FOLDER}/{png_filename}"
        uploaded_png_url = await upload_to_supabase(supabase_png_path, png_content, "image/png")
        
        if uploaded_png_url:
            log_sprite(f"  SUCCESS: {uploaded_png_url}")
        else:
            log_sprite("  FAILED to upload PNG")
            return
        
        # Upload CSS to Supabase
        log_sprite("")
        log_sprite("Uploading CSS to Supabase...")
        supabase_css_path = f"{SPRITES_FOLDER}/{css_filename}"
        css_url = await upload_to_supabase(supabase_css_path, updated_css_text.encode('utf-8'), "text/css")
        
        if css_url:
            log_sprite(f"  SUCCESS: {css_url}")
        else:
            log_sprite("  FAILED to upload CSS")
            return
        
        # Mark as uploaded in progress
        if 'uploaded_sprite_sheets' not in progress:
            progress['uploaded_sprite_sheets'] = []
        if test_slug not in progress['uploaded_sprite_sheets']:
            progress['uploaded_sprite_sheets'].append(test_slug)
            save_progress(progress)
        
        log_sprite("")
        log_sprite("=" * 50)
        log_sprite(f"Sprite processing complete for: {test_slug}")
        log_sprite("=" * 50)
        
    except Exception as e:
        log_sprite(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()


# ============== SCRAPING FUNCTIONS ==============

async def get_all_test_links(page):
    """Extract all test links from the main page"""
    log(f"Navigating to test list: {TEST_LIST_URL}")
    await page.goto(TEST_LIST_URL, wait_until="networkidle", timeout=60000)
    await asyncio.sleep(3)
    
    links = await page.locator('a.btn[href^="/test/"]').all()
    
    test_links = []
    seen_slugs = set()
    
    for link in links:
        href = await link.get_attribute('href')
        text = await link.inner_text()
        
        if href and "Start Learn Test" in text:
            test_slug = href.replace('/test/', '')
            
            if test_slug in seen_slugs:
                continue
            seen_slugs.add(test_slug)
            
            try:
                parent = link.locator('xpath=ancestor::div[contains(@class, "collapse")]')
                collapse_id = await parent.get_attribute('id')
                if collapse_id:
                    toggle = page.locator(f'a[href="#{collapse_id}"]')
                    title_elem = toggle.locator('h4')
                    title = await title_elem.inner_text()
                    title = title.strip()
                    if title and title[0].isdigit():
                        title = title.split('.', 1)[-1].strip()
                else:
                    title = test_slug.replace('-', ' ').title()
            except:
                title = test_slug.replace('-', ' ').title()
            
            test_links.append({
                "title": title,
                "slug": test_slug,
                "url": href
            })
    
    log(f"Found {len(test_links)} tests")
    return test_links


async def get_total_questions(page, test_url):
    """Get total number of questions"""
    try:
        await page.goto(f"{BASE_URL}{test_url}/1", wait_until="networkidle", timeout=30000)
        await asyncio.sleep(1)
        
        try:
            total_text = await page.locator('text=Total:').first.inner_text()
            total = int(total_text.replace('Total:', '').strip())
            return total
        except:
            pass
        
        try:
            options = await page.locator('select[aria-label="Go to Question"] option').count()
            if options > 0:
                return options
        except:
            pass
        
        return 160
    except:
        return 160


async def scrape_single_question(page, test_url, question_num):
    """Scrape a single question - SEQUENTIAL (no parallel)"""
    question_url = f"{BASE_URL}{test_url}/{question_num}"
    
    for retry in range(MAX_RETRIES):
        try:
            await page.goto(question_url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(DELAY_BETWEEN_REQUESTS)
            
            # Extract question HTML
            try:
                question_elem = page.locator('#imagewrap a').first
                question_html = await question_elem.inner_html()
            except:
                try:
                    question_elem = page.locator('#imagewrap').first
                    question_html = await question_elem.inner_html()
                except:
                    question_html = ""
            
            # Extract options
            options = []
            try:
                await page.wait_for_selector('#answers li', state='visible', timeout=5000)
                option_items = await page.locator('#answers li').all()
                
                for item in option_items:
                    try:
                        span = item.locator('label span').first
                        if await span.count() > 0:
                            option_html = await span.inner_html()
                            options.append(option_html)
                        else:
                            label = item.locator('label')
                            label_html = await label.inner_html()
                            option_html = re.sub(r'<input[^>]*>', '', label_html).strip()
                            options.append(option_html)
                    except:
                        options.append("")
            except:
                pass
            
            while len(options) < 4:
                options.append("")
            
            # Click option and validate
            try:
                first_radio = page.locator('input[name="answerid"]').first
                await first_radio.click()
                await asyncio.sleep(0.3)
            except:
                pass
            
            try:
                validate_btn = page.locator('a[onclick="v(event)"]').first
                await validate_btn.click()
                await asyncio.sleep(1.0)  # Increased wait time for solution content to load
            except:
                pass
            
            # Find correct answer
            correct_option = None
            try:
                correct_radio = page.locator('input.rightanswer').first
                value = await correct_radio.get_attribute('value')
                option_map = {'0': 'a', '1': 'b', '2': 'c', '3': 'd'}
                correct_option = option_map.get(value)
            except:
                pass
            
            # Extract solution - wait for answer validation to show solution
            solution_html = ""
            try:
                # First try to wait for #answerstatus to become visible
                try:
                    await page.wait_for_selector('#answerstatus', state='visible', timeout=3000)
                except:
                    # If not visible, try to make it visible by evaluating JS
                    try:
                        await page.evaluate('''() => {
                            const elem = document.getElementById("answerstatus");
                            if (elem) elem.style.display = "block";
                        }''')
                        await asyncio.sleep(0.5)
                    except:
                        pass
                
                # Wait for actual content to appear (fmath elements or substantial content)
                # This handles the timing issue where div exists but content hasn't loaded
                max_wait_attempts = 10
                for wait_attempt in range(max_wait_attempts):
                    try:
                        # Wait for fmath elements to appear (indicates content is loaded)
                        try:
                            await page.wait_for_selector('#answerstatus fmath', state='visible', timeout=500)
                        except:
                            # If no fmath, wait a bit and check for any substantial content
                            await asyncio.sleep(0.3)
                        
                        # Method 1: Look for div with position style (contains actual solution content)
                        # This is the main container with solution content
                        try:
                            solution_elem = page.locator('#answerstatus div[style*="position"]').first
                            count = await solution_elem.count()
                            if count > 0:
                                solution_html = await solution_elem.inner_html()
                                # Verify we have actual content, not just empty div
                                if solution_html and len(solution_html.strip()) > 50:
                                    # Check for fmath or other content indicators
                                    if '<fmath' in solution_html or 'sprite' in solution_html or len(solution_html.strip()) > 100:
                                        break  # We have real content
                                    else:
                                        solution_html = ""  # Empty div, keep waiting
                                else:
                                    solution_html = ""  # Reset if too short
                        except Exception as e:
                            pass
                        
                        # Method 2: If method 1 failed, iterate through all divs in answerstatus
                        if not solution_html or len(solution_html.strip()) < 50:
                            try:
                                solution_divs = await page.locator('#answerstatus > div').all()
                                for div in solution_divs:
                                    div_html = await div.inner_html()
                                    div_class = await div.get_attribute('class') or ''
                                    div_style = await div.get_attribute('style') or ''
                                    
                                    # Skip header div (contains "Solution:" text)
                                    if 'Solution:' in div_html and '<strong>' in div_html:
                                        continue
                                    # Skip watermark divs
                                    if 'watermark' in div_class.lower() or 'watermark' in div_style.lower():
                                        continue
                                    # Skip empty divs
                                    if not div_html or len(div_html.strip()) < 20:
                                        continue
                                    
                                    # Take the first substantial div (should be the solution content)
                                    if div_html and (len(div_html.strip()) > 50 or '<fmath' in div_html or 'sprite' in div_html):
                                        solution_html = div_html
                                        break
                            except Exception as e:
                                pass
                        
                        # If we found content, break out of wait loop
                        if solution_html and len(solution_html.strip()) > 50 and ('<fmath' in solution_html or 'sprite' in solution_html or len(solution_html.strip()) > 100):
                            break
                        
                        # If still no content, wait a bit more
                        if wait_attempt < max_wait_attempts - 1:
                            await asyncio.sleep(0.3)
                    except:
                        await asyncio.sleep(0.3)
                
                # Method 3: Get entire answerstatus content and clean it up
                if not solution_html or len(solution_html.strip()) < 50:
                    try:
                        solution_elem = page.locator('#answerstatus')
                        full_html = await solution_elem.inner_html()
                        
                        # Remove header section (div containing "Solution:")
                        full_html = re.sub(r'<div[^>]*class="[^"]*text-primary[^"]*"[^>]*>.*?<strong>Solution:</strong>.*?</div>', '', full_html, flags=re.DOTALL | re.IGNORECASE)
                        full_html = re.sub(r'<div[^>]*>.*?<strong>Solution:</strong>.*?</div>', '', full_html, flags=re.DOTALL | re.IGNORECASE)
                        
                        # Remove watermark sections
                        full_html = re.sub(r'<div[^>]*class="[^"]*watermark[^"]*"[^>]*>.*?</div>', '', full_html, flags=re.DOTALL | re.IGNORECASE)
                        full_html = re.sub(r'<div[^>]*style="[^"]*z-index[^"]*"[^>]*class="[^"]*watermark[^"]*"[^>]*>.*?</div>', '', full_html, flags=re.DOTALL | re.IGNORECASE)
                        
                        # Clean up extra whitespace
                        solution_html = re.sub(r'\s+', ' ', full_html).strip()
                        
                        # If still too short, try one more time with simpler regex
                        if len(solution_html.strip()) < 50:
                            # Get all text content as last resort
                            text_content = await solution_elem.inner_text()
                            if len(text_content.strip()) > 50:
                                # Fallback to inner_text if HTML extraction fails
                                solution_html = full_html.strip()
                    except Exception as e:
                        pass
                    
            except Exception as sol_error:
                # Final fallback - just get whatever is in #answerstatus
                try:
                    solution_elem = page.locator('#answerstatus')
                    solution_html = await solution_elem.inner_html()
                    # Basic cleanup
                    solution_html = re.sub(r'<div[^>]*>.*?<strong>Solution:</strong>.*?</div>', '', solution_html, flags=re.DOTALL)
                    solution_html = re.sub(r'<div[^>]*class="[^"]*watermark[^"]*"[^>]*>.*?</div>', '', solution_html, flags=re.DOTALL)
                    solution_html = solution_html.strip()
                except:
                    pass
            
            return {
                "question_number": question_num,
                "question_html": question_html.strip(),
                "option_a": options[0].strip() if options[0] else "",
                "option_b": options[1].strip() if options[1] else "",
                "option_c": options[2].strip() if options[2] else "",
                "option_d": options[3].strip() if options[3] else "",
                "correct_option": correct_option,
                "solution_html": solution_html.strip()
            }
            
        except Exception as e:
            if retry < MAX_RETRIES - 1:
                log(f"  Retry {retry + 1}/{MAX_RETRIES} for Q{question_num}: {str(e)[:50]}", "WARN")
                await asyncio.sleep(1)
            else:
                log(f"  FAILED Q{question_num} after {MAX_RETRIES} retries: {str(e)[:50]}", "ERROR")
                return None
    
    return None


async def fix_empty_solution_question(page, test_url, test_slug, question_num):
    """Fix a single question that has empty or empty div solution"""
    log(f"  Fixing empty solution for Q{question_num}...")
    
    result = await scrape_single_question(page, test_url, question_num)
    if not result:
        log(f"  Failed to fix Q{question_num}", "WARN")
        return False
    
    # Check if we got a valid solution
    if is_empty_solution(result.get('solution_html', '')):
        log(f"  Q{question_num} still has empty solution after retry", "WARN")
        return False
    
    # Update the question in the test data
    test_data = load_test_data(test_slug)
    if not test_data:
        return False
    
    # Find and update the question
    updated = False
    for q in test_data.get('questions', []):
        if q['question_number'] == question_num:
            q['solution_html'] = result['solution_html']
            updated = True
            break
    
    if updated:
        save_test_data(test_slug, test_data)
        log(f"  Fixed Q{question_num} solution")
        return True
    
    return False


async def scrape_test(page, test_info, progress):
    """Scrape a single test - SEQUENTIAL (one question at a time)"""
    test_url = test_info['url']
    test_slug = test_info['slug']
    test_title = test_info['title']
    
    log("=" * 60)
    log(f"SCRAPING TEST: {test_title}")
    log(f"Slug: {test_slug}")
    log(f"URL: {test_url}")
    log("=" * 60)
    
    # Get total questions
    total_questions = await get_total_questions(page, test_url)
    log(f"Total questions: {total_questions}")
    
    # Extract and upload sprites for this test
    await extract_and_upload_sprites(page, test_slug, progress)
    
    # Load existing test data
    sprite_sheet_id = test_slug.replace('-', '_')
    test_data = load_test_data(test_slug)
    if test_data is None:
        test_data = {
            "title": test_title,
            "slug": test_slug,
            "url": test_url,
            "total_questions": total_questions,
            "sprite_css_url": f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{sprite_sheet_id}.css",
            "sprite_sheet_url": f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{sprite_sheet_id}.png",
            "questions": []
        }
        save_test_data(test_slug, test_data)
    else:
        # Update sprite URLs if they don't exist in existing data
        if "sprite_css_url" not in test_data:
            test_data["sprite_css_url"] = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{sprite_sheet_id}.css"
        if "sprite_sheet_url" not in test_data:
            test_data["sprite_sheet_url"] = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{sprite_sheet_id}.png"
        save_test_data(test_slug, test_data)
    
    # Check for questions with empty solutions and fix them
    empty_solution_nums = find_questions_with_empty_solutions(test_slug)
    if empty_solution_nums:
        log(f"Found {len(empty_solution_nums)} questions with empty solutions - fixing...")
        fixed_count = 0
        for q_num in empty_solution_nums:
            if await fix_empty_solution_question(page, test_url, test_slug, q_num):
                fixed_count += 1
            await asyncio.sleep(0.3)  # Small delay between fixes
        log(f"Fixed {fixed_count}/{len(empty_solution_nums)} questions with empty solutions")
    
    # Find missing questions
    existing_nums = {q['question_number'] for q in test_data.get('questions', [])}
    missing_nums = [i for i in range(1, total_questions + 1) if i not in existing_nums]
    
    if not missing_nums:
        log(f"All {total_questions} questions already scraped")
        return test_data
    
    log(f"Missing questions: {len(missing_nums)}")
    log(f"Starting sequential scrape...")
    
    # Scrape questions ONE BY ONE (sequential)
    scraped_count = 0
    for q_num in missing_nums:
        log(f"  Scraping question {q_num}/{total_questions}...")
        
        result = await scrape_single_question(page, test_url, q_num)
        
        if result:
            added = add_question(test_slug, result)
            if added:
                scraped_count += 1
                log(f"  Saved Q{q_num} (correct: {result['correct_option']})")
            else:
                log(f"  Q{q_num} already exists - skipped")
        else:
            log(f"  Q{q_num} failed to scrape", "WARN")
        
        # Small delay between questions
        await asyncio.sleep(0.2)
    
    # Reload final data
    test_data = load_test_data(test_slug)
    log(f"Completed: {len(test_data['questions'])}/{total_questions} questions saved")
    
    # Mark test as completed
    if test_slug not in progress['completed_tests']:
        progress['completed_tests'].append(test_slug)
        save_progress(progress)
    
    return test_data


async def fix_all_empty_solutions(page, progress):
    """Scan all existing test data and fix questions with empty/empty div solutions"""
    log("=" * 60)
    log("SCANNING ALL EXISTING TESTS FOR EMPTY SOLUTIONS")
    log("=" * 60)
    
    # Get all JSON files in output directory
    json_files = []
    for filename in os.listdir(OUTPUT_DIR):
        if filename.endswith('.json') and filename not in ['progress.json', 'all_questions.json']:
            json_files.append(filename)
    
    log(f"Found {len(json_files)} test files to check")
    
    total_fixed = 0
    total_questions_to_fix = 0
    
    for filename in json_files:
        test_slug = filename.replace('.json', '')
        test_data = load_test_data(test_slug)
        
        if not test_data:
            continue
        
        # Get test URL from data
        test_url = test_data.get('url', '')
        if not test_url:
            # Try to construct URL from slug
            test_url = f"/test/{test_slug}"
        
        # Find questions with empty solutions
        empty_solution_nums = find_questions_with_empty_solutions(test_slug)
        
        if empty_solution_nums:
            log("")
            log(f"Test: {test_data.get('title', test_slug)}")
            log(f"  Found {len(empty_solution_nums)} questions with empty solutions: {empty_solution_nums}")
            total_questions_to_fix += len(empty_solution_nums)
            
            fixed_count = 0
            for q_num in empty_solution_nums:
                if await fix_empty_solution_question(page, test_url, test_slug, q_num):
                    fixed_count += 1
                    total_fixed += 1
                await asyncio.sleep(0.3)  # Small delay between fixes
            
            log(f"  Fixed {fixed_count}/{len(empty_solution_nums)} questions")
    
    log("")
    log("=" * 60)
    log(f"FIXING COMPLETE: Fixed {total_fixed}/{total_questions_to_fix} questions across all tests")
    log("=" * 60)
    return total_fixed, total_questions_to_fix


async def merge_all_data():
    """Merge all individual test files into one"""
    all_data = {"tests": [], "last_updated": datetime.now().isoformat()}
    
    for filename in os.listdir(OUTPUT_DIR):
        if filename.endswith('.json') and filename not in ['progress.json', 'all_questions.json']:
            filepath = os.path.join(OUTPUT_DIR, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    test_data = json.load(f)
                    if 'questions' in test_data:
                        all_data['tests'].append(test_data)
            except:
                pass
    
    all_data['tests'].sort(key=lambda x: x.get('title', ''))
    save_json(ALL_DATA_FILE, all_data)
    
    total_questions = sum(len(t.get('questions', [])) for t in all_data['tests'])
    log(f"Merged: {len(all_data['tests'])} tests, {total_questions} total questions")


async def main():
    """Main scraper - FIX EMPTY SOLUTIONS ONLY"""
    print("=" * 60)
    print("AP EAPCET Question Scraper - FIX EMPTY SOLUTIONS MODE")
    print("=" * 60)
    print()
    print("CONFIGURATION:")
    print(f"  Supabase URL: {SUPABASE_URL}")
    print(f"  Bucket: {SUPABASE_BUCKET}")
    print(f"  Sprites folder: {SPRITES_FOLDER}")
    print()
    print("FILE TYPES UPLOADED:")
    print("  - *.png files: image/png (binary image)")
    print("  - *.css files: text/css (text file)")
    print()
    print("=" * 60)
    
    ensure_output_dirs()
    progress = load_progress()
    
    log(f"Previously completed tests: {len(progress.get('completed_tests', []))}")
    log(f"Previously uploaded sprites: {len(progress.get('uploaded_sprite_sheets', []))}")
    
    async with async_playwright() as p:
        log("Launching browser...")
        browser = await p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        
        page = await context.new_page()
        log("Browser ready")
        
        try:
            # Fix all existing empty solutions
            await fix_all_empty_solutions(page, progress)
            
            # Merge all data
            await merge_all_data()
            
            print()
            print("=" * 60)
            print("EMPTY SOLUTIONS FIXING COMPLETE!")
            print("=" * 60)
            print()
            print(f"Sprite sheets URL base:")
            print(f"  {SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/")
            print()
            print(f"Local data: {OUTPUT_DIR}/")
            print(f"Local sprites: {SPRITES_DIR}/")
            
        except Exception as e:
            log(f"ERROR: {str(e)}", "ERROR")
            import traceback
            traceback.print_exc()
            raise
        finally:
            await browser.close()


if __name__ == "__main__":
    start_time = time.time()
    asyncio.run(main())
    elapsed = time.time() - start_time
    print(f"\nTotal time: {elapsed/60:.1f} minutes")
