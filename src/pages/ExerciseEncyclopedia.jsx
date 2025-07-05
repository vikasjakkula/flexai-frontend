import React from 'react';
import TraditionalDocWorkflowCard from '../components/TraditionalDocWorkflowCard';

const exercises = [
  { name: 'Bench Press', img: '/1.png?updated', primary: 'Chest', secondary: 'Triceps, Shoulders', tips: 'Keep your back tight and feet flat.' },
  { name: 'Pull-Up', img: '/2.png?updated', primary: 'Back', secondary: 'Biceps', tips: 'Go full range, avoid swinging.' },
  { name: 'Squat', img: '/3.png?updated', primary: 'Legs', secondary: 'Glutes, Core', tips: 'Keep chest up, knees out.' },
];

export default function ExerciseEncyclopedia() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <TraditionalDocWorkflowCard />
      <h2 className="text-xl font-bold mb-4">📚 Exercise Encyclopedia</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exercises.map(ex => (
          <div key={ex.name} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
            <img src={ex.img} alt={ex.name} className="rounded w-full h-32 object-cover mb-2" />
            <div className="font-semibold text-lg">{ex.name}</div>
            <div>💪 <b>Primary:</b> {ex.primary}</div>
            <div>🦾 <b>Secondary:</b> {ex.secondary}</div>
            <div>💡 <b>Tip:</b> {ex.tips}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 