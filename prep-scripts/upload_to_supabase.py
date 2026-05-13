"""
Upload scraped EAMCET questions to Supabase PostgreSQL database
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

# File paths
DATA_DIR = "ap_scraped_data"
DATA_FILE = "ap_scraped_data/all_questions.json"  # Legacy - may not exist

# Sprite storage config
SPRITES_BUCKET = "images"
SPRITES_FOLDER = "sprites"


def get_supabase_client() -> Client:
    """Create and return Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def parse_test_title(title: str, slug: str) -> dict:
    """
    Parse test title to extract metadata
    Example: "TG EAMCET 2 May 2025 Shift 1 Paper" or "TS EAMCET 7 May 2024 Shift 2 Solved Paper"
    """
    # Default values
    result = {
        "test_name": title,
        "test_date": None,
        "shift": "1",
        "year": None,
        "test_type": "previous_year"
    }
    
    # Try to extract date and shift from title
    # Pattern: "DD Month YYYY Shift N"
    date_pattern = r'(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})'
    shift_pattern = r'Shift\s+(\d)'
    
    date_match = re.search(date_pattern, title, re.IGNORECASE)
    shift_match = re.search(shift_pattern, title, re.IGNORECASE)
    
    if date_match:
        day = int(date_match.group(1))
        month_name = date_match.group(2)
        year = int(date_match.group(3))
        
        # Convert month name to number
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
    
    # Fallback: try to extract from slug
    if not result["test_date"]:
        # slug format: "tg-eamcet-2-may-2025-shift-1-paper"
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


def get_sprite_css_url(slug: str) -> str:
    """
    Generate the Supabase Storage URL for sprite CSS
    The CSS file is named after the test slug with dashes replaced by underscores
    """
    css_filename = slug.replace('-', '_') + '.css'
    return f"{SUPABASE_URL}/storage/v1/object/public/{SPRITES_BUCKET}/{SPRITES_FOLDER}/{css_filename}"


def get_section_for_question(question_number: int) -> str:
    """
    Determine section based on question number
    1-80: Mathematics
    81-120: Physics
    121-160: Chemistry
    """
    if 1 <= question_number <= 80:
        return "Mathematics"
    elif 81 <= question_number <= 120:
        return "Physics"
    elif 121 <= question_number <= 160:
        return "Chemistry"
    else:
        return "Unknown"


