'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import { CheckIcon, XMarkIcon, StarIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { PlanTier, getProPlan, getBasicPlan, getDisplayPriceRupees } from '@/utils/pricing'
import { QuestionContent } from '@/components/QuestionContent'
import { RadarChart } from '@/components/charts/RadarChart'
import { trackInitiateCheckout } from '@/lib/facebook-pixel'

const inter = Inter({ subsets: ['latin'] })

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
    question_text: 'An alkene <fmath alttext="X" class="fm-inline"><mi class="fm-mi-length-1" mathvariant="italic" style="padding-right: 0.44ex;">X</mi></fmath> on ozonolysis gives a mixture of simplest ketone <fmath alttext="(Y)" class="fm-inline"><mrow><mo class="fm-mo-Luc">(</mo><mi class="fm-mi-length-1" mathvariant="italic" style="padding-right: 0.44ex;">Y</mi><mo class="fm-mo-Luc">)</mo></mrow></fmath> and 3-pentanone. The IUPAC name of the alkene <fmath alttext="X" class="fm-inline"><mi class="fm-mi-length-1" mathvariant="italic" style="padding-right: 0.44ex;">X</mi></fmath> is<br>',
    option_a: '2, 3-dimethylbut-2-ene',
    option_b: '3-ethyl-4-methylpent-3-ene',
    option_c: '3-ethyl-2-methylpent-2-ene',
    option_d: '2-methyl-3-ethylpent-2-ene',
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
  const size = 160
  const strokeWidth = 20
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
        <div className="text-3xl font-bold text-gray-900">{total}</div>
        <div className="text-xs text-gray-600">Total Qs</div>
      </div>
    </div>
  )
}

