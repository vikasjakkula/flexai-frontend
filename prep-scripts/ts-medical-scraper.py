"""
TS EAMCET Medical Question Scraper
Scrapes all questions + sprites + CSS from:
https://examsnet.com/exams/ts-eamcet-medical-exam-previous-question-papers-online
"""

import asyncio
import json
import os
import re
import time
import httpx
from datetime import datetime
from playwright.async_api import async_playwright

# ============== SUPABASE CONFIGURATION ==============
SUPABASE_URL = "https://bnnpmfdnsngxhxydvecx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubnBtZmRuc25neGh4eWR2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg5Nzc1MCwiZXhwIjoyMDgxNDczNzUwfQ.wYXy4tK9-CXzXb8fb85tz6pK6M95w8jrROWyoNljTZY"
SUPABASE_BUCKET = "images"
SPRITES_FOLDER = "sprites"

# ============== SCRAPER CONFIGURATION ==============
BASE_URL = "https://www.examsnet.com"
TEST_LIST_URL = f"{BASE_URL}/exams/ts-eamcet-medical-exam-previous-question-papers-online"
OUTPUT_DIR = "ts_medical_scraped_data"
SPRITES_DIR = os.path.join(OUTPUT_DIR, "sprites")
PROGRESS_FILE = os.path.join(OUTPUT_DIR, "progress.json")

DELAY_BETWEEN_REQUESTS = 0.5
MAX_RETRIES = 3
LIMIT_QUESTIONS_PER_TEST = None  # Full scrape - all questions per test

# For parallel runs: 2 scripts - one from start, one from end.
# "start" = first half (0 to N/2), "reverse" = second half (N/2 to N, reversed)
SLICE_MODE = os.environ.get("TS_MEDICAL_SCRAPER_SLICE", "start")


def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


def log_sprite(message):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [SPRITE] {message}")


def ensure_output_dirs():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(SPRITES_DIR, exist_ok=True)


def load_json(filepath, default):
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return default
    return default


def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_progress():
    return load_json(PROGRESS_FILE, {"completed_tests": [], "uploaded_sprite_sheets": []})


def save_progress(progress):
    save_json(PROGRESS_FILE, progress)


def load_test_data(test_slug):
    return load_json(os.path.join(OUTPUT_DIR, f"{test_slug}.json"), None)


def save_test_data(test_slug, test_data):
    save_json(os.path.join(OUTPUT_DIR, f"{test_slug}.json"), test_data)


def add_question(test_slug, question_data):
    filepath = os.path.join(OUTPUT_DIR, f"{test_slug}.json")
    test_data = load_json(filepath, {"slug": test_slug, "questions": []})
    if any(q['question_number'] == question_data['question_number'] for q in test_data['questions']):
        return False
    test_data['questions'].append(question_data)
    test_data['questions'].sort(key=lambda x: x['question_number'])
    save_json(filepath, test_data)
    return True


async def upload_to_supabase(file_path: str, file_data: bytes, content_type: str):
    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{file_path}"
    headers = {"Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": content_type, "x-upsert": "true"}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(url, content=file_data, headers=headers, timeout=60.0)
            if response.status_code in [200, 201]:
                return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{file_path}"
    except:
        pass
    return None


async def download_file(url: str) -> bytes:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=60.0, follow_redirects=True)
            if response.status_code == 200:
                return response.content
    except:
        pass
    return None


