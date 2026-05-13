"""
AP EAMCET Medical Question Scraper
Scrapes questions from https://examsnet.com/exams/ap-eamcet-medical-exam-previous-question-papers-online
Lists tests year-wise, then scrapes using same practices as ap-scraper.py
"""

import asyncio
import json
import os
import re
import sys
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
TEST_LIST_URL = f"{BASE_URL}/exams/ap-eamcet-medical-exam-previous-question-papers-online"
OUTPUT_DIR = "ap_medical_scraped_data"
SPRITES_DIR = os.path.join(OUTPUT_DIR, "sprites")
PROGRESS_FILE = os.path.join(OUTPUT_DIR, "progress.json")
ALL_DATA_FILE = os.path.join(OUTPUT_DIR, "all_questions.json")

# TIMING
DELAY_BETWEEN_REQUESTS = 0.5
MAX_RETRIES = 3

# Set to None to scrape all questions; set to N to scrape only first N questions per test (faster)
LIMIT_QUESTIONS_PER_TEST = None  # Full scrape - all questions per test

# For parallel runs: 2 scripts - one from start, one from end.
# "start" = first half (0 to N/2), "reverse" = second half (N/2 to N, reversed)
# Can override via env: AP_MEDICAL_SCRAPER_SLICE=reverse
SLICE_MODE = os.environ.get("AP_MEDICAL_SCRAPER_SLICE", "start")


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


# ============== SUPABASE UPLOAD FUNCTIONS ==============

