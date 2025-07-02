import React, { useState } from 'react';

export default function FormCheckerAI() {
  // const [file, setFile] = useState(null); // Removed unused variable
  const [feedback, setFeedback] = useState(null);

  function handleFile(e) {
    // setFile(e.target.files[0]); // No need to store file
    setFeedback(null);
  }
  function handleSubmit(e) {
    e.preventDefault();
    setFeedback({
      rating: '⚠️ Needs Improvement',
      tips: 'Your back is not straight during squats. Try to keep your chest up and core tight!'
    });
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">🤖 Form Checker AI</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white rounded-xl shadow p-6 mb-6">
        <input type="file" accept="video/*" onChange={handleFile} className="border rounded px-3 py-2" required />
        <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2 mt-2">Upload & Get Feedback</button>
      </form>
      {feedback && (
        <div className="bg-blue-50 rounded-xl shadow p-4 mt-4">
          <div className="text-lg mb-1">{feedback.rating}</div>
          <div>{feedback.tips}</div>
        </div>
      )}
    </div>
  );
} 