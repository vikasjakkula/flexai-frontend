import React, { useState } from 'react';

const mockQA = [
  {
    q: 'How much protein do I need per day?',
    a: 'For muscle building, aim for 1.6–2.2g protein per kg of body weight.'
  },
  {
    q: 'Is it okay to train the same muscle every day?',
    a: 'Muscles need rest! Train each muscle group 2–3x per week for best results.'
  },
  {
    q: 'What is the best time to do cardio?',
    a: 'Any time that fits your schedule! Consistency matters more than timing.'
  },
];

export default function AskQueries() {
  const [form, setForm] = useState({ question: '', category: '' });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    // For now, just clear the form
    setForm({ question: '', category: '' });
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white rounded-xl shadow p-6 mb-6">
        <label>
          Ask your question
          <textarea name="question" value={form.question} onChange={handleChange} className="border rounded px-3 py-2 w-full mt-1" required rows={2} />
        </label>
        <label>
          Category
          <select name="category" value={form.category} onChange={handleChange} className="border rounded px-3 py-2 w-full mt-1" required>
            <option value="">Select</option>
            <option>Diet</option>
            <option>Workout</option>
            <option>Recovery</option>
          </select>
        </label>
        <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2 mt-2">Submit</button>
      </form>
      <div className="flex flex-col gap-4">
        {mockQA.map((item, i) => (
          <div key={i} className="bg-blue-50 rounded-xl shadow p-4">
            <div className="text-lg mb-1">❓ <b>{item.q}</b></div>
            <div className="text-green-700">✅ {item.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 