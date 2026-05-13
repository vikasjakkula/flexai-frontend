"""
Upload scraped EAMCET Medical questions to Supabase PostgreSQL database.
Loads from ap_medical_scraped_data and ts_medical_scraped_data.
Section mapping: 1-40 Botany, 41-80 Zoology, 81-120 Physics, 121-160 Chemistry.
Adds field='medical' for both AP and TS states.
"""

import json
import os
import re
import time
from datetime import datetime
from supabase import create_client, Client

# Supabase credentials (hardcoded)
SUPABASE_URL = "https://bnnpmfdnsngxhxydvecx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubnBtZmRuc25neGh4eWR2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg5Nzc1MCwiZXhwIjoyMDgxNDczNzUwfQ.wYXy4tK9-CXzXb8fb85tz6pK6M95w8jrROWyoNljTZY"

# Data directories for medical papers (AP and TS)
DATA_DIRS = ["ap_medical_scraped_data", "ts_medical_scraped_data"]

# Sprite storage config
SPRITES_BUCKET = "images"
SPRITES_FOLDER = "sprites"


def get_supabase_client() -> Client:
    """Create and return Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def parse_test_title(title: str, slug: str) -> dict:
    """
    Parse test title to extract metadata
    Example: "AP EAPCET Medical 20 May 2025 Shift 2 Paper" or "TS EAMCET Medical 10 May 2023 Shift 1 Paper"
    """
    result = {
        "test_name": title,
        "test_date": None,
        "shift": "1",
        "year": None,
        "test_type": "previous_year"
    }

    date_pattern = r'(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})'
    shift_pattern = r'Shift\s+(\d)'

    date_match = re.search(date_pattern, title, re.IGNORECASE)
    shift_match = re.search(shift_pattern, title, re.IGNORECASE)

    if date_match:
        day = int(date_match.group(1))
        month_name = date_match.group(2)
        year = int(date_match.group(3))
        months = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4,
            'may': 5, 'june': 6, 'july': 7, 'august': 8,
            'september': 9, 'october': 10, 'november': 11, 'december': 12
        }
        month = months.get(month_name.lower(), 1)
        try:
            result["test_date"] = datetime(year, month, day).strftime("%Y-%m-%d")
            result["year"] = str(year)
        except ValueError:
            pass

    if shift_match:
        result["shift"] = shift_match.group(1)

    if not result["test_date"]:
        slug_date_pattern = r'(\d{1,2})-(\w+)-(\d{4})'
        slug_match = re.search(slug_date_pattern, slug)
        if slug_match:
            day = int(slug_match.group(1))
            month_name = slug_match.group(2)
            year = int(slug_match.group(3))
            months = {
                'january': 1, 'february': 2, 'march': 3, 'april': 4,
                'may': 5, 'june': 6, 'july': 7, 'august': 8,
                'september': 9, 'october': 10, 'november': 11, 'december': 12
            }
            month = months.get(month_name.lower(), 1)
            try:
                result["test_date"] = datetime(year, month, day).strftime("%Y-%m-%d")
                result["year"] = str(year)
            except ValueError:
                pass

    return result


def get_state_from_slug(slug: str) -> str:
    """Infer state from slug: ap- -> AP, ts- or tg- -> TS"""
    slug_lower = slug.lower()
    if slug_lower.startswith("ap-"):
        return "AP"
    elif slug_lower.startswith("ts-") or slug_lower.startswith("tg-"):
        return "TS"
    return "AP"  # Default


def get_sprite_css_url(slug: str) -> str:
    """Generate the Supabase Storage URL for sprite CSS"""
    css_filename = slug.replace('-', '_') + '.css'
    return f"{SUPABASE_URL}/storage/v1/object/public/{SPRITES_BUCKET}/{SPRITES_FOLDER}/{css_filename}"


def get_section_for_question(question_number: int) -> str:
    """
    Medical paper section mapping:
    1-40: Botany
    41-80: Zoology
    81-120: Physics
    121-160: Chemistry
    """
    if 1 <= question_number <= 40:
        return "Botany"
    elif 41 <= question_number <= 80:
        return "Zoology"
    elif 81 <= question_number <= 120:
        return "Physics"
    elif 121 <= question_number <= 160:
        return "Chemistry"
    else:
        return "Unknown"


def load_questions_data() -> dict:
    """
    Load questions data from both ap_medical_scraped_data and ts_medical_scraped_data.
    """
    all_data = {"tests": [], "last_updated": datetime.now().isoformat()}
    excluded_files = ['progress.json', 'all_questions.json']
    seen_slugs = set()

    for data_dir in DATA_DIRS:
        if not os.path.exists(data_dir):
            print(f"  [WARN] Directory not found: {data_dir}")
            continue

        print(f"  Reading from: {data_dir}...")
        for filename in os.listdir(data_dir):
            if filename.endswith('.json') and filename not in excluded_files:
                filepath = os.path.join(data_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        test_data = json.load(f)
                    if 'questions' in test_data and len(test_data['questions']) > 0:
                        slug = test_data.get('slug', '')
                        if slug not in seen_slugs:
                            seen_slugs.add(slug)
                            all_data['tests'].append(test_data)
                            print(f"    Loaded: {filename} ({len(test_data['questions'])} questions)")
                        else:
                            print(f"    Skipped duplicate slug: {filename}")
                except Exception as e:
                    print(f"    Error loading {filename}: {str(e)[:50]}")

    all_data['tests'].sort(key=lambda x: x.get('title', ''))
    return all_data


def upload_data(supabase: Client, data: dict):
    """Upload all medical data to Supabase"""

    tests = data.get("tests", [])
    print(f"Found {len(tests)} tests to upload")

    for test in tests:
        title = test.get("title", "")
        slug = test.get("slug", "")
        questions = test.get("questions", [])

        print(f"\n{'='*60}")
        print(f"Processing: {title}")
        print(f"Questions: {len(questions)}")

        test_meta = parse_test_title(title, slug)
        state = get_state_from_slug(slug)

        if not test_meta["test_date"]:
            print(f"  [WARN] Could not parse date from title, using today's date")
            test_meta["test_date"] = datetime.now().strftime("%Y-%m-%d")
            test_meta["year"] = str(datetime.now().year)

        existing_test = supabase.table("tests").select("test_id").eq("test_name", title).execute()
        sprite_css_url = get_sprite_css_url(slug)

        if existing_test.data and len(existing_test.data) > 0:
            test_id = existing_test.data[0]["test_id"]
            print(f"  [SKIP] Test already exists with ID: {test_id}")

            supabase.table("tests").update({
                "sprite_css_url": sprite_css_url,
                "state": state,
                "field": "medical"
            }).eq("test_id", test_id).execute()
            print(f"  [UPDATE] Updated sprite_css_url, state, and field for existing test")
        else:
            test_insert = supabase.table("tests").insert({
                "test_name": test_meta["test_name"],
                "test_date": test_meta["test_date"],
                "shift": test_meta["shift"],
                "year": test_meta["year"],
                "test_type": test_meta["test_type"],
                "sprite_css_url": sprite_css_url,
                "state": state,
                "field": "medical"
            }).execute()

            if test_insert.data and len(test_insert.data) > 0:
                test_id = test_insert.data[0]["test_id"]
                print(f"  [OK] Created test with ID: {test_id} (state={state}, field=medical)")
                print(f"  [OK] Sprite CSS URL: {sprite_css_url}")
            else:
                print(f"  [ERROR] Failed to insert test")
                continue

        sections = ["Botany", "Zoology", "Physics", "Chemistry"]
        section_ids = {}

        for section_name in sections:
            section_id = f"{test_id}_{section_name.lower()}"

            existing_section = supabase.table("sections").select("section_id").eq("section_id", section_id).execute()

            if existing_section.data and len(existing_section.data) > 0:
                section_ids[section_name] = section_id
                print(f"  [SKIP] Section {section_name} already exists")
            else:
                section_insert = supabase.table("sections").insert({
                    "section_id": section_id,
                    "test_id": test_id,
                    "section_name": section_name
                }).execute()

                if section_insert.data:
                    section_ids[section_name] = section_id
                    print(f"  [OK] Created section: {section_name}")
                else:
                    print(f"  [ERROR] Failed to create section: {section_name}")

        questions_inserted = 0
        questions_skipped = 0
        max_retries = 3
        retry_delay = 2

        for q in questions:
            q_num = q.get("question_number", 0)
            section_name = get_section_for_question(q_num)
            section_id = section_ids.get(section_name)

            if not section_id:
                print(f"  [WARN] No section for question {q_num}")
                continue

            existing_q = None
            for attempt in range(max_retries):
                try:
                    existing_q = supabase.table("questions").select("question_id").eq("section_id", section_id).eq("question_number", q_num).execute()
                    break
                except Exception as e:
                    if attempt < max_retries - 1:
                        print(f"  [RETRY] Network error checking Q{q_num}, retrying in {retry_delay}s... ({attempt + 1}/{max_retries})")
                        time.sleep(retry_delay)
                    else:
                        print(f"  [ERROR] Failed to check existing Q{q_num} after {max_retries} attempts: {str(e)[:100]}")
                        continue

            if existing_q and existing_q.data and len(existing_q.data) > 0:
                questions_skipped += 1
                continue

            correct_opt = q.get("correct_option", "")
            if correct_opt:
                correct_opt = correct_opt.upper()[0]
            else:
                correct_opt = "A"

            question_data = {
                "section_id": section_id,
                "question_number": q_num,
                "question_text": q.get("question_html", ""),
                "option_a": q.get("option_a", ""),
                "option_b": q.get("option_b", ""),
                "option_c": q.get("option_c", ""),
                "option_d": q.get("option_d", ""),
                "correct_option": correct_opt,
                "answer": q.get("solution_html", "")
            }

            inserted = False
            for attempt in range(max_retries):
                try:
                    q_insert = supabase.table("questions").insert(question_data).execute()
                    if q_insert.data:
                        questions_inserted += 1
                        inserted = True
                        break
                    else:
                        print(f"  [ERROR] Failed to insert Q{q_num}")
                        break
                except Exception as e:
                    if attempt < max_retries - 1:
                        print(f"  [RETRY] Network error inserting Q{q_num}, retrying in {retry_delay}s... ({attempt + 1}/{max_retries})")
                        time.sleep(retry_delay)
                    else:
                        print(f"  [ERROR] Q{q_num}: {str(e)[:100]}")

            if not inserted:
                time.sleep(0.1)

        print(f"  Questions: {questions_inserted} inserted, {questions_skipped} skipped")

    print(f"\n{'='*60}")
    print("UPLOAD COMPLETE!")
    print(f"{'='*60}")


def main():
    """Main function"""
    print("="*60)
    print("EAMCET Medical Questions Uploader to Supabase")
    print("="*60)

    print("\nLoading questions data from ap_medical_scraped_data and ts_medical_scraped_data...")
    data = load_questions_data()

    total_tests = len(data.get("tests", []))
    total_questions = sum(len(t.get("questions", [])) for t in data.get("tests", []))
    print(f"Loaded: {total_tests} tests, {total_questions} questions")

    print("\nConnecting to Supabase...")
    supabase = get_supabase_client()
    print("Connected!")

    print("\nStarting upload...")
    upload_data(supabase, data)


if __name__ == "__main__":
    main()
