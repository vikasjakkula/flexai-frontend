"""
Verify progress.json for ap_medical_scraped_data and ts_medical_scraped_data.
Checks:
1. completed_tests: All JSON files with 160 questions should be listed
2. uploaded_sprite_sheets: All tests with both .css and .png in sprites folder should be listed
"""

import json
import os
from pathlib import Path

BASE = Path(__file__).parent


def slug_to_sprite_name(slug: str) -> str:
    """Convert progress.json slug (ap-eamcet-medical-2015-paper) to sprite filename base (ap_eamcet_medical_2015_paper)"""
    return slug.replace("-", "_")


def sprite_name_to_slug(sprite_base: str) -> str:
    """Convert sprite filename base to progress.json slug"""
    return sprite_base.replace("_", "-")


def get_json_tests_with_160_questions(folder: Path) -> tuple[list[str], list[dict]]:
    """
    Get all test slugs from JSON files that have 160 questions.
    Returns: (valid_slugs, issues_list)
    """
    valid = []
    issues = []
    
    for f in folder.glob("*.json"):
        if f.name == "progress.json":
            continue
        slug = f.stem
        try:
            with open(f, encoding="utf-8") as fp:
                data = json.load(fp)
            total = data.get("total_questions") or len(data.get("questions", []))
            if total == 160:
                valid.append(slug)
            else:
                issues.append({"slug": slug, "total_questions": total, "issue": "not_160"})
        except Exception as e:
            issues.append({"slug": slug, "issue": f"error: {e}"})
    
    return valid, issues


def get_sprites_with_both_css_and_png(folder: Path) -> tuple[list[str], list[dict]]:
    """
    Get all test slugs that have BOTH .css and .png in sprites subfolder.
    Sprite filenames use underscores (ap_eamcet_medical_2015_paper.css).
    Returns: (valid_slugs, issues_list)
    """
    sprites_dir = folder / "sprites"
    valid = []
    issues = []
    
    if not sprites_dir.exists():
        return [], [{"issue": "sprites_folder_missing", "path": str(sprites_dir)}]
    
    css_bases = {f.stem for f in sprites_dir.glob("*.css")}
    png_bases = {f.stem for f in sprites_dir.glob("*.png")}
    
    both = css_bases & png_bases
    for base in both:
        valid.append(sprite_name_to_slug(base))
    
    # CSS without PNG
    css_only = css_bases - png_bases
    for base in css_only:
        issues.append({"slug": sprite_name_to_slug(base), "issue": "has_css_missing_png"})
    
    # PNG without CSS
    png_only = png_bases - css_bases
    for base in png_only:
        issues.append({"slug": sprite_name_to_slug(base), "issue": "has_png_missing_css"})
    
    return valid, issues


def verify_folder(folder_name: str) -> dict:
    folder = BASE / folder_name
    progress_path = folder / "progress.json"
    
    result = {
        "folder": folder_name,
        "completed_tests": {"correct": [], "missing": [], "extra": [], "issues": []},
        "uploaded_sprite_sheets": {"correct": [], "missing": [], "extra": [], "issues": []},
        "summary": {}
    }
    
    if not progress_path.exists():
        result["error"] = "progress.json not found"
        return result
    
    with open(progress_path, encoding="utf-8") as f:
        progress = json.load(f)
    
    completed_in_progress = set(progress.get("completed_tests", []))
    uploaded_in_progress = set(progress.get("uploaded_sprite_sheets", []))
    
    # Check completed_tests
    valid_160, json_issues = get_json_tests_with_160_questions(folder)
    valid_160_set = set(valid_160)
    result["completed_tests"]["issues"] = json_issues
    
    missing_from_completed = valid_160_set - completed_in_progress
    extra_in_completed = completed_in_progress - valid_160_set
    
    result["completed_tests"]["missing"] = sorted(missing_from_completed)
    result["completed_tests"]["extra"] = sorted(extra_in_completed)
    result["completed_tests"]["correct"] = sorted(valid_160_set & completed_in_progress)
    
    # Check uploaded_sprite_sheets
    valid_sprites, sprite_issues = get_sprites_with_both_css_and_png(folder)
    valid_sprites_set = set(valid_sprites)
    result["uploaded_sprite_sheets"]["issues"] = sprite_issues
    
    missing_from_uploaded = valid_sprites_set - uploaded_in_progress
    extra_in_uploaded = uploaded_in_progress - valid_sprites_set
    
    result["uploaded_sprite_sheets"]["missing"] = sorted(missing_from_uploaded)
    result["uploaded_sprite_sheets"]["extra"] = sorted(extra_in_uploaded)
    result["uploaded_sprite_sheets"]["correct"] = sorted(valid_sprites_set & uploaded_in_progress)
    
    result["summary"] = {
        "total_160_question_jsons": len(valid_160_set),
        "completed_tests_in_progress": len(completed_in_progress),
        "total_valid_sprites": len(valid_sprites_set),
        "uploaded_sprite_sheets_in_progress": len(uploaded_in_progress),
    }
    
    return result


