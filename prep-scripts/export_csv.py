"""
Export scraped JSON data to CSV format
"""

import json
import csv
import os
from html import unescape
import re

OUTPUT_DIR = "scraped_data"
ALL_DATA_FILE = os.path.join(OUTPUT_DIR, "all_questions.json")
CSV_FILE = os.path.join(OUTPUT_DIR, "all_questions.csv")


def strip_html_tags(html):
    """Remove HTML tags but keep text content"""
    if not html:
        return ""
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', ' ', html)
    # Unescape HTML entities
    clean = unescape(clean)
    # Normalize whitespace
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


def export_to_csv():
    """Export all questions to CSV"""
    if not os.path.exists(ALL_DATA_FILE):
        print(f"Error: {ALL_DATA_FILE} not found. Run scraper.py first.")
        return
    
    with open(ALL_DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    rows = []
    for test in data['tests']:
        test_name = test['title']
        test_slug = test['slug']
        
        for q in test['questions']:
            rows.append({
                'test_name': test_name,
                'test_slug': test_slug,
                'question_number': q['question_number'],
                'question_html': q['question_html'],
                'question_text': strip_html_tags(q['question_html']),
                'option_a_html': q['option_a'],
                'option_a_text': strip_html_tags(q['option_a']),
                'option_b_html': q['option_b'],
                'option_b_text': strip_html_tags(q['option_b']),
                'option_c_html': q['option_c'],
                'option_c_text': strip_html_tags(q['option_c']),
                'option_d_html': q['option_d'],
                'option_d_text': strip_html_tags(q['option_d']),
                'correct_option': q['correct_option'],
                'solution_html': q['solution_html'],
                'solution_text': strip_html_tags(q['solution_html'])
            })
    
    # Write CSV
    if rows:
        fieldnames = rows[0].keys()
        with open(CSV_FILE, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        
        print(f"Exported {len(rows)} questions to {CSV_FILE}")
    else:
        print("No data to export")


if __name__ == "__main__":
    export_to_csv()