async def extract_and_upload_sprites(page, test_slug: str, progress: dict):
    """Extract sprite CSS and PNG for TS EAMCET Medical. Returns status dict."""
    log_sprite(f"SPRITE EXTRACTION: {test_slug}")

    if test_slug in progress.get('uploaded_sprite_sheets', []):
        return {"status": "ok", "message": "Already uploaded"}

    try:
        slug_parts = test_slug.lower().split('-')
        day, month, year, shift = None, None, None, "1"
        month_map = {'jan': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'apr': 'Apr', 'may': 'May',
                    'jun': 'Jun', 'jul': 'Jul', 'july': 'Jul', 'aug': 'Aug', 'sep': 'Sep',
                    'sept': 'Sep', 'september': 'Sep', 'oct': 'Oct', 'nov': 'Nov', 'dec': 'Dec'}

        # Day-month-year order (e.g. ts-eamcet-medical-7-may-2024)
        for i, part in enumerate(slug_parts):
            if part.isdigit() and len(part) <= 2:  # day only, not year
                day = str(int(part))
                if i + 2 < len(slug_parts):
                    mn = slug_parts[i + 1]
                    if mn in month_map or (len(mn) >= 3 and not mn.isdigit()):
                        month = mn
                        year = slug_parts[i + 2]
                        if year.isdigit() and len(year) == 4:
                            break
        # Year-month-day order (e.g. ts-eamcet-medical-2018-may-2)
        if not (day and month and year):
            for i, part in enumerate(slug_parts):
                if part.isdigit() and len(part) == 4:
                    year = part
                    if i + 2 < len(slug_parts):
                        mn = slug_parts[i + 1]
                        dn = slug_parts[i + 2]
                        if mn in month_map and dn.isdigit() and len(dn) <= 2:
                            month = mn
                            day = str(int(dn))
                            break

        for i, part in enumerate(slug_parts):
            if part == 'shift' and i + 1 < len(slug_parts):
                shift = slug_parts[i + 1]
                break

        if not year:
            for part in slug_parts:
                if part.isdigit() and len(part) == 4:
                    year = part
                    break

        # TS Medical shares CDN with TS Engineering: img/engg/eamcet/ts/prev
        # Format: ts_{day}_{month}_{year}_s{shift} (e.g. ts_7_may_2024_s1)
        # For TG 2025: tg_{day}_{month}_{year}_s{shift}
        ts_engg_cdn = "https://examsnet.github.io/cdn/img/engg/eamcet/ts/prev"
        ts_medical_cdn = "https://examsnet.github.io/cdn/img/medical/eamcet/ts/prev"
        url_patterns = []

        if day and month and year:
            # ts_ style (works for ts-eamcet-medical-7-may-2024)
            base_ts = f"ts_{day}_{month}_{year}_s{shift}"
            url_patterns.append({
                "name": f"ts_engg/{base_ts}",
                "css": f"{ts_engg_cdn}/{base_ts}.css",
                "png_variants": [
                    f"{ts_engg_cdn}/{base_ts}_0.png",
                    f"{ts_engg_cdn}/{base_ts}.png",
                    f"{ts_engg_cdn}/{base_ts}-1.png",
                    f"{ts_engg_cdn}/{base_ts}-{shift}.png",
                ]
            })
            # tg_ style for 2025 TG EAMCET (tg-eamcet-29-apr-2025)
            base_tg = f"tg_{day}_{month}_{year}_s{shift}"
            url_patterns.append({
                "name": f"ts_engg/{base_tg}",
                "css": f"{ts_engg_cdn}/{base_tg}.css",
                "png_variants": [
                    f"{ts_engg_cdn}/{base_tg}_0.png",
                    f"{ts_engg_cdn}/{base_tg}.png",
                ]
            })
            base_ts_shift = f"ts_{day}_{month}_{year}_Shift{shift}"
            url_patterns.append({
                "name": f"ts_engg/{base_ts_shift}",
                "css": f"{ts_engg_cdn}/{base_ts_shift}.css",
                "png_variants": [
                    f"{ts_engg_cdn}/{base_ts_shift}-0.png",
                    f"{ts_engg_cdn}/{base_ts_shift}_0.png",
                    f"{ts_engg_cdn}/{base_ts_shift}.png",
                ]
            })
            # ts_ep_ medical pattern (if different)
            base_ts_ep = f"ts_ep_{day}_{month}_{year}_s{shift}"
            url_patterns.append({
                "name": f"ts_medical/{base_ts_ep}",
                "css": f"{ts_medical_cdn}/{base_ts_ep}.css",
                "png_variants": [
                    f"{ts_medical_cdn}/{base_ts_ep}_0.png",
                    f"{ts_medical_cdn}/{base_ts_ep}.png",
                ]
            })

        if year:
            url_patterns.append({
                "name": f"ts_medical/ts_ep_{year}_s{shift}",
                "css": f"{ts_medical_cdn}/ts_ep_{year}_s{shift}.css",
                "png_variants": [
                    f"{ts_medical_cdn}/ts_ep_{year}_s{shift}_0.png",
                    f"{ts_medical_cdn}/ts_ep_{year}_s{shift}.png",
                ]
            })
            url_patterns.append({
                "name": f"ts_engg/ts{year}",
                "css": f"{ts_engg_cdn}/ts{year}.css",
                "png_variants": [f"{ts_engg_cdn}/ts{year}.png", f"{ts_engg_cdn}/ts{year}_0.png"]
            })

        if not url_patterns:
            return {"status": "css_not_found", "message": "Could not parse date/year from slug"}

        css_content, css_text, png_content = None, None, None
        for pattern in url_patterns:
            css_content = await download_file(pattern['css'])
            if not css_content:
                continue
            try:
                css_text = css_content.decode('utf-8')
            except:
                continue
            for png_url in pattern['png_variants']:
                png_content = await download_file(png_url)
                if png_content and len(png_content) >= 1000:
                    break
            if png_content and len(png_content) >= 1000:
                break

        if not css_content or not css_text:
            log_sprite("FLAG: CSS NOT FOUND")
            return {"status": "css_not_found", "message": "Could not download sprite CSS from any CDN pattern"}
        if not png_content or len(png_content) < 1000:
            log_sprite("FLAG: SPRITES (PNG) NOT FOUND")
            return {"status": "sprite_not_found", "message": "CSS found but could not download sprite PNG"}

        sprite_sheet_id = test_slug.replace('-', '_')
        def replace_url(m):
            return f"url('{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{sprite_sheet_id}.png')"
        updated_css = re.sub(r"url\(['\"]?([^'\")\s]+)['\"]?\)", replace_url, css_text)

        png_path = f"{SPRITES_FOLDER}/{sprite_sheet_id}.png"
        css_path = f"{SPRITES_FOLDER}/{sprite_sheet_id}.css"
        if await upload_to_supabase(png_path, png_content, "image/png") and \
           await upload_to_supabase(css_path, updated_css.encode('utf-8'), "text/css"):
            progress.setdefault('uploaded_sprite_sheets', []).append(test_slug)
            save_progress(progress)
            return {"status": "ok", "message": "CSS and sprites uploaded"}
        return {"status": "sprite_not_found", "message": "Upload failed"}
    except Exception as e:
        return {"status": "css_not_found", "message": str(e)}


