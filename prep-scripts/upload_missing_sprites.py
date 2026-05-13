"""
Upload missing sprite sheets to Supabase
Only processes tests that are in completed_tests but not in uploaded_sprite_sheets
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

# ============== CONFIGURATION ==============
OUTPUT_DIR = "ap_scraped_data"
SPRITES_DIR = os.path.join(OUTPUT_DIR, "sprites")
PROGRESS_FILE = os.path.join(OUTPUT_DIR, "progress.json")

# Month name mapping
MONTH_MAP = {
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


def log(message, level="INFO"):
    """Print log message with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


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


async def download_file(url: str) -> bytes:
    """Download a file from URL"""
    log(f"Downloading: {url}")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=60.0, follow_redirects=True)
            if response.status_code == 200:
                log(f"  - Downloaded: {len(response.content)} bytes")
                return response.content
            else:
                log(f"  - Failed: HTTP {response.status_code}", "WARN")
                return None
    except Exception as e:
        log(f"  - Error: {str(e)}", "ERROR")
        return None


async def upload_to_supabase(file_path: str, file_data: bytes, content_type: str):
    """Upload a file to Supabase Storage"""
    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{file_path}"
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true"
    }
    
    log(f"Uploading to Supabase: {file_path}")
    log(f"  - Size: {len(file_data)} bytes")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(url, content=file_data, headers=headers, timeout=60.0)
            
            if response.status_code in [200, 201]:
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{file_path}"
                log(f"  - SUCCESS: {public_url}")
                return public_url
            else:
                log(f"  - FAILED: HTTP {response.status_code}", "ERROR")
                log(f"  - Error: {response.text[:200]}", "ERROR")
                return None
    except Exception as e:
        log(f"  - ERROR: {str(e)}", "ERROR")
        return None


def extract_date_components(test_slug: str):
    """Extract day, month, year, shift from test slug"""
    slug_parts = test_slug.lower().split('-')
    
    day = None
    month = None
    month_capital = None
    year = None
    shift = "1"
    
    # Find day, month, year
    for i, part in enumerate(slug_parts):
        # Extract numeric day - handle ordinals like "18th", "15th" and plain numbers like "04", "4"
        day_match = re.match(r'^(\d{1,2})', part)
        if day_match:
            day_str = day_match.group(1)
            # Remove leading zeros (e.g., "04" -> "4", "08" -> "8")
            day = str(int(day_str))
            if i + 2 < len(slug_parts):
                month_name = slug_parts[i + 1]
                month = month_name.lower()
                month_capital = MONTH_MAP.get(month_name, month_name.capitalize())
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
            if part.isdigit() and len(part) == 4:
                year = part
                break
    
    return day, month, month_capital, year, shift


def build_url_patterns(day, month, month_capital, year, shift):
    """Build all possible URL patterns"""
    cdn_base = "https://examsnet.github.io/cdn/img/engg/eamcet/apeap/prev"
    url_patterns = []
    
    if day and month and year and month_capital:
        # Pattern 3: Lowercase month with capital Shift - eap-15-may-2023-Shift1.css
        base_shift = f"eap-{day}-{month}-{year}-Shift{shift}"
        url_patterns.append({
            "name": base_shift,
            "css": f"{cdn_base}/{base_shift}.css",
            "png": f"{cdn_base}/{base_shift}.png"
        })
        
        # Pattern 4: Capital month with capital Shift - eap-4-Jul-2022-Shift1.css
        base_cap_shift = f"eap-{day}-{month_capital}-{year}-Shift{shift}"
        url_patterns.append({
            "name": base_cap_shift,
            "css": f"{cdn_base}/{base_cap_shift}.css",
            "png": f"{cdn_base}/{base_cap_shift}.png"
        })
        
        # Pattern 2: With dashes - eap-18-May-2024-s1.css
        base_dash = f"eap-{day}-{month_capital}-{year}-s{shift}"
        url_patterns.append({
            "name": base_dash,
            "css": f"{cdn_base}/{base_dash}.css",
            "png": f"{cdn_base}/{base_dash}.png"
        })
        
        # Pattern 1: Compact format - eap21May2025s1.css
        base_compact = f"eap{day}{month_capital}{year}s{shift}"
        url_patterns.append({
            "name": base_compact,
            "css": f"{cdn_base}/{base_compact}.css",
            "png": f"{cdn_base}/{base_compact}.png"
        })
    
    return url_patterns


