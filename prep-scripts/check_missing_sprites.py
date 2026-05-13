"""Check for tests in completed_tests but not in uploaded_sprite_sheets"""

import json

PROGRESS_FILE = "ap_scraped_data/progress.json"

# Load progress
with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

completed = set(data['completed_tests'])
uploaded = set(data['uploaded_sprite_sheets'])
missing = sorted(completed - uploaded)

print("=" * 60)
print("Sprite Sheet Upload Status Check")
print("=" * 60)
print()
print(f"Total completed tests: {len(completed)}")
print(f"Total uploaded sprite sheets: {len(uploaded)}")
print(f"Missing sprite sheets: {len(missing)}")
print()

if missing:
    print("MISSING sprite sheets:")
    for i, test in enumerate(missing, 1):
        print(f"  {i}. {test}")
else:
    print("SUCCESS: All completed tests have uploaded sprite sheets!")

print()
print("=" * 60)