async def get_all_test_links(page):
    log(f"Navigating to: {TEST_LIST_URL}")
    await page.goto(TEST_LIST_URL, wait_until="networkidle", timeout=60000)
    await asyncio.sleep(3)

    links = await page.locator('a[href^="/test/"]').all()
    tests_by_year = {}
    seen = set()

    for link in links:
        href = await link.get_attribute('href')
        text = await link.inner_text()
        if not href or "Start Learn Test" not in text:
            continue
        slug = href.replace('/test/', '').rstrip('/')
        if slug in seen:
            continue
        seen.add(slug)
        year = "Unknown"
        for p in slug.split('-'):
            if p.isdigit() and len(p) == 4:
                year = p
                break
        try:
            parent = link.locator('xpath=ancestor::div[contains(@class, "collapse") or contains(@class, "exam-test-panel")]').first
            cid = await parent.get_attribute('id')
            if cid:
                title = await page.locator(f'a[href="#{cid}"]').first.locator('h4, .exam-test-title').first.inner_text()
                title = title.strip().split('.', 1)[-1].strip() if title and title[0].isdigit() else title
            else:
                title = slug.replace('-', ' ').title()
        except:
            title = slug.replace('-', ' ').title()

        tests_by_year.setdefault(year, []).append({"title": title, "slug": slug, "url": href})

    log(f"Found {len(seen)} tests")
    return tests_by_year


