import React, { useState } from 'react';

const initialState = {
  age: '',
  gender: '',
  goal: '',
  activity: '',
};

const suggestionsMap = {
  'Weight Loss': {
    calories: '1,500–1,800 kcal',
    workout: 'HIIT/Cardio + Full Body',
    rest: 2,
    protein: '1.6g/kg',
    tip: 'Small steps, big results!'
  },
  'Muscle Gain': {
    calories: '2,200–2,800 kcal',
    workout: 'Push-Pull-Legs',
    rest: 1,
    protein: '2.0g/kg',
    tip: 'Consistency beats intensity!'
  },
  'Maintenance': {
    calories: '1,800–2,200 kcal',
    workout: 'Upper/Lower Split',
    rest: 2,
    protein: '1.8g/kg',
    tip: 'Balance is key!'
  }
};

export default function PersonalizedSuggestions() {
  const [form, setForm] = useState(initialState);
  const [result, setResult] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (form.goal && form.activity && form.gender && form.age) {
      setResult(suggestionsMap[form.goal]);
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white rounded-xl shadow p-6">
        <label>
          Age
          <input type="number" name="age" value={form.age} onChange={handleChange} className="border rounded px-3 py-2 w-full mt-1" required min={10} max={100} />
        </label>
        <label>
          Gender
          <select name="gender" value={form.gender} onChange={handleChange} className="border rounded px-3 py-2 w-full mt-1" required>
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          Goal
          <select name="goal" value={form.goal} onChange={handleChange} className="border rounded px-3 py-2 w-full mt-1" required>
            <option value="">Select</option>
            <option>Weight Loss</option>
            <option>Muscle Gain</option>
            <option>Maintenance</option>
          </select>
        </label>
        <label>
          Activity Level
          <select name="activity" value={form.activity} onChange={handleChange} className="border rounded px-3 py-2 w-full mt-1" required>
            <option value="">Select</option>
            <option>Sedentary</option>
            <option>Moderate</option>
            <option>Intense</option>
          </select>
        </label>
        <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2 mt-2">Get Suggestions</button>
      </form>
      {result && (
        <div className="mt-6 p-5 bg-blue-50 rounded-xl shadow flex flex-col gap-2 text-lg">
          <div>🏋️ <b>Workout Type:</b> {result.workout}</div>
          <div>🍽️ <b>Protein Goal:</b> {result.protein}/day</div>
          <div>🔥 <b>Calories:</b> {result.calories}</div>
          <div>🛌 <b>Rest Days/Week:</b> {result.rest}</div>
          <div>💡 <b>Tip:</b> {result.tip}</div>
        </div>
      )}
    </div>
  );
} 