"""
Verification script for TS and AP tests in Supabase database
Generates a detailed report of test data quality
"""

import json
import requests
from datetime import datetime
from supabase import create_client, Client

# Supabase credentials
SUPABASE_URL = "https://bnnpmfdnsngxhxydvecx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubnBtZmRuc25neGh4eWR2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg5Nzc1MCwiZXhwIjoyMDgxNDczNzUwfQ.wYXy4tK9-CXzXb8fb85tz6pK6M95w8jrROWyoNljTZY"


def get_supabase_client() -> Client:
    """Create and return Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def check_url_status(url: str) -> tuple[str, int]:
    """
    Check HTTP status of a URL
    Returns: (status_text, status_code)
    """
    if not url:
        return "NO_URL", 0
    
    try:
        response = requests.head(url, timeout=10, allow_redirects=True)
        status_code = response.status_code
        if status_code == 200:
            return "200", status_code
        elif status_code == 404:
            return "404", status_code
        else:
            return f"OTHER_{status_code}", status_code
    except requests.exceptions.RequestException as e:
        return f"ERROR_{str(e)[:30]}", 0


def is_field_empty_or_null(value) -> bool:
    """Check if a field is empty string or null"""
    return value is None or value == "" or (isinstance(value, str) and value.strip() == "")


def check_question_quality(question: dict) -> bool:
    """
    Check if question has any empty/null fields in:
    question_text, option_a, option_b, option_c, option_d, correct_option, answer
    Returns True if any field is empty/null
    """
    fields_to_check = [
        question.get("question_text"),
        question.get("option_a"),
        question.get("option_b"),
        question.get("option_c"),
        question.get("option_d"),
        question.get("correct_option"),
        question.get("answer")
    ]
    
    return any(is_field_empty_or_null(field) for field in fields_to_check)


def get_test_questions(supabase: Client, test_id: int) -> list:
    """
    Get all questions for a test by joining through sections
    """
    try:
        # Get all sections for this test
        sections_result = supabase.table("sections").select("section_id").eq("test_id", test_id).execute()
        
        if not sections_result.data:
            return []
        
        section_ids = [s["section_id"] for s in sections_result.data]
        
        # Get all questions for these sections
        all_questions = []
        for section_id in section_ids:
            questions_result = supabase.table("questions").select(
                "question_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, answer"
            ).eq("section_id", section_id).execute()
            
            if questions_result.data:
                all_questions.extend(questions_result.data)
        
        # Sort by question_number
        all_questions.sort(key=lambda x: x.get("question_number", 0))
        return all_questions
    
    except Exception as e:
        print(f"  [ERROR] Failed to get questions for test {test_id}: {str(e)}")
        return []


def verify_tests_by_state(supabase: Client, state: str) -> dict:
    """
    Verify all tests with a given state
    Returns detailed report dictionary
    """
    print(f"\n{'='*60}")
    print(f"Verifying tests with state: {state}")
    print(f"{'='*60}")
    
    # Get all tests with this state
    try:
        tests_result = supabase.table("tests").select(
            "test_id, test_name, sprite_css_url"
        ).eq("state", state).order("test_name").execute()
        
        if not tests_result.data:
            print(f"  No tests found with state: {state}")
            return {
                "state": state,
                "total_tests": 0,
                "tests": []
            }
        
        tests = tests_result.data
        print(f"  Found {len(tests)} tests")
        
        report = {
            "state": state,
            "total_tests": len(tests),
            "tests": []
        }
        
        for test in tests:
            test_id = test["test_id"]
            test_name = test["test_name"]
            sprite_css_url = test.get("sprite_css_url")
            
            print(f"\n  Processing: {test_name} (ID: {test_id})")
            
            # Get all questions for this test
            questions = get_test_questions(supabase, test_id)
            total_questions = len(questions)
            
            print(f"    Questions: {total_questions}")
            
            # Check sprite_css_url status
            print(f"    Checking sprite_css_url...")
            url_status, status_code = check_url_status(sprite_css_url)
            print(f"    Sprite CSS URL Status: {url_status}")
            
            # Count questions with empty/null fields
            questions_with_empty_fields = 0
            empty_field_details = []
            
            for q in questions:
                if check_question_quality(q):
                    questions_with_empty_fields += 1
                    q_num = q.get("question_number", "?")
                    empty_fields = []
                    
                    if is_field_empty_or_null(q.get("question_text")):
                        empty_fields.append("question_text")
                    if is_field_empty_or_null(q.get("option_a")):
                        empty_fields.append("option_a")
                    if is_field_empty_or_null(q.get("option_b")):
                        empty_fields.append("option_b")
                    if is_field_empty_or_null(q.get("option_c")):
                        empty_fields.append("option_c")
                    if is_field_empty_or_null(q.get("option_d")):
                        empty_fields.append("option_d")
                    if is_field_empty_or_null(q.get("correct_option")):
                        empty_fields.append("correct_option")
                    if is_field_empty_or_null(q.get("answer")):
                        empty_fields.append("answer")
                    
                    empty_field_details.append({
                        "question_number": q_num,
                        "empty_fields": empty_fields
                    })
            
            print(f"    Questions with empty/null fields: {questions_with_empty_fields}")
            
            test_report = {
                "test_id": test_id,
                "test_name": test_name,
                "sprite_css_url": sprite_css_url,
                "sprite_css_url_status": url_status,
                "sprite_css_url_status_code": status_code,
                "total_questions": total_questions,
                "questions_with_empty_fields": questions_with_empty_fields,
                "empty_field_details": empty_field_details
            }
            
            report["tests"].append(test_report)
        
        return report
    
    except Exception as e:
        print(f"  [ERROR] Failed to verify tests: {str(e)}")
        return {
            "state": state,
            "total_tests": 0,
            "tests": [],
            "error": str(e)
        }


def generate_report(ts_report: dict, ap_report: dict, output_file: str):
    """
    Generate a detailed text report from verification results
    """
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("="*80 + "\n")
        f.write("TEST VERIFICATION REPORT\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("="*80 + "\n\n")
        
        # TS Report
        f.write("="*80 + "\n")
        f.write("TS STATE TESTS\n")
        f.write("="*80 + "\n\n")
        
        f.write(f"Total Tests: {ts_report['total_tests']}\n\n")
        
        if ts_report['total_tests'] == 0:
            f.write("No tests found with state TS.\n\n")
        else:
            for i, test in enumerate(ts_report['tests'], 1):
                f.write(f"{'─'*80}\n")
                f.write(f"Test {i}: {test['test_name']}\n")
                f.write(f"{'─'*80}\n")
                f.write(f"Test ID: {test['test_id']}\n")
                f.write(f"Sprite CSS URL: {test['sprite_css_url'] or 'N/A'}\n")
                f.write(f"Sprite CSS URL Status: {test['sprite_css_url_status']} (Code: {test['sprite_css_url_status_code']})\n")
                f.write(f"Total Questions: {test['total_questions']}\n")
                f.write(f"Questions with Empty/Null Fields: {test['questions_with_empty_fields']}\n")
                
                if test['questions_with_empty_fields'] > 0:
                    f.write(f"\nQuestions with Empty/Null Fields Details:\n")
                    for detail in test['empty_field_details']:
                        f.write(f"  Question {detail['question_number']}: Missing fields - {', '.join(detail['empty_fields'])}\n")
                
                f.write("\n")
        
        # AP Report
        f.write("\n" + "="*80 + "\n")
        f.write("AP STATE TESTS\n")
        f.write("="*80 + "\n\n")
        
        f.write(f"Total Tests: {ap_report['total_tests']}\n\n")
        
        if ap_report['total_tests'] == 0:
            f.write("No tests found with state AP.\n\n")
        else:
            for i, test in enumerate(ap_report['tests'], 1):
                f.write(f"{'─'*80}\n")
                f.write(f"Test {i}: {test['test_name']}\n")
                f.write(f"{'─'*80}\n")
                f.write(f"Test ID: {test['test_id']}\n")
                f.write(f"Sprite CSS URL: {test['sprite_css_url'] or 'N/A'}\n")
                f.write(f"Sprite CSS URL Status: {test['sprite_css_url_status']} (Code: {test['sprite_css_url_status_code']})\n")
                f.write(f"Total Questions: {test['total_questions']}\n")
                f.write(f"Questions with Empty/Null Fields: {test['questions_with_empty_fields']}\n")
                
                if test['questions_with_empty_fields'] > 0:
                    f.write(f"\nQuestions with Empty/Null Fields Details:\n")
                    for detail in test['empty_field_details']:
                        f.write(f"  Question {detail['question_number']}: Missing fields - {', '.join(detail['empty_fields'])}\n")
                
                f.write("\n")
        
        # Summary
        f.write("\n" + "="*80 + "\n")
        f.write("SUMMARY\n")
        f.write("="*80 + "\n\n")
        
        f.write(f"TS Tests: {ts_report['total_tests']}\n")
        ts_total_questions = sum(t['total_questions'] for t in ts_report['tests'])
        ts_empty_questions = sum(t['questions_with_empty_fields'] for t in ts_report['tests'])
        f.write(f"TS Total Questions: {ts_total_questions}\n")
        f.write(f"TS Questions with Empty/Null Fields: {ts_empty_questions}\n")
        
        ts_200_urls = sum(1 for t in ts_report['tests'] if t['sprite_css_url_status'] == "200")
        ts_404_urls = sum(1 for t in ts_report['tests'] if t['sprite_css_url_status'] == "404")
        f.write(f"TS Sprite CSS URLs (200): {ts_200_urls}\n")
        f.write(f"TS Sprite CSS URLs (404): {ts_404_urls}\n")
        
        f.write("\n")
        
        f.write(f"AP Tests: {ap_report['total_tests']}\n")
        ap_total_questions = sum(t['total_questions'] for t in ap_report['tests'])
        ap_empty_questions = sum(t['questions_with_empty_fields'] for t in ap_report['tests'])
        f.write(f"AP Total Questions: {ap_total_questions}\n")
        f.write(f"AP Questions with Empty/Null Fields: {ap_empty_questions}\n")
        
        ap_200_urls = sum(1 for t in ap_report['tests'] if t['sprite_css_url_status'] == "200")
        ap_404_urls = sum(1 for t in ap_report['tests'] if t['sprite_css_url_status'] == "404")
        f.write(f"AP Sprite CSS URLs (200): {ap_200_urls}\n")
        f.write(f"AP Sprite CSS URLs (404): {ap_404_urls}\n")
        
        f.write("\n" + "="*80 + "\n")
        f.write("END OF REPORT\n")
        f.write("="*80 + "\n")


def main():
    """Main function"""
    print("="*60)
    print("Test Verification Script")
    print("="*60)
    
    # Connect to Supabase
    print("\nConnecting to Supabase...")
    supabase = get_supabase_client()
    print("Connected!")
    
    # Verify TS tests
    ts_report = verify_tests_by_state(supabase, "TS")
    
    # Verify AP tests
    ap_report = verify_tests_by_state(supabase, "AP")
    
    # Generate report
    output_file = f"verification_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    print(f"\n{'='*60}")
    print(f"Generating report: {output_file}")
    print(f"{'='*60}")
    
    generate_report(ts_report, ap_report, output_file)
    
    print(f"\nReport generated successfully: {output_file}")
    print("="*60)


if __name__ == "__main__":
    main()

