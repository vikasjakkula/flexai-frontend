Tests without sprites (19 total)
All have sprite_status: "css_not_found":
#	Test Slug
1	ap-eamcet-medical-2015-paper
2	ap-eamcet-medical-2016-paper
3	ap-eamcet-medical-2017-shift-1-paper
4	ap-eamcet-medical-2017-shift-2-paper
5	ap-eamcet-medical-2018-shift-1-paper
6	ap-eamcet-medical-2018-shift-2-paper
7	ap-eamcet-medical-23-apr-2019-shift-2-paper
8	ap-eamcet-medical-24-apr-2019-shift-1-paper
9	ap-eamcet-medical-24-apr-2019-shift-2-paper
10	ap-eamcet-medical-23-sep-2020-shift-2-paper
11	ap-eamcet-medical-24-sep-2020-shift-1-paper
12	ap-eamcet-medical-24-sep-2020-shift-2-paper
13	ap-eamcet-medical-25-sep-2020-shift-1-paper
14	ap-eamcet-medical-25-sep-2020-shift-2-paper
15	ap-eapcet-11-july-2022-shift-1-paper
16	ap-eapcet-11-july-2022-shift-2-paper
17	ap-eapcet-12-july-2022-shift-1-paper
18	ap-eapcet-12-july-2022-shift-2-paper
19	ap-eamcet-medical-17-may-2024-shift-4-paper
Patterns in missing sprites
1. Year-only (no day/month) – 2015, 2016, 2017, 2018
ap-eamcet-medical-2015-paper
ap-eamcet-medical-2016-paper
ap-eamcet-medical-2017-shift-1-paper, ap-eamcet-medical-2017-shift-2-paper
ap-eamcet-medical-2018-shift-1-paper, ap-eamcet-medical-2018-shift-2-paper
Pattern: ap_ep_{year}_s{shift} or ap_ep_{year} – likely different naming on CDN (e.g. ap_ep_2017_s1, ap_ep_2018_s1).
2. April 2019
ap-eamcet-medical-23-apr-2019-shift-2-paper
ap-eamcet-medical-24-apr-2019-shift-1-paper
ap-eamcet-medical-24-apr-2019-shift-2-paper
Pattern: ap_ep_{day}_apr_{year}_s{shift} – CDN may use april instead of apr, or a different convention.
3. September 2020
ap-eamcet-medical-23-sep-2020-shift-2-paper
ap-eamcet-medical-24-sep-2020-shift-1-paper
ap-eamcet-medical-24-sep-2020-shift-2-paper
ap-eamcet-medical-25-sep-2020-shift-1-paper
ap-eamcet-medical-25-sep-2020-shift-2-paper
Pattern: ap_ep_{day}_sep_{year}_s{shift} – CDN may use sept or september instead of sep.
4. July 2022
ap-eapcet-11-july-2022-shift-1-paper
ap-eapcet-11-july-2022-shift-2-paper
ap-eapcet-12-july-2022-shift-1-paper
ap-eapcet-12-july-2022-shift-2-paper
Pattern: ap_ep_{day}_july_{year}_s{shift} – CDN may use jul instead of july.
5. May 2024 – Shift 4
ap-eamcet-medical-17-may-2024-shift-4-paper
Pattern: Shift 4 – CDN may not have s4 variants; only s1 and s2 might exist.
Tests with sprites (15 total)
2025 May: 4 tests (19, 20 May, shifts 1 & 2)
2024 May: 2 tests (17 May, shifts 1 & 2)
2023 May: 4 tests (22, 23 May, shifts 1 & 2)
2021 Sep: 5 tests (3, 6, 7 Sep, shifts 1 & 2)
Summary
Pattern type	Count	Likely CDN issue
Year-only (2015–2018)	6	Different naming for year-only tests
April 2019	3	apr vs april or other naming
September 2020	5	sep vs sept/september
July 2022	4	july vs jul
May 2024 Shift 4	1	No s4 variant on CDN
