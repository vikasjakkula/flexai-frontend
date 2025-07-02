import React, { useState } from 'react';

const mistakes = [
  {
    title: '❌ Skipping Warm-Up',
    why: 'It increases injury risk and reduces performance.',
    fix: '✅ Fix: Always warm up with dynamic movements like jumping jacks or mobility drills.'
  },
  {
    title: '❌ Lifting Too Heavy, Too Soon',
    why: 'Trying to lift too much weight early on can lead to poor form and injuries.',
    fix: '✅ Fix: Start light, master your form, and progress gradually.'
  },
  
  {
    title: '❌ Not Tracking Progress',
    why: "Without tracking, it's hard to know what's working and what's not.",
    fix: '✅ Fix: Keep a workout log or use an app to monitor your progress.'
  },
  {
    title: '❌ Neglecting Nutrition',
    why: 'Muscle growth and fat loss depend on proper nutrition as much as training.',
    fix: '✅ Fix: Prioritize protein, eat enough calories, and stay hydrated.'
  },
  {
    title: '❌ Overtraining',
    why: 'Training too often without rest can lead to burnout and injury.',
    fix: '✅ Fix: Schedule rest days and listen to your body.'
  },
  {
    title: '❌ Poor Sleep Habits',
    why: 'Lack of sleep impairs recovery and muscle growth.',
    fix: '✅ Fix: Aim for 7–9 hours of quality sleep each night.'
  },
];

export default function TopMistakes() {
  const [open, setOpen] = useState(null);
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Top Mistakes Beginners Make</h2>
      <div className="flex flex-col gap-4">
        {mistakes.map((m, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 cursor-pointer" onClick={() => setOpen(open === i ? null : i)}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">{m.title}</span>
              <span>{open === i ? '▲' : '▼'}</span>
            </div>
            {open === i && (
              <div className="mt-2 text-gray-700">
                <div className="mb-2">👉 {m.why}</div>
                <div>{m.fix}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 