'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import { CheckIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/solid'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { PlanTier, getProPlan, getBasicPlan, getOnboardingPaywallPriceRupees, getOnboardingPaywallOriginalRupees, SPIN_OFFER_RUPEES } from '@/utils/pricing'
import { QuestionContent } from '@/components/QuestionContent'
import { SpinWheel } from '@/components/SpinWheel'
import { trackInitiateCheckout, trackViewPaywall } from '@/lib/facebook-pixel'

const inter = Inter({ subsets: ['latin'] })

/** Single pricing = PRO only ₹299. Set to false when dual pricing (BASIC ₹299 + PRO ₹399) is uncommented below. */
const ONBOARDING_SINGLE_PRICING = true

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

// Paywall preview images (carousel) – order: report card, attempt analysis, overall time, quality time, maths, physics, chemistry
const PAYWALL_PREVIEW_IMAGES = [
  'report card.png',
  'attempt analysis.png',
  'overall time spent.png',
  'quality time spent.png',
  'maths question.png',
  'physics question.png',
  'chemistry question.png',
]

// Feature comparison for cards
const FEATURES_COMPARISON = [
  { name: 'All previous year papers', basic: true, pro: true },
  { name: 'Performance analytics', basic: true, pro: true },
  { name: 'Test attempts per paper', basic: '1 attempt', pro: 'Unlimited' },
  { name: 'Rank predictor', basic: false, pro: true },
]

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

