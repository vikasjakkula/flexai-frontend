"""Generate TS Medical sprites report from scraped data."""
import json
import os

OUTPUT_DIR = "ts_medical_scraped_data"
REPORT_PATH = "ts-medical-sprites-report.md"

# All TS Medical tests from the page (for complete report)
ALL_TS_MEDICAL_TESTS = [
    "tg-eamcet-29-apr-2025-shift-1-paper",
    "tg-eamcet-29-apr-2025-shift-2-paper",
    "tg-eamcet-30-apr-2025-shift-1-paper",
    "ts-eamcet-medical-7-may-2024-shift-1-paper",
    "ts-eamcet-medical-7-may-2024-shift-2-paper",
    "ts-eamcet-medical-8-may-2024-shift-1-paper",
    "ts-eamcet-medical-10-may-2023-shift-1-paper",
    "ts-eamcet-medical-10-may-2023-shift-2-paper",
    "ts-eamcet-medical-11-may-2023-shift-1-paper",
    "ts-eamcet-medical-11-may-2023-shift-2-paper",
    "ts-eamcet-medical-30-jul-2022-shift-1-paper",
    "ts-eamcet-medical-30-jul-2022-shift-2-paper",
    "ts-eamcet-medical-31-jul-2022-shift-1-paper",
    "ts-eamcet-medical-31-jul-2022-shift-2-paper",
    "ts-eamcet-medical-09-aug-2021-shift-1-paper",
    "ts-eamcet-medical-09-aug-2021-shift-2-paper",
    "ts-eamcet-medical-10-aug-2021-shift-1-paper",
    "ts-eamcet-medical-28-sept-2020-shift-1-paper",
    "ts-eamcet-medical-28-sept-2020-shift-2-paper",
    "ts-eamcet-medical-29-sept-2020-shift-1-paper",
    "ts-eamcet-medical-29-sept-2020-shift-2-paper",
    "ts-eamcet-medical-8-may-2019-shift-1-paper",
    "ts-eamcet-medical-8-may-2019-shift-2-paper",
    "ts-eamcet-medical-9-may-2019-shift-1-paper",
    "ts-eamcet-medical-2018-may-2-shift-1-paper",
    "ts-eamcet-medical-2018-may-2-shift-2-paper",
    "ts-eamcet-medical-2018-may-3-shift-1paper",
    "ts-eamcet-medical-2015-paper",
    "ts-eamcet-medical-2016-paper",
    "ts-eamcet-medical-2017-paper",
]

def load_test(slug):
    path = os.path.join(OUTPUT_DIR, f"{slug}.json")
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def main():
    css_failed = []
    sprite_failed = []
    ok_list = []
    not_processed = []

    for slug in ALL_TS_MEDICAL_TESTS:
        data = load_test(slug)
        if not data:
            not_processed.append(slug)
            continue
        s = data.get('sprite_status', 'unknown')
        if s == 'css_not_found':
            css_failed.append({"slug": slug, "title": data.get('title', slug), "msg": data.get('sprite_message', '')})
        elif s == 'sprite_not_found':
            sprite_failed.append({"slug": slug, "title": data.get('title', slug), "msg": data.get('sprite_message', '')})
        elif s == 'ok':
            ok_list.append(slug)

    lines = [
        "# TS EAMCET Medical - Tests Without Sprites Report",
        "",
        "## Summary",
        "",
        f"- **Total tests on page:** {len(ALL_TS_MEDICAL_TESTS)}",
        f"- **Tests processed:** {len(ALL_TS_MEDICAL_TESTS) - len(not_processed)}",
        f"- **Tests with CSS NOT FOUND:** {len(css_failed)}",
        f"- **Tests with SPRITES (PNG) NOT FOUND:** {len(sprite_failed)}",
        f"- **Tests with sprites OK:** {len(ok_list)}",
        f"- **Not yet processed:** {len(not_processed)}",
        "",
        "---",
        "",
        "## Tests Without Sprites (CSS NOT FOUND)",
        "",
    ]
    if css_failed:
        for i, x in enumerate(css_failed, 1):
            lines.append(f"{i}. **{x['slug']}**")
            lines.append(f"   - Title: {x['title']}")
            lines.append(f"   - Reason: {x['msg']}")
            lines.append("")
    else:
        lines.append("None")
        lines.append("")

    lines.extend(["## Tests Without Sprites (PNG NOT FOUND)", ""])
    if sprite_failed:
        for i, x in enumerate(sprite_failed, 1):
            lines.append(f"{i}. **{x['slug']}**")
            lines.append(f"   - Title: {x['title']}")
            lines.append(f"   - Reason: {x['msg']}")
            lines.append("")
    else:
        lines.append("None")
        lines.append("")

    lines.extend(["## Tests With Sprites OK", ""])
    for s in ok_list:
        lines.append(f"- `{s}`")
    lines.append("")

    lines.extend(["## Pattern Analysis", ""])
    failed = [x['slug'] for x in css_failed + sprite_failed]
    if failed:
        lines.append("### Failed test slugs:")
        for s in failed:
            lines.append(f"- `{s}`")
        lines.append("")
        lines.append("### Likely CDN patterns to investigate:")
        lines.append("- **TG 2025 (Apr):** tg-eamcet-29-apr-2025 - CDN may use tg_ or ts_ prefix, 2025 may not be on CDN yet")
        lines.append("- **TS Medical:** Uses same CDN as TS Engineering (img/engg/eamcet/ts/prev) with ts_{day}_{month}_{year}_s{shift}")
    else:
        lines.append("All processed tests have sprites found successfully.")
    if not_processed:
        lines.append("")
        lines.append("### Not yet processed:")
        for s in not_processed:
            lines.append(f"- `{s}`")

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Report written to {REPORT_PATH}")

if __name__ == "__main__":
    main()