async def upload_to_supabase(file_path: str, file_data: bytes, content_type: str):
    """Upload a file to Supabase Storage"""
    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{file_path}"
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true"
    }
    
    log_sprite(f"Uploading to Supabase...")
    log_sprite(f"  - Target path: {SUPABASE_BUCKET}/{file_path}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(url, content=file_data, headers=headers, timeout=60.0)
            
            if response.status_code in [200, 201]:
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{file_path}"
                log_sprite(f"  - Status: SUCCESS (HTTP {response.status_code})")
                return public_url
            else:
                log_sprite(f"  - Status: FAILED (HTTP {response.status_code})")
                return None
    except Exception as e:
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
    Extract sprite CSS and PNG for AP EAMCET Medical.
    Returns: {"status": "ok"|"css_not_found"|"sprite_not_found", "message": str}
    """
    
    log_sprite("=" * 60)
    log_sprite(f"SPRITE EXTRACTION FOR: {test_slug}")
    log_sprite("=" * 60)
    
    if test_slug in progress.get('uploaded_sprite_sheets', []):
        log_sprite(f"Already uploaded - skipping")
        return {"status": "ok", "message": "Already uploaded"}
    
    try:
        slug_parts = test_slug.lower().split('-')
        
        day = None
        month = None
        month_capital = None
        year = None
        shift = "1"
        
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
        
        # Find day, month, year - handle both ap-eapcet-medical-20-may-2025 and ap-eamcet-22-may-2023
        for i, part in enumerate(slug_parts):
            day_match = re.match(r'^(\d{1,2})', part)
            if day_match:
                day_str = day_match.group(1)
                day = str(int(day_str))
                if i + 2 < len(slug_parts):
                    month_name = slug_parts[i + 1]
                    if month_name in month_map or len(month_name) >= 3:
                        month = month_name.lower()
                        year = slug_parts[i + 2]
                        if year.isdigit() and len(year) == 4:
                            month_capital = month_map.get(month_name, month_name.capitalize())
                            break
        
        # Find shift
        for i, part in enumerate(slug_parts):
            if part == 'shift' and i + 1 < len(slug_parts):
                shift = slug_parts[i + 1]
                break
        
        # Year-only patterns (e.g., ap-eamcet-medical-2018-shift-1-paper)
        if not year:
            for part in slug_parts:
                if part.isdigit() and len(part) == 4:
                    year = part
                    break
        
        # CDN bases to try: medical first (correct path), then fallbacks
        cdn_bases = [
            "https://examsnet.github.io/cdn/img/medical/eamcet/ap/prev",  # ap_ep_20_may_2025_s2.css
            "https://examsnet.github.io/cdn/img/engg/eamcet/eapmed/prev",
            "https://examsnet.github.io/cdn/img/med/eamcet/ap/prev",
            "https://examsnet.github.io/cdn/img/engg/eamcet/apeap/prev",
        ]
        
        url_patterns = []
        
        if day and month and year and month_capital:
            # AP Medical pattern: ap_ep_{day}_{month}_{year}_s{shift} (e.g. ap_ep_20_may_2025_s2)
            medical_cdn = "https://examsnet.github.io/cdn/img/medical/eamcet/ap/prev"
            base_ap_ep = f"ap_ep_{day}_{month}_{year}_s{shift}"
            url_patterns.append({
                "name": f"medical/{base_ap_ep}",
                "css": f"{medical_cdn}/{base_ap_ep}.css",
                "png_variants": [
                    f"{medical_cdn}/{base_ap_ep}_0.png",
                    f"{medical_cdn}/{base_ap_ep}.png",
                    f"{medical_cdn}/{base_ap_ep}-0.png",
                ]
            })
            
            for cdn_base in cdn_bases:
                base_compact = f"eap{day}{month_capital}{year}s{shift}"
                url_patterns.append({
                    "name": f"{cdn_base.split('/')[-2]}/{base_compact}",
                    "css": f"{cdn_base}/{base_compact}.css",
                    "png_variants": [
                        f"{cdn_base}/{base_compact}_0.png",
                        f"{cdn_base}/{base_compact}.png",
                        f"{cdn_base}/{base_compact}-{shift}.png",
                        f"{cdn_base}/{base_compact}-1.png",
                        f"{cdn_base}/{base_compact}-0.png"
                    ]
                })
                
                base_dash = f"eap-{day}-{month_capital}-{year}-s{shift}"
                url_patterns.append({
                    "name": f"{cdn_base.split('/')[-2]}/{base_dash}",
                    "css": f"{cdn_base}/{base_dash}.css",
                    "png_variants": [
                        f"{cdn_base}/{base_dash}_0.png",
                        f"{cdn_base}/{base_dash}.png",
                        f"{cdn_base}/{base_dash}-{shift}.png",
                        f"{cdn_base}/{base_dash}-1.png",
                        f"{cdn_base}/{base_dash}-0.png"
                    ]
                })
                
                base_shift = f"eap-{day}-{month_capital}-{year}-Shift{shift}"
                url_patterns.append({
                    "name": f"{cdn_base.split('/')[-2]}/{base_shift}",
                    "css": f"{cdn_base}/{base_shift}.css",
                    "png_variants": [
                        f"{cdn_base}/{base_shift}_0.png",
                        f"{cdn_base}/{base_shift}.png",
                        f"{cdn_base}/{base_shift}-{shift}.png",
                        f"{cdn_base}/{base_shift}-1.png",
                        f"{cdn_base}/{base_shift}-0.png"
                    ]
                })
        
        # Year-only patterns
        if year:
            # Medical year-only: ap_ep_{year}_s{shift}
            medical_cdn = "https://examsnet.github.io/cdn/img/medical/eamcet/ap/prev"
            url_patterns.append({
                "name": f"medical/ap_ep_{year}_s{shift}",
                "css": f"{medical_cdn}/ap_ep_{year}_s{shift}.css",
                "png_variants": [
                    f"{medical_cdn}/ap_ep_{year}_s{shift}_0.png",
                    f"{medical_cdn}/ap_ep_{year}_s{shift}.png",
                ]
            })
            for cdn_base in cdn_bases:
                url_patterns.append({
                    "name": f"{cdn_base.split('/')[-2]}/eap{year}",
                    "css": f"{cdn_base}/eap{year}.css",
                    "png_variants": [
                        f"{cdn_base}/eap{year}_0.png",
                        f"{cdn_base}/eap{year}.png"
                    ]
                })
        
        if not url_patterns:
            log_sprite("FLAG: Could not extract date/year from test slug - no URL patterns generated")
            return {"status": "css_not_found", "message": "Could not parse date/year from slug"}
        
        log_sprite(f"Extracted: day={day}, month={month}, year={year}, shift={shift}")
        log_sprite(f"Generated {len(url_patterns)} URL pattern(s)...")
        
        css_content = None
        css_text = None
        png_content = None
        working_pattern = None
        
        for pattern in url_patterns:
            log_sprite(f"Trying: {pattern['css']}")
            
            css_content = await download_file(pattern['css'])
            if not css_content:
                continue
            
            try:
                css_text = css_content.decode('utf-8')
                log_sprite(f"  CSS SUCCESS! {len(css_content)} bytes")
            except:
                continue
            
            for png_url in pattern['png_variants']:
                png_content = await download_file(png_url)
                if png_content and len(png_content) >= 1000:
                    log_sprite(f"  PNG SUCCESS! from {png_url}")
                    break
            
            if png_content and len(png_content) >= 1000:
                working_pattern = pattern
                break
        
        if not css_content or not css_text:
            log_sprite("FLAG: For this exam we did NOT get CSS - all CSS URL patterns failed")
            return {"status": "css_not_found", "message": "Could not download sprite CSS from any CDN pattern"}
        
        if not png_content or len(png_content) < 1000:
            log_sprite("FLAG: For this exam we did NOT get sprites (PNG) - CSS found but sprite sheet download failed")
            return {"status": "sprite_not_found", "message": "CSS found but could not download sprite PNG"}
        
        # Save and upload
        sprite_sheet_id = test_slug.replace('-', '_')
        
        def replace_url(match):
            png_filename = f"{sprite_sheet_id}.png"
            new_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{png_filename}"
            return f"url('{new_url}')"
        
        updated_css_text = re.sub(r"url\(['\"]?([^'\")\s]+)['\"]?\)", replace_url, css_text)
        
        css_filename = f"{sprite_sheet_id}.css"
        local_css_path = os.path.join(SPRITES_DIR, css_filename)
        with open(local_css_path, 'w', encoding='utf-8') as f:
            f.write(updated_css_text)
        
        png_filename = f"{sprite_sheet_id}.png"
        local_png_path = os.path.join(SPRITES_DIR, png_filename)
        with open(local_png_path, 'wb') as f:
            f.write(png_content)
        
        supabase_png_path = f"{SPRITES_FOLDER}/{png_filename}"
        uploaded_png_url = await upload_to_supabase(supabase_png_path, png_content, "image/png")
        if not uploaded_png_url:
            log_sprite("FLAG: Sprite PNG downloaded but Supabase upload failed")
            return {"status": "sprite_not_found", "message": "PNG upload to Supabase failed"}
        
        supabase_css_path = f"{SPRITES_FOLDER}/{css_filename}"
        css_url = await upload_to_supabase(supabase_css_path, updated_css_text.encode('utf-8'), "text/css")
        if not css_url:
            log_sprite("FLAG: Sprite CSS prepared but Supabase upload failed")
            return {"status": "css_not_found", "message": "CSS upload to Supabase failed"}
        
        if 'uploaded_sprite_sheets' not in progress:
            progress['uploaded_sprite_sheets'] = []
        if test_slug not in progress['uploaded_sprite_sheets']:
            progress['uploaded_sprite_sheets'].append(test_slug)
            save_progress(progress)
        
        log_sprite(f"Sprite processing complete for: {test_slug}")
        return {"status": "ok", "message": "CSS and sprites found and uploaded"}
        
    except Exception as e:
        log_sprite(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "css_not_found", "message": f"Exception: {str(e)}"}


# ============== SCRAPING FUNCTIONS ==============

async def get_all_test_links(page):
    """Extract all test links from the medical exams page, grouped by year"""
    log(f"Navigating to: {TEST_LIST_URL}")
    await page.goto(TEST_LIST_URL, wait_until="networkidle", timeout=60000)
    await asyncio.sleep(3)
    
    # Medical page uses exam-cta-button-learn or btn class
    links = await page.locator('a[href^="/test/"]').all()
    
    tests_by_year = {}  # year -> list of test info
    seen_slugs = set()
    
    for link in links:
        href = await link.get_attribute('href')
        text = await link.inner_text()
        
        if not href or "Start Learn Test" not in text:
            continue
        
        test_slug = href.replace('/test/', '').rstrip('/')
        if test_slug in seen_slugs:
            continue
        seen_slugs.add(test_slug)
        
        # Extract year from slug (e.g., ap-eapcet-medical-20-may-2025-shift-2 -> 2025)
        year = "Unknown"
        for part in test_slug.split('-'):
            if part.isdigit() and len(part) == 4:
                year = part
                break
        
        try:
            parent = link.locator('xpath=ancestor::div[contains(@class, "collapse") or contains(@class, "exam-test-panel")]').first
            collapse_id = await parent.get_attribute('id')
            if collapse_id:
                toggle = page.locator(f'a[href="#{collapse_id}"]').first
                title_elem = toggle.locator('h4.exam-test-title, h4, .exam-test-title')
                if await title_elem.count() > 0:
                    title = await title_elem.first.inner_text()
                    title = title.strip()
                    if title and len(title) > 0 and title[0].isdigit():
                        title = title.split('.', 1)[-1].strip()
                else:
                    title = test_slug.replace('-', ' ').title()
            else:
                title = test_slug.replace('-', ' ').title()
        except Exception:
            title = test_slug.replace('-', ' ').title()
        
        if year not in tests_by_year:
            tests_by_year[year] = []
        
        tests_by_year[year].append({
            "title": title,
            "slug": test_slug,
            "url": href
        })
    
    # Sort years descending
    for year in tests_by_year:
        tests_by_year[year].sort(key=lambda x: x['slug'])
    
    log(f"Found {len(seen_slugs)} tests across {len(tests_by_year)} year(s)")
    return tests_by_year


def list_tests_year_wise(tests_by_year):
    """Print tests grouped by year"""
    print("\n" + "=" * 70)
    print("AP EAMCET MEDICAL TESTS (Year-wise)")
    print("=" * 70)
    
    for year in sorted(tests_by_year.keys(), reverse=True):
        tests = tests_by_year[year]
        print(f"\n### {year} ({len(tests)} tests)")
        print("-" * 50)
        for i, t in enumerate(tests, 1):
            print(f"  {i}. {t['title']}")
            print(f"     Slug: {t['slug']}")
            print(f"     URL:  {BASE_URL}{t['url']}")
    
    print("\n" + "=" * 70)


async def get_total_questions(page, test_url):
    """Get total number of questions"""
    try:
        clean_url = test_url.rstrip('/')
        await page.goto(f"{BASE_URL}{clean_url}/1", wait_until="networkidle", timeout=30000)
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
    """Scrape a single question - same logic as ap-scraper.py"""
    clean_url = test_url.rstrip('/')
    question_url = f"{BASE_URL}{clean_url}/{question_num}"
    
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
            
            # Click and validate
            try:
                first_radio = page.locator('input[name="answerid"]').first
                await first_radio.click()
                await asyncio.sleep(0.3)
            except:
                pass
            
            try:
                validate_btn = page.locator('a[onclick="v(event)"]').first
                await validate_btn.click()
                await asyncio.sleep(1.0)
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
            
            # Extract solution
            solution_html = ""
            try:
                await page.wait_for_selector('#answerstatus', state='visible', timeout=3000)
                solution_elem = page.locator('#answerstatus')
                full_html = await solution_elem.inner_html()
                full_html = re.sub(r'<div[^>]*>.*?<strong>Solution:</strong>.*?</div>', '', full_html, flags=re.DOTALL | re.IGNORECASE)
                full_html = re.sub(r'<div[^>]*class="[^"]*watermark[^"]*"[^>]*>.*?</div>', '', full_html, flags=re.DOTALL | re.IGNORECASE)
                solution_html = re.sub(r'\s+', ' ', full_html).strip()
            except:
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
                log(f"  Retry {retry + 1}/{MAX_RETRIES} for Q{question_num}", "WARN")
                await asyncio.sleep(1)
            else:
                log(f"  FAILED Q{question_num}: {str(e)[:80]}", "ERROR")
                return None
    
    return None


async def scrape_test(page, test_info, progress):
    """Scrape a single test"""
    test_url = test_info['url']
    test_slug = test_info['slug']
    test_title = test_info['title']
    
    log("=" * 60)
    log(f"SCRAPING: {test_title}")
    log(f"Slug: {test_slug}")
    log("=" * 60)
    
    total_questions = await get_total_questions(page, test_url)
    log(f"Total questions: {total_questions}")
    
    sprite_result = await extract_and_upload_sprites(page, test_slug, progress)
    sprite_status = sprite_result.get("status", "unknown") if sprite_result else "unknown"
    sprite_message = sprite_result.get("message", "") if sprite_result else ""
    
    if sprite_status != "ok":
        log(f"FLAG: {test_slug} - sprite_status={sprite_status}: {sprite_message}", "WARN")
    
    sprite_sheet_id = test_slug.replace('-', '_')
    test_data = load_test_data(test_slug)
    if test_data is None:
        test_data = {
            "title": test_title,
            "slug": test_slug,
            "url": test_url,
            "total_questions": total_questions,
            "sprite_css_url": f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{sprite_sheet_id}.css" if sprite_status == "ok" else None,
            "sprite_sheet_url": f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{sprite_sheet_id}.png" if sprite_status == "ok" else None,
            "sprite_status": sprite_status,
            "sprite_message": sprite_message if sprite_status != "ok" else None,
            "questions": []
        }
        save_test_data(test_slug, test_data)
    else:
        test_data["sprite_status"] = sprite_status
        test_data["sprite_message"] = sprite_message if sprite_status != "ok" else None
        if sprite_status == "ok":
            test_data["sprite_css_url"] = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{sprite_sheet_id}.css"
            test_data["sprite_sheet_url"] = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{sprite_sheet_id}.png"
        else:
            test_data["sprite_css_url"] = None
            test_data["sprite_sheet_url"] = None
        save_test_data(test_slug, test_data)
    
    existing_nums = {q['question_number'] for q in test_data.get('questions', [])}
    missing_nums = [i for i in range(1, total_questions + 1) if i not in existing_nums]
    
    if LIMIT_QUESTIONS_PER_TEST is not None and len(missing_nums) > LIMIT_QUESTIONS_PER_TEST:
        missing_nums = missing_nums[:LIMIT_QUESTIONS_PER_TEST]
        log(f"Limiting to first {LIMIT_QUESTIONS_PER_TEST} questions (quick mode)")
    
    if not missing_nums:
        log(f"All {total_questions} questions already scraped")
        return test_data
    
    log(f"Scraping {len(missing_nums)} missing questions...")
    
    scraped_count = 0
    for q_num in missing_nums:
        log(f"  Q{q_num}/{total_questions}...")
        result = await scrape_single_question(page, test_url, q_num)
        
        if result:
            if add_question(test_slug, result):
                scraped_count += 1
                log(f"  Saved Q{q_num} (correct: {result['correct_option']})")
        else:
            log(f"  Q{q_num} failed", "WARN")
        
        await asyncio.sleep(0.2)
    
    test_data = load_test_data(test_slug)
    log(f"Completed: {len(test_data['questions'])}/{total_questions} questions")
    
    if test_slug not in progress['completed_tests']:
        progress['completed_tests'].append(test_slug)
        save_progress(progress)
    
    return test_data


def print_sprite_failure_summary(all_tests):
    """Print summary of tests with sprite/CSS issues"""
    css_failed = []
    sprite_failed = []
    
    for t in all_tests:
        slug = t['slug']
        test_data = load_test_data(slug)
        if not test_data:
            continue
        status = test_data.get('sprite_status', 'unknown')
        if status == 'css_not_found':
            css_failed.append({"slug": slug, "title": t.get('title', slug), "msg": test_data.get('sprite_message', '')})
        elif status == 'sprite_not_found':
            sprite_failed.append({"slug": slug, "title": t.get('title', slug), "msg": test_data.get('sprite_message', '')})
    
    if css_failed or sprite_failed:
        print("\n" + "!" * 70)
        print("SPRITE/CSS FAILURE SUMMARY - FLAGS RAISED")
        print("!" * 70)
        if css_failed:
            print(f"\n*** CSS NOT FOUND ({len(css_failed)} tests) ***")
            for x in css_failed:
                print(f"  - {x['slug']}")
                print(f"    {x['title']}")
                print(f"    Reason: {x['msg']}")
        if sprite_failed:
            print(f"\n*** SPRITES (PNG) NOT FOUND ({len(sprite_failed)} tests) ***")
            for x in sprite_failed:
                print(f"  - {x['slug']}")
                print(f"    {x['title']}")
                print(f"    Reason: {x['msg']}")
        print("\n" + "!" * 70)
    else:
        print("\n" + "=" * 70)
        print("ALL TESTS: Sprites and CSS found successfully.")
        print("=" * 70)


async def main():
    """Main: list all tests, run sprite extraction + scrape for each, print failure summary"""
    print("=" * 60)
    print("AP EAMCET Medical Question Scraper")
    print("=" * 60)
    print(f"Source: {TEST_LIST_URL}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)
    
    ensure_output_dirs()
    progress = load_progress()
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        
        page = await context.new_page()
        
        try:
            # Step 1: List all tests year-wise
            tests_by_year = await get_all_test_links(page)
            list_tests_year_wise(tests_by_year)
            
            # Step 2: Process tests - sprite extraction + question scraping
            all_tests = []
            for year in sorted(tests_by_year.keys(), reverse=True):
                all_tests.extend(tests_by_year[year])
            
            # Apply slice for parallel runs (2 scripts: start + reverse)
            n = len(all_tests)
            if SLICE_MODE == "start":
                tests_to_process = all_tests[: n // 2]
                log(f"SLICE MODE: start (first half: 0 to {n//2})")
            elif SLICE_MODE == "reverse":
                tests_to_process = all_tests[n // 2 :]
                tests_to_process = list(reversed(tests_to_process))
                log(f"SLICE MODE: reverse (second half: {n//2} to {n}, reversed)")
            else:
                tests_to_process = all_tests
                log("SLICE MODE: all (no partitioning)")
            
            print("\n" + "=" * 60)
            print(f"PROCESSING {len(tests_to_process)} TESTS (sprites + questions)")
            print("=" * 60)
            
            for i, test_info in enumerate(tests_to_process, 1):
                print(f"\n[{i}/{len(tests_to_process)}] ", end="")
                await scrape_test(page, test_info, progress)
                await asyncio.sleep(0.5)  # Brief pause between tests
            
            # Step 3: Print sprite/CSS failure summary
            print_sprite_failure_summary(tests_to_process)
            
        except Exception as e:
            log(f"ERROR: {str(e)}", "ERROR")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()


if __name__ == "__main__":
    start_time = time.time()
    asyncio.run(main())
    elapsed = time.time() - start_time
    print(f"\nTotal time: {elapsed/60:.1f} minutes")
