import React, { useState } from 'react';

const initialLog = { date: '', bodyPart: '', reps: '', sets: '' };
const bodyParts = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core'];

export default function WorkoutLogs() {
  const [log, setLog] = useState(initialLog);
  const [logs, setLogs] = useState([]);

  function handleChange(e) {
    setLog({ ...log, [e.target.name]: e.target.value });
  }
  function handleSubmit(e) {
    e.preventDefault();
    setLogs([...logs, log]);
    setLog(initialLog);
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">🏋️ Workout Logs</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-white rounded-xl shadow p-5 mb-6">
        <label>Date <input type="date" name="date" value={log.date} onChange={handleChange} className="border rounded px-3 py-2 w-full mt-1" required /></label>
        <label>Body Part
          <select name="bodyPart" value={log.bodyPart} onChange={handleChange} className="border rounded px-3 py-2 w-full mt-1" required>
            <option value="">Select</option>
            {bodyParts.map(bp => <option key={bp}>{bp}</option>)}
          </select>
        </label>
        <label>Reps <input type="number" name="reps" value={log.reps} onChange={handleChange} className="border rounded px-3 py-2 w-full mt-1" required min={1} /></label>
        <label>Sets <input type="number" name="sets" value={log.sets} onChange={handleChange} className="border rounded px-3 py-2 w-full mt-1" required min={1} /></label>
        <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2 mt-2">Add Log</button>
      </form>
      <div className="bg-blue-50 rounded-xl shadow p-4">
        <h3 className="font-semibold mb-2">This Week's Logs</h3>
        <div className="flex flex-col gap-2">
          {logs.length === 0 && <div className="text-gray-500">No logs yet.</div>}
          {logs.map((l, i) => (
            <div key={i} className="flex gap-3 items-center text-sm">
              <span>📅 {l.date}</span>
              <span>💪 {l.bodyPart}</span>
              <span>🔢 {l.reps} reps x {l.sets} sets</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 