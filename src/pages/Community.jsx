import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const tabs = [
  { name: 'Forum Q&A', path: 'forum' },
  { name: 'Share Progress Photos', path: 'photos' },
  { name: 'Comment on Workouts', path: 'workouts' },
];

export default function Community() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex gap-4 mb-6 border-b pb-2">
        {tabs.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `px-4 py-2 rounded-t font-bold ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`
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