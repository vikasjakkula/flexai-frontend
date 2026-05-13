"""
TS EAMCET Medical Question Scraper - REVERSE ORDER (second half)
Run: python ts-medical-scraper-reverse.py
"""
import os
import runpy

os.environ["TS_MEDICAL_SCRAPER_SLICE"] = "reverse"
script_dir = os.path.dirname(os.path.abspath(__file__))
runpy.run_path(os.path.join(script_dir, "ts-medical-scraper.py"), run_name="__main__")
