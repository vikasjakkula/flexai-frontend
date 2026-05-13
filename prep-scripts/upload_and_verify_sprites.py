"""
Upload all locally-downloaded sprite CSS+PNG to Supabase,
update test JSON files with Supabase URLs,
then verify every sprite URL across all test JSONs.
"""

import asyncio
import json
import os
import re
import httpx
from datetime import datetime

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL    = "https://bnnpmfdnsngxhxydvecx.supabase.co"
SUPABASE_KEY    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubnBtZmRuc25neGh4eWR2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg5Nzc1MCwiZXhwIjoyMDgxNDczNzUwfQ.wYXy4tK9-CXzXb8fb85tz6pK6M95w8jrROWyoNljTZY"
SUPABASE_BUCKET = "images"
SPRITES_FOLDER  = "sprites"

FOLDERS = [
    "ap_medical_scraped_data",
    "ts_medical_scraped_data",
]

def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")

def supabase_css_url(slug):
    fn = slug.replace("-", "_") + ".css"
    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{fn}"

def supabase_png_url(slug):
    fn = slug.replace("-", "_") + ".png"
    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{SPRITES_FOLDER}/{fn}"

async def upload_file(client, remote_path, data, content_type):
    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{remote_path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }
    r = await client.put(url, content=data, headers=headers, timeout=60)
    return r.status_code in (200, 201)

async def process_folder(folder, client, results):
    sprites_dir = os.path.join(folder, "sprites")
    log(f"\n{'='*60}")
    log(f"Folder: {folder}")
    log(f"{'='*60}")

    for fname in sorted(os.listdir(folder)):
        if not fname.endswith(".json") or fname == "progress.json":
            continue

        slug = fname[:-5]                          # strip .json
        json_path = os.path.join(folder, fname)
        filename  = slug.replace("-", "_")
        css_local = os.path.join(sprites_dir, f"{filename}.css")
        png_local = os.path.join(sprites_dir, f"{filename}.png")

        with open(json_path, encoding="utf-8", errors="replace") as f:
            data = json.load(f)

        already_ok = data.get("sprite_status") == "ok" and data.get("sprite_css_url")

        # ── Skip if Supabase URLs already set ────────────────────────────────
        if already_ok:
            log(f"  [SKIP] {slug} - already has Supabase URLs")
            results["already_ok"].append(slug)
            continue

        # ── No local sprite files ─────────────────────────────────────────────
        if not os.path.exists(css_local) or not os.path.exists(png_local):
            log(f"  [MISS] {slug} - no local sprite files", "WARN")
            results["no_local"].append(slug)
            continue

        log(f"  [UPLOAD] {slug}")

        with open(css_local, encoding="utf-8", errors="replace") as f:
            css_text = f.read()
        with open(png_local, "rb") as f:
            png_data = f.read()

        # Rewrite background-image in CSS to point to Supabase PNG URL
        png_sb_url = supabase_png_url(slug)
        updated_css = re.sub(
            r"url\(['\"]?([^'\")\s]+)['\"]?\)",
            lambda m: f"url('{png_sb_url}')",
            css_text,
        )

        remote_png = f"{SPRITES_FOLDER}/{filename}.png"
        remote_css = f"{SPRITES_FOLDER}/{filename}.css"

        png_ok = await upload_file(client, remote_png, png_data, "image/png")
        css_ok = await upload_file(client, remote_css, updated_css.encode("utf-8"), "text/css")

        if png_ok and css_ok:
            # Update local CSS file with rewritten URLs too
            with open(css_local, "w", encoding="utf-8") as f:
                f.write(updated_css)

            # Update the test JSON
            data["sprite_css_url"]   = supabase_css_url(slug)
            data["sprite_sheet_url"] = png_sb_url
            data["sprite_status"]    = "ok"
            data["sprite_message"]   = "Uploaded via upload_and_verify_sprites.py"
            with open(json_path, "w", encoding="utf-8", errors="replace") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            log(f"    CSS -> {supabase_css_url(slug)}")
            log(f"    PNG -> {png_sb_url}")
            results["uploaded"].append(slug)
        else:
            log(f"    FAILED (css={css_ok}, png={png_ok})", "ERROR")
            results["upload_failed"].append(slug)


async def verify_all(results):
    log(f"\n{'='*60}")
    log("VERIFICATION - checking all Supabase URLs")
    log(f"{'='*60}")

    urls_to_check = []  # (slug, css_url, png_url)

    for folder in FOLDERS:
        for fname in sorted(os.listdir(folder)):
            if not fname.endswith(".json") or fname == "progress.json":
                continue
            json_path = os.path.join(folder, fname)
            with open(json_path, encoding="utf-8", errors="replace") as f:
                data = json.load(f)
            css = data.get("sprite_css_url")
            png = data.get("sprite_sheet_url")
            if css or png:
                urls_to_check.append((fname[:-5], css, png))

    ok_count = 0
    bad = []

    async with httpx.AsyncClient(follow_redirects=True, timeout=20) as client:
        for slug, css_url, png_url in urls_to_check:
            issues = []
            for label, url in [("CSS", css_url), ("PNG", png_url)]:
                if not url:
                    issues.append(f"{label}=MISSING")
                    continue
                try:
                    r = await client.head(url)
                    if r.status_code != 200:
                        issues.append(f"{label}=HTTP {r.status_code}")
                except Exception as e:
                    issues.append(f"{label}=ERROR({str(e)[:40]})")
            if issues:
                bad.append((slug, issues))
                log(f"  [FAIL] {slug}: {', '.join(issues)}", "WARN")
            else:
                ok_count += 1

    results["verify_ok"]  = ok_count
    results["verify_bad"] = bad
    log(f"\nVerification: {ok_count} OK, {len(bad)} failed")


async def main():
    results = {
        "already_ok":    [],
        "uploaded":      [],
        "upload_failed": [],
        "no_local":      [],
        "verify_ok":     0,
        "verify_bad":    [],
    }

    async with httpx.AsyncClient(timeout=60) as client:
        for folder in FOLDERS:
            await process_folder(folder, client, results)

    await verify_all(results)

    # ── Final report ─────────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print("FINAL REPORT")
    print(f"{'='*60}")
    print(f"Already had Supabase URLs : {len(results['already_ok'])}")
    print(f"Newly uploaded            : {len(results['uploaded'])}")
    print(f"Upload failed             : {len(results['upload_failed'])}")
    print(f"No local sprite files     : {len(results['no_local'])}")
    print(f"Verification passed       : {results['verify_ok']}")
    print(f"Verification failed       : {len(results['verify_bad'])}")

    if results["upload_failed"]:
        print("\nUpload failures:")
        for s in results["upload_failed"]:
            print(f"  - {s}")

    if results["no_local"]:
        print("\nMissing local sprites (not downloaded):")
        for s in results["no_local"]:
            print(f"  - {s}")

    if results["verify_bad"]:
        print("\nBad Supabase URLs:")
        for slug, issues in results["verify_bad"]:
            print(f"  - {slug}: {', '.join(issues)}")


if __name__ == "__main__":
    asyncio.run(main())