def load_questions_data() -> dict:
    """
    Load questions data from JSON files.
    First tries to read all_questions.json, if not found, reads individual test files.
    """
    # Try the merged file first
    if os.path.exists(DATA_FILE):
        print(f"  Reading from: {DATA_FILE}")
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    # Otherwise, read individual test files from ap_scraped_data folder
    print(f"  {DATA_FILE} not found, reading individual test files from {DATA_DIR}...")
    
    all_data = {"tests": [], "last_updated": datetime.now().isoformat()}
    
    if not os.path.exists(DATA_DIR):
        raise FileNotFoundError(f"Data directory not found: {DATA_DIR}")
    
    # Find all test JSON files (exclude progress.json and all_questions.json)
    excluded_files = ['progress.json', 'all_questions.json']
    
    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.json') and filename not in excluded_files:
            filepath = os.path.join(DATA_DIR, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    test_data = json.load(f)
                    # Only include if it has questions
                    if 'questions' in test_data and len(test_data['questions']) > 0:
                        all_data['tests'].append(test_data)
                        print(f"    Loaded: {filename} ({len(test_data['questions'])} questions)")
            except Exception as e:
                print(f"    Error loading {filename}: {str(e)[:50]}")
    
    # Sort by title
    all_data['tests'].sort(key=lambda x: x.get('title', ''))
    
    return all_data


def upload_data(supabase: Client, data: dict):
    """Upload all data to Supabase"""
    
    tests = data.get("tests", [])
    print(f"Found {len(tests)} tests to upload")
    
    for test in tests:
        title = test.get("title", "")
        slug = test.get("slug", "")
        questions = test.get("questions", [])
        
        print(f"\n{'='*60}")
        print(f"Processing: {title}")
        print(f"Questions: {len(questions)}")
        
        # Parse test metadata
        test_meta = parse_test_title(title, slug)
        
        if not test_meta["test_date"]:
            print(f"  [WARN] Could not parse date from title, using today's date")
            test_meta["test_date"] = datetime.now().strftime("%Y-%m-%d")
            test_meta["year"] = str(datetime.now().year)
        
        # Check if test already exists
        existing_test = supabase.table("tests").select("test_id").eq("test_name", title).execute()
        
        # Generate sprite CSS URL for this test
        sprite_css_url = get_sprite_css_url(slug)
        
        if existing_test.data and len(existing_test.data) > 0:
            test_id = existing_test.data[0]["test_id"]
            print(f"  [SKIP] Test already exists with ID: {test_id}")
            
            # Update sprite_css_url and state if not set
            supabase.table("tests").update({
                "sprite_css_url": sprite_css_url,
                "state": "AP"
            }).eq("test_id", test_id).execute()
            print(f"  [UPDATE] Updated sprite_css_url and state for existing test")
        else:
            # Insert test with sprite_css_url and state
            test_insert = supabase.table("tests").insert({
                "test_name": test_meta["test_name"],
                "test_date": test_meta["test_date"],
                "shift": test_meta["shift"],
                "year": test_meta["year"],
                "test_type": test_meta["test_type"],
                "sprite_css_url": sprite_css_url,
                "state": "AP"
            }).execute()
            
            if test_insert.data and len(test_insert.data) > 0:
                test_id = test_insert.data[0]["test_id"]
                print(f"  [OK] Created test with ID: {test_id}")
                print(f"  [OK] Sprite CSS URL: {sprite_css_url}")
            else:
                print(f"  [ERROR] Failed to insert test")
                continue
        
        # Create sections for this test
        sections = ["Mathematics", "Physics", "Chemistry"]
        section_ids = {}
        
        for section_name in sections:
            section_id = f"{test_id}_{section_name.lower()}"
            
            # Check if section exists
            existing_section = supabase.table("sections").select("section_id").eq("section_id", section_id).execute()
            
            if existing_section.data and len(existing_section.data) > 0:
                section_ids[section_name] = section_id
                print(f"  [SKIP] Section {section_name} already exists")
            else:
                # Insert section
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
        
        # Insert questions
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
            
            # Check if question already exists (with retry on network error)
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
            
            # Prepare question data
            correct_opt = q.get("correct_option", "")
            if correct_opt:
                correct_opt = correct_opt.upper()[0]  # Ensure uppercase single char
            else:
                correct_opt = "A"  # Default
            
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
            
            # Insert question (with retry on network error)
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
                # Small delay between questions to avoid overwhelming the server
                time.sleep(0.1)
        
        print(f"  Questions: {questions_inserted} inserted, {questions_skipped} skipped")
    
    print(f"\n{'='*60}")
    print("UPLOAD COMPLETE!")
    print(f"{'='*60}")


def main():
    """Main function"""
    print("="*60)
    print("EAMCET Questions Uploader to Supabase")
    print("="*60)
    
    # Load data
    print("\nLoading questions data...")
    data = load_questions_data()
    
    # Get only the last 6 tests
    all_tests = data.get("tests", [])
    if len(all_tests) > 6:
        data["tests"] = all_tests[-6:]
        print(f"\n[INFO] Filtering to last 6 tests (out of {len(all_tests)} total)")
    
    total_tests = len(data.get("tests", []))
    total_questions = sum(len(t.get("questions", [])) for t in data.get("tests", []))
    print(f"Loaded: {total_tests} tests, {total_questions} questions")
    
    # Connect to Supabase
    print("\nConnecting to Supabase...")
    supabase = get_supabase_client()
    print("Connected!")
    
    # Upload data
    print("\nStarting upload...")
    upload_data(supabase, data)


if __name__ == "__main__":
    main()

