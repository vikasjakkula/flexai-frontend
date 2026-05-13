"""
AP EAMCET Medical Question Scraper - REVERSE ORDER (last quarter)
Run: python ap-medical-scraper-reverse.py
"""
import os
import runpy

os.environ["AP_MEDICAL_SCRAPER_SLICE"] = "reverse"
script_dir = os.path.dirname(os.path.abspath(__file__))
runpy.run_path(os.path.join(script_dir, "ap-medical-scraper.py"), run_name="__main__")
