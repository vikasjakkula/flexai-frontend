import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function CommunityPhotos() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');

  // Fetch photos on mount
  useEffect(() => {
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from('community_photos')
        .select('id, url, caption, user_id, created_at')
        .order('created_at', { ascending: false });
      if (!error) setPhotos(data);
    };
    fetchPhotos();
  }, []);

  const handleUpload = async e => {
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
    if (!user) {
      setError('You must be logged in to upload.');
      return;
    }

    // Upload to Supabase Storage
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    let { error: uploadError } = await supabase.storage
      .from('community-photos')
      .upload(filePath, file);
    if (uploadError) {
      setError('Upload failed.');
      return;
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('community-photos')
      .getPublicUrl(filePath);

    // Insert into DB
    const { data, error: dbError } = await supabase
      .from('community_photos')
      .insert([{ user_id: user.id, url: publicUrlData.publicUrl, caption }])
      .select();
    if (!dbError && data && data.length > 0) {
      setPhotos([data[0], ...photos]);
      setCaption('');
      setError('');
    } else {
      setError('Failed to save photo.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-2 mb-2 items-center">
        <input type="file" accept="image/*" onChange={handleUpload} disabled={!user} />
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Optional caption"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          disabled={!user}
        />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
        {photos.map((p) => (
          <div key={p.id} className="border rounded p-2 flex flex-col items-center bg-gray-50">
            <img src={p.url} alt="progress" className="w-full h-32 object-cover rounded mb-1" />
            <div className="text-xs text-gray-600">{p.caption}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 