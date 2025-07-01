import React from 'react';

const foods = [
  { name: 'Eggs', protein: '13g', img: '🥚' },
  { name: 'Chicken Breast', protein: '31g', img: '🍗' },
  { name: 'Lentils', protein: '9g', img: '🌱' },
  { name: 'Tofu', protein: '8g', img: '🍥' },
  { name: 'Fish', protein: '22g', img: '🐟' },
  { name: 'Whey Protein', protein: '80g', img: '🧃' },
  { name: 'Greek Yogurt', protein: '10g', img: '🥛' },
  { name: 'Cottage Cheese', protein: '11g', img: '🧀' },
];

export default function NutritionProtein() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {foods.map((f, i) => (
        <div key={i} className="bg-white rounded-xl shadow p-4 flex flex-col items-center gap-2 border">
          <div className="text-4xl">{f.img}</div>
          <div className="font-bold text-lg">{f.name}</div>
          <div className="text-sm text-gray-600">Protein: {f.protein} / 100g</div>
          <button className="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded text-xs">Add to Meal Plan</button>
        </div>
      ))}
    </div>
  );
} 