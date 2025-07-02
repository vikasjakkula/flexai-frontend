import React, { useState, useEffect } from 'react';
import { getSocket } from '../lib/utils';

export default function CommunityForum() {
  const [questions, setQuestions] = useState([
    { text: 'How do I increase my bench press?', comments: 2, likes: 5 },
    { text: 'Best time to do cardio?', comments: 1, likes: 3 },
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const socket = getSocket();
    // Listen for new questions from other users
    socket.on('forum:newQuestion', (data) => {
      setQuestions(prev => [{ text: data.text, comments: 0, likes: 0 }, ...prev]);
    });
    return () => {
      socket.off('forum:newQuestion');
    };
  }, []);

  const handlePost = () => {
    if (input.trim()) {
      setQuestions([{ text: input, comments: 0, likes: 0 }, ...questions]);
      // Emit to server for real-time update
      getSocket().emit('forum:newQuestion', { text: input });
      setInput('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-4">
      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Ask a question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handlePost()}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handlePost}>Post</button>
      </div>
      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <div key={i} className="border rounded p-3 flex flex-col gap-2 bg-gray-50">
            <div className="font-semibold">{q.text}</div>
            <div className="flex gap-4 text-sm text-gray-500">
              <button className="hover:underline">Comment</button>
              <span>💬 {q.comments}</span>
              <span>👍 {q.likes}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 