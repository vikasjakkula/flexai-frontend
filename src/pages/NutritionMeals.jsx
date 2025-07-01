import React, { useState } from 'react';

const preMeals = [
  { name: 'Banana & Peanut Butter', time: '30 mins before', breakdown: 'Carbs: 27g, Protein: 4g, Fat: 8g', desc: 'Quick energy and sustained fuel.', icon: '🍌' },
  { name: 'Oats with Milk', time: '45 mins before', breakdown: 'Carbs: 35g, Protein: 10g, Fat: 6g', desc: 'Slow-digesting carbs for lasting energy.', icon: '🥣' },
  { name: 'Greek Yogurt & Berries', time: '30 mins before', breakdown: 'Carbs: 18g, Protein: 12g, Fat: 2g', desc: 'Protein and antioxidants boost.', icon: '🍓' },
];
const postMeals = [
  { name: 'Grilled Chicken & Rice', time: 'Within 1 hr after', breakdown: 'Carbs: 40g, Protein: 30g, Fat: 5g', desc: 'Muscle recovery and glycogen refill.', icon: '🍗' },
  { name: 'Protein Shake & Banana', time: 'Within 30 mins after', breakdown: 'Carbs: 25g, Protein: 25g, Fat: 2g', desc: 'Quick protein and carbs.', icon: '🥤' },
  { name: 'Egg Omelette & Toast', time: 'Within 1 hr after', breakdown: 'Carbs: 20g, Protein: 18g, Fat: 10g', desc: 'Balanced recovery meal.', icon: '🍳' },
];

export default function NutritionMeals() {
  const [open, setOpen] = useState('pre');
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 mb-2">
        <button className={`px-4 py-2 rounded font-bold ${open === 'pre' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`} onClick={() => setOpen('pre')}>Pre-Workout Meals</button>
        <button className={`px-4 py-2 rounded font-bold ${open === 'post' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`} onClick={() => setOpen('post')}>Post-Workout Meals</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(open === 'pre' ? preMeals : postMeals).map((m, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border">
            <div className="text-2xl">{m.icon}</div>
            <div className="font-bold text-lg">{m.name}</div>
            <div className="text-xs text-gray-500">Best: {m.time}</div>
            <div className="text-xs text-gray-600">{m.breakdown}</div>
            <div className="text-sm text-gray-700 mt-1">{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 