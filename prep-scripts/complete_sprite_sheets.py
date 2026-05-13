"""
Complete Missing Sprite Sheet Uploads
Uses specific URL patterns for each year/month combination based on actual CDN structure
"""

import asyncio
import json
import os
import re
import httpx
from datetime import datetime

# ============== SUPABASE CONFIGURATION ==============
SUPABASE_URL = "https://bnnpmfdnsngxhxydvecx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubnBtZmRuc25neGh4eWR2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg5Nzc1MCwiZXhwIjoyMDgxNDczNzUwfQ.wYXy4tK9-CXzXb8fb85tz6pK6M95w8jrROWyoNljTZY"
SUPABASE_BUCKET = "images"
SPRITES_FOLDER = "sprites"

# ============== FILE CONFIGURATION ==============
OUTPUT_DIR = "scraped_data"
SPRITES_DIR = os.path.join(OUTPUT_DIR, "sprites")
PROGRESS_FILE = os.path.join(OUTPUT_DIR, "progress.json")


def log(message, level="INFO"):
    """Print log message with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


def log_sprite(message):
    """Print sprite-related log message"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [SPRITE] {message}")


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


async def upload_to_supabase(file_path: str, file_data: bytes, content_type: str):
    """Upload a file to Supabase Storage"""
    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{file_path}"
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true"
    }
    
    log_sprite(f"Uploading to Supabase: {SUPABASE_BUCKET}/{file_path} ({len(file_data)} bytes)")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(url, content=file_data, headers=headers, timeout=60.0)
            
            if response.status_code in [200, 201]:
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{file_path}"
                log_sprite(f"  SUCCESS: {public_url}")
                return public_url
            else:
                log_sprite(f"  FAILED: HTTP {response.status_code} - {response.text[:200]}")
                return None
    except Exception as e:
        log_sprite(f"  ERROR: {str(e)}")
        return None


