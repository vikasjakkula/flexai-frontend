import React, { useState } from 'react';

const exercises = ['Bench Press', 'Pull-Up', 'Squat', 'Push-Up', 'Deadlift'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MyRoutines() {
  const [routine, setRoutine] = useState({ name: '', exercises: [], days: [] });
  const [routines, setRoutines] = useState([]);

  function handleChange(e) {
    setRoutine({ ...routine, [e.target.name]: e.target.value });
  }
  function handleExercise(e) {
    const val = e.target.value;
    setRoutine(r => ({ ...r, exercises: r.exercises.includes(val) ? r.exercises.filter(x => x !== val) : [...r.exercises, val] }));
  }
  function handleDay(e) {
    const val = e.target.value;
    setRoutine(r => ({ ...r, days: r.days.includes(val) ? r.days.filter(x => x !== val) : [...r.days, val] }));
  }
  function handleSubmit(e) {
    e.preventDefault();
    setRoutines([...routines, routine]);
    setRoutine({ name: '', exercises: [], days: [] });
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">📝 My Routines</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-white rounded-xl shadow p-5 mb-6">
        <label>Routine Name <input name="name" value={routine.name} onChange={handleChange} className="border rounded px-3 py-2 w-full mt-1" required /></label>
        <label>Exercises
          <div className="flex flex-wrap gap-2 mt-1">
            {exercises.map(ex => (
              <label key={ex} className="flex items-center gap-1">
                <input type="checkbox" value={ex} checked={routine.exercises.includes(ex)} onChange={handleExercise} /> {ex}
              </label>
            ))}
          </div>
        </label>
        <label>Days
          <div className="flex flex-wrap gap-2 mt-1">
            {days.map(day => (
              <label key={day} className="flex items-center gap-1">
                <input type="checkbox" value={day} checked={routine.days.includes(day)} onChange={handleDay} /> {day}
              </label>
            ))}
          </div>
        </label>
        <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2 mt-2">Save Routine</button>
      </form>
      <div className="bg-blue-50 rounded-xl shadow p-4">
        <h3 className="font-semibold mb-2">Saved Routines</h3>
        <div className="flex flex-col gap-2">
          {routines.length === 0 && <div className="text-gray-500">No routines yet.</div>}
          {routines.map((r, i) => (
            <div key={i} className="flex flex-col gap-1 bg-white rounded p-3 shadow">
              <div>📋 <b>{r.name}</b></div>
              <div>🏋️ Exercises: {r.exercises.join(', ')}</div>
              <div>📅 Days: {r.days.join(', ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 