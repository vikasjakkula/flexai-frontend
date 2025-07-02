import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

export default function Tips() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <nav className="flex flex-wrap gap-3 mb-6 justify-center">
        <NavLink to="personalized" className={({isActive}) => isActive ? 'font-bold text-blue-600' : 'text-gray-600'}>Personalized Suggestions</NavLink>
        <NavLink to="ask" className={({isActive}) => isActive ? 'font-bold text-blue-600' : 'text-gray-600'}>Ask Diet/Workout Queries</NavLink>
        <NavLink to="mistakes" className={({isActive}) => isActive ? 'font-bold text-blue-600' : 'text-gray-600'}>Top Mistakes</NavLink>
        <NavLink to="hypertrophy" className={({isActive}) => isActive ? 'font-bold text-blue-600' : 'text-gray-600'}>Science Behind Hypertrophy</NavLink>
      </nav>
      <Outlet />
    </div>
  );
} 