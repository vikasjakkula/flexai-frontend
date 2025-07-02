import React, { useState } from 'react';

const categories = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core'];
const videos = [
  { title: 'Bench Press', category: 'Chest', url: '/videos/gym01.mp4' },
  { title: 'Pull-Up', category: 'Back', url: '/videos/gym02.mp4' },
  { title: 'Squat', category: 'Legs', url: '/videos/gym01.mp4' },
];

export default function VideoLibrary() {
  const [cat, setCat] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);

  const filtered = videos.filter(v => (!cat || v.category === cat) && v.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">🎥 Video Library</h2>
      <div className="flex gap-2 mb-4">
        <select value={cat} onChange={e => setCat(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="border rounded px-3 py-2 flex-1" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(v => (
          <div key={v.title} className="bg-white rounded-xl shadow p-4 cursor-pointer" onClick={() => setModal(v)}>
            <div className="font-semibold">{v.title}</div>
            <div className="text-gray-500 text-sm">{v.category}</div>
          </div>
        ))}
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow p-6 max-w-md w-full relative">
            <button onClick={() => setModal(null)} className="absolute top-2 right-2 text-xl">✖</button>
            <video src={modal.url} controls autoPlay className="w-full rounded" />
            <div className="mt-2 font-semibold">{modal.title}</div>
          </div>
        </div>
      )}
    </div>
  );
} 