'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Inter } from 'next/font/google'
import { CheckIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/solid'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { PlanTier, getProPlan, getBasicPlan, getDisplayPriceRupees } from '@/utils/pricing'
import { QuestionContent } from '@/components/QuestionContent'
import { SpinWheel } from '@/components/SpinWheel'
import { trackInitiateCheckout, trackViewPaywall, trackLandingView, trackSelectPlan } from '@/lib/facebook-pixel'
// Static test list (same as main landing) — no fetch, tests defined in codebase
import testsDataTs from '../../public/tests-data.json'
import testsDataAp from '../../public/tests-data-ap.json'

const inter = Inter({ subsets: ['latin'] })

// Grouped keys for TS (exclude mock), sorted newest first
const TS_GROUPED_YEARS = Object.keys((testsDataTs as { grouped?: Record<string, unknown> }).grouped || {})
  .filter((y) => y !== 'mock')
  .sort((a, b) => (parseInt(b) || 0) - (parseInt(a) || 0))
const AP_GROUPED_YEARS = Object.keys((testsDataAp as { grouped?: Record<string, unknown> }).grouped || {})
  .sort((a, b) => (parseInt(b) || 0) - (parseInt(a) || 0))

declare global {
  interface Window {
    Razorpay: any
  }
}

// Testimonials data
const TESTIMONIALS = [
  { name: 'Venkat Ramana', text: 'Got 1560 rank in EAPCET. Previous papers were exactly like the real exam!', college: 'JNTU Hyderabad' },
  { name: 'Srinivas Rao', text: 'Practiced all papers from 2015. The pattern analysis helped me score 98/160.', college: 'OU Engineering' },
  { name: 'Lakshmi Prasanna', text: 'Rank predictor was surprisingly accurate. Predicted 2000, got 1890!', college: 'CBIT' },
  { name: 'Ravi Kumar', text: 'Best ₹299 I spent. Unlimited attempts helped me improve from 60 to 105 marks.', college: 'VNR VJIET' },
  { name: 'Priya Reddy', text: 'Analytics showed my weak areas in chemistry. Focused on them and jumped 3000 ranks.', college: 'Vasavi Engineering' },
  { name: 'Suresh Babu', text: 'Completed 50+ papers in 2 months. Nothing beats practicing real questions.', college: 'MVSR Engineering' },
  { name: 'Kavitha Sharma', text: 'The interface is exactly like real EAPCET. No surprises on exam day!', college: 'GRIET' },
  { name: 'Anil Reddy', text: 'Worth every rupee. My brother is using it this year too.', college: 'CBIT' },
]

// Demo result ID — View Solution works for anyone (unauthenticated) for this result only
const LANDING_DEMO_RESULT_ID = '7719b2bc-33a4-4c12-a65d-cfdd5313629f'

// Static report card data for "See what you'll get" (test_id 94, same as API demo result)
const LANDING_DEMO_RESULT = {
  id: LANDING_DEMO_RESULT_ID,
  attempt_id: 'ed501681-561e-40d3-9f37-90042f2a4a78',
  test_id: 94,
  test: { test_id: 94, test_name: 'TS EAPCET 2024' },
  total_marks: 120,
  correct_answers: 120,
  wrong_answers: 34,
  unattempted: 6,
  time_taken: 10800,
  section_wise_marks: { maths: 58, physics: 34, chemistry: 28 },
  section_wise_analysis: {
    maths: { correct: 58, wrong: 18, unattempted: 4, marks: 58, time_seconds: 5332, time_correct: 3858, time_wrong: 1206, time_unattempted: 268 },
    physics: { correct: 34, wrong: 5, unattempted: 1, marks: 34, time_seconds: 2756, time_correct: 2346, time_wrong: 338, time_unattempted: 72 },
    chemistry: { correct: 28, wrong: 11, unattempted: 1, marks: 28, time_seconds: 2712, time_correct: 1881, time_wrong: 759, time_unattempted: 72 },
  },
  estimated_rank: { estimatedRank: 150, rankRange: '120-180' },
} as const

// Feature comparison for cards (BASIC commented out — landing-b shows PRO only at ₹299)
const FEATURES_COMPARISON = [
  { name: 'All previous year papers', basic: true, pro: true },
  { name: 'Performance analytics', basic: true, pro: true },
  { name: 'Test attempts per paper', basic: '1 attempt', pro: 'Unlimited' },
  { name: 'Rank predictor', basic: false, pro: true },
]

/** Landing-b only: PRO plan display price (₹299 instead of ₹399) */
const LANDING_B_PRO_PRICE = 299

/** Original price shown as strikethrough when spin wheel discount is applied */
const LANDING_B_PRO_ORIGINAL_PRICE = 499

/** Display price for landing-b: PRO at ₹299 (or ₹249 with spin); BASIC disabled. */
function getLandingBDisplayPrice(_tier: PlanTier, _hasCoupon: boolean, spinWheelApplied: boolean): number {
  if (spinWheelApplied) return 249
  return LANDING_B_PRO_PRICE
}

// Sample questions for preview
const SAMPLE_QUESTIONS = [
  {
    question_number: 2,
    question_text: 'The range of the real value function <fmath alttext="f(x)= sin \\;^{-1} ({√{x^2+x+1}}) " class="fm-inline"><mrow><mrow><mi class="fm-mi-length-1" mathvariant="italic" style="padding-right: 0.44ex;">f</mi><mrow><mo class="fm-mo-Luc">(</mo><mi class="fm-mi-length-1" mathvariant="italic">x</mi><mo class="fm-mo-Luc">)</mo></mrow></mrow><mo class="fm-infix-loose">=</mo><mrow><mrow><mrow><mi class="fm-mi-length-1" mathvariant="italic">s</mi><mi class="fm-mi-length-1" mathvariant="italic">i</mi></mrow><mi class="fm-mi-length-1" mathvariant="italic">n</mi></mrow><msup><mspace width=".28em" style="margin-right: 0.28em; padding-right: 0.001em; visibility: hidden;"> </mspace><span class="fm-script fm-inline" style="vertical-align: 0.7em;"><mrow><mo class="fm-prefix-tight">−</mo><mn>1</mn></mrow></span></msup><mrow><mo class="fm-mo-Luc" style="font-size: 1.366em; vertical-align: 0.094em; display: inline-block; transform: scaleX(0.5);">(</mo><mrow mtagname="msqrt"><mo class="fm-radic" style="font-size: 1.366em; vertical-align: -0.069em; display: inline-block; transform: scaleX(0.5);">√</mo><span style="vertical-align: 0.22em;"><span class="fm-vert fm-radicand" style="border-top-width: 0.087em;"><mrow><mrow><msup><mi class="fm-mi-length-1" mathvariant="italic">x</mi><span class="fm-script fm-inline" style="vertical-align: 0.7em;"><mn>2</mn></span></msup><mo class="fm-infix">+</mo><mi class="fm-mi-length-1" mathvariant="italic">x</mi></mrow><mo class="fm-infix">+</mo><mn>1</mn></mrow></span></span></mrow><mo class="fm-mo-Luc" style="font-size: 1.366em; vertical-align: 0.094em; display: inline-block; transform: scaleX(0.5);">)</mo></mrow></mrow></mrow></fmath> is<br>',
    option_a: '<fmath alttext=" [-\\;{π}/{2}, \\;{π}/{2}] " class="fm-inline"><mrow><mo class="fm-mo-Luc" style="font-size: 2.05em; vertical-align: -0.128em; display: inline-block; transform: scaleX(0.5);">[</mo><mrow><mrow><mo class="fm-prefix-tight">−</mo><mrow><mspace width=".28em" style="margin-right: 0.28em; padding-right: 0.001em; visibility: hidden;"> </mspace><span mtagname="mfrac" style="vertical-align: 0em;"><span class="fm-vert fm-frac"><table><tbody><tr><td class="fm-num-frac fm-inline"><mi class="fm-mi-length-1" mathvariant="italic">π</mi></td></tr><tr><td class="fm-den-frac fm-inline"><mn>2</mn></td></tr></tbody></table></span></span></mrow></mrow><mo class="fm-separator">,</mo><mrow><mspace width=".28em" style="margin-right: 0.28em; padding-right: 0.001em; visibility: hidden;"> </mspace><span mtagname="mfrac" style="vertical-align: 0em;"><span class="fm-vert fm-frac"><table><tbody><tr><td class="fm-num-frac fm-inline"><mi class="fm-mi-length-1" mathvariant="italic">π</mi></td></tr><tr><td class="fm-den-frac fm-inline"><mn>2</mn></td></tr></tbody></table></span></span></mrow></mrow><mo class="fm-mo-Luc" style="font-size: 2.05em; vertical-align: -0.128em; display: inline-block; transform: scaleX(0.5);">]</mo></mrow></fmath>',
    option_b: '<fmath alttext=" [0, \\;{π}/{2}] " class="fm-inline"><mrow><mo class="fm-mo-Luc" style="font-size: 2.05em; vertical-align: -0.128em; display: inline-block; transform: scaleX(0.5);">[</mo><mrow><mn>0</mn><mo class="fm-separator">,</mo><mrow><mspace width=".28em" style="margin-right: 0.28em; padding-right: 0.001em; visibility: hidden;"> </mspace><span mtagname="mfrac" style="vertical-align: 0em;"><span class="fm-vert fm-frac"><table><tbody><tr><td class="fm-num-frac fm-inline"><mi class="fm-mi-length-1" mathvariant="italic">π</mi></td></tr><tr><td class="fm-den-frac fm-inline"><mn>2</mn></td></tr></tbody></table></span></span></mrow></mrow><mo class="fm-mo-Luc" style="font-size: 2.05em; vertical-align: -0.128em; display: inline-block; transform: scaleX(0.5);">]</mo></mrow></fmath>',
    option_c: '<fmath alttext=" [\\;{π}/{6}, \\;{π}/{2}] " class="fm-inline"><mrow><mo class="fm-mo-Luc" style="font-size: 2.05em; vertical-align: -0.128em; display: inline-block; transform: scaleX(0.5);">[</mo><mrow><mrow><mspace width=".28em" style="margin-right: 0.28em; padding-right: 0.001em; visibility: hidden;"> </mspace><span mtagname="mfrac" style="vertical-align: 0em;"><span class="fm-vert fm-frac"><table><tbody><tr><td class="fm-num-frac fm-inline"><mi class="fm-mi-length-1" mathvariant="italic">π</mi></td></tr><tr><td class="fm-den-frac fm-inline"><mn>6</mn></td></tr></tbody></table></span></span></mrow><mo class="fm-separator">,</mo><mrow><mspace width=".28em" style="margin-right: 0.28em; padding-right: 0.001em; visibility: hidden;"> </mspace><span mtagname="mfrac" style="vertical-align: 0em;"><span class="fm-vert fm-frac"><table><tbody><tr><td class="fm-num-frac fm-inline"><mi class="fm-mi-length-1" mathvariant="italic">π</mi></td></tr><tr><td class="fm-den-frac fm-inline"><mn>2</mn></td></tr></tbody></table></span></span></mrow></mrow><mo class="fm-mo-Luc" style="font-size: 2.05em; vertical-align: -0.128em; display: inline-block; transform: scaleX(0.5);">]</mo></mrow></fmath>',
    option_d: '<fmath alttext=" [\\;{π}/{3}, \\;{π}/{2}] " class="fm-inline"><mrow><mo class="fm-mo-Luc" style="font-size: 2.05em; vertical-align: -0.128em; display: inline-block; transform: scaleX(0.5);">[</mo><mrow><mrow><mspace width=".28em" style="margin-right: 0.28em; padding-right: 0.001em; visibility: hidden;"> </mspace><span mtagname="mfrac" style="vertical-align: 0em;"><span class="fm-vert fm-frac"><table><tbody><tr><td class="fm-num-frac fm-inline"><mi class="fm-mi-length-1" mathvariant="italic">π</mi></td></tr><tr><td class="fm-den-frac fm-inline"><mn>3</mn></td></tr></tbody></table></span></span></mrow><mo class="fm-separator">,</mo><mrow><mspace width=".28em" style="margin-right: 0.28em; padding-right: 0.001em; visibility: hidden;"> </mspace><span mtagname="mfrac" style="vertical-align: 0em;"><span class="fm-vert fm-frac"><table><tbody><tr><td class="fm-num-frac fm-inline"><mi class="fm-mi-length-1" mathvariant="italic">π</mi></td></tr><tr><td class="fm-den-frac fm-inline"><mn>2</mn></td></tr></tbody></table></span></span></mrow></mrow><mo class="fm-mo-Luc" style="font-size: 2.05em; vertical-align: -0.128em; display: inline-block; transform: scaleX(0.5);">]</mo></mrow></fmath>',
    section_id: '8_mathematics'
  },
  {
    question_number: 91,
    question_text: 'If a body is projected vertically from the surface of the Earth with a speed of <fmath alttext="8000 ms^{-1}" class="fm-inline"><mrow><mrow><mn>8000</mn><mi class="fm-mi-length-1" mathvariant="italic">m</mi></mrow><msup><mi class="fm-mi-length-1" mathvariant="italic">s</mi><span class="fm-script fm-inline" style="vertical-align: 0.7em;"><mrow><mo class="fm-prefix-tight">−</mo><mn>1</mn></mrow></span></msup></mrow></fmath>, then the maximum height reached by the body is (Radius of the Earth <fmath alttext="=6400 km" class="fm-inline"><mrow><mo class="fm-infix-loose">=</mo><mrow><mrow><mn>6400</mn><mi class="fm-mi-length-1" mathvariant="italic">k</mi></mrow><mi class="fm-mi-length-1" mathvariant="italic">m</mi></mrow></mrow></fmath> and acceleration due to gravity <fmath alttext="=10 ms^{-2}" class="fm-inline"><mrow><mo class="fm-infix-loose">=</mo><mrow><mrow><mn>10</mn><mi class="fm-mi-length-1" mathvariant="italic">m</mi></mrow><msup><mi class="fm-mi-length-1" mathvariant="italic">s</mi><span class="fm-script fm-inline" style="vertical-align: 0.7em;"><mrow><mo class="fm-prefix-tight">−</mo><mn>2</mn></mrow></span></msup></mrow></mrow></fmath> )<br>',
    option_a: '1600 km',
    option_b: '9600 km',
    option_c: '6400 km',
    option_d: '3200 km',
    section_id: '8_physics'
  },
  {
    question_number: 140,
    question_text: 'The major product \' Y \' in the given sequence of reactions is<div class="hscrollenable"><fmath alttext=" {\C}_3  {\H}_7  {\OH} {───────▶}↖{\Conc.\H_5\SO_4 }↙{443\K} {\X} {───────▶}↙{(\C_6\H_5\CO)_2\O _2} ↖{\HBr}  {\Y}" class="fm-inline"><mrow class="ma-repel-adj"><mrow class="ma-repel-adj"><mrow class="ma-repel-adj"><mrow class="ma-repel-adj"><mrow class="ma-repel-adj"><mrow><msub><mi class="fm-mi-length-1 ma-upright" mathvariant="normal" style="padding-right: 0px;">C</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>3</mn></span></msub><msub><mi class="fm-mi-length-1 ma-upright" mathvariant="normal" style="padding-right: 0px;">H</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>7</mn></span></msub></mrow><mspace width=".17em" style="margin-right: 0.17em; padding-right: 0.001em; visibility: hidden;">‌</mspace><mi mathvariant="normal" class="ma-repel-adj">OH</mi></mrow><mspace width=".17em" style="margin-right: 0.17em; padding-right: 0.001em; visibility: hidden;">‌</mspace><span mtagname="munderover" style="vertical-align: 0.089em;"><span class="fm-vert"><table><tbody><tr><td class="fm-script fm-inline"><mrow><mi mathvariant="normal" class="ma-repel-adj">Conc</mi><mo class="fm-infix">.</mo><mrow><msub><mi class="fm-mi-length-1 ma-upright" mathvariant="normal" style="padding-right: 0px;">H</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>5</mn></span></msub><msub><mi mathvariant="normal" class="ma-repel-adj">SO</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>4</mn></span></msub></mrow></mrow></td></tr><tr><td class="fm-underover-base"><mrow><mrow><mrow><mrow><mrow><mrow><mrow><mi class="fm-mi-length-1" mathvariant="italic">─</mi><mi class="fm-mi-length-1" mathvariant="italic">─</mi></mrow><mi class="fm-mi-length-1" mathvariant="italic">─</mi></mrow><mi class="fm-mi-length-1" mathvariant="italic">─</mi></mrow><mi class="fm-mi-length-1" mathvariant="italic">─</mi></mrow><mi class="fm-mi-length-1" mathvariant="italic">─</mi></mrow><mi class="fm-mi-length-1" mathvariant="italic">─</mi></mrow><mo class="fm-postfix-tight">▶</mo></mrow></td></tr><tr><td class="fm-script fm-inline"><mrow><mn>443</mn><mi class="fm-mi-length-1 ma-upright" mathvariant="normal" style="padding-right: 0px;">K</mi></mrow></td></tr></tbody></table></span></span></mrow><mspace width=".17em" style="margin-right: 0.17em; padding-right: 0.001em; visibility: hidden;">‌</mspace><mi class="fm-mi-length-1 ma-upright" mathvariant="normal" style="padding-right: 0px;">X</mi></mrow><mspace width=".17em" style="margin-right: 0.17em; padding-right: 0.001em; visibility: hidden;">‌</mspace><span mtagname="munderover" style="vertical-align: -0.089em;"><span class="fm-vert"><table><tbody><tr><td class="fm-script fm-inline"><mi mathvariant="normal" class="ma-repel-adj">HBr</mi></td></tr><tr><td class="fm-underover-base"><mrow><mrow><mrow><mrow><mrow><mrow><mrow><mi class="fm-mi-length-1" mathvariant="italic">─</mi><mi class="fm-mi-length-1" mathvariant="italic">─</mi></mrow><mi class="fm-mi-length-1" mathvariant="italic">─</mi></mrow><mi class="fm-mi-length-1" mathvariant="italic">─</mi></mrow><mi class="fm-mi-length-1" mathvariant="italic">─</mi></mrow><mi class="fm-mi-length-1" mathvariant="italic">─</mi></mrow><mi class="fm-mi-length-1" mathvariant="italic">─</mi></mrow><mo class="fm-postfix-tight">▶</mo></mrow></td></tr><tr><td class="fm-script fm-inline"><mrow><msub><mrow><mo class="fm-mo-Luc">(</mo><mrow class="ma-repel-adj"><mrow><msub><mi class="fm-mi-length-1 ma-upright" mathvariant="normal" style="padding-right: 0px;">C</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>6</mn></span></msub><msub><mi class="fm-mi-length-1 ma-upright" mathvariant="normal" style="padding-right: 0px;">H</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>5</mn></span></msub></mrow><mspace width=".17em" style="margin-right: 0.17em; padding-right: 0.001em; visibility: hidden;">‌</mspace><mi mathvariant="normal" class="ma-repel-adj">CO</mi></mrow><mo class="fm-mo-Luc">)</mo></mrow><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>2</mn></span></msub><msub><mi class="fm-mi-length-1 ma-upright" mathvariant="normal" style="padding-right: 0px;">O</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>2</mn></span></msub></mrow></td></tr></tbody></table></span></span></mrow><mspace width=".17em" style="margin-right: 0.17em; padding-right: 0.001em; visibility: hidden;">‌</mspace><mi class="fm-mi-length-1 ma-upright" mathvariant="normal" style="padding-right: 0px;">Y</mi></mrow></fmath></div>',
    option_a: '<fmath alttext="\; {\CH}_3  {\CH}_2  {\CH}_2  {\Br}  " class="fm-inline"><mrow><mspace width=".28em" style="margin-right: 0.28em; padding-right: 0.001em; visibility: hidden;">‌</mspace><mrow class="ma-repel-adj"><mrow><mrow><msub><mi mathvariant="normal" class="ma-repel-adj">CH</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>3</mn></span></msub><msub><mi mathvariant="normal" class="ma-repel-adj">CH</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>2</mn></span></msub></mrow><msub><mi mathvariant="normal" class="ma-repel-adj">CH</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>2</mn></span></msub></mrow><mspace width=".17em" style="margin-right: 0.17em; padding-right: 0.001em; visibility: hidden;">‌</mspace><mi mathvariant="normal" class="ma-repel-adj">Br</mi></mrow></mrow></fmath><br>',
    option_b: '<fmath alttext=" \; {\CH}_3  {\CH}( {\Br})  {\CH}_3  " class="fm-inline"><mrow><mspace width=".28em" style="margin-right: 0.28em; padding-right: 0.001em; visibility: hidden;">‌</mspace><mrow class="ma-repel-adj"><mrow class="ma-repel-adj"><mrow class="ma-repel-adj"><msub><mi mathvariant="normal" class="ma-repel-adj">CH</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>3</mn></span></msub><mspace width=".17em" style="margin-right: 0.17em; padding-right: 0.001em; visibility: hidden;">‌</mspace><mi mathvariant="normal" class="ma-repel-adj">CH</mi></mrow><mrow><mo class="fm-mo-Luc">(</mo><mi mathvariant="normal" class="ma-repel-adj">Br</mi><mo class="fm-mo-Luc">)</mo></mrow></mrow><mspace width=".17em" style="margin-right: 0.17em; padding-right: 0.001em; visibility: hidden;">‌</mspace><msub><mi mathvariant="normal" class="ma-repel-adj">CH</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>3</mn></span></msub></mrow></mrow></fmath><br>',
    option_c: '<fmath alttext=" \; {\CH}_3  {\COC}_6  {\H}_5  " class="fm-inline"><mrow><mspace width=".28em" style="margin-right: 0.28em; padding-right: 0.001em; visibility: hidden;">‌</mspace><mrow><mrow><msub><mi mathvariant="normal" class="ma-repel-adj">CH</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>3</mn></span></msub><msub><mi mathvariant="normal" class="ma-repel-adj">COC</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>6</mn></span></msub></mrow><msub><mi class="fm-mi-length-1 ma-upright" mathvariant="normal" style="padding-right: 0px;">H</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>5</mn></span></msub></mrow></mrow></fmath><br>',
    option_d: '<fmath alttext=" \; {\C}_6  {\H}_5  {\COBr}" class="fm-inline"><mrow><mspace width=".28em" style="margin-right: 0.28em; padding-right: 0.001em; visibility: hidden;">‌</mspace><mrow class="ma-repel-adj"><mrow><msub><mi class="fm-mi-length-1 ma-upright" mathvariant="normal" style="padding-right: 0px;">C</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>6</mn></span></msub><msub><mi class="fm-mi-length-1 ma-upright" mathvariant="normal" style="padding-right: 0px;">H</mi><span class="fm-script fm-inline" style="vertical-align: -0.5em;"><mn>5</mn></span></msub></mrow><mspace width=".17em" style="margin-right: 0.17em; padding-right: 0.001em; visibility: hidden;">‌</mspace><mi mathvariant="normal" class="ma-repel-adj">COBr</mi></mrow></mrow></fmath>',
    section_id: '9_chemistry'
  }
]

// Donut Chart Preview Component
function DonutChartPreview() {
  const data = [
    { label: 'Correct', value: 85, color: '#10b981' },
    { label: 'Incorrect', value: 35, color: '#ef4444' },
    { label: 'Not Answered', value: 40, color: '#9ca3af' },
  ]
  const total = 160
  const size = 90
  const strokeWidth = 12
  const radius = (size / 2) - strokeWidth
  const centerX = size / 2
  const centerY = size / 2
  const gapAngle = 4

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180.0
    return {
      x: cx + (r * Math.cos(rad)),
      y: cy + (r * Math.sin(rad))
    }
  }

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, endAngle)
    const end = polarToCartesian(x, y, r, startAngle)
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1"
    return "M " + start.x + " " + start.y + " A " + r + " " + r + " 0 " + largeArc + " 0 " + end.x + " " + end.y
  }

  const nonZeroData = data.filter(item => item.value > 0)
  const totalGapAngle = gapAngle * nonZeroData.length
  const availableAngle = 360 - totalGapAngle
  
  let currentAngle = 0
  const segments: Array<{path: string; color: string}> = []
  
  nonZeroData.forEach((item, index) => {
    if (index > 0) currentAngle += gapAngle
    const segmentAngle = (item.value / total) * availableAngle
    const endAngle = currentAngle + segmentAngle
    segments.push({
      path: describeArc(centerX, centerY, radius, currentAngle, endAngle),
      color: item.color,
    })
    currentAngle = endAngle
  })

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => (
          <path key={i} d={seg.path} fill="none" stroke={seg.color} strokeWidth={strokeWidth} />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-base font-bold text-gray-900">{total}</div>
        <div className="text-[9px] text-gray-600">Total Qs</div>
      </div>
    </div>
  )
}

