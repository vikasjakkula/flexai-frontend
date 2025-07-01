import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const tabs = [
  { name: 'Protein-rich Foods', path: 'protein' },
  { name: 'Pre/Post-Workout Meals', path: 'meals' },
  { name: 'Weight Gain/Loss Plans', path: 'plans' },
];

export default function Nutrition() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex gap-4 mb-6 border-b pb-2">
        {tabs.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `px-4 py-2 rounded-t font-bold ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`
            }
            end
          >
            {tab.name}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
} 