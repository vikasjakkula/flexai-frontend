import React from 'react';

export default function HypertrophyScience() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Science Behind Hypertrophy</h2>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white rounded-xl shadow p-5 flex flex-col gap-3">
          <h3 className="font-semibold text-lg mb-2">✅ What is Hypertrophy?</h3>
          <p>Hypertrophy is the enlargement of muscle fibers due to resistance training. It happens when micro-tears in muscle fibers are repaired and rebuilt stronger.</p>
          <h3 className="font-semibold text-lg mt-4 mb-2">✅ Types</h3>
          <ul className="list-disc ml-6">
            <li><b>Myofibrillar:</b> Focused on strength (heavy weight, low reps)</li>
            <li><b>Sarcoplasmic:</b> Focused on size (moderate weight, high reps)</li>
          </ul>
        </div>
        <div className="flex-1 bg-white rounded-xl shadow p-5 flex flex-col gap-3">
          <h3 className="font-semibold text-lg mb-2">✅ Key Training Variables</h3>
          <ul className="list-disc ml-6">
            <li>Progressive overload</li>
            <li>Rest time (60–90s)</li>
            <li>Volume & intensity</li>
            <li>Mind-muscle connection</li>
          </ul>
          <h3 className="font-semibold text-lg mt-4 mb-2">✅ Nutrition & Recovery</h3>
          <ul className="list-disc ml-6">
            <li>Protein intake: 1.6–2.2g/kg</li>
            <li>Sleep: 7–9 hours/night</li>
            <li>Active recovery: light cardio, stretching</li>
          </ul>
          <div className="flex gap-2 mt-4">
            <button className="bg-blue-500 text-white rounded px-3 py-2">Watch Hypertrophy Science Video</button>
            <button className="bg-green-500 text-white rounded px-3 py-2">Download PDF Guide</button>
            <button className="bg-purple-500 text-white rounded px-3 py-2">Try Hypertrophy Plan</button>
          </div>
        </div>
      </div>
    </div>
  );
} 