// Full report card for landing "See what you'll get" — same structure as dashboard result, static data (sentinel is below this, after testimonials)
function LandingReportCard({ result }: { result: typeof LANDING_DEMO_RESULT }) {
  const [activeTab, setActiveTab] = useState<'overall' | 'physics' | 'chemistry' | 'maths'>('overall')
  const totalQuestions = 160
  const accuracy = totalQuestions > 0 ? ((result.correct_answers / (result.correct_answers + result.wrong_answers + result.unattempted)) * 100).toFixed(1) : '0'
  const timeTakenMinutes = Math.floor(result.time_taken / 60)
  const timeTakenSeconds = result.time_taken % 60
  const sa = result.section_wise_analysis
  const timeCorrect = (sa.maths?.time_correct || 0) + (sa.physics?.time_correct || 0) + (sa.chemistry?.time_correct || 0)
  const timeWrong = (sa.maths?.time_wrong || 0) + (sa.physics?.time_wrong || 0) + (sa.chemistry?.time_wrong || 0)
  const timeUnattempted = (sa.maths?.time_unattempted || 0) + (sa.physics?.time_unattempted || 0) + (sa.chemistry?.time_unattempted || 0)
  const totalTimeSpent = timeCorrect + timeWrong + timeUnattempted
  const mathsTime = sa.maths?.time_seconds || 0
  const physicsTime = sa.physics?.time_seconds || 0
  const chemistryTime = sa.chemistry?.time_seconds || 0
  const totalSubjectTime = mathsTime + physicsTime + chemistryTime
  const donutData = [
    { label: 'Correct', value: result.correct_answers, color: '#10b981' },
    { label: 'Incorrect', value: result.wrong_answers, color: '#ef4444' },
    { label: 'Not Answered', value: result.unattempted, color: '#9ca3af' },
  ]

  const DonutChart = ({ data, total, size = 180 }: { data: Array<{ label: string; value: number; color: string }>; total: number; size?: number }) => {
    const strokeWidth = 24
    const radius = (size / 2) - strokeWidth
    const centerX = size / 2
    const centerY = size / 2
    const gapAngle = 4
    const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
      const rad = (angle - 90) * Math.PI / 180.0
      return { x: cx + (r * Math.cos(rad)), y: cy + (r * Math.sin(rad)) }
    }
    const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
      const start = polarToCartesian(x, y, r, endAngle)
      const end = polarToCartesian(x, y, r, startAngle)
      const largeArc = endAngle - startAngle <= 180 ? '0' : '1'
      return 'M ' + start.x + ' ' + start.y + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 0 ' + end.x + ' ' + end.y
    }
    const nonZeroData = data.filter(item => item.value > 0)
    const totalGapAngle = gapAngle * nonZeroData.length
    const availableAngle = 360 - totalGapAngle
    let currentAngle = 0
    const segments: Array<{ path: string; color: string }> = []
    nonZeroData.forEach((item, index) => {
      if (index > 0) currentAngle += gapAngle
      const segmentAngle = (item.value / total) * availableAngle
      const endAngle = currentAngle + segmentAngle
      segments.push({ path: describeArc(centerX, centerY, radius, currentAngle, endAngle), color: item.color })
      currentAngle = endAngle
    })
    return (
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
          {segments.map((seg, i) => (
            <path key={i} d={seg.path} fill="none" stroke={seg.color} strokeWidth={strokeWidth} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-900">Total Qs</div>
        </div>
      </div>
    )
  }

  const TimeBarChart = ({ data, maxValue, height = 200 }: { data: Array<{ label: string; value: number; color: string }>; maxValue: number; height?: number }) => {
    const maxVal = Math.max(maxValue, 1)
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return mins + 'm ' + secs + 's'
    }
    return (
      <div className="w-full">
        <div className="flex items-end gap-4" style={{ height }}>
          {data.map((item, index) => {
            const percentage = (item.value / maxVal) * 100
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-end" style={{ height: height - 40 }}>
                  {item.value > 0 && (
                    <div className="text-xs font-semibold text-gray-900 mb-1 whitespace-nowrap">{formatTime(item.value)}</div>
                  )}
                  <div
                    className="w-full rounded-t-lg"
                    style={{
                      height: Math.max(percentage, item.value > 0 ? 5 : 2) + '%',
                      backgroundColor: item.color,
                      minHeight: item.value > 0 ? 8 : 2,
                    }}
                  />
                </div>
                <div className="mt-3 text-sm text-gray-900 font-medium text-center whitespace-nowrap">{item.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const testName = result.test?.test_name || `Test ${result.test_id}`

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Report Card</h1>
        <a
          href={`/test/solution?resultId=${LANDING_DEMO_RESULT_ID}`}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          View Solution
        </a>
      </div>
      <p className="text-sm text-gray-800">{testName}</p>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-lg overflow-x-auto">
        <div className="flex gap-1 pt-2 min-w-max">
          {(['overall', 'physics', 'chemistry', 'maths'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-800 hover:text-gray-900'
              }`}
            >
              {tab === 'overall' ? 'Overall' : tab === 'maths' ? '🔢 Maths' : tab === 'physics' ? '⚛ Physics' : '🧪 Chemistry'}
            </button>
          ))}
        </div>
      </div>

      {/* Overall */}
      {activeTab === 'overall' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-4 shadow-lg">
            <div className="text-xs font-medium mb-2 opacity-90">MARKS OBTAINED</div>
            <div className="text-3xl font-bold mb-2">{result.total_marks} / 160</div>
            {result.estimated_rank && (
              <div className="space-y-0.5">
                <div className="text-sm font-semibold">Estimated Rank: {result.estimated_rank.estimatedRank}</div>
                <div className="text-xs opacity-90">Rank Range: {result.estimated_rank.rankRange}</div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
              <div className="text-xl font-bold text-purple-600">{result.correct_answers + result.wrong_answers}</div>
              <div className="text-xs text-gray-900">Attempted</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
              <div className="text-xl font-bold text-green-600">{accuracy}%</div>
              <div className="text-xs text-gray-900">Accuracy</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
              <div className="text-xl font-bold text-orange-600">{timeTakenMinutes}m {timeTakenSeconds}s</div>
              <div className="text-xs text-gray-900">Time</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold mb-3 text-gray-900">Attempt Analysis</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <DonutChart data={donutData} total={totalQuestions} size={160} />
              <div className="flex-1 w-full space-y-2">
                {donutData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-900">{item.label}</span>
                    <span className="text-sm font-semibold ml-auto text-gray-900">{item.value} Qs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold mb-2 text-gray-900">Quality of Time Spent</h2>
            <p className="text-xs text-gray-900 mb-3">Total: {Math.floor(totalTimeSpent / 60)}m {totalTimeSpent % 60}s</p>
            {totalTimeSpent > 0 && (
              <TimeBarChart
                data={[
                  { label: 'Correct', value: timeCorrect, color: '#10b981' },
                  { label: 'Incorrect', value: timeWrong, color: '#ef4444' },
                  { label: 'Not Attempted', value: timeUnattempted, color: '#9ca3af' },
                ]}
                maxValue={Math.max(timeCorrect, timeWrong, timeUnattempted, 1)}
                height={160}
              />
            )}
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold mb-2 text-gray-900">Subject Wise Time</h2>
            {totalSubjectTime > 0 && (
              <TimeBarChart
                data={[
                  { label: 'Physics', value: physicsTime, color: '#f97316' },
                  { label: 'Chemistry', value: chemistryTime, color: '#10b981' },
                  { label: 'Mathematics', value: mathsTime, color: '#3b82f6' },
                ]}
                maxValue={Math.max(mathsTime, physicsTime, chemistryTime, 1)}
                height={160}
              />
            )}
          </div>
        </div>
      )}

      {/* Subject tabs */}
      {activeTab !== 'overall' && (() => {
        const subjectMap = { maths: { name: 'Mathematics', maxQ: 80, color: '#3b82f6' }, physics: { name: 'Physics', maxQ: 40, color: '#f97316' }, chemistry: { name: 'Chemistry', maxQ: 40, color: '#10b981' } } as const
        const subject = subjectMap[activeTab]
        const section = result.section_wise_analysis?.[activeTab]
        const sectionMarks = result.section_wise_marks?.[activeTab] ?? 0
        if (!subject || !section) return null
        const subjectDonutData = [
          { label: 'Correct', value: section.correct, color: '#10b981' },
          { label: 'Incorrect', value: section.wrong, color: '#ef4444' },
          { label: 'Not Answered', value: section.unattempted, color: '#9ca3af' },
        ]
        const subjectTime = activeTab === 'maths' ? mathsTime : activeTab === 'physics' ? physicsTime : chemistryTime
        return (
          <div className="space-y-4">
            <div className="rounded-xl p-4 shadow-lg text-white" style={{ background: `linear-gradient(135deg, ${subject.color} 0%, ${subject.color}dd 100%)` }}>
              <div className="text-xs font-medium mb-2 opacity-90">{subject.name.toUpperCase()} MARKS</div>
              <div className="text-3xl font-bold">{sectionMarks} / {subject.maxQ}</div>
              <div className="text-sm opacity-90">{((sectionMarks / subject.maxQ) * 100).toFixed(1)}% Accuracy</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-lg p-3 text-center shadow-sm border"><div className="text-xl font-bold text-green-600">{section.correct}</div><div className="text-xs text-gray-900">Correct</div></div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm border"><div className="text-xl font-bold text-red-600">{section.wrong}</div><div className="text-xs text-gray-900">Wrong</div></div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm border"><div className="text-xl font-bold text-gray-800">{section.unattempted}</div><div className="text-xs text-gray-900">Unattempted</div></div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h2 className="text-sm font-semibold mb-3 text-gray-900">Attempt Analysis ({subject.name})</h2>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <DonutChart data={subjectDonutData} total={subject.maxQ} size={160} />
                <div className="flex-1 space-y-2">
                  {subjectDonutData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-900">{item.label}</span>
                      <span className="text-sm font-semibold ml-auto text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {subjectTime > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <h2 className="text-sm font-semibold mb-2 text-gray-900">Quality of Time Spent ({subject.name})</h2>
                <TimeBarChart
                  data={[
                    { label: 'Correct', value: section.time_correct || 0, color: '#10b981' },
                    { label: 'Incorrect', value: section.time_wrong || 0, color: '#ef4444' },
                    { label: 'Not Attempted', value: section.time_unattempted || 0, color: '#9ca3af' },
                  ]}
                  maxValue={Math.max(section.time_correct || 0, section.time_wrong || 0, section.time_unattempted || 0, 1)}
                  height={160}
                />
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

// Time Bar Chart Preview Component
function TimeBarChartPreview() {
  const data = [
    { label: 'Correct', value: 4200, color: '#10b981' }, // 70 min
    { label: 'Wrong', value: 1800, color: '#ef4444' }, // 30 min
    { label: 'Not Attempted', value: 600, color: '#9ca3af' }, // 10 min
  ]
  const maxValue = Math.max(...data.map(d => d.value))
  const height = 70

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return mins + 'm'
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex items-end gap-4 w-full" style={{ height }}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100
          return (
            <div key={index} className="flex-1 flex flex-col items-center h-full">
              <div className="w-full flex flex-col items-center justify-end flex-1" style={{ height: '100%' }}>
                {item.value > 0 && (
                  <div className="text-xs font-semibold text-gray-700 mb-1 whitespace-nowrap text-center">
                    {formatTime(item.value)}
                  </div>
                )}
                <div
                  className="w-full rounded-t"
                  style={{
                    height: Math.max(percentage, item.value > 0 ? 5 : 2) + '%',
                    backgroundColor: item.color,
                    minHeight: item.value > 0 ? 8 : 2,
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-700 font-medium text-center">{item.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Custom Full-Width Area Chart
function FullWidthAreaChart({ data, color = '#3b82f6' }: { data: Array<{x: number; y: number}>, color?: string }) {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(300)
  const gradientId = `areaGradient-${Math.random().toString(36).substr(2, 9)}`
  const height = 140
  const padding = 32

  useEffect(() => {
    if (!containerRef) return
    
    const updateWidth = () => {
      if (containerRef) {
        setWidth(containerRef.offsetWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    
    return () => window.removeEventListener('resize', updateWidth)
  }, [containerRef])

  const chartWidth = width - 2 * padding
  const chartHeight = height - 2 * padding

  const minX = Math.min(...data.map(d => d.x))
  const maxX = Math.max(...data.map(d => d.x))
  const minY = 0
  const maxY = Math.max(...data.map(d => d.y), 160)

  const scaleX = (value: number) => {
    if (maxX === minX) return padding
    return padding + ((value - minX) / (maxX - minX)) * chartWidth
  }

  const scaleY = (value: number) => {
    if (maxY === minY) return height - padding
    return height - padding - ((value - minY) / (maxY - minY)) * chartHeight
  }

  const createAreaPath = () => {
    if (data.length === 0) return ''
    let path = `M ${scaleX(data[0].x)} ${scaleY(data[0].y)}`
    for (let i = 1; i < data.length; i++) {
      path += ` L ${scaleX(data[i].x)} ${scaleY(data[i].y)}`
    }
    path += ` L ${scaleX(data[data.length - 1].x)} ${height - padding}`
    path += ` L ${scaleX(data[0].x)} ${height - padding} Z`
    return path
  }

  const createLinePath = () => {
    if (data.length === 0) return ''
    let path = `M ${scaleX(data[0].x)} ${scaleY(data[0].y)}`
    for (let i = 1; i < data.length; i++) {
      path += ` L ${scaleX(data[i].x)} ${scaleY(data[i].y)}`
    }
    return path
  }

  // Generate Y-axis labels
  const yAxisLabels = []
  const numLabels = 5
  for (let i = 0; i <= numLabels; i++) {
    const value = minY + (maxY - minY) * (i / numLabels)
    yAxisLabels.push(Math.round(value))
  }

  return (
    <div ref={setContainerRef} className="w-full" style={{ height }}>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Y-axis grid lines and labels */}
        {yAxisLabels.map((label, index) => {
          const y = scaleY(label)
          return (
            <g key={index}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.5"
              />
              <text
                x={padding - 8}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-600"
                fontSize="11"
              >
                {label}
              </text>
            </g>
          )
        })}
        <path d={createAreaPath()} fill={`url(#${gradientId})`} />
        <path d={createLinePath()} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        {data.map((point, index) => {
          const x = scaleX(point.x)
          const y = scaleY(point.y)
          return (
            <circle key={index} cx={x} cy={y} r="4" fill={color} stroke="white" strokeWidth="2" />
          )
        })}
      </svg>
    </div>
  )
}

// Custom Full-Width Line Chart
function FullWidthLineChart({ data, color = '#3b82f6', valueUnit = '' }: { data: Array<{x: number; y: number}>, color?: string, valueUnit?: string }) {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(300)
  const height = 140
  const padding = 32

  useEffect(() => {
    if (!containerRef) return
    
    const updateWidth = () => {
      if (containerRef) {
        setWidth(containerRef.offsetWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    
    return () => window.removeEventListener('resize', updateWidth)
  }, [containerRef])

  const chartWidth = width - 2 * padding
  const chartHeight = height - 2 * padding

  const minX = Math.min(...data.map(d => d.x))
  const maxX = Math.max(...data.map(d => d.x))
  const minY = 0
  const maxY = Math.max(...data.map(d => d.y), 80)

  const scaleX = (value: number) => {
    if (maxX === minX) return padding
    return padding + ((value - minX) / (maxX - minX)) * chartWidth
  }

  const scaleY = (value: number) => {
    if (maxY === minY) return height - padding
    return height - padding - ((value - minY) / (maxY - minY)) * chartHeight
  }

  const createLinePath = () => {
    if (data.length === 0) return ''
    let path = `M ${scaleX(data[0].x)} ${scaleY(data[0].y)}`
    for (let i = 1; i < data.length; i++) {
      path += ` L ${scaleX(data[i].x)} ${scaleY(data[i].y)}`
    }
    return path
  }

  // Generate Y-axis labels
  const yAxisLabels = []
  const numLabels = 5
  for (let i = 0; i <= numLabels; i++) {
    const value = minY + (maxY - minY) * (i / numLabels)
    yAxisLabels.push(Math.round(value))
  }

  return (
    <div ref={setContainerRef} className="w-full" style={{ height }}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Y-axis grid lines and labels */}
        {yAxisLabels.map((label, index) => {
          const y = scaleY(label)
          return (
            <g key={index}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.5"
              />
              <text
                x={padding - 8}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-600"
                fontSize="11"
              >
                {label}
              </text>
            </g>
          )
        })}
        <path d={createLinePath()} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        {data.map((point, index) => {
          const x = scaleX(point.x)
          const y = scaleY(point.y)
          return (
            <circle key={index} cx={x} cy={y} r="4" fill={color} stroke="white" strokeWidth="2" />
          )
        })}
      </svg>
    </div>
  )
}

// Question Card Component (Compact for carousel)
function QuestionCard({ question, questionNumber }: { question: any; questionNumber: number }) {
  const sectionName = question.section_id.includes('mathematics') ? 'Maths' :
                      question.section_id.includes('physics') ? 'Physics' : 'Chemistry'
  
  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] font-semibold text-blue-600">Q{questionNumber}</span>
        <span className="text-[9px] text-gray-500">{sectionName}</span>
      </div>
      <div className="text-[10px] text-gray-700 mb-1.5 flex-1 overflow-hidden line-clamp-2">
        <QuestionContent html={question.question_text} className="text-[10px]" />
      </div>
      <div className="grid grid-cols-2 gap-0.5">
        {['a', 'b', 'c', 'd'].map(opt => (
          <div key={opt} className="flex items-start gap-1 text-[9px] p-1 bg-gray-50 rounded">
            <span className="text-gray-600 font-medium shrink-0">{opt}.</span>
            <div className="text-gray-700 truncate min-w-0">
              <QuestionContent html={question[`option_${opt}`]} className="text-[9px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// A/B variant B: paywall-style landing with scroll-to-reveal pricing; unauthenticated users go to signup then return and open checkout
function LandingBContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTier, setSelectedTier] = useState<PlanTier>('PRO')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [shareLinkUrl, setShareLinkUrl] = useState<string | null>(null)
  const [shareLinkLoading, setShareLinkLoading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLinkError, setShareLinkError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showSpinWheel, setShowSpinWheel] = useState(false)
  const [spinWheelApplied, setSpinWheelApplied] = useState(false)
  const [testsTab, setTestsTab] = useState<'ts' | 'ap'>('ts')
  const [expandedSection, setExpandedSection] = useState<string>(TS_GROUPED_YEARS[0] ?? '')
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const openCheckoutAfterAuthRef = useRef(false)
  const openShareModalAfterAuthRef = useRef(false)
  const openSpinCheckoutAfterAuthRef = useRef(false)
  const openSpinShareAfterAuthRef = useRef(false)
  // First cross click or first back → spin wheel; second → /dashboard
  const spinWheelShownFromCrossOrBackRef = useRef(false)

  const proPlan = getProPlan()
  const basicPlan = getBasicPlan()

  useEffect(() => {
    // Load Razorpay script immediately
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => setRazorpayLoaded(true)
      document.body.appendChild(script)
    } else {
      setRazorpayLoaded(true)
    }

    // Check auth (no redirect — this is public landing; we redirect only when they click pay)
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-session')
        const data = await response.json()
        setIsAuthenticated(!!data.authenticated)
        if (data.authenticated) {
          const userResponse = await fetch('/api/auth/user')
          const userData = await userResponse.json()
          setUserPhone(userData.phone || '')
        }
      } catch (_) {
        setIsAuthenticated(false)
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [])

  // Back / swipe: first time show spin wheel, second time go to dashboard (same as cross button)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.history) return
    const state = { landingBackGuard: true }
    window.history.pushState(state, '', window.location.href)
    const onPopState = () => {
      if (!spinWheelShownFromCrossOrBackRef.current) {
        window.history.pushState(state, '', window.location.href)
        setShowSpinWheel(true)
        spinWheelShownFromCrossOrBackRef.current = true
      } else {
        router.push('/dashboard')
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [router])

  // After signup return: open checkout when ?checkout=1 and user is authenticated
  useEffect(() => {
    if (!authChecked || !isAuthenticated) return
    const checkout = searchParams.get('checkout')
    if (checkout !== '1' || openCheckoutAfterAuthRef.current) return
    openCheckoutAfterAuthRef.current = true
    const t = setTimeout(() => {
      handlePayment()
    }, 600)
    return () => clearTimeout(t)
  }, [authChecked, isAuthenticated, searchParams])

  // After signup return: open share link modal when ?shareLink=1 and user is authenticated
  useEffect(() => {
    if (!authChecked || !isAuthenticated) return
    if (searchParams.get('shareLink') !== '1' || openShareModalAfterAuthRef.current) return
    openShareModalAfterAuthRef.current = true
    handleSharePaymentLink()
  }, [authChecked, isAuthenticated, searchParams])

  // After signup return from spin wheel Pay: open spin wheel then checkout for discounted price
  useEffect(() => {
    if (!authChecked || !isAuthenticated) return
    if (searchParams.get('spinCheckout') !== '1' || openSpinCheckoutAfterAuthRef.current) return
    openSpinCheckoutAfterAuthRef.current = true
    setShowSpinWheel(true)
    setSpinWheelApplied(true) // so they see the offer state
    const t = setTimeout(() => handleSpinOfferPayment(), 800)
    return () => clearTimeout(t)
  }, [authChecked, isAuthenticated, searchParams])

  // After signup return from spin wheel Share: open spin wheel then create share link and show modal
  useEffect(() => {
    if (!authChecked || !isAuthenticated) return
    if (searchParams.get('shareLink') !== 'spin' || openSpinShareAfterAuthRef.current) return
    openSpinShareAfterAuthRef.current = true
    setShowSpinWheel(true)
    setSpinWheelApplied(true)
    const run = async () => {
      setShareLinkError('')
      setShareLinkLoading(true)
      try {
        const res = await fetch('/api/payments/share-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: 'PRO', amount_rupees: 249 }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create link')
        setShareLinkUrl(data.url)
        setShowSpinWheel(false)
        setShowShareModal(true)
      } catch (err) {
        setShareLinkError(err instanceof Error ? err.message : 'Failed to create link')
      } finally {
        setShareLinkLoading(false)
      }
    }
    run()
  }, [authChecked, isAuthenticated, searchParams])

  // Facebook Pixel: paywall view for retargeting
  useEffect(() => {
    trackViewPaywall()
  }, [])

  // Facebook Pixel: fire ViewContent "Landing Page" for retargeting audiences
  useEffect(() => {
    trackLandingView({ page_name: 'Landing B' })
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSection((s) => (s === section ? '' : section))
  }

  // When switching to AP tab, expand first AP year
  useEffect(() => {
    if (testsTab === 'ap' && AP_GROUPED_YEARS[0] && expandedSection !== AP_GROUPED_YEARS[0]) {
      setExpandedSection(AP_GROUPED_YEARS[0])
    }
  }, [testsTab])

  // After trial completion: scroll to pricing and show banner
  const trialComplete = searchParams.get('trialComplete') === '1'
  useEffect(() => {
    if (!trialComplete) return
    const t = setTimeout(() => {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
    }, 400)
    return () => clearTimeout(t)
  }, [trialComplete])

  // Mobile: on back/swipe-back, open spin wheel instead of leaving
  useEffect(() => {
    const stateKey = 'paywall-spin'
    if (typeof window === 'undefined') return
    window.history.pushState({ key: stateKey }, '')
    const onPopState = (e: PopStateEvent) => {
      e.preventDefault?.()
      window.history.pushState({ key: stateKey }, '')
      setShowSpinWheel(true)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const handleProPayment = async () => {
    if (!isAuthenticated) {
      const currentSearch = searchParams.toString()
      const baseLanding = '/landing'
      const landingWithCheckout = currentSearch
        ? `${baseLanding}?${currentSearch}&checkout=1`
        : `${baseLanding}?checkout=1`
      const onboardingUrl = `/onboarding?checkout=1&returnTo=${encodeURIComponent(landingWithCheckout)}`
      localStorage.setItem('redirectPath', onboardingUrl)
      router.push('/auth/register')
      return
    }

    try {
      setError('')
      setLoading(true)

      const amountRupees = getLandingBDisplayPrice('PRO', false, spinWheelApplied)
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier: 'PRO', amount_rupees: amountRupees, spin_wheel_applied: spinWheelApplied }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If authentication error, redirect to login
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        throw new Error(data.error || 'Failed to create order')
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'eapcetpro',
        description: `eapcetpro · PRO · ${proPlan.label}`,
        order_id: data.orderId,
        theme: { color: '#2563EB' },
        method: { upi: true, card: false, netbanking: false, wallet: false },
        prefill: {
          name: 'Student',
          contact: userPhone,
          email: ''
        },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              router.push('/payment/success')
            } else {
              // If authentication error, redirect to login
              if (verifyResponse.status === 401 || verifyResponse.status === 400) {
                router.push('/auth/login')
                return
              }
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (error) {
            console.error('Verification error:', error)
            router.push('/payment/failure')
          }
        },
        modal: {
          ondismiss: () => setLoading(false)
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      setError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  // TEMPORARY: Changed to one-time payment due to Razorpay subscription issues
  const handleBasicPayment = async () => {
    if (!isAuthenticated) {
      const currentSearch = searchParams.toString()
      const baseLanding = '/landing'
      const landingWithCheckout = currentSearch
        ? `${baseLanding}?${currentSearch}&checkout=1`
        : `${baseLanding}?checkout=1`
      const onboardingUrl = `/onboarding?checkout=1&returnTo=${encodeURIComponent(landingWithCheckout)}`
      localStorage.setItem('redirectPath', onboardingUrl)
      router.push('/auth/register')
      return
    }

    try {
      setError('')
      setLoading(true)

      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier: 'BASIC', spin_wheel_applied: spinWheelApplied }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If authentication error, redirect to login
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        throw new Error(data.error || 'Failed to create order')
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'eapcetpro',
        description: `eapcetpro · BASIC · ${basicPlan.label}`,
        order_id: data.orderId,
        theme: { color: '#2563EB' },
        method: { upi: true, card: false, netbanking: false, wallet: false },
        prefill: {
          name: 'Student',
          contact: userPhone,
          email: ''
        },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              router.push('/payment/success')
            } else {
              // If authentication error, redirect to login
              if (verifyResponse.status === 401 || verifyResponse.status === 400) {
                router.push('/auth/login')
                return
              }
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (error) {
            console.error('Verification error:', error)
            router.push('/payment/failure')
          }
        },
        modal: {
          ondismiss: () => setLoading(false)
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      setError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = () => {
    if (!isAuthenticated) {
      const currentSearch = searchParams.toString()
      const baseLanding = '/landing'
      const landingWithCheckout = currentSearch
        ? `${baseLanding}?${currentSearch}&checkout=1`
        : `${baseLanding}?checkout=1`
      const onboardingUrl = `/onboarding?checkout=1&returnTo=${encodeURIComponent(landingWithCheckout)}`
      localStorage.setItem('redirectPath', onboardingUrl)
      router.push('/auth/register')
      return
    }
    // Facebook Pixel: fire as soon as user clicks Pay (before Razorpay loads)
    const amount = getLandingBDisplayPrice('PRO', false, spinWheelApplied)
    trackInitiateCheckout({
      value: amount,
      currency: 'INR',
      content_name: 'eapcetpro PRO',
    })
    handleProPayment()
  }

  /** Pay ₹249 from spin wheel modal — PRO with spin_wheel_applied so backend charges 249. */
  const handleSpinOfferPayment = async () => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectPath', '/landing?spinCheckout=1')
      router.push('/auth/register')
      return
    }
    try {
      setError('')
      setLoading(true)
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier: 'PRO', spin_wheel_applied: true }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) router.push('/auth/login')
        else throw new Error(data.error || 'Failed to create order')
        return
      }
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'eapcetpro',
        description: 'eapcetpro · ₹249 Unlimited',
        order_id: data.orderId,
        theme: { color: '#2563EB' },
        method: { upi: true, card: false, netbanking: false, wallet: false },
        prefill: { name: 'Student', contact: userPhone, email: '' },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyResponse.json()
            if (verifyData.success) router.push('/payment/success')
            else if (verifyResponse.status === 401 || verifyResponse.status === 400) router.push('/auth/login')
            else throw new Error(verifyData.error || 'Payment verification failed')
          } catch (e) {
            console.error(e)
            router.push('/payment/failure')
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      }
      trackInitiateCheckout({ value: data.amount / 100, currency: 'INR', content_name: 'eapcetpro · ₹249 Unlimited' })
      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      setError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSharePaymentLink = async () => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectPath', '/landing?shareLink=1')
      router.push('/auth/register')
      return
    }
    setShareLinkError('')
    setShareLinkLoading(true)
    try {
      const amountRupees = getLandingBDisplayPrice('PRO', false, spinWheelApplied)
      const res = await fetch('/api/payments/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'PRO', amount_rupees: amountRupees }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create link')
      setShareLinkUrl(data.url)
      setShowShareModal(true)
    } catch (err) {
      setShareLinkError(err instanceof Error ? err.message : 'Failed to create link')
    } finally {
      setShareLinkLoading(false)
    }
  }

  const shareLinkInputRef = useRef<HTMLInputElement>(null)
  const copyShareLink = async () => {
    const text = shareLinkUrl ?? ''
    if (!text) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const input = shareLinkInputRef.current
        if (input) {
          input.select()
          input.setSelectionRange(0, text.length)
          document.execCommand('copy')
        } else {
          return
        }
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      const input = shareLinkInputRef.current
      if (input) {
        input.select()
        input.setSelectionRange(0, text.length)
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    }
  }

  return (
    <div className={`h-screen bg-gray-50 overflow-hidden flex flex-col ${inter.className}`}>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        {/* Scrollable: header + report card + testimonials + pricing (pricing sticks to bottom when it comes into view) */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="container mx-auto px-2 py-1.5 max-w-4xl pb-4">
            {/* Header: eapcetpro left, close / spin wheel right. First click → spin wheel, second click → /dashboard */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-600 font-bold text-xl">eapcet<span className="text-gray-900">pro</span></span>
              <button
                type="button"
                onClick={() => {
                  if (!spinWheelShownFromCrossOrBackRef.current) {
                    setShowSpinWheel(true)
                    spinWheelShownFromCrossOrBackRef.current = true
                  } else {
                    router.push('/dashboard')
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 bg-white transition"
                aria-label="Try your luck or go to dashboard"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center mb-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <StarIcon className="h-4 w-4 text-yellow-400" />
                <StarIcon className="h-4 w-4 text-yellow-400" />
                <StarIcon className="h-4 w-4 text-yellow-400" />
              </div>
              <span className="text-[10px] text-gray-700 text-center">
                Trusted by <span className="font-bold">1270+</span> students
              </span>
            </div>

            {trialComplete && (
              <div className="mb-4 py-2.5 px-3 rounded-lg bg-green-50 border border-green-200 text-center">
                <p className="text-sm font-semibold text-green-800">Trial completed! Unlock full access below.</p>
              </div>
            )}

            {/* Big stats */}
            <div className="text-center mb-4 py-3 px-2 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                142+ question papers · 22,400+ questions · 70+ papers with detailed answers
              </p>
            </div>

            {/* Available tests (same as landing page) */}
            <h2 className="text-xs font-bold text-gray-900 mb-2">Available tests</h2>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${testsTab === 'ts' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900 border border-gray-200'}`}
                onClick={() => setTestsTab('ts')}
              >
                TS EAPCET
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${testsTab === 'ap' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900 border border-gray-200'}`}
                onClick={() => setTestsTab('ap')}
              >
                AP EAPCET
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {testsTab === 'ts' ? (
                  Object.entries((testsDataTs as { grouped?: Record<string, unknown[]> }).grouped || {})
                    .filter(([year]) => year !== 'mock')
                    .sort(([a], [b]) => (parseInt(b) || 0) - (parseInt(a) || 0))
                    .map(([year, yearTests]) => {
                      const tests = Array.isArray(yearTests) ? yearTests : []
                      return (
                        <div key={year} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            className="flex w-full justify-between items-center p-3 bg-gray-50 text-left text-gray-900"
                            onClick={() => toggleSection(year)}
                          >
                            <span className="font-semibold text-sm">TS EAPCET {year} Papers</span>
                            {expandedSection === year ? (
                              <ChevronUpIcon className="h-4 w-4 text-gray-700 shrink-0" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4 text-gray-700 shrink-0" />
                            )}
                          </button>
                          {expandedSection === year && (
                            <div className="p-2 space-y-2">
                              {tests.map((test: any) => (
                                <div
                                  key={test.test_id}
                                  className="w-full border border-gray-200 rounded-lg p-2.5 hover:border-blue-300 hover:bg-blue-50/50 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                                >
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-left flex-1 min-w-0"
                                  >
                                    <h4 className="font-semibold text-sm text-gray-900">{test.test_name}</h4>
                                    <div className="flex gap-3 text-xs text-gray-900 mt-0.5">
                                      <span>3 hours</span>
                                      <span>160 questions</span>
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (typeof window !== 'undefined') {
                                        window.localStorage.setItem('trialTestId', String(test.test_id))
                                        window.localStorage.setItem('redirectPath', '/onboarding')
                                      }
                                      if (isAuthenticated) {
                                        router.push('/onboarding')
                                      } else {
                                        router.push('/auth/register')
                                      }
                                    }}
                                    className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-500 hover:border-blue-600 rounded-md px-2.5 py-1.5 transition"
                                  >
                                    15 mins trial
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
              ) : (
                Object.entries((testsDataAp as { grouped?: Record<string, unknown[]> }).grouped || {})
                  .sort(([a], [b]) => (parseInt(b) || 0) - (parseInt(a) || 0))
                  .map(([year, yearTests]) => {
                    const tests = Array.isArray(yearTests) ? yearTests : []
                    return (
                      <div key={year} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          className="flex w-full justify-between items-center p-3 bg-gray-50 text-left text-gray-900"
                          onClick={() => toggleSection(year)}
                        >
                          <span className="font-semibold text-sm">
                            AP EAPCET {year === 'mock' ? 'Mock Tests' : `${year} Papers`}
                          </span>
                          {expandedSection === year ? (
                            <ChevronUpIcon className="h-4 w-4 text-gray-700 shrink-0" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4 text-gray-700 shrink-0" />
                          )}
                        </button>
                        {expandedSection === year && (
                          <div className="p-2 space-y-2">
                            {tests.map((test: any) => (
                                <div
                                  key={test.test_id}
                                  className="w-full border border-gray-200 rounded-lg p-2.5 hover:border-blue-300 hover:bg-blue-50/50 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                                >
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-left flex-1 min-w-0"
                                  >
                                    <h4 className="font-semibold text-sm text-gray-900">{test.test_name}</h4>
                                    <div className="flex gap-3 text-xs text-gray-900 mt-0.5">
                                      <span>3 hours</span>
                                      <span>160 questions</span>
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (typeof window !== 'undefined') {
                                        window.localStorage.setItem('trialTestId', String(test.test_id))
                                        window.localStorage.setItem('redirectPath', '/onboarding')
                                      }
                                      if (isAuthenticated) {
                                        router.push('/onboarding')
                                      } else {
                                        router.push('/auth/register')
                                      }
                                    }}
                                    className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-500 hover:border-blue-600 rounded-md px-2.5 py-1.5 transition"
                                  >
                                    15 mins trial
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )
                  })
              )}
            </div>

            {/* See what you'll get — full report card with static demo data */}
            <h2 className="text-sm font-bold text-gray-900 mb-1.5">See what you'll get</h2>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm">
              <LandingReportCard result={LANDING_DEMO_RESULT} />
            </div>

            {/* What students say — below report card, still in scroll area */}
            <div className="mt-4 mb-2">
              <h2 className="text-xs font-bold text-gray-900 mb-1.5 text-center">What students say</h2>
              <div className="relative overflow-hidden">
                <div className="flex animate-testimonial-scroll w-max">
                  {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-44 mx-1 bg-white rounded border border-gray-200 p-1.5"
                    >
                      <div className="flex gap-0.5 mb-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon key={star} className="h-2.5 w-2.5 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-[9px] text-gray-600 line-clamp-2 leading-tight">&quot;{testimonial.text}&quot;</p>
                      <p className="text-[8px] font-medium text-gray-800 mt-0.5">{testimonial.name}</p>
                    </div>
                  ))}
                </div>
              </div>
               {/* Pricing section: at bottom of scroll content; sticks to viewport bottom when it comes into view */}
            <div id="pricing" className="bottom-0 left-0 right-0 z-10 mt-6 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] container mx-auto px-2 py-2.5 max-w-4xl">
          {/* Cross moved to header (where Login was); spin wheel opens from there */}
          <p className="text-[10px] text-emerald-700 text-center mb-2">
            Money-back guarantee · refund within 48 hrs if not satisfied
          </p>
          {/* SINGLE PRICING (default): PRO only ₹299. For DUAL PRICING (299 BASIC + 399 PRO): uncomment the BASIC card block below. */}
          <div className="grid grid-cols-1 gap-2 mb-2">
            {/* DUAL PRICING — uncomment block below to show BASIC ₹299 + PRO ₹399
            BASIC Card:
            <div
              onClick={() => {
                setSelectedTier('BASIC')
                trackSelectPlan('BASIC', { value: getDisplayPriceRupees('BASIC', hasCoupon, spinWheelApplied) })
              }}
              className={`relative bg-white rounded-lg border-2 p-2.5 cursor-pointer transition-all ${
                selectedTier === 'BASIC'
                  ? 'border-blue-600 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="mt-1.5">
                <h3 className="text-sm font-bold text-gray-900">BASIC</h3>
                <p className="text-[10px] text-gray-600 mb-1.5">{basicPlan.label}</p>
                <div className="flex items-baseline mb-2 flex-wrap gap-x-1">
                  {spinWheelApplied ? (
                    <>
                      <span className="text-[10px] text-gray-500 line-through">₹{basicPlan.originalPrice}</span>
                      <span className="text-[10px] text-green-600 font-medium">50% off</span>
                      <span className="text-xl font-bold text-gray-900">₹{getDisplayPriceRupees('BASIC', hasCoupon, true)}</span>
                    </>
                  ) : hasCoupon ? (
                    <>
                      <span className="text-[10px] text-gray-500 line-through">₹{COUPON_DISPLAY_ORIGINAL_BASIC}</span>
                      <span className="text-[10px] text-green-600 font-medium">-₹{getCouponDiscountRupees('BASIC')} off</span>
                      <span className="text-xl font-bold text-gray-900">₹{getDisplayPriceRupees('BASIC', true, false)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-gray-500 line-through">₹{basicPlan.originalPrice}</span>
                      <span className="text-[10px] text-green-600 font-medium">-₹100</span>
                      <span className="text-xl font-bold text-gray-900">₹{getDisplayPriceRupees('BASIC', false, false)}</span>
                    </>
                  )}
                  <span className="text-[10px] text-gray-500 ml-0.5 block w-full">one-time</span>
                </div>
                <div className="space-y-1 mb-2">
                  {FEATURES_COMPARISON.map((feature, index) => (
                    <div key={index} className="flex items-start gap-1 text-[10px]">
                      {feature.basic ? (
                        <CheckIcon className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XMarkIcon className="h-3 w-3 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.basic ? 'text-gray-700 leading-tight' : 'text-gray-400 leading-tight'}>
                        {typeof feature.basic === 'string' ? `${feature.name}: ${feature.basic}` : feature.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                    selectedTier === 'BASIC' ? 'border-blue-600' : 'border-gray-300'
                  }`}>
                    {selectedTier === 'BASIC' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </div>
                  <span className="text-[10px] text-gray-600">Select</span>
                </div>
              </div>
            </div>
            */}

            {/* PRO Card */}
            <div
              onClick={() => {
                setSelectedTier('PRO')
                trackSelectPlan('PRO', { value: getLandingBDisplayPrice('PRO', false, spinWheelApplied) })
              }}
              className={`relative bg-white rounded-lg border-2 p-2.5 cursor-pointer transition-all ${
                selectedTier === 'PRO'
                  ? 'border-blue-600 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Popular & Rank Booster Unlimited Badges */}
              <div className="absolute -top-2 left-2 flex flex-row gap-1">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  POPULAR
                </span>
                <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  LIFETIME
                </span>
              </div>

              <div className="mt-1.5">
                <h3 className="text-sm font-bold text-gray-900">PRO</h3>
                <p className="text-[10px] text-gray-600 mb-1.5">{proPlan.label}</p>

                <div className="flex items-baseline mb-2 flex-wrap gap-x-1">
                  {spinWheelApplied ? (
                    <>
                      <span className="text-[10px] text-gray-500 line-through">₹{LANDING_B_PRO_ORIGINAL_PRICE}</span>
                      <span className="text-[10px] text-green-600 font-medium">50% off</span>
                      <span className="text-xl font-bold text-gray-900">₹{getLandingBDisplayPrice('PRO', false, true)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-gray-500 line-through">₹{LANDING_B_PRO_ORIGINAL_PRICE}</span>
                      <span className="text-[10px] text-green-600 font-medium">-₹{LANDING_B_PRO_ORIGINAL_PRICE - LANDING_B_PRO_PRICE} off</span>
                      <span className="text-xl font-bold text-gray-900">₹{getLandingBDisplayPrice('PRO', false, false)}</span>
                    </>
                  )}
                  <span className="text-[10px] text-gray-500 ml-0.5 block w-full">one-time</span>
                </div>

                {/* Features */}
                <div className="space-y-1 mb-2">
                  {FEATURES_COMPARISON.map((feature, index) => (
                    <div key={index} className="flex items-start gap-1 text-[10px]">
                      <CheckIcon className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 leading-tight">
                        {typeof feature.pro === 'string' ? `${feature.name}: ${feature.pro}` : feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Radio indicator */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                    selectedTier === 'PRO' ? 'border-blue-600' : 'border-gray-300'
                  }`}>
                    {selectedTier === 'PRO' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </div>
                  <span className="text-[10px] text-gray-600">Select</span>
                </div>
              </div>
            </div>
          </div>


          {/* Error Message */}
          {error && (
            <div className="mb-2 bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-md text-[10px]">
              {error}
            </div>
          )}

          {/* Try for Free Button */}
          <div className="mb-2">
            <button
              onClick={() => router.push('/dashboard?demo=true')}
              className="w-full bg-gray-100 border border-gray-200 text-gray-700 py-1.5 px-2 rounded-md font-medium text-[11px] hover:bg-gray-200 transition"
            >
              Doubtful? Check out eapcetpro for free
            </button>
          </div>

          {/* Payment Button */}
          <div className="flex gap-2">
            <button
              onClick={handlePayment}
              disabled={loading || !razorpayLoaded}
              className="flex-[1.75] bg-blue-600 text-white py-3 px-4 rounded-md font-bold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay ₹${getLandingBDisplayPrice('PRO', false, spinWheelApplied)} Now`
              )}
            </button>
            <button
              type="button"
              onClick={handleSharePaymentLink}
              disabled={shareLinkLoading}
              className="flex-1 border-2 border-blue-600 text-blue-600 py-2 px-3 rounded-md font-semibold text-xs hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {shareLinkLoading ? 'Creating...' : 'Share payment link'}
            </button>
          </div>
          {shareLinkError && (
            <p className="text-red-600 text-[10px] mt-1 text-center">{shareLinkError}</p>
          )}
          <div className="mt-1 text-center">
            <div className="flex items-center justify-center gap-1">
              <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-2" />
              <p className="text-[9px] text-gray-500">Secure payment by Razorpay</p>
            </div>
            <p className="text-[9px] text-gray-500">
              One-time payment • Rank Booster Unlimited
            </p>
          </div>
            </div>
            </div>

           
          </div>
        </div>
      </div>

      {/* Spin wheel modal — onResult only applies discount; modal stays open for countdown + Pay CTA */}
      {showSpinWheel && (
        <SpinWheel
          onResult={() => setSpinWheelApplied(true)}
          onClose={() => setShowSpinWheel(false)}
          onPayNow={handleSpinOfferPayment}
          onSharePaymentLink={async () => {
            if (!isAuthenticated) {
              localStorage.setItem('redirectPath', '/landing?shareLink=spin')
              router.push('/auth/register')
              return
            }
            setShareLinkError('')
            setShareLinkLoading(true)
            try {
              const res = await fetch('/api/payments/share-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: 'PRO', amount_rupees: 249 }),
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data.error || 'Failed to create link')
              setShareLinkUrl(data.url)
              setShowSpinWheel(false)
              setShowShareModal(true)
            } catch (err) {
              setShareLinkError(err instanceof Error ? err.message : 'Failed to create link')
            } finally {
              setShareLinkLoading(false)
            }
          }}
        />
      )}

      {/* Share payment link modal */}
      {showShareModal && shareLinkUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">Share payment link</h3>
            <p className="text-xs text-gray-600 mb-3">
              Send this link to someone to pay ₹{getLandingBDisplayPrice('PRO', false, spinWheelApplied)} for your account. They can pay without logging in.
            </p>
            <div className="flex gap-2 mb-2">
              <input
                ref={shareLinkInputRef}
                type="text"
                readOnly
                value={shareLinkUrl ?? ''}
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-2 bg-gray-50 text-gray-700"
                aria-label="Payment link"
              />
              <button
                type="button"
                onClick={copyShareLink}
                className="shrink-0 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 font-medium mb-3">
                Copied to clipboard. Share it with your parents or anyone to complete payment.
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="w-full border border-gray-300 text-gray-700 py-1 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default function LandingB() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <LandingBContent />
    </Suspense>
  )
}
