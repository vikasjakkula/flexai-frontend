"""
Sprite Downloader
Navigates to a sprite question URL, intercepts .css and .png network responses,
downloads and saves them to the appropriate sprites folder.
"""

import asyncio
import json
import os
import re
import httpx
from datetime import datetime
from playwright.async_api import async_playwright

# ── Config ────────────────────────────────────────────────────────────────────
BASE_URL = "https://www.examsnet.com"

AP_SPRITES_DIR = "ap_medical_scraped_data/sprites"
TS_SPRITES_DIR = "ts_medical_scraped_data/sprites"
AP_PROGRESS    = "ap_medical_scraped_data/progress.json"
TS_PROGRESS    = "ts_medical_scraped_data/progress.json"

# Each entry: (slug, sample_question_number, sprites_dir, progress_file)
MISSING_SPRITES = [
    # ── AP ──────────────────────────────────────────────────────────────────
    ("ap-eamcet-medical-2015-paper",                  83,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-2016-paper",                   8,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-2017-shift-1-paper",          11,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-2017-shift-2-paper",           7,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-2018-shift-1-paper",          59,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-2018-shift-2-paper",           4,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-23-apr-2019-shift-2-paper",   54,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-24-apr-2019-shift-1-paper",   62,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-24-apr-2019-shift-2-paper",   62,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-23-sep-2020-shift-2-paper",  108,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-24-sep-2020-shift-1-paper",    5,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-24-sep-2020-shift-2-paper",   88,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-25-sep-2020-shift-1-paper",   83,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-25-sep-2020-shift-2-paper",   95,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eapcet-11-july-2022-shift-1-paper",          33,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eapcet-11-july-2022-shift-2-paper",          86,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eapcet-12-july-2022-shift-1-paper",         107,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eapcet-12-july-2022-shift-2-paper",          57,  AP_SPRITES_DIR, AP_PROGRESS),
    ("ap-eamcet-medical-17-may-2024-shift-4-paper",   86,  AP_SPRITES_DIR, AP_PROGRESS),
    # ── TS ──────────────────────────────────────────────────────────────────
    ("tg-eamcet-29-apr-2025-shift-1-paper",            8,  TS_SPRITES_DIR, TS_PROGRESS),
    ("tg-eamcet-29-apr-2025-shift-2-paper",           17,  TS_SPRITES_DIR, TS_PROGRESS),
    ("tg-eamcet-30-apr-2025-shift-1-paper",           23,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-7-may-2024-shift-1-paper",    11,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-7-may-2024-shift-2-paper",     9,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-8-may-2024-shift-1-paper",   119,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-10-may-2023-shift-1-paper",    9,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-10-may-2023-shift-2-paper",    9,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-11-may-2023-shift-1-paper",   85,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-11-may-2023-shift-2-paper",   85,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-2015-paper",                  89,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-2016-paper",                  96,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-2017-paper",                  23,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-2018-may-3-shift-1paper",      7,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-2018-may-2-shift-2-paper",    17,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-2018-may-2-shift-1-paper",    18,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-9-may-2019-shift-1-paper",    12,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-8-may-2019-shift-2-paper",    23,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-8-may-2019-shift-1-paper",    15,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-29-sept-2020-shift-2-paper",  54,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-29-sept-2020-shift-1-paper",  56,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-28-sept-2020-shift-2-paper",  56,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-28-sept-2020-shift-1-paper",  59,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-09-aug-2021-shift-1-paper",   63,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-09-aug-2021-shift-2-paper",   56,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-10-aug-2021-shift-1-paper",   56,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-30-jul-2022-shift-1-paper",  119,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-30-jul-2022-shift-2-paper",   69,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-31-jul-2022-shift-1-paper",   58,  TS_SPRITES_DIR, TS_PROGRESS),
    ("ts-eamcet-medical-31-jul-2022-shift-2-paper",   83,  TS_SPRITES_DIR, TS_PROGRESS),
]

# ── Helpers ───────────────────────────────────────────────────────────────────
def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")

def slug_to_filename(slug):
    """ap-eamcet-medical-2015-paper  ->  ap_eamcet_medical_2015_paper"""
    return slug.replace("-", "_")

def load_progress(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def save_progress(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

async def download_file(url, dest_path):
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        r = await client.get(url)
        if r.status_code == 200:
            with open(dest_path, "wb") as f:
                f.write(r.content)
            return True
        return False

# ── Core ──────────────────────────────────────────────────────────────────────
async def fetch_sprites_for_test(page, slug, question_num, sprites_dir):
    """
    Navigate to the question page and capture all .css / .png network responses
    whose URL contains the slug (normalised) or a sprite-sheet keyword.
    Returns (css_url, png_url) or (None, None).
    """
    captured = {"css": None, "png": None}
    # Sprite assets always live under /cdn/img/ on the github CDN
    SPRITE_CDN = "examsnet.github.io/cdn/img/"

    def is_sprite_asset(url: str) -> bool:
        url_lower = url.lower()
        if SPRITE_CDN not in url_lower:
            return False
        return url_lower.endswith(".css") or url_lower.endswith(".png")

    async def on_response(response):
        url = response.url
        if is_sprite_asset(url):
            if url.endswith(".css") and not captured["css"]:
                captured["css"] = url
                log(f"  CSS captured: {url}")
            elif url.endswith(".png") and not captured["png"]:
                captured["png"] = url
                log(f"  PNG captured: {url}")

    page.on("response", on_response)

    target_url = f"{BASE_URL}/test/{slug}/{question_num}"
    log(f"  -> {target_url}")
    try:
        await page.goto(target_url, wait_until="networkidle", timeout=40000)
    except Exception as e:
        log(f"  Page load warning: {e}", "WARN")

    # Give lazy-loaded assets a moment to fire
    await asyncio.sleep(2)
    page.remove_listener("response", on_response)

    return captured["css"], captured["png"]


async def process_test(page, slug, question_num, sprites_dir, progress_path):
    filename = slug_to_filename(slug)
    css_dest = os.path.join(sprites_dir, f"{filename}.css")
    png_dest = os.path.join(sprites_dir, f"{filename}.png")

    log(f"\n[{slug}]")

    # Skip if already fully downloaded
    if os.path.exists(css_dest) and os.path.exists(png_dest):
        log("  Already downloaded - skipping")
        progress = load_progress(progress_path)
        if slug not in progress["uploaded_sprite_sheets"]:
            progress["uploaded_sprite_sheets"].append(slug)
            save_progress(progress_path, progress)
        return True

    css_url, png_url = await fetch_sprites_for_test(page, slug, question_num, sprites_dir)

    if not css_url and not png_url:
        log(f"  No sprite assets detected on page - skipping", "WARN")
        return False

    ok = True

    if css_url:
        if await download_file(css_url, css_dest):
            log(f"  Saved CSS -> {css_dest}")
        else:
            log(f"  CSS download failed: {css_url}", "ERROR")
            ok = False
    else:
        log("  No CSS URL found", "WARN")
        ok = False

    if png_url:
        if await download_file(png_url, png_dest):
            log(f"  Saved PNG -> {png_dest}")
        else:
            log(f"  PNG download failed: {png_url}", "ERROR")
            ok = False
    else:
        log("  No PNG URL found", "WARN")
        ok = False

    if ok:
        progress = load_progress(progress_path)
        if slug not in progress["uploaded_sprite_sheets"]:
            progress["uploaded_sprite_sheets"].append(slug)
            save_progress(progress_path, progress)
        log(f"  OK Done - progress.json updated")

    return ok


async def main():
    os.makedirs(AP_SPRITES_DIR, exist_ok=True)
    os.makedirs(TS_SPRITES_DIR, exist_ok=True)

    results = {"ok": [], "failed": []}

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context()
        page    = await context.new_page()

        for slug, qnum, sprites_dir, progress_path in MISSING_SPRITES:
            success = await process_test(page, slug, qnum, sprites_dir, progress_path)
            if success:
                results["ok"].append(slug)
            else:
                results["failed"].append(slug)

        await browser.close()

    print("\n" + "="*60)
    print(f"Downloaded: {len(results['ok'])}")
    print(f"Failed:     {len(results['failed'])}")
    if results["failed"]:
        print("\nFailed tests:")
        for s in results["failed"]:
            print(f"  - {s}")


if __name__ == "__main__":
    asyncio.run(main())
