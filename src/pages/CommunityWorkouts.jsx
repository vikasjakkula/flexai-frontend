import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const dummyWorkouts = [
  { name: 'Chest Day' },
  { name: 'Leg Day' },
  { name: 'Full Body' },
];

export default function CommunityWorkouts() {
  const { user } = useAuth();
  const [comments, setComments] = useState([[], [], []]);
  const [inputs, setInputs] = useState(['', '', '']);

  // Fetch comments for each workout
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('community_workout_comments')
        .select('id, workout, comment, user_id, created_at')
        .order('created_at', { ascending: false });
      if (!error && data) {
        // Group comments by workout
        const grouped = dummyWorkouts.map(w =>
          data.filter(c => c.workout === w.name)
        );
        setComments(grouped);
      }
    };
    fetchComments();
  }, []);

  const handlePost = async idx => {
    if (inputs[idx].trim() && user) {
      const { data, error } = await supabase
        .from('community_workout_comments')
        .insert([{ workout: dummyWorkouts[idx].name, comment: inputs[idx], user_id: user.id }])
        .select();
      if (!error && data && data.length > 0) {
        const newComments = [...comments];
        newComments[idx] = [data[0], ...newComments[idx]];
        setComments(newComments);
        const newInputs = [...inputs];
        newInputs[idx] = '';
        setInputs(newInputs);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {dummyWorkouts.map((w, i) => (
        <div key={i} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border">
          <div className="font-bold text-lg mb-1">{w.name}</div>
          <textarea
            className="border rounded px-3 py-2 mb-2"
            placeholder="Write a comment..."
            value={inputs[i]}
            onChange={e => setInputs(inputs.map((val, idx) => idx === i ? e.target.value : val))}
            disabled={!user}
          />
          <button className="bg-blue-500 text-white px-4 py-1 rounded w-max" onClick={() => handlePost(i)} disabled={!user}>
            Post Comment
          </button>
          <div className="flex flex-col gap-1 mt-2">
            {comments[i].map((c) => (
              <div key={c.id} className="text-sm text-gray-700 bg-gray-50 rounded px-2 py-1">
                {c.comment}
                <span className="ml-2 text-xs text-gray-400">by {c.user_id.slice(0, 6)}... {new Date(c.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 