async def download_file(url: str) -> bytes:
    """Download a file from URL"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=60.0, follow_redirects=True)
            if response.status_code == 200:
                return response.content
            else:
                return None
    except Exception as e:
        return None


def get_sprite_url_patterns(test_slug: str):
    """
    Get the specific URL pattern based on the test slug.
    Uses exact patterns provided for each year/month combination.
    """
    slug_parts = test_slug.lower().split('-')
    
    day = None
    month = None
    month_full = None
    year = None
    shift = "1"
    
    # Month name mapping
    month_map = {
        'jan': 'jan', 'january': 'jan',
        'feb': 'feb', 'february': 'feb',
        'mar': 'mar', 'march': 'mar',
        'apr': 'apr', 'april': 'apr',
        'may': 'may',
        'jun': 'jun', 'june': 'jun',
        'jul': 'jul', 'july': 'jul',  # Abbreviated form
        'aug': 'aug', 'august': 'aug',
        'sep': 'sep', 'sept': 'sept', 'september': 'sep',
        'oct': 'oct', 'october': 'oct',
        'nov': 'nov', 'november': 'nov',
        'dec': 'dec', 'december': 'dec'
    }
    
    # Parse slug - handle "engineering" keyword
    day_raw = None
    for i, part in enumerate(slug_parts):
        if part.isdigit() and len(part) <= 2:  # day
            day_raw = part  # Keep original (no zero-padding)
            # Look ahead for month, skipping non-month words
            for j in range(i + 1, min(i + 4, len(slug_parts))):
                potential_month = slug_parts[j]
                if potential_month in ['engineering', 'eamcet', 'shift', 'solved', 'question', 'paper']:
                    continue
                if potential_month in month_map or len(potential_month) >= 3:
                    month_name = potential_month
                    month_full = month_name
                    month = month_map.get(month_name, month_name[:3])
                    if j + 1 < len(slug_parts) and slug_parts[j + 1].isdigit() and len(slug_parts[j + 1]) == 4:
                        year = slug_parts[j + 1]
                    break
            if year:
                break
    
    # Find shift
    for i, part in enumerate(slug_parts):
        if part == 'shift' and i + 1 < len(slug_parts):
            shift = slug_parts[i + 1]
            break
    
    # If no date found, try to find just year
    if not year:
        for part in slug_parts:
            if part.isdigit() and len(part) == 4:
                year = part
                break
    
    if not day_raw or not month or not year:
        return None, None, None
    
    cdn_base = "https://examsnet.github.io/cdn/img/engg/eamcet/ts/prev"
    url_patterns = []
    
    year_int = int(year)
    
    # Pattern selection based on year and month
    if year_int == 2020 and month_full in ['sep', 'sept', 'september']:
        # 2020 September: ts_{day}_sept_{year}_s{shift}.css
        # Example: ts_9_sept_2020_s1.css
        base = f"ts_{day_raw}_sept_{year}_s{shift}"
        url_patterns.append({
            "css": f"{cdn_base}/{base}.css",
            "png_variants": [
                f"{cdn_base}/{base}.png",
                f"{cdn_base}/{base}_0.png",
                f"{cdn_base}/{base}-0.png",
                f"{cdn_base}/{base}-{shift}.png",
                f"{cdn_base}/{base}-1.png"
            ]
        })
        
    elif year_int == 2022 and month_full in ['jul', 'july']:
        # 2022 July: ts_{year}_{month_full}_{day}_s{shift}.css
        # Example: ts_2022_july_18_s1.css (always use "july" full form)
        month_full_for_pattern = 'july'  # Always use full form for 2022
        base = f"ts_{year}_{month_full_for_pattern}_{day_raw}_s{shift}"
        url_patterns.append({
            "css": f"{cdn_base}/{base}.css",
            "png_variants": [
                f"{cdn_base}/{base}-1.png",
                f"{cdn_base}/{base}-{shift}.png",
                f"{cdn_base}/{base}-0.png",
                f"{cdn_base}/{base}_0.png",
                f"{cdn_base}/{base}.png"
            ]
        })
        
    elif year_int == 2023 and month_full in ['may']:
        # 2023 May (Engineering): ts_{day}_{month}_{year}_Shift{shift}.css (capital Shift, no underscore)
        # Example: ts_12_may_2023_Shift2.css
        base = f"ts_{day_raw}_{month}_{year}_Shift{shift}"
        url_patterns.append({
            "css": f"{cdn_base}/{base}.css",
            "png_variants": [
                f"{cdn_base}/{base}.png",
                f"{cdn_base}/{base}_0.png",
                f"{cdn_base}/{base}-0.png",
                f"{cdn_base}/{base}-{shift}.png"
            ]
        })
        
    elif year_int == 2021 and month_full in ['aug', 'august']:
        # 2021 August: ts_{day}_{month}_{year}_Shift_{shift}.css (capital Shift with underscore)
        # Example: ts_4_aug_2021_Shift_1.css
        base = f"ts_{day_raw}_{month}_{year}_Shift_{shift}"
        url_patterns.append({
            "css": f"{cdn_base}/{base}.css",
            "png_variants": [
                f"{cdn_base}/{base}.png",
                f"{cdn_base}/{base}_0.png",
                f"{cdn_base}/{base}-0.png",
                f"{cdn_base}/{base}-{shift}.png",
                f"{cdn_base}/{base}-1.png"
            ]
        })
        
    else:
        # For other years, try common patterns
        # Pattern 1: ts_{day}_{month}_{year}_s{shift}.css
        base1 = f"ts_{day_raw}_{month}_{year}_s{shift}"
        url_patterns.append({
            "css": f"{cdn_base}/{base1}.css",
            "png_variants": [
                f"{cdn_base}/{base1}-{shift}.png",
                f"{cdn_base}/{base1}-1.png",
                f"{cdn_base}/{base1}-0.png",
                f"{cdn_base}/{base1}_0.png",
                f"{cdn_base}/{base1}.png"
            ]
        })
        
        # Pattern 2: ts_{day}_{month}_{year}_Shift_{shift}.css
        base2 = f"ts_{day_raw}_{month}_{year}_Shift_{shift}"
        url_patterns.append({
            "css": f"{cdn_base}/{base2}.css",
            "png_variants": [
                f"{cdn_base}/{base2}.png",
                f"{cdn_base}/{base2}_0.png",
                f"{cdn_base}/{base2}-0.png",
                f"{cdn_base}/{base2}-{shift}.png",
                f"{cdn_base}/{base2}-1.png"
            ]
        })
        
        # Pattern 3: ts_{day}_{month}_{year}_Shift{shift}.css
        base3 = f"ts_{day_raw}_{month}_{year}_Shift{shift}"
        url_patterns.append({
            "css": f"{cdn_base}/{base3}.css",
            "png_variants": [
                f"{cdn_base}/{base3}.png",
                f"{cdn_base}/{base3}_0.png",
                f"{cdn_base}/{base3}-0.png"
            ]
        })
    
    return url_patterns, year, shift


async def extract_and_upload_sprites(test_slug: str, progress: dict):
    """Extract and upload sprite sheets using specific patterns"""
    
    log_sprite("=" * 60)
    log_sprite(f"SPRITE EXTRACTION FOR: {test_slug}")
    log_sprite("=" * 60)
    
    # Check if already uploaded
    if test_slug in progress.get('uploaded_sprite_sheets', []):
        log_sprite(f"Already uploaded - skipping")
        return True
    
    try:
        # Get URL patterns for this test
        url_patterns, year, shift = get_sprite_url_patterns(test_slug)
        
        if not url_patterns:
            log_sprite("ERROR: Could not generate URL patterns from test slug")
            return False
        
        log_sprite(f"Generated {len(url_patterns)} URL pattern(s) for year {year}, shift {shift}")
        
        # Try each pattern until one works
        css_content = None
        css_text = None
        png_content = None
        working_pattern = None
        
        for pattern in url_patterns:
            log_sprite(f"Trying: {pattern['css']}")
            
            # Try downloading CSS
            css_content = await download_file(pattern['css'])
            if not css_content:
                log_sprite("  CSS download failed")
                continue
            
            try:
                css_text = css_content.decode('utf-8')
                log_sprite(f"  CSS downloaded: {len(css_content)} bytes")
            except:
                log_sprite("  CSS decode failed")
                continue
            
            # Try downloading PNG
            png_content = None
            for png_url in pattern['png_variants']:
                log_sprite(f"  Trying PNG: {png_url}")
                png_content = await download_file(png_url)
                if png_content and len(png_content) >= 1000:
                    log_sprite(f"  PNG downloaded: {len(png_content)} bytes")
                    break
            
            if not png_content or len(png_content) < 1000:
                log_sprite("  All PNG variants failed")
                continue
            
            working_pattern = pattern
            log_sprite(f"SUCCESS with pattern!")
            break
        
        if not css_content or not css_text or not png_content:
            log_sprite("ERROR: All URL patterns failed. Could not download sprite files.")
            return False
        
        # Upload files to Supabase
        log_sprite("")
        log_sprite("Uploading sprite files to Supabase...")
        
        sprite_sheet_id = test_slug.replace('-', '_')
        png_filename = f"{sprite_sheet_id}.png"
        css_filename = f"{sprite_sheet_id}.css"
        
        # Update CSS URLs to point to Supabase
        supabase_png_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{png_filename}"
        updated_css_text = re.sub(
            r"url\(['\"]?([^'\")\s]+)['\"]?\)",
            lambda m: f"url('{supabase_png_url}')",
            css_text
        )
        
        # Save locally
        os.makedirs(SPRITES_DIR, exist_ok=True)
        local_png_path = os.path.join(SPRITES_DIR, png_filename)
        local_css_path = os.path.join(SPRITES_DIR, css_filename)
        
        with open(local_png_path, 'wb') as f:
            f.write(png_content)
        with open(local_css_path, 'w', encoding='utf-8') as f:
            f.write(updated_css_text)
        
        log_sprite(f"Saved locally: {local_png_path}, {local_css_path}")
        
        # Upload PNG
        supabase_png_path = f"{SPRITES_FOLDER}/{png_filename}"
        uploaded_png_url = await upload_to_supabase(supabase_png_path, png_content, "image/png")
        
        if not uploaded_png_url:
            log_sprite("FAILED to upload PNG")
            return False
        
        # Upload CSS
        supabase_css_path = f"{SPRITES_FOLDER}/{css_filename}"
        css_url = await upload_to_supabase(supabase_css_path, updated_css_text.encode('utf-8'), "text/css")
        
        if not css_url:
            log_sprite("FAILED to upload CSS")
            return False
        
        # Mark as uploaded in progress
        if 'uploaded_sprite_sheets' not in progress:
            progress['uploaded_sprite_sheets'] = []
        if test_slug not in progress['uploaded_sprite_sheets']:
            progress['uploaded_sprite_sheets'].append(test_slug)
            save_progress(progress)
        
        log_sprite("=" * 50)
        log_sprite(f"SUCCESS: Sprite processing complete for {test_slug}")
        log_sprite("=" * 50)
        return True
        
    except Exception as e:
        log_sprite(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Main function to complete missing sprite sheet uploads"""
    print("=" * 60)
    print("Complete Missing Sprite Sheet Uploads")
    print("=" * 60)
    print()
    
    # Load progress
    progress = load_progress()
    completed_tests = set(progress.get('completed_tests', []))
    uploaded_sprite_sheets = set(progress.get('uploaded_sprite_sheets', []))
    
    # Find missing sprite sheets
    missing_sprite_sheets = list(completed_tests - uploaded_sprite_sheets)
    missing_sprite_sheets.sort()
    
    print(f"Completed tests: {len(completed_tests)}")
    print(f"Uploaded sprite sheets: {len(uploaded_sprite_sheets)}")
    print(f"Missing sprite sheets: {len(missing_sprite_sheets)}")
    print()
    
    if not missing_sprite_sheets:
        print("All sprite sheets are already uploaded!")
        return
    
    print("Missing sprite sheets:")
    for i, test_slug in enumerate(missing_sprite_sheets, 1):
        print(f"  {i}. {test_slug}")
    print()
    print("=" * 60)
    print()
    
    # Process each missing sprite sheet
    success_count = 0
    fail_count = 0
    
    for i, test_slug in enumerate(missing_sprite_sheets, 1):
        log(f"[{i}/{len(missing_sprite_sheets)}] Processing: {test_slug}")
        success = await extract_and_upload_sprites(test_slug, progress)
        
        if success:
            success_count += 1
        else:
            fail_count += 1
        
        # Small delay between requests
        await asyncio.sleep(0.5)
        print()
    
    # Summary
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Successfully uploaded: {success_count}")
    print(f"Failed: {fail_count}")
    print(f"Total processed: {len(missing_sprite_sheets)}")
    print()


if __name__ == "__main__":
    asyncio.run(main())
