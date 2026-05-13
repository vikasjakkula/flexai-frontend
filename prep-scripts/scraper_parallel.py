"""
TS EAMCET Question Scraper - PARALLEL VERSION
Scrapes questions, extracts sprite sheets + CSS, uploads to Supabase
Uses multiple browser pages for concurrent scraping
"""

import asyncio
import json
import os
import re
import time
import threading
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
TEST_LIST_URL = f"{BASE_URL}/exams/ts-eamcet-previous-question-papers-online"
OUTPUT_DIR = "scraped_data"
SPRITES_DIR = os.path.join(OUTPUT_DIR, "sprites")
PROGRESS_FILE = os.path.join(OUTPUT_DIR, "progress.json")
ALL_DATA_FILE = os.path.join(OUTPUT_DIR, "all_questions.json")

# PARALLEL SETTINGS
MAX_CONCURRENT_TESTS = 3        # Number of tests to scrape in parallel
MAX_CONCURRENT_QUESTIONS = 5    # Number of questions per test in parallel
MAX_BROWSER_PAGES = 15          # Total browser pages (should be >= MAX_CONCURRENT_TESTS * MAX_CONCURRENT_QUESTIONS)

# TIMING
DELAY_BETWEEN_REQUESTS = 0.5    # Seconds between requests (per page)
MAX_RETRIES = 3

# Thread lock for file writes
file_lock = threading.Lock()


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


def load_json_safe(filepath, default):
    """Thread-safe JSON load"""
    with file_lock:
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return default
        return default


def save_json_safe(filepath, data):
    """Thread-safe JSON save"""
    with file_lock:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


def load_progress():
    return load_json_safe(PROGRESS_FILE, {
        "completed_tests": [],
        "uploaded_sprite_sheets": []
    })


def save_progress(progress):
    save_json_safe(PROGRESS_FILE, progress)


def load_test_data(test_slug):
    """Load individual test data"""
    filepath = os.path.join(OUTPUT_DIR, f"{test_slug}.json")
    return load_json_safe(filepath, None)


def save_test_data(test_slug, test_data):
    """Save individual test data"""
    filepath = os.path.join(OUTPUT_DIR, f"{test_slug}.json")
    save_json_safe(filepath, test_data)


def question_exists(test_data, question_num):
    """Check if question already exists in test data"""
    if not test_data or 'questions' not in test_data:
        return False
    return any(q['question_number'] == question_num for q in test_data['questions'])


