#!/usr/bin/env python3
"""
Script to update progress.json by scanning existing JSON files and sprite sheets
in the ap_scraped_data directory.
"""

import json
import os
import re
from pathlib import Path
from datetime import datetime
from typing import List, Tuple

def extract_date_from_filename(filename: str) -> Tuple[int, datetime]:
    """
    Extract year and date from filename.
    Returns (year, datetime_object) for sorting.
    """
    # Pattern to match dates in filenames like:
    # ap-eapcet-21-may-2024-shift-1-solved-paper.json
    # ap-eapcet-04-jul-2022-shift-1-paper.json
    # ap-eapcet-15th-may-2023-shift-1-solved-paper.json
    
    # Remove file extension
    name = filename.replace('.json', '').replace('.png', '').replace('.css', '')
    
    # Try to extract date pattern: day-month-year
    # Handle formats like: 21-may-2024, 04-jul-2022, 15th-may-2023
    date_patterns = [
        r'(\d{1,2})(?:st|nd|rd|th)?-(\w+)-(\d{4})',  # 15th-may-2023, 21-may-2024
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, name, re.IGNORECASE)
        if match:
            day_str = match.group(1)
            month_str = match.group(2).lower()
            year = int(match.group(3))
            
            # Convert month name to number
            month_map = {
                'jan': 1, 'january': 1,
                'feb': 2, 'february': 2,
                'mar': 3, 'march': 3,
                'apr': 4, 'april': 4,
                'may': 5,
                'jun': 6, 'june': 6,
                'jul': 7, 'july': 7,
                'aug': 8, 'august': 8,
                'sep': 9, 'september': 9,
                'oct': 10, 'october': 10,
                'nov': 11, 'november': 11,
                'dec': 12, 'december': 12
            }
            
            month = month_map.get(month_str)
            if month:
                day = int(day_str)
                try:
                    date_obj = datetime(year, month, day)
                    return (year, date_obj)
                except ValueError:
                    # Invalid date, use year only
                    return (year, datetime(year, 1, 1))
    
    # Fallback: try to extract just the year
    year_match = re.search(r'(\d{4})', name)
    if year_match:
        year = int(year_match.group(1))
        return (year, datetime(year, 1, 1))
    
    # If no date found, return a very old date
    return (0, datetime(1970, 1, 1))

def sprite_name_to_test_name(sprite_filename: str) -> str:
    """
    Convert sprite filename to test name format.
    Example: ap_eapcet_21_may_2024_shift_1_solved_paper.png
    -> ap-eapcet-21-may-2024-shift-1-solved-paper
    """
    # Remove extension
    name = sprite_filename.replace('.png', '').replace('.css', '')
    # Replace underscores with hyphens
    return name.replace('_', '-')

def get_completed_tests(data_dir: Path) -> List[str]:
    """Get all completed tests from JSON files."""
    completed = []
    
    for json_file in data_dir.glob('*.json'):
        if json_file.name == 'progress.json':
            continue
        
        # Remove .json extension to get test name
        test_name = json_file.stem
        completed.append(test_name)
    
    return completed

def get_uploaded_sprite_sheets(sprites_dir: Path) -> List[str]:
    """Get all uploaded sprite sheets from PNG files."""
    uploaded = []
    
    # Get unique sprite sheet names (each has both .png and .css)
    sprite_names = set()
    
    for png_file in sprites_dir.glob('*.png'):
        sprite_name = png_file.stem
        sprite_names.add(sprite_name)
    
    # Convert sprite names to test name format
    for sprite_name in sprite_names:
        test_name = sprite_name_to_test_name(sprite_name)
        uploaded.append(test_name)
    
    return uploaded

def sort_by_year(test_names: List[str]) -> List[str]:
    """Sort test names by year (and date within year)."""
    # Create list of (year, date, test_name) tuples
    test_data = []
    for test_name in test_names:
        year, date_obj = extract_date_from_filename(test_name)
        test_data.append((year, date_obj, test_name))
    
    # Sort by year first, then by date
    test_data.sort(key=lambda x: (x[0], x[1]))
    
    # Return just the test names
    return [test_name for _, _, test_name in test_data]

def main():
    # Get the directory containing this script
    script_dir = Path(__file__).parent
    data_dir = script_dir / 'ap_scraped_data'
    sprites_dir = data_dir / 'sprites'
    progress_file = data_dir / 'progress.json'
    
    if not data_dir.exists():
        print(f"Error: Directory {data_dir} does not exist")
        return
    
    print("Scanning for completed tests...")
    completed_tests = get_completed_tests(data_dir)
    print(f"Found {len(completed_tests)} completed tests")
    
    print("Scanning for uploaded sprite sheets...")
    uploaded_sprite_sheets = get_uploaded_sprite_sheets(sprites_dir)
    print(f"Found {len(uploaded_sprite_sheets)} uploaded sprite sheets")
    
    # Sort both lists by year
    print("Sorting by year...")
    completed_tests_sorted = sort_by_year(completed_tests)
    uploaded_sprite_sheets_sorted = sort_by_year(uploaded_sprite_sheets)
    
    # Create progress data
    progress_data = {
        "completed_tests": completed_tests_sorted,
        "uploaded_sprite_sheets": uploaded_sprite_sheets_sorted
    }
    
    # Write to progress.json
    print(f"Writing to {progress_file}...")
    with open(progress_file, 'w', encoding='utf-8') as f:
        json.dump(progress_data, f, indent=2, ensure_ascii=False)
    
    print("Done!")
    print(f"\nCompleted tests: {len(completed_tests_sorted)}")
    print(f"Uploaded sprite sheets: {len(uploaded_sprite_sheets_sorted)}")

if __name__ == '__main__':
    main()