// Rank Report Card Component
function RankReportCard() {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-3 w-full">
      <div className="text-[9px] font-medium mb-1 opacity-90">MARKS OBTAINED</div>
      <div className="text-2xl font-bold mb-2">
        120 / 160
      </div>
      <div className="space-y-1.5">
        <div className="text-xs font-semibold">
          Estimated Rank: 150
        </div>
        <div className="text-[10px] opacity-90">
          Rank Range: 130 - 170
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20">
          <div>
            <div className="text-[9px] opacity-80">Attempted</div>
            <div className="text-xs font-semibold">120 Qs</div>
          </div>
          <div>
            <div className="text-[9px] opacity-80">Accuracy</div>
            <div className="text-xs font-semibold">75%</div>
          </div>
          <div>
            <div className="text-[9px] opacity-80">Time</div>
            <div className="text-xs font-semibold">165m</div>
          </div>
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
  const height = 200

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
  const height = 240
  const padding = 40

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
  const height = 240
  const padding = 40

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

// Question Card Component (Full Card)
function QuestionCard({ question, questionNumber }: { question: any; questionNumber: number }) {
  const sectionName = question.section_id.includes('mathematics') ? 'Maths' :
                      question.section_id.includes('physics') ? 'Physics' : 'Chemistry'
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-blue-600">Q{questionNumber}</span>
        <span className="text-[10px] text-gray-500">{sectionName}</span>
      </div>
      <div className="text-xs text-gray-700 mb-3 flex-1 overflow-y-auto">
        <QuestionContent html={question.question_text} className="text-xs" />
      </div>
      <div className="space-y-1.5">
        {['a', 'b', 'c', 'd'].map(opt => (
          <div key={opt} className="flex items-start gap-1.5 text-[11px] p-1.5 bg-gray-50 rounded">
            <span className="text-gray-600 font-medium">{opt}.</span>
            <div className="text-gray-700 flex-1">
              <QuestionContent html={question[`option_${opt}`]} className="text-[11px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Payment() {
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState<PlanTier>('PRO')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [cardWidth, setCardWidth] = useState(320)

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

    // Verify authentication in background
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-session')
        const data = await response.json()

        if (!data.authenticated) {
          localStorage.setItem('redirectPath', '/payment')
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


  // Update carousel dots indicator and card width
  useEffect(() => {
    const carousel = document.getElementById('analytics-carousel')
    if (!carousel) return

    const updateCardWidth = () => {
      const firstCard = carousel.querySelector('div > div')
      if (firstCard) {
        const width = firstCard.getBoundingClientRect().width
        setCardWidth(width - 24) // Subtract padding (p-3 = 12px each side = 24px)
      }
    }

    const updateDots = () => {
      const scrollLeft = carousel.scrollLeft
      const cards = carousel.querySelectorAll('div > div')
      if (cards.length === 0) return
      
      // Find which card is most centered/visible in the viewport
      const carouselRect = carousel.getBoundingClientRect()
      const viewportCenter = carouselRect.left + carouselRect.width / 2
      
      let closestCardIndex = 0
      let minDistance = Infinity
      
      cards.forEach((card, index) => {
        const cardElement = card as HTMLElement
        const cardRect = cardElement.getBoundingClientRect()
        const cardCenter = cardRect.left + cardRect.width / 2
        const distance = Math.abs(viewportCenter - cardCenter)
        
        if (distance < minDistance) {
          minDistance = distance
          closestCardIndex = index
        }
      })
      
      setCurrentCardIndex(Math.min(Math.max(0, closestCardIndex), cards.length - 1))
    }

    // Initial update
    const timer = setTimeout(() => {
      updateCardWidth()
      updateDots()
    }, 100)

    // Throttle scroll updates for better performance
    let scrollTimeout: NodeJS.Timeout | null = null
    const throttledUpdateDots = () => {
      if (scrollTimeout) return
      updateDots()
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null
      }, 50)
    }

    // Use scroll, scrollend, and touchmove events for better mobile support
    carousel.addEventListener('scroll', throttledUpdateDots, { passive: true })
    carousel.addEventListener('scrollend', updateDots, { passive: true })
    carousel.addEventListener('touchmove', throttledUpdateDots, { passive: true })
    carousel.addEventListener('touchend', updateDots, { passive: true })
    window.addEventListener('resize', updateCardWidth)

    return () => {
      clearTimeout(timer)
      if (scrollTimeout) clearTimeout(scrollTimeout)
      carousel.removeEventListener('scroll', throttledUpdateDots)
      carousel.removeEventListener('scrollend', updateDots)
      carousel.removeEventListener('touchmove', throttledUpdateDots)
      carousel.removeEventListener('touchend', updateDots)
      window.removeEventListener('resize', updateCardWidth)
    }
  }, [])

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
        body: JSON.stringify({ tier: 'PRO' }),
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
            localStorage.removeItem('selectedPlanDuration')
            localStorage.removeItem('purchaseIntent')
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
        body: JSON.stringify({ tier: 'BASIC' }),
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
              localStorage.removeItem('selectedPlanDuration')
              localStorage.removeItem('purchaseIntent')
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

  return (
    <div className={`h-screen bg-gray-50 overflow-hidden flex flex-col ${inter.className}`}>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="container mx-auto px-2 py-2 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-2">
            <h1 className="text-lg font-bold text-gray-900 mb-0.5">Choose Your Plan</h1>
            <p className="text-xs text-gray-600">Unlock all features and ace your EAPCET exam</p>
          </div>

          {/* Trusted Badge */}
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


          {/* Pricing Cards - Smaller */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* BASIC Card */}
            <div
              onClick={() => setSelectedTier('BASIC')}
              className={`relative bg-white rounded-lg border-2 p-2.5 cursor-pointer transition-all ${
                selectedTier === 'BASIC'
                  ? 'border-blue-600 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Badge - TEMPORARY: Removed FREE TRIAL badge due to one-time purchase */}
              {/* <div className="absolute -top-2 left-2">
                <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  FREE TRIAL
                    </span>
              </div> */}

              <div className="mt-1.5">
                <h3 className="text-sm font-bold text-gray-900">BASIC</h3>
                <p className="text-[10px] text-gray-600 mb-1.5">{basicPlan.label}</p>

                <div className="flex items-baseline mb-2 flex-wrap gap-x-1">
                  <span className="text-[10px] text-gray-500 line-through">₹{basicPlan.originalPrice}</span>
                  <span className="text-[10px] text-green-600 font-medium">-₹{basicPlan.originalPrice - basicPlan.price} off</span>
                  <span className="text-xl font-bold text-gray-900">₹{getDisplayPriceRupees('BASIC')}</span>
                  <span className="text-[10px] text-gray-500 ml-0.5">one-time</span>
                </div>

                {/* Features */}
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

                {/* Radio indicator */}
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

            {/* PRO Card */}
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
                  RANK BOOSTER UNLIMITED
                </span>
              </div>

              <div className="mt-1.5">
                <h3 className="text-sm font-bold text-gray-900">PRO</h3>
                <p className="text-[10px] text-gray-600 mb-1.5">{proPlan.label}</p>

                <div className="flex items-baseline mb-2 flex-wrap gap-x-1">
                  <span className="text-[10px] text-gray-500 line-through">₹{proPlan.originalPrice}</span>
                  <span className="text-[10px] text-green-600 font-medium">-₹{proPlan.originalPrice - proPlan.price} off</span>
                  <span className="text-xl font-bold text-gray-900">₹{getDisplayPriceRupees('PRO')}</span>
                  <span className="text-[10px] text-gray-500 ml-0.5">one-time</span>
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

          {/* Testimonials Conveyor Belt - Compact */}
          <div className="mb-2 overflow-hidden">
            <h2 className="text-xs font-bold text-gray-900 mb-1.5 text-center">What Students Say</h2>
            <div className="relative">
              <div className="flex animate-scroll">
                {/* Duplicate testimonials for seamless loop */}
                {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-56 mx-1.5 bg-white rounded-lg border border-gray-200 p-2"
                  >
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} className="h-3 w-3 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-600 mb-1.5 line-clamp-2 leading-tight">"{testimonial.text}"</p>
                    <div className="flex items-center gap-1.5">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-[9px] text-gray-500">{testimonial.college}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
              className="w-full bg-gray-100 border border-gray-200 text-gray-700 py-2 px-3 rounded-md font-medium text-xs hover:bg-gray-200 transition"
            >
              Doubtful? Check out eapcetpro for free
            </button>
          </div>

          {/* Analytics Preview Section - Swipeable Cards */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-xs font-bold text-gray-900">See What You'll Get</h2>
              <div className="flex items-center gap-1 text-[9px] text-gray-500">
                <span>Swipe</span>
                <ChevronRightIcon className="h-3 w-3" />
              </div>
            </div>
            
            {/* Horizontal Scrollable Cards */}
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory" id="analytics-carousel">
                <div className="flex gap-2 justify-center" style={{ width: 'max-content' }}>
                  {/* Card 1: Donut Chart + Rank Report */}
                  <div className="flex-shrink-0 w-[calc(100vw-1rem)] snap-start bg-white rounded-lg border border-gray-200 p-3 shadow-sm flex flex-col">
                    <h3 className="text-[10px] font-semibold text-gray-900 mb-2">Attempt Analysis</h3>
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <DonutChartPreview />
                      <RankReportCard />
                    </div>
                  </div>

                  {/* Cards 2-4: Individual Question Cards */}
                  {SAMPLE_QUESTIONS.map((q, idx) => (
                    <div key={idx} className="flex-shrink-0 w-[calc(100vw-1rem)] snap-start bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                      <QuestionCard question={q} questionNumber={q.question_number} />
                    </div>
                  ))}

                  {/* Card 5: Time Analytics */}
                  <div className="flex-shrink-0 w-[calc(100vw-1rem)] snap-start bg-white rounded-lg border border-gray-200 p-3 shadow-sm flex flex-col" style={{ minHeight: '280px' }}>
                    <h3 className="text-[10px] font-semibold text-gray-900 mb-2">Quality of Time Spent</h3>
                    <div className="flex-1">
                      <TimeBarChartPreview />
                    </div>
                  </div>

                  {/* Card 6: Performance Growth Area Chart */}
                  <div className="flex-shrink-0 w-[calc(100vw-1rem)] snap-start bg-white rounded-lg border border-gray-200 p-3 shadow-sm flex flex-col" style={{ minHeight: '280px' }}>
                    <h3 className="text-[10px] font-semibold text-gray-900 mb-2">Performance Growth</h3>
                    <div className="flex-1 w-full">
                      <FullWidthAreaChart 
                        data={[
                          { x: 1, y: 85 },
                          { x: 2, y: 92 },
                          { x: 3, y: 105 },
                          { x: 4, y: 115 },
                          { x: 5, y: 120 },
                        ]}
                        color="#3b82f6"
                      />
                    </div>
                  </div>

                  {/* Card 7: Subject Time Trends - Maths */}
                  <div className="flex-shrink-0 w-[calc(100vw-1rem)] snap-start bg-white rounded-lg border border-gray-200 p-3 shadow-sm flex flex-col" style={{ minHeight: '280px' }}>
                    <h3 className="text-[10px] font-semibold text-gray-900 mb-2">Maths Time Trend</h3>
                    <div className="flex-1 w-full">
                      <FullWidthLineChart 
                        data={[
                          { x: 1, y: 65 },
                          { x: 2, y: 68 },
                          { x: 3, y: 62 },
                          { x: 4, y: 60 },
                          { x: 5, y: 58 },
                        ]}
                        color="#3b82f6"
                        valueUnit="min"
                      />
                    </div>
                  </div>

                  {/* Card 8: Subject Time Trends - Physics */}
                  <div className="flex-shrink-0 w-[calc(100vw-1rem)] snap-start bg-white rounded-lg border border-gray-200 p-3 shadow-sm flex flex-col" style={{ minHeight: '280px' }}>
                    <h3 className="text-[10px] font-semibold text-gray-900 mb-2">Physics Time Trend</h3>
                    <div className="flex-1 w-full">
                      <FullWidthLineChart 
                        data={[
                          { x: 1, y: 32 },
                          { x: 2, y: 30 },
                          { x: 3, y: 28 },
                          { x: 4, y: 27 },
                          { x: 5, y: 25 },
                        ]}
                        color="#10b981"
                        valueUnit="min"
                      />
                    </div>
                  </div>

                  {/* Card 9: Subject Time Trends - Chemistry */}
                  <div className="flex-shrink-0 w-[calc(100vw-1rem)] snap-start bg-white rounded-lg border border-gray-200 p-3 shadow-sm flex flex-col" style={{ minHeight: '280px' }}>
                    <h3 className="text-[10px] font-semibold text-gray-900 mb-2">Chemistry Time Trend</h3>
                    <div className="flex-1 w-full">
                      <FullWidthLineChart 
                        data={[
                          { x: 1, y: 28 },
                          { x: 2, y: 26 },
                          { x: 3, y: 25 },
                          { x: 4, y: 24 },
                          { x: 5, y: 22 },
                        ]}
                        color="#f59e0b"
                        valueUnit="min"
                      />
                    </div>
                  </div>

                  {/* Card 10: Radar Chart - Subject Performance */}
                  <div className="flex-shrink-0 w-[calc(100vw-1rem)] snap-start bg-white rounded-lg border border-gray-200 p-3 shadow-sm flex flex-col" style={{ minHeight: '280px' }}>
                    <h3 className="text-[10px] font-semibold text-gray-900 mb-2">Subject Performance</h3>
                    <div className="flex-1 w-full flex items-center justify-center">
                      <RadarChart 
                        data={[
                          { label: 'Maths', value: 65, maxValue: 80 },
                          { label: 'Physics', value: 32, maxValue: 40 },
                          { label: 'Chemistry', value: 28, maxValue: 40 },
                        ]}
                        width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 64, 280) : 280}
                        height={typeof window !== 'undefined' ? Math.min(window.innerWidth - 64, 280) : 280}
                        colors={['#3b82f6', '#f97316', '#10b981']}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Dots Indicator */}
              <div className="flex justify-center gap-1.5 mt-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((idx) => (
                  <div
                    key={idx}
                    className={`rounded-full transition-all ${
                      currentCardIndex === idx
                        ? 'w-6 h-1.5 bg-blue-600'
                        : 'w-1.5 h-1.5 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Button - Fixed at bottom */}
      <div className="bg-white border-t border-gray-200 p-3 shadow-lg">
          <button
            onClick={handlePayment}
            disabled={loading || !razorpayLoaded}
          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md font-bold text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
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
            `Pay ₹${getDisplayPriceRupees('PRO')} Now`
          ) : (
            `Pay ₹${getDisplayPriceRupees('BASIC')} Now`
          )}
          </button>
        <div className="mt-1.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-2.5" />
            <p className="text-[10px] text-gray-500">Secure payment by Razorpay</p>
          </div>
          <p className="text-[10px] text-gray-500">
            {selectedTier === 'PRO' ? 'One-time payment • Rank Booster Unlimited' : `One-time payment • ${basicPlan.label} access`}
          </p>
        </div>
      </div>

      {/* CSS for infinite scroll animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