def add_question_safe(test_slug, question_data):
    """Thread-safe add question to test data"""
    with file_lock:
        filepath = os.path.join(OUTPUT_DIR, f"{test_slug}.json")
        
        # Load current data
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                test_data = json.load(f)
        else:
            test_data = {"slug": test_slug, "questions": []}
        
        # Check if question already exists
        q_num = question_data['question_number']
        exists = any(q['question_number'] == q_num for q in test_data['questions'])
        
        if not exists:
            test_data['questions'].append(question_data)
            test_data['questions'].sort(key=lambda x: x['question_number'])
            
            # Save
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(test_data, f, indent=2, ensure_ascii=False)
            
            return True
        return False


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
    Extract sprite CSS and PNG by directly constructing URLs.
    
    URL patterns supported:
    1. Date-based: ts_{day}_{month}_{year}_s{shift}.css (e.g., ts_2_may_2025_s1.css)
    2. Year-only: ts{year}.css (e.g., ts2015.css)
    
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
        log_sprite("Starting sprite extraction process...")
        # Extract components from test slug
        # Example: tg-eamcet-2-may-2025-shift-1-paper or ts-eamcet-2015-paper
        slug_parts = test_slug.lower().split('-')
        
        day = None
        month = None
        year = None
        shift = "1"
        
        # Find day, month, year (for date-based pattern)
        for i, part in enumerate(slug_parts):
            if part.isdigit() and len(part) <= 2:  # day
                day = part
                if i + 2 < len(slug_parts):
                    month_name = slug_parts[i + 1]
                    month = month_name[:3]  # First 3 chars (may, jun, etc.)
                    year = slug_parts[i + 2]
                    break
        
        # Find shift
        for i, part in enumerate(slug_parts):
            if part == 'shift' and i + 1 < len(slug_parts):
                shift = slug_parts[i + 1]
                break
        
        # If no date found, try to find just year (for year-only pattern)
        if not year:
            for part in slug_parts:
                if part.isdigit() and len(part) == 4:  # 4-digit year
                    year = part
                    break
        
        cdn_base = "https://examsnet.github.io/cdn/img/engg/eamcet/ts/prev"
        
        # Try multiple URL patterns
        url_patterns = []
        
        # Pattern 1: Date-based with shift (ts_2_may_2025_s1.css)
        if day and month and year:
            base_pattern = f"ts_{day}_{month}_{year}_s{shift}"
            url_patterns.append({
                "name": "date-based with shift",
                "css": f"{cdn_base}/{base_pattern}.css",
                "png": f"{cdn_base}/{base_pattern}_0.png"
            })
            # Also try without shift (ts_2_may_2025.css)
            base_pattern_no_shift = f"ts_{day}_{month}_{year}"
            url_patterns.append({
                "name": "date-based without shift",
                "css": f"{cdn_base}/{base_pattern_no_shift}.css",
                "png": f"{cdn_base}/{base_pattern_no_shift}_0.png"
            })
        
        # Pattern 2: Year-only (ts2015.css)
        if year and len(year) == 4:
            url_patterns.append({
                "name": "year-only",
                "css": f"{cdn_base}/ts{year}.css",
                "png": f"{cdn_base}/ts{year}.png"
            })
        
        if not url_patterns:
            log_sprite("ERROR: Could not extract date/year from test slug")
            return
        
        log_sprite(f"Extracted: day={day}, month={month}, year={year}, shift={shift}")
        log_sprite(f"Trying {len(url_patterns)} URL pattern(s)...")
        
        # Try each pattern until one works
        css_content = None
        css_text = None
        png_content = None
        working_pattern = None
        
        for pattern in url_patterns:
            log_sprite("")
            log_sprite(f"Trying pattern: {pattern['name']}")
            log_sprite(f"  CSS URL: {pattern['css']}")
            log_sprite(f"  PNG URL: {pattern['png']}")
            
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
            
            # Try downloading PNG
            png_content = await download_file(pattern['png'])
            if not png_content or len(png_content) < 1000:
                log_sprite("  PNG download failed, trying next pattern...")
                continue
            
            log_sprite(f"  PNG SUCCESS! Downloaded {len(png_content)} bytes")
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
        
        # Ensure directories exist before saving
        with file_lock:
            os.makedirs(SPRITES_DIR, exist_ok=True)
        
        # Save CSS locally
        css_filename = f"{sprite_sheet_id}.css"
        local_css_path = os.path.join(SPRITES_DIR, css_filename)
        with file_lock:
            with open(local_css_path, 'w', encoding='utf-8') as f:
                f.write(updated_css_text)
        log_sprite(f"Saved CSS locally: {local_css_path}")
        
        # Save PNG locally (use test slug format, not CDN format)
        png_filename = f"{sprite_sheet_id}.png"  # tg_eamcet_2_may_2025_shift_1_paper.png
        local_png_path = os.path.join(SPRITES_DIR, png_filename)
        with file_lock:
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
            log_sprite("  FAILED to upload PNG - continuing anyway")
        
        # Upload CSS to Supabase
        log_sprite("")
        log_sprite("Uploading CSS to Supabase...")
        supabase_css_path = f"{SPRITES_FOLDER}/{css_filename}"
        css_url = await upload_to_supabase(supabase_css_path, updated_css_text.encode('utf-8'), "text/css")
        
        if css_url:
            log_sprite(f"  SUCCESS: {css_url}")
        else:
            log_sprite("  FAILED to upload CSS - continuing anyway")
        
        # Mark as uploaded in progress
        log_sprite("Marking sprite as uploaded in progress...")
        try:
            with file_lock:
                if 'uploaded_sprite_sheets' not in progress:
                    progress['uploaded_sprite_sheets'] = []
                if test_slug not in progress['uploaded_sprite_sheets']:
                    progress['uploaded_sprite_sheets'].append(test_slug)
                    save_progress(progress)
            log_sprite("Progress updated successfully")
        except Exception as e:
            log_sprite(f"ERROR updating progress (continuing anyway): {str(e)}")
            import traceback
            traceback.print_exc()
        
        log_sprite("")
        log_sprite("=" * 50)
        log_sprite(f"Sprite processing complete for: {test_slug}")
        log_sprite("=" * 50)
        
    except Exception as e:
        log_sprite(f"ERROR in sprite extraction: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        log_sprite(f"RETURNING from extract_and_upload_sprites for: {test_slug}")


# ============== SCRAPING FUNCTIONS ==============

class PagePool:
    """Pool of browser pages for parallel scraping"""
    
    def __init__(self, context, size):
        self.context = context
        self.size = size
        self.pages = asyncio.Queue()
        self.created = 0
        self.lock = asyncio.Lock()
    
    async def initialize(self):
        """Create initial pages"""
        for _ in range(self.size):
            page = await self.context.new_page()
            await self.pages.put(page)
            self.created += 1
    
    async def acquire(self):
        """Get a page from pool"""
        return await self.pages.get()
    
    async def release(self, page):
        """Return page to pool"""
        await self.pages.put(page)
    
    async def close_all(self):
        """Close all pages"""
        while not self.pages.empty():
            page = await self.pages.get()
            await page.close()


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


async def scrape_single_question(page, test_url, test_slug, question_num, semaphore):
    """Scrape a single question with semaphore control"""
    async with semaphore:
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
                    await asyncio.sleep(0.5)
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
                        await page.wait_for_selector('#answerstatus', state='visible', timeout=2000)
                    except:
                        # If not visible, try to make it visible by evaluating JS
                        await page.evaluate('document.getElementById("answerstatus").style.display = "block"')
                        await asyncio.sleep(0.3)
                    
                    # Method 1: Look for div with position style (contains actual solution content)
                    try:
                        solution_elem = page.locator('#answerstatus > div[style*="position"]').first
                        if await solution_elem.count() > 0:
                            solution_html = await solution_elem.inner_html()
                    except:
                        pass
                    
                    # Method 2: If method 1 failed, iterate through divs
                    if not solution_html or len(solution_html) < 20:
                        solution_divs = await page.locator('#answerstatus > div').all()
                        for div in solution_divs:
                            div_html = await div.inner_html()
                            div_class = await div.get_attribute('class') or ''
                            
                            # Skip header and watermark divs
                            if '<strong>Solution:</strong>' in div_html:
                                continue
                            if 'watermark' in div_class:
                                continue
                            
                            # Take the first substantial div (may contain sprites or text)
                            if div_html and (len(div_html) > 20 or 'sprite' in div_html):
                                solution_html = div_html
                                break
                    
                    # Method 3: Get entire answerstatus content as fallback
                    if not solution_html:
                        solution_elem = page.locator('#answerstatus')
                        full_html = await solution_elem.inner_html()
                        # Remove header and watermark sections
                        full_html = re.sub(r'<div[^>]*>.*?<strong>Solution:</strong>.*?</div>', '', full_html, flags=re.DOTALL)
                        full_html = re.sub(r'<div[^>]*class="[^"]*watermark[^"]*"[^>]*>.*?</div>', '', full_html, flags=re.DOTALL)
                        solution_html = full_html.strip()
                        
                except Exception as sol_error:
                    # Final fallback - just get whatever is in #answerstatus
                    try:
                        solution_elem = page.locator('#answerstatus')
                        solution_html = await solution_elem.inner_html()
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
                    await asyncio.sleep(1)
                else:
                    log(f"  FAILED Q{question_num} after {MAX_RETRIES} retries: {str(e)[:50]}", "ERROR")
                    return None
        
        return None


async def scrape_test_parallel(page_pool, test_info, progress, test_semaphore):
    """Scrape a single test with parallel question fetching"""
    test_url = test_info['url']
    test_slug = test_info['slug']
    test_title = test_info['title']
    
    try:
        log(f"[SEMAPHORE] Waiting for slot to start: {test_title}")
        async with test_semaphore:
            log(f"[SEMAPHORE] Acquired slot, starting: {test_title}")
            log("=" * 60)
            log(f"SCRAPING TEST: {test_title}")
            log(f"Slug: {test_slug}")
            log(f"URL: {test_url}")
            log("=" * 60)
            
            # Get a page to check total questions
            page = await page_pool.acquire()
            try:
                total_questions = await get_total_questions(page, test_url)
                log(f"Total questions: {total_questions}")
            finally:
                await page_pool.release(page)
            
            # Extract and upload sprites for this test (use a page from pool)
            sprite_page = await page_pool.acquire()
            try:
                log(f"Extracting sprites for {test_slug}...")
                await extract_and_upload_sprites(sprite_page, test_slug, progress)
                log(f"Sprite extraction completed for {test_slug}")
            except Exception as e:
                log(f"ERROR in sprite extraction for {test_slug}: {str(e)}", "ERROR")
                import traceback
                traceback.print_exc()
            finally:
                await page_pool.release(sprite_page)
            
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
            
            # Find missing questions
            existing_nums = {q['question_number'] for q in test_data.get('questions', [])}
            missing_nums = [i for i in range(1, total_questions + 1) if i not in existing_nums]
            
            if not missing_nums:
                log(f"All {total_questions} questions already scraped - skipping")
                return test_data
            
            log(f"Missing questions: {len(missing_nums)}")
            log(f"Starting parallel scrape with {MAX_CONCURRENT_QUESTIONS} concurrent questions...")
            
            # Semaphore for questions within this test
            question_semaphore = asyncio.Semaphore(MAX_CONCURRENT_QUESTIONS)
            
            # Scrape questions in batches
            batch_size = MAX_CONCURRENT_QUESTIONS
            scraped_count = 0
            
            for i in range(0, len(missing_nums), batch_size):
                batch = missing_nums[i:i + batch_size]
                
                # Get pages for batch
                pages = []
                for _ in range(len(batch)):
                    p = await page_pool.acquire()
                    pages.append(p)
                
                try:
                    # Scrape batch in parallel
                    tasks = []
                    for j, q_num in enumerate(batch):
                        tasks.append(scrape_single_question(
                            pages[j], test_url, test_slug, q_num, question_semaphore
                        ))
                    
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                    
                    # Process results
                    for result in results:
                        if isinstance(result, dict) and result is not None:
                            added = add_question_safe(test_slug, result)
                            if added:
                                scraped_count += 1
                                log(f"  Saved Q{result['question_number']} (correct: {result['correct_option']})")
                    
                    log(f"  Progress: {scraped_count}/{len(missing_nums)} questions scraped")
                    
                finally:
                    # Release pages
                    for p in pages:
                        await page_pool.release(p)
            
            # Reload final data
            test_data = load_test_data(test_slug)
            log(f"Completed: {len(test_data['questions'])}/{total_questions} questions saved")
        
            # Mark test as completed
            with file_lock:
                if test_slug not in progress['completed_tests']:
                    progress['completed_tests'].append(test_slug)
                    save_progress(progress)
            
            log(f"[SEMAPHORE] Test completed, releasing slot: {test_title}")
            return test_data
    except Exception as e:
        log(f"CRITICAL ERROR in scrape_test_parallel for '{test_title}' ({test_slug}): {str(e)}", "ERROR")
        log(f"[SEMAPHORE] Releasing slot due to error: {test_title}")
        import traceback
        traceback.print_exc()
        raise  # Re-raise so it's caught by gather


async def merge_all_data():
    """Merge all individual test files into one"""
    all_data = {"tests": [], "last_updated": datetime.now().isoformat()}
    
    # Ensure output directory exists
    if not os.path.exists(OUTPUT_DIR):
        log("Output directory does not exist, creating it...", "WARN")
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        return  # No files to merge if directory didn't exist
    
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
    save_json_safe(ALL_DATA_FILE, all_data)
    
    total_questions = sum(len(t.get('questions', [])) for t in all_data['tests'])
    log(f"Merged: {len(all_data['tests'])} tests, {total_questions} total questions")


async def main():
    """Main parallel scraper"""
    print("=" * 60)
    print("TS EAMCET Question Scraper - PARALLEL MODE")
    print("=" * 60)
    print()
    print("CONFIGURATION:")
    print(f"  Supabase URL: {SUPABASE_URL}")
    print(f"  Bucket: {SUPABASE_BUCKET}")
    print(f"  Sprites folder: {SPRITES_FOLDER}")
    print()
    print("PARALLEL SETTINGS:")
    print(f"  Concurrent tests: {MAX_CONCURRENT_TESTS}")
    print(f"  Concurrent questions per test: {MAX_CONCURRENT_QUESTIONS}")
    print(f"  Total browser pages: {MAX_BROWSER_PAGES}")
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
        
        # Create page pool
        log(f"Creating {MAX_BROWSER_PAGES} browser pages...")
        page_pool = PagePool(context, MAX_BROWSER_PAGES)
        await page_pool.initialize()
        log("Page pool ready")
        
        try:
            # Get test links
            page = await page_pool.acquire()
            test_links = await get_all_test_links(page)
            await page_pool.release(page)
            
            # Filter completed tests
            completed = set(progress.get('completed_tests', []))
            pending_tests = [t for t in test_links if t['slug'] not in completed]
            
            log(f"Pending tests: {len(pending_tests)}/{len(test_links)}")
            
            if not pending_tests:
                log("All tests already scraped!")
            else:
                # Semaphore for concurrent tests
                test_semaphore = asyncio.Semaphore(MAX_CONCURRENT_TESTS)
                
                log(f"Creating {len(pending_tests)} test tasks with max {MAX_CONCURRENT_TESTS} concurrent...")
                # Scrape tests in parallel
                tasks = [
                    scrape_test_parallel(page_pool, test_info, progress, test_semaphore)
                    for test_info in pending_tests
                ]
                
                log(f"All {len(tasks)} tasks created. Starting execution (first {MAX_CONCURRENT_TESTS} will start immediately)...")
                results = await asyncio.gather(*tasks, return_exceptions=True)
                log(f"All {len(results)} tasks completed.")
                
                # Log any exceptions that occurred
                for i, result in enumerate(results):
                    if isinstance(result, Exception):
                        test_info = pending_tests[i]
                        log(f"ERROR: Test '{test_info['title']}' ({test_info['slug']}) failed with exception: {str(result)}", "ERROR")
                        import traceback
                        if hasattr(result, '__traceback__'):
                            traceback.print_exception(type(result), result, result.__traceback__)
                        else:
                            log(f"Exception details: {repr(result)}", "ERROR")
            
            # Merge all data
            await merge_all_data()
            
            print()
            print("=" * 60)
            print("SCRAPING COMPLETE!")
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
            await page_pool.close_all()
            await browser.close()


if __name__ == "__main__":
    start_time = time.time()
    asyncio.run(main())
    elapsed = time.time() - start_time
    print(f"\nTotal time: {elapsed/60:.1f} minutes")
