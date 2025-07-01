import React, { useState } from 'react';

export default function CommunityPhotos() {
  const [photos, setPhotos] = useState([]);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');

  const handleUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files allowed.');
      return;
    }
    if (photos.length >= 5) {
      setError('Max 5 images allowed.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      setPhotos([{ src: ev.target.result, caption }, ...photos]);
      setCaption('');
      setError('');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-2 mb-2 items-center">
        <input type="file" accept="image/*" onChange={handleUpload} />
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Optional caption"
          value={caption}
          onChange={e => setCaption(e.target.value)}
        />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
        {photos.map((p, i) => (
          <div key={i} className="border rounded p-2 flex flex-col items-center bg-gray-50">
            <img src={p.src} alt="progress" className="w-full h-32 object-cover rounded mb-1" />
            <div className="text-xs text-gray-600">{p.caption}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 