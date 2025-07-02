import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function CommunityForum() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [input, setInput] = useState('');

  // Fetch questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('community_questions')
        .select('id, text, created_at, user_id')
        .order('created_at', { ascending: false });
      if (!error) setQuestions(data);
    };
    fetchQuestions();
  }, []);

  const handlePost = async () => {
    if (input.trim() && user) {
      const { data, error } = await supabase
        .from('community_questions')
        .insert([{ text: input, user_id: user.id }])
        .select();
      if (!error && data && data.length > 0) {
        setQuestions([data[0], ...questions]);
        setInput('');
      }
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
          disabled={!user}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handlePost} disabled={!user}>Post</button>
      </div>
      <div className="flex flex-col gap-3">
        {questions.map((q) => (
          <div key={q.id} className="border rounded p-3 flex flex-col gap-2 bg-gray-50">
            <div className="font-semibold">{q.text}</div>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>Asked by: {q.user_id.slice(0, 6)}... {new Date(q.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 