async def get_total_questions(page, test_url):
    try:
        await page.goto(f"{BASE_URL}{test_url.rstrip('/')}/1", wait_until="networkidle", timeout=30000)
        await asyncio.sleep(1)
        t = await page.locator('text=Total:').first.inner_text()
        return int(t.replace('Total:', '').strip())
    except:
        return 160


async def scrape_single_question(page, test_url, question_num):
    url = f"{BASE_URL}{test_url.rstrip('/')}/{question_num}"
    for retry in range(MAX_RETRIES):
        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(DELAY_BETWEEN_REQUESTS)
            try:
                qh = await page.locator('#imagewrap a').first.inner_html()
            except:
                try:
                    qh = await page.locator('#imagewrap').first.inner_html()
                except:
                    qh = ""
            options = []
            try:
                for item in await page.locator('#answers li').all():
                    try:
                        options.append(await item.locator('label span').first.inner_html())
                    except:
                        options.append("")
            except:
                pass
            while len(options) < 4:
                options.append("")
            try:
                await page.locator('input[name="answerid"]').first.click()
                await asyncio.sleep(0.3)
            except:
                pass
            try:
                await page.locator('a[onclick="v(event)"]').first.click()
                await asyncio.sleep(1.0)
            except:
                pass
            correct = None
            try:
                v = await page.locator('input.rightanswer').first.get_attribute('value')
                correct = {'0': 'a', '1': 'b', '2': 'c', '3': 'd'}.get(v)
            except:
                pass
            sol = ""
            try:
                full = await page.locator('#answerstatus').inner_html()
                sol = re.sub(r'<div[^>]*>.*?<strong>Solution:</strong>.*?</div>', '', full, flags=re.DOTALL | re.I)
                sol = re.sub(r'<div[^>]*class="[^"]*watermark[^"]*"[^>]*>.*?</div>', '', sol, flags=re.DOTALL | re.I)
                sol = re.sub(r'\s+', ' ', sol).strip()
            except:
                pass
            return {"question_number": question_num, "question_html": qh.strip(),
                    "option_a": options[0].strip() if options[0] else "",
                    "option_b": options[1].strip() if options[1] else "",
                    "option_c": options[2].strip() if options[2] else "",
                    "option_d": options[3].strip() if options[3] else "",
                    "correct_option": correct, "solution_html": sol}
        except Exception as e:
            if retry < MAX_RETRIES - 1:
                await asyncio.sleep(1)
            else:
                return None
    return None


async def scrape_test(page, test_info, progress):
    test_url, test_slug, test_title = test_info['url'], test_info['slug'], test_info['title']
    log(f"SCRAPING: {test_title} ({test_slug})")

    total = await get_total_questions(page, test_url)
    sprite_result = await extract_and_upload_sprites(page, test_slug, progress)
    status = sprite_result.get("status", "unknown") if sprite_result else "unknown"
    msg = sprite_result.get("message", "") if sprite_result else ""

    if status != "ok":
        log(f"FLAG: {test_slug} - {status}: {msg}", "WARN")

    sid = test_slug.replace('-', '_')
    test_data = load_test_data(test_slug) or {
        "title": test_title, "slug": test_slug, "url": test_url, "total_questions": total,
        "sprite_css_url": None, "sprite_sheet_url": None, "sprite_status": status,
        "sprite_message": msg if status != "ok" else None, "questions": []
    }
    if status == "ok":
        test_data["sprite_css_url"] = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{sid}.css"
        test_data["sprite_sheet_url"] = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{sid}.png"
    else:
        test_data["sprite_css_url"] = test_data["sprite_sheet_url"] = None
        test_data["sprite_message"] = msg
    test_data["sprite_status"] = status
    save_test_data(test_slug, test_data)

    existing = {q['question_number'] for q in test_data.get('questions', [])}
    missing = [i for i in range(1, total + 1) if i not in existing]
    if LIMIT_QUESTIONS_PER_TEST is not None and len(missing) > LIMIT_QUESTIONS_PER_TEST:
        missing = missing[:LIMIT_QUESTIONS_PER_TEST]
        log(f"Limiting to first {LIMIT_QUESTIONS_PER_TEST} questions")

    for q in missing:
        result = await scrape_single_question(page, test_url, q)
        if result and add_question(test_slug, result):
            log(f"  Saved Q{q} (correct: {result['correct_option']})")
        await asyncio.sleep(0.2)

    if test_slug not in progress['completed_tests']:
        progress['completed_tests'].append(test_slug)
        save_progress(progress)
    return load_test_data(test_slug)


