import React, { useState } from 'react';

const plans = {
  gain: {
    name: 'Weight Gain Plan',
    meals: [
      { meal: 'Breakfast', items: ['Oats with milk', 'Boiled eggs', 'Banana'], cal: 450 },
      { meal: 'Lunch', items: ['Chicken breast', 'Rice', 'Veggies'], cal: 600 },
      { meal: 'Snack', items: ['Peanut butter toast', 'Greek yogurt'], cal: 300 },
      { meal: 'Dinner', items: ['Paneer curry', 'Chapati', 'Salad'], cal: 550 },
    ],
  },
  loss: {
    name: 'Weight Loss Plan',
    meals: [
      { meal: 'Breakfast', items: ['Scrambled eggs', 'Apple'], cal: 250 },
      { meal: 'Lunch', items: ['Grilled fish', 'Quinoa', 'Broccoli'], cal: 400 },
      { meal: 'Snack', items: ['Carrot sticks', 'Hummus'], cal: 150 },
      { meal: 'Dinner', items: ['Tofu stir-fry', 'Brown rice'], cal: 350 },
    ],
  },
};

export default function NutritionPlans() {
  const [tab, setTab] = useState('gain');
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-4">
      <div className="flex gap-2 mb-2">
        <button className={`px-4 py-2 rounded font-bold ${tab === 'gain' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`} onClick={() => setTab('gain')}>Weight Gain Plan</button>
        <button className={`px-4 py-2 rounded font-bold ${tab === 'loss' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`} onClick={() => setTab('loss')}>Weight Loss Plan</button>
      </div>
      <div className="flex flex-col gap-3">
        {plans[tab].meals.map((m, i) => (
          <div key={i} className="bg-gray-50 rounded p-3 border flex flex-col gap-1">
            <div className="font-bold">{m.meal}</div>
            <div className="text-sm text-gray-700">{m.items.join(', ')}</div>
            <div className="text-xs text-gray-500">Approx. {m.cal} kcal</div>
          </div>
        ))}
      </div>
      <button className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded font-bold w-max self-end">Download Full Plan (PDF)</button>
    </div>
  );
} 