def print_report(ap_result: dict, ts_result: dict):
    def section(title: str):
        print("\n" + "=" * 70)
        print(title)
        print("=" * 70)
    
    section("AP MEDICAL SCRAPED DATA - VERIFICATION REPORT")
    
    print("\n--- completed_tests (160-question JSONs) ---")
    print(f"  Total JSONs with 160 questions: {ap_result['summary']['total_160_question_jsons']}")
    print(f"  In progress.json: {ap_result['summary']['completed_tests_in_progress']}")
    if ap_result["completed_tests"]["missing"]:
        print(f"  MISSING from completed_tests (should add): {ap_result['completed_tests']['missing']}")
    if ap_result["completed_tests"]["extra"]:
        print(f"  EXTRA in completed_tests (not 160 q / no JSON): {ap_result['completed_tests']['extra']}")
    if ap_result["completed_tests"]["issues"]:
        print("  JSON issues (not 160 questions):")
        for i in ap_result["completed_tests"]["issues"]:
            print(f"    - {i['slug']}: {i.get('total_questions', i.get('issue', ''))}")
    
    print("\n--- uploaded_sprite_sheets (.css + .png in sprites/) ---")
    print(f"  Total with both .css and .png: {ap_result['summary']['total_valid_sprites']}")
    print(f"  In progress.json: {ap_result['summary']['uploaded_sprite_sheets_in_progress']}")
    if ap_result["uploaded_sprite_sheets"]["missing"]:
        print(f"  MISSING from uploaded_sprite_sheets (should add): {ap_result['uploaded_sprite_sheets']['missing']}")
    if ap_result["uploaded_sprite_sheets"]["extra"]:
        print(f"  EXTRA in uploaded_sprite_sheets (no .css/.png): {ap_result['uploaded_sprite_sheets']['extra']}")
    if ap_result["uploaded_sprite_sheets"]["issues"]:
        print("  Sprite issues:")
        for i in ap_result["uploaded_sprite_sheets"]["issues"]:
            print(f"    - {i}")
    
    section("TS MEDICAL SCRAPED DATA - VERIFICATION REPORT")
    
    print("\n--- completed_tests (160-question JSONs) ---")
    print(f"  Total JSONs with 160 questions: {ts_result['summary']['total_160_question_jsons']}")
    print(f"  In progress.json: {ts_result['summary']['completed_tests_in_progress']}")
    if ts_result["completed_tests"]["missing"]:
        print(f"  MISSING from completed_tests (should add): {ts_result['completed_tests']['missing']}")
    if ts_result["completed_tests"]["extra"]:
        print(f"  EXTRA in completed_tests (not 160 q / no JSON): {ts_result['completed_tests']['extra']}")
    if ts_result["completed_tests"]["issues"]:
        print("  JSON issues (not 160 questions):")
        for i in ts_result["completed_tests"]["issues"]:
            print(f"    - {i['slug']}: {i.get('total_questions', i.get('issue', ''))}")
    
    print("\n--- uploaded_sprite_sheets (.css + .png in sprites/) ---")
    print(f"  Total with both .css and .png: {ts_result['summary']['total_valid_sprites']}")
    print(f"  In progress.json: {ts_result['summary']['uploaded_sprite_sheets_in_progress']}")
    if ts_result["uploaded_sprite_sheets"]["missing"]:
        print(f"  MISSING from uploaded_sprite_sheets (should add): {ts_result['uploaded_sprite_sheets']['missing']}")
    if ts_result["uploaded_sprite_sheets"]["extra"]:
        print(f"  EXTRA in uploaded_sprite_sheets (no .css/.png): {ts_result['uploaded_sprite_sheets']['extra']}")
    if ts_result["uploaded_sprite_sheets"]["issues"]:
        print("  Sprite issues:")
        for i in ts_result["uploaded_sprite_sheets"]["issues"]:
            print(f"    - {i}")
    
    section("SUMMARY - PATTERNS & ACTIONS")
    
    print("\nAP:")
    print(f"  - Add to completed_tests: {len(ap_result['completed_tests']['missing'])} tests")
    print(f"  - Remove from completed_tests: {len(ap_result['completed_tests']['extra'])} tests")
    print(f"  - Add to uploaded_sprite_sheets: {len(ap_result['uploaded_sprite_sheets']['missing'])} tests")
    print(f"  - Remove from uploaded_sprite_sheets: {len(ap_result['uploaded_sprite_sheets']['extra'])} tests")
    
    print("\nTS:")
    print(f"  - Add to completed_tests: {len(ts_result['completed_tests']['missing'])} tests")
    print(f"  - Remove from completed_tests: {len(ts_result['completed_tests']['extra'])} tests")
    print(f"  - Add to uploaded_sprite_sheets: {len(ts_result['uploaded_sprite_sheets']['missing'])} tests")
    print(f"  - Remove from uploaded_sprite_sheets: {len(ts_result['uploaded_sprite_sheets']['extra'])} tests")
    
    if not (Path(BASE) / "ts_medical_scraped_data" / "sprites").exists():
        print("\n  NOTE: TS has NO sprites folder - all uploaded_sprite_sheets in progress may be from prior uploads.")


def main():
    ap_result = verify_folder("ap_medical_scraped_data")
    ts_result = verify_folder("ts_medical_scraped_data")
    print_report(ap_result, ts_result)


if __name__ == "__main__":
    main()
