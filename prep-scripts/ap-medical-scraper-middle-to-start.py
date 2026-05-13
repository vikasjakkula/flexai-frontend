"""
AP EAMCET Medical Question Scraper - MIDDLE TO START (second quarter)
Run: python ap-medical-scraper-middle-to-start.py
"""
import os
import runpy

os.environ["AP_MEDICAL_SCRAPER_SLICE"] = "middle_to_start"
script_dir = os.path.dirname(os.path.abspath(__file__))
runpy.run_path(os.path.join(script_dir, "ap-medical-scraper.py"), run_name="__main__")