// Rank Report Card Component - vertical layout, compact for grid (pie chart above, marks box below)
function RankReportCard() {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-2 w-full">
      <div className="text-[8px] font-medium mb-0.5 opacity-90">MARKS OBTAINED</div>
      <div className="text-base font-bold mb-1">
        120 / 160
      </div>
      <div className="space-y-0.5">
        <div className="text-[10px] font-semibold">Est. Rank: 150</div>
        <div className="text-[9px] opacity-90">Range: 130–170</div>
        <div className="flex flex-col gap-0.5 pt-1 border-t border-white/20 text-[8px]">
          <div><span className="opacity-80">Attempted:</span> 120</div>
          <div><span className="opacity-80">Accuracy:</span> 75%</div>
          <div><span className="opacity-80">Time:</span> 165m</div>
        </div>
      </div>
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

export default function Paywall() {
  const router = useRouter()
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
  // First cross or back/swipe → show spin wheel; second → go to dashboard
  const spinWheelShownFromCrossOrBackRef = useRef(false)
  const [testsData, setTestsData] = useState<any>(null)
  const [apTestsData, setApTestsData] = useState<any>(null)
  const [testsTab, setTestsTab] = useState<'ts' | 'ap'>('ts')
  const [expandedSection, setExpandedSection] = useState<string>('')

  const proPlan = getProPlan()
  const basicPlan = getBasicPlan()
  const paywallPrice = (tier: PlanTier) => getOnboardingPaywallPriceRupees(tier, ONBOARDING_SINGLE_PRICING, spinWheelApplied)

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

    // Verify authentication in background
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-session')
        const data = await response.json()

        if (!data.authenticated) {
          router.push('/auth/login')
          return
        }

        const userResponse = await fetch('/api/auth/user')
        const userData = await userResponse.json()
        setUserPhone(userData.phone || '')
      } catch (error) {
        console.error('Auth error:', error)
        setError('Authentication failed')
      }
    }

    checkAuth()
  }, [router])

  // Facebook Pixel: paywall view for retargeting
  useEffect(() => {
    trackViewPaywall()
  }, [])

  // Load tests data (same as landing page)
  useEffect(() => {
    fetch('/tests-data.json')
      .then((res) => res.json())
      .then((data) => {
        setTestsData(data)
        if (data?.grouped) {
          const years = Object.keys(data.grouped)
            .filter((y) => y !== 'mock')
            .sort((a, b) => (parseInt(b) || 0) - (parseInt(a) || 0))
          if (years.length > 0) setExpandedSection(years[0])
        }
      })
      .catch(() => setTestsData(null))
  }, [])
  useEffect(() => {
    fetch('/tests-data-ap.json')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setApTestsData(data))
      .catch(() => setApTestsData(null))
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSection((s) => (s === section ? '' : section))
  }

  // Back / swipe: first time show spin wheel, second time go to dashboard (same as cross button)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.history) return
    const state = { paywallBackGuard: true }
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

  const handleProPayment = async () => {
    // Verify authentication when payment is initiated
    const authCheck = await fetch('/api/auth/check-session')
    const authData = await authCheck.json()

    if (!authData.authenticated) {
      router.push('/auth/login')
      return
    }

    try {
      setError('')
      setLoading(true)

      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tier: 'PRO',
          amount_rupees: paywallPrice('PRO'),
          spin_wheel_applied: spinWheelApplied,
        }),
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

      trackInitiateCheckout({ value: data.amount / 100, currency: 'INR', content_name: `eapcetpro · PRO · ${proPlan.label}` })
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
  // To revert: Change back to handleBasicSubscription and use create-subscription API
  const handleBasicPayment = async () => {
    // Verify authentication when payment is initiated
    const authCheck = await fetch('/api/auth/check-session')
    const authData = await authCheck.json()

    if (!authData.authenticated) {
      router.push('/auth/login')
      return
    }

    try {
      setError('')
      setLoading(true)

      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tier: 'BASIC',
          amount_rupees: paywallPrice('BASIC'),
          spin_wheel_applied: spinWheelApplied,
        }),
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

      trackInitiateCheckout({ value: data.amount / 100, currency: 'INR', content_name: `eapcetpro · BASIC · ${basicPlan.label}` })
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
    if (selectedTier === 'PRO') {
      handleProPayment()
    } else {
      handleBasicPayment() // TEMPORARY: Changed from handleBasicSubscription
    }
  }

  /** Pay ₹249 from spin wheel modal — PRO with spin_wheel_applied so backend charges 249. */
  const handleSpinOfferPayment = async () => {
    const authCheck = await fetch('/api/auth/check-session')
    const authData = await authCheck.json()
    if (!authData.authenticated) {
      router.push('/auth/login')
      return
    }
    try {
      setError('')
      setLoading(true)
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier: 'PRO', amount_rupees: SPIN_OFFER_RUPEES, spin_wheel_applied: true }),
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
    setShareLinkError('')
    setShareLinkLoading(true)
    try {
      const amountRupees = paywallPrice(selectedTier)
      const res = await fetch('/api/payments/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedTier, amount_rupees: amountRupees }),
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
        {/* Close: first time → spin wheel, second time → dashboard */}
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
          className="absolute top-1 right-2 z-10 w-9 h-9 flex items-center justify-center rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-200 border border-gray-300/80 bg-white/90 transition shadow-sm"
          aria-label="Close"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Scrollable: header + What you'll get (vertical) */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="container mx-auto px-2 py-1.5 max-w-4xl">
            <div className="text-center mb-2">
              <h1 className="text-lg font-bold text-gray-900 mb-0.5">Choose Your Plan</h1>
              <p className="text-xs text-gray-600">Unlock all features and ace your EAPCET exam</p>
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
                !testsData ? (
                  <div className="text-center py-4 text-gray-900 text-sm">Loading TS EAPCET tests...</div>
                ) : (
                  Object.entries(testsData.grouped || {})
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
                                <div key={test.test_id} className="border border-gray-200 rounded-lg p-2.5">
                                  <h4 className="font-semibold text-sm text-gray-900">{test.test_name}</h4>
                                  <div className="flex gap-3 text-xs text-gray-900 mt-0.5">
                                    <span>3 hours</span>
                                    <span>160 questions</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                )
              ) : apTestsData?.grouped ? (
                Object.entries(apTestsData.grouped)
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
                              <div key={test.test_id} className="border border-gray-200 rounded-lg p-2.5">
                                <h4 className="font-semibold text-sm text-gray-900">{test.test_name}</h4>
                                <div className="flex gap-3 text-xs text-gray-900 mt-0.5">
                                  <span>3 hours</span>
                                  <span>160 questions</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
              ) : (
                <div className="text-center py-4 text-gray-900 text-sm">Loading AP EAPCET tests...</div>
              )}
            </div>

            {/* What you'll get - vertical scroll */}
            <h2 className="text-xs font-bold text-gray-900 mb-1.5">What you'll get</h2>
            <div className="space-y-3 pb-4">
              {PAYWALL_PREVIEW_IMAGES.map((filename, index) => (
                <div key={filename} className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/paywall-what-you-get-previews/${encodeURIComponent(filename)}`}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-auto block"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky bottom: pricing + coupon + CTA */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg container mx-auto px-2 py-2.5 max-w-4xl">
          {/* SINGLE PRICING (default): PRO only ₹299. For DUAL (BASIC ₹299 + PRO ₹399): set ONBOARDING_SINGLE_PRICING = false, uncomment BASIC block below, use grid-cols-2. */}
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 gap-2 mb-2">
            {/* DUAL PRICING — set ONBOARDING_SINGLE_PRICING = false above, uncomment block below, change grid to grid-cols-2
            <div
              onClick={() => setSelectedTier('BASIC')}
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
                      <span className="text-[10px] text-gray-500 line-through">₹{getOnboardingPaywallOriginalRupees('BASIC')}</span>
                      <span className="text-[10px] text-green-600 font-medium">50% off</span>
                      <span className="text-xl font-bold text-gray-900">₹{paywallPrice('BASIC')}</span>
                    </>
                  ) : hasCoupon ? (
                    <>
                      <span className="text-[10px] text-gray-500 line-through">₹{getOnboardingPaywallOriginalRupees('BASIC')}</span>
                      <span className="text-[10px] text-green-600 font-medium">-₹{getOnboardingPaywallOriginalRupees('BASIC') - paywallPrice('BASIC')} off</span>
                      <span className="text-xl font-bold text-gray-900">₹{paywallPrice('BASIC')}</span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-gray-900">₹{paywallPrice('BASIC')}</span>
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

            {/* PRO Card (single pricing) */}
            <div
              onClick={() => setSelectedTier('PRO')}
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
                      <span className="text-[10px] text-gray-500 line-through">₹{getOnboardingPaywallOriginalRupees('PRO')}</span>
                      <span className="text-[10px] text-green-600 font-medium">50% off</span>
                      <span className="text-xl font-bold text-gray-900">₹{paywallPrice('PRO')}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-gray-500 line-through">₹{getOnboardingPaywallOriginalRupees('PRO')}</span>
                      <span className="text-[10px] text-green-600 font-medium">-₹{getOnboardingPaywallOriginalRupees('PRO') - paywallPrice('PRO')} off</span>
                      <span className="text-xl font-bold text-gray-900">₹{paywallPrice('PRO')}</span>
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

          {/* Coupon */}

          {/* Testimonials Conveyor Belt - Compact (commented out)
          <div className="mb-1.5">
            <h2 className="text-xs font-bold text-gray-900 mb-1 text-center">What Students Say</h2>
            <div className="relative overflow-hidden">
              <div className="flex animate-testimonial-scroll w-max">
                {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, index) => (
                  <div key={index} className="flex-shrink-0 w-44 mx-1 bg-white rounded border border-gray-200 p-1.5">
                    <div className="flex gap-0.5 mb-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} className="h-2.5 w-2.5 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-[9px] text-gray-600 line-clamp-2 leading-tight">"{testimonial.text}"</p>
                    <p className="text-[8px] font-medium text-gray-800 mt-0.5">{testimonial.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          */}

          {/* Error Message */}
          {error && (
            <div className="mb-2 bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-md text-[10px]">
              {error}
            </div>
          )}

          {/* Try for Free Button (commented out)
          <div className="mb-2">
            <button
              onClick={() => router.push('/dashboard?demo=true')}
              className="w-full bg-gray-100 border border-gray-200 text-gray-700 py-1.5 px-2 rounded-md font-medium text-[11px] hover:bg-gray-200 transition"
            >
              Doubtful? Check out eapcetpro for free
            </button>
          </div>
          */}

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
              ) : selectedTier === 'PRO' ? (
                `Pay ₹${paywallPrice('PRO')} Now`
              ) : (
                `Pay ₹${paywallPrice('BASIC')} Now`
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
              {selectedTier === 'PRO' ? 'One-time payment • Rank Booster Unlimited' : `One-time payment • ${basicPlan.label} access`}
            </p>
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
              Send this link to someone to pay ₹{paywallPrice(selectedTier)} for your account. They can pay without logging in.
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
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