async def upload_sprite_sheet(test_slug: str, progress: dict):
    """Upload sprite sheet for a single test"""
    log("=" * 60)
    log(f"Processing: {test_slug}")
    log("=" * 60)
    
    # Check if already uploaded
    if test_slug in progress.get('uploaded_sprite_sheets', []):
        log(f"Already uploaded - skipping")
        return True
    
    # Extract date components
    day, month, month_capital, year, shift = extract_date_components(test_slug)
    
    if not day or not month or not year:
        log(f"ERROR: Could not extract date components from slug", "ERROR")
        return False
    
    log(f"Extracted: day={day}, month={month} (capital: {month_capital}), year={year}, shift={shift}")
    
    # Build URL patterns
    url_patterns = build_url_patterns(day, month, month_capital, year, shift)
    
    if not url_patterns:
        log(f"ERROR: Could not build URL patterns", "ERROR")
        return False
    
    # Try each pattern until one works
    css_content = None
    css_text = None
    png_content = None
    working_pattern = None
    
    for pattern in url_patterns:
        log(f"Trying pattern: {pattern['name']}")
        
        # Try CSS
        css_content = await download_file(pattern['css'])
        if not css_content:
            continue
        
        try:
            css_text = css_content.decode('utf-8')
            log(f"  CSS SUCCESS: {len(css_content)} bytes")
        except:
            log(f"  CSS decode failed", "WARN")
            continue
        
        # Try PNG
        png_content = await download_file(pattern['png'])
        if not png_content or len(png_content) < 1000:
            log(f"  PNG failed or too small", "WARN")
            continue
        
        log(f"  PNG SUCCESS: {len(png_content)} bytes")
        working_pattern = pattern
        break
    
    if not css_content or not css_text or not png_content:
        log(f"ERROR: All URL patterns failed", "ERROR")
        return False
    
    log(f"Working pattern: {working_pattern['name']}")
    
    # Generate sprite sheet ID from test slug
    sprite_sheet_id = test_slug.replace('-', '_')
    
    # Update CSS to point to Supabase PNG URL
    png_filename = f"{sprite_sheet_id}.png"
    supabase_png_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{png_filename}"
    
    # Replace any background-image URL with our Supabase PNG URL
    updated_css_text = re.sub(
        r"url\(['\"]?([^'\")\s]+)['\"]?\)",
        lambda m: f"url('{supabase_png_url}')",
        css_text
    )
    
    # Save CSS locally
    css_filename = f"{sprite_sheet_id}.css"
    local_css_path = os.path.join(SPRITES_DIR, css_filename)
    os.makedirs(SPRITES_DIR, exist_ok=True)
    with open(local_css_path, 'w', encoding='utf-8') as f:
        f.write(updated_css_text)
    log(f"Saved CSS locally: {local_css_path}")
    
    # Save PNG locally
    local_png_path = os.path.join(SPRITES_DIR, png_filename)
    with open(local_png_path, 'wb') as f:
        f.write(png_content)
    log(f"Saved PNG locally: {local_png_path}")
    
    # Upload PNG to Supabase
    log("")
    log("Uploading PNG to Supabase...")
    supabase_png_path = f"{SPRITES_FOLDER}/{png_filename}"
    uploaded_png_url = await upload_to_supabase(supabase_png_path, png_content, "image/png")
    
    if not uploaded_png_url:
        log("FAILED to upload PNG", "ERROR")
        return False
    
    # Upload CSS to Supabase
    log("")
    log("Uploading CSS to Supabase...")
    supabase_css_path = f"{SPRITES_FOLDER}/{css_filename}"
    css_url = await upload_to_supabase(supabase_css_path, updated_css_text.encode('utf-8'), "text/css")
    
    if not css_url:
        log("FAILED to upload CSS", "ERROR")
        return False
    
    # Mark as uploaded in progress
    if 'uploaded_sprite_sheets' not in progress:
        progress['uploaded_sprite_sheets'] = []
    if test_slug not in progress['uploaded_sprite_sheets']:
        progress['uploaded_sprite_sheets'].append(test_slug)
        save_progress(progress)
        log(f"Updated progress.json - marked as uploaded")
    
    log("")
    log("=" * 50)
    log(f"SUCCESS: {test_slug}")
    log("=" * 50)
    return True


async def main():
    """Main function"""
    print("=" * 60)
    print("Upload Missing Sprite Sheets")
    print("=" * 60)
    print()
    
    # Load progress
    progress = load_progress()
    
    # Find missing tests
    completed = set(progress.get('completed_tests', []))
    uploaded = set(progress.get('uploaded_sprite_sheets', []))
    missing = sorted(completed - uploaded)
    
    if not missing:
        print("No missing sprite sheets to upload!")
        return
    
    print(f"Found {len(missing)} missing sprite sheets:")
    for test in missing:
        print(f"  - {test}")
    print()
    
    # Upload each missing sprite sheet
    success_count = 0
    fail_count = 0
    
    for i, test_slug in enumerate(missing, 1):
        print()
        log(f"[{i}/{len(missing)}] Processing: {test_slug}")
        print()
        
        success = await upload_sprite_sheet(test_slug, progress)
        
        if success:
            success_count += 1
        else:
            fail_count += 1
        
        # Small delay between uploads
        await asyncio.sleep(0.5)
    
    print()
    print("=" * 60)
    print(f"COMPLETE: {success_count} succeeded, {fail_count} failed")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())