def generate_report(all_tests, output_path: str):
    """Generate markdown report of tests without sprites"""
    css_failed = []
    sprite_failed = []
    for t in all_tests:
        data = load_test_data(t['slug'])
        if not data:
            continue
        s = data.get('sprite_status', 'unknown')
        if s == 'css_not_found':
            css_failed.append({"slug": t['slug'], "title": t.get('title', t['slug']), "msg": data.get('sprite_message', '')})
        elif s == 'sprite_not_found':
            sprite_failed.append({"slug": t['slug'], "title": t.get('title', t['slug']), "msg": data.get('sprite_message', '')})

    lines = [
        "# TS EAMCET Medical - Tests Without Sprites Report",
        "",
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "## Summary",
        "",
        f"- **Total tests processed:** {len(all_tests)}",
        f"- **Tests with CSS NOT FOUND:** {len(css_failed)}",
        f"- **Tests with SPRITES (PNG) NOT FOUND:** {len(sprite_failed)}",
        f"- **Tests with sprites OK:** {len(all_tests) - len(css_failed) - len(sprite_failed)}",
        "",
        "---",
        "",
        "## Tests Without Sprites (CSS NOT FOUND)",
        "",
    ]
    if css_failed:
        for i, x in enumerate(css_failed, 1):
            lines.append(f"{i}. **{x['slug']}**")
            lines.append(f"   - Title: {x['title']}")
            lines.append(f"   - Reason: {x['msg']}")
            lines.append("")
    else:
        lines.append("None")
        lines.append("")

    lines.extend(["## Tests Without Sprites (PNG NOT FOUND)", ""])
    if sprite_failed:
        for i, x in enumerate(sprite_failed, 1):
            lines.append(f"{i}. **{x['slug']}**")
            lines.append(f"   - Title: {x['title']}")
            lines.append(f"   - Reason: {x['msg']}")
            lines.append("")
    else:
        lines.append("None")
        lines.append("")

    lines.extend(["## Pattern Analysis", ""])
    if css_failed or sprite_failed:
        failed_slugs = [x['slug'] for x in css_failed + sprite_failed]
        lines.append("### Failed test slugs:")
        for s in failed_slugs:
            lines.append(f"- `{s}`")
    else:
        lines.append("All tests have sprites found successfully.")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    log(f"Report written to: {output_path}")


async def main():
    print("=" * 60)
    print("TS EAMCET Medical Scraper (all questions + sprites + CSS)")
    print("=" * 60)
    ensure_output_dirs()
    progress = load_progress()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--disable-blink-features=AutomationControlled'])
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        try:
            tests_by_year = await get_all_test_links(page)
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

            print(f"\nProcessing {len(tests_to_process)} tests...")
            for i, t in enumerate(tests_to_process, 1):
                print(f"\n[{i}/{len(tests_to_process)}] ", end="")
                await scrape_test(page, t, progress)
                await asyncio.sleep(0.5)

            report_path = os.path.join(os.path.dirname(__file__), "ts-medical-sprites-report.md")
            generate_report(tests_to_process, report_path)

        except Exception as e:
            log(f"ERROR: {str(e)}", "ERROR")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()


if __name__ == "__main__":
    start = time.time()
    asyncio.run(main())
    print(f"\nTotal time: {(time.time()-start)/60:.1f} minutes")
