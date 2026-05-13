#!/usr/bin/env python3
"""
Script to find and count empty string values in all completed test JSON files.
Also counts solution_html fields that contain only empty divs or whitespace.
Scans both ap_scraped_data and scraped_data directories.
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, Any, List
from collections import defaultdict

def is_empty_solution_html(value: str) -> bool:
    """
    Check if solution_html is effectively empty.
    Returns True if:
    - Empty string ""
    - Contains only whitespace
    - Contains only empty div tags (with or without whitespace)
    """
    if not isinstance(value, str):
        return False
    
    # Check for empty string
    if value == "":
        return True
    
    # Strip whitespace
    stripped = value.strip()
    
    # Check if empty after stripping
    if stripped == "":
        return True
    
    # Check for empty div patterns like: <div style="..."> </div> or <div style="..."></div>
    # Pattern matches div tags with optional style attributes and only whitespace content
    empty_div_pattern = r'^<div[^>]*>\s*</div>$'
    if re.match(empty_div_pattern, stripped, re.IGNORECASE | re.DOTALL):
        return True
    
    # Check for multiple empty divs with only whitespace
    # Remove all whitespace and check if only div tags remain
    no_whitespace = re.sub(r'\s+', '', stripped)
    if re.match(r'^(<div[^>]*></div>)+$', no_whitespace, re.IGNORECASE):
        return True
    
    return False

def count_empty_strings_recursive(obj: Any, path: str = "", counts: Dict[str, int] = None) -> Dict[str, int]:
    """
    Recursively traverse JSON object and count empty strings by field name.
    Also checks for empty solution_html fields (empty divs).
    
    Args:
        obj: The JSON object to traverse
        path: Current path in the object (for nested structures)
        counts: Dictionary to accumulate counts
    
    Returns:
        Dictionary mapping field names to counts of empty strings
    """
    if counts is None:
        counts = defaultdict(int)
    
    if isinstance(obj, dict):
        for key, value in obj.items():
            current_path = f"{path}.{key}" if path else key
            
            if isinstance(value, str):
                if value == "":
                    counts[key] += 1
                elif key == "solution_html" and is_empty_solution_html(value):
                    # Count empty solution_html (including empty divs)
                    counts[key] += 1
            elif isinstance(value, (dict, list)):
                count_empty_strings_recursive(value, current_path, counts)
    
    elif isinstance(obj, list):
        for idx, item in enumerate(obj):
            current_path = f"{path}[{idx}]" if path else f"[{idx}]"
            if isinstance(item, (dict, list)):
                count_empty_strings_recursive(item, current_path, counts)
            elif isinstance(item, str) and item == "":
                # For list items that are strings, we'll count them under a generic key
                counts["_list_empty_strings"] += 1
    
    return counts

def process_json_file(json_file: Path) -> Dict[str, int]:
    """
    Process a single JSON file and return counts of empty strings by field.
    Also counts solution_html fields with empty divs.
    
    Args:
        json_file: Path to the JSON file
    
    Returns:
        Dictionary mapping field names to counts of empty strings/empty divs
    """
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        counts = count_empty_strings_recursive(data)
        return dict(counts)  # Convert defaultdict to regular dict
    
    except Exception as e:
        print(f"Error processing {json_file}: {e}")
        return {}

def scan_directory(directory: Path) -> Dict[str, Dict[str, int]]:
    """
    Scan a directory for JSON files and process them.
    
    Args:
        directory: Path to directory to scan
    
    Returns:
        Dictionary mapping test names to their empty string counts
    """
    results = {}
    
    if not directory.exists():
        print(f"Warning: Directory {directory} does not exist")
        return results
    
    json_files = list(directory.glob('*.json'))
    
    # Exclude progress.json and tests_data_debug.json
    json_files = [f for f in json_files if f.name not in ['progress.json', 'tests_data_debug.json']]
    
    print(f"Scanning {len(json_files)} files in {directory}...")
    
    for json_file in json_files:
        test_name = json_file.stem  # Get filename without extension
        counts = process_json_file(json_file)
        
        if counts:  # Only include tests that have empty strings or empty divs
            results[test_name] = counts
            print(f"  Found empty strings/divs in {test_name}: {sum(counts.values())} total")
    
    return results

def main():
    script_dir = Path(__file__).parent
    
    # Directories to scan
    ap_data_dir = script_dir / 'ap_scraped_data'
    scraped_data_dir = script_dir / 'scraped_data'
    
    all_results = {}
    
    # Scan ap_scraped_data
    print("=" * 60)
    print("Scanning ap_scraped_data...")
    print("=" * 60)
    ap_results = scan_directory(ap_data_dir)
    all_results.update(ap_results)
    
    # Scan scraped_data
    print("\n" + "=" * 60)
    print("Scanning scraped_data...")
    print("=" * 60)
    scraped_results = scan_directory(scraped_data_dir)
    all_results.update(scraped_results)
    
    # Calculate totals
    total_tests = len(all_results)
    total_empty_strings = sum(sum(counts.values()) for counts in all_results.values())
    
    # Calculate totals by field name
    field_totals = defaultdict(int)
    for counts in all_results.values():
        for field, count in counts.items():
            field_totals[field] += count
    
    # Prepare output with totals
    output_data = {
        "_summary": {
            "total_tests_with_empty_strings_or_divs": total_tests,
            "total_empty_string_or_div_occurrences": total_empty_strings,
            "totals_by_field": dict(sorted(field_totals.items()))
        },
        **all_results
    }
    
    # Write results to tests_data_debug.json
    output_file = script_dir / 'tests_data_debug.json'
    
    print("\n" + "=" * 60)
    print(f"Writing results to {output_file}...")
    print("=" * 60)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nSummary:")
    print(f"  Total tests with empty strings/divs: {total_tests}")
    print(f"  Total empty string/div occurrences: {total_empty_strings}")
    print(f"  Results saved to: {output_file}")
    
    if total_tests > 0:
        print(f"\nTests with empty strings/divs:")
        for test_name, counts in sorted(all_results.items()):
            total = sum(counts.values())
            print(f"  {test_name}: {total} empty strings/divs")
            for field, count in sorted(counts.items()):
                if count > 0:
                    print(f"    - {field}: {count}")

if __name__ == '__main__':
    main()


