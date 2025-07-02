import React, { useState, useEffect } from 'react';
import { getSocket } from '../lib/utils';

const dummyWorkouts = [
  { name: 'Chest Day' },
  { name: 'Leg Day' },
  { name: 'Full Body' },
];

export default function CommunityWorkouts() {
  const [comments, setComments] = useState([
    ['Great chest pump!', 'Loved the workout!'],
    ['Legs are burning!'],
    ['Full body blast!'],
  ]);
  const [inputs, setInputs] = useState(['', '', '']);

  useEffect(() => {
    const socket = getSocket();
    // Listen for new comments from other users
    socket.on('workout:newComment', ({ idx, comment }) => {
      setComments(prev => {
        const newComments = [...prev];
        newComments[idx] = [comment, ...newComments[idx]];
        return newComments;
      });
    });
    return () => {
      socket.off('workout:newComment');
    };
  }, []);

  const handlePost = idx => {
    if (inputs[idx].trim()) {
      const newComments = [...comments];
      newComments[idx] = [inputs[idx], ...newComments[idx]];
      setComments(newComments);
      // Emit to server for real-time update
      getSocket().emit('workout:newComment', { idx, comment: inputs[idx] });
      const newInputs = [...inputs];
      newInputs[idx] = '';
      setInputs(newInputs);
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
          />
          <button className="bg-blue-500 text-white px-4 py-1 rounded w-max" onClick={() => handlePost(i)}>
            Post Comment
          </button>
          <div className="flex flex-col gap-1 mt-2">
            {comments[i].map((c, j) => (
              <div key={j} className="text-sm text-gray-700 bg-gray-50 rounded px-2 py-1">{c}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 