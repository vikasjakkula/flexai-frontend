import React, { useState } from 'react';
import './MuscleMap.css';

export default function MuscleMap() {
  // Only one group can be selected at a time
  const [selected, setSelected] = useState(null);
  const [gender, setGender] = useState('male');

  // Helper to handle symmetrical selection
  const handleSelect = (group) => {
    setSelected(selected === group ? null : group);
  };

  return (
    <div className="muscle-map-container" style={{ flexDirection: 'column' }}>
      {gender === 'male' ? (
        <svg
          viewBox="0 0 300 500"
          width="300"
          height="500"
          className="muscle-map-svg"
        >
          {/* Neck */}
          <rect
            x="130" y="40" width="40" height="20"
            fill={selected === 'neck' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('neck')}
            style={{ cursor: 'pointer' }}
          />
          {/* Chest */}
          <rect
            x="110" y="60" width="80" height="40"
            fill={selected === 'chest' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('chest')}
            style={{ cursor: 'pointer' }}
          />
          {/* Abs */}
          <rect
            x="130" y="100" width="40" height="60"
            fill={selected === 'abs' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('abs')}
            style={{ cursor: 'pointer' }}
          />
          {/* Left Arm */}
          <rect
            x="80" y="60" width="30" height="100"
            fill={selected === 'arms' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('arms')}
            style={{ cursor: 'pointer' }}
          />
          {/* Right Arm */}
          <rect
            x="190" y="60" width="30" height="100"
            fill={selected === 'arms' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('arms')}
            style={{ cursor: 'pointer' }}
          />
          {/* Left Leg */}
          <rect
            x="120" y="160" width="25" height="120"
            fill={selected === 'legs' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('legs')}
            style={{ cursor: 'pointer' }}
          />
          {/* Right Leg */}
          <rect
            x="155" y="160" width="25" height="120"
            fill={selected === 'legs' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('legs')}
            style={{ cursor: 'pointer' }}
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 300 500"
          width="300"
          height="500"
          className="muscle-map-svg"
        >
          {/* Female Neck */}
          <rect
            x="135" y="40" width="30" height="20"
            fill={selected === 'neck' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('neck')}
            style={{ cursor: 'pointer' }}
          />
          {/* Female Chest (slightly narrower) */}
          <rect
            x="120" y="60" width="60" height="35"
            fill={selected === 'chest' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('chest')}
            style={{ cursor: 'pointer' }}
          />
          {/* Female Abs */}
          <rect
            x="135" y="95" width="30" height="60"
            fill={selected === 'abs' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('abs')}
            style={{ cursor: 'pointer' }}
          />
          {/* Female Left Arm */}
          <rect
            x="80" y="60" width="30" height="100"
            fill={selected === 'arms' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('arms')}
            style={{ cursor: 'pointer' }}
          />
          {/* Female Right Arm */}
          <rect
            x="190" y="60" width="30" height="100"
            fill={selected === 'arms' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('arms')}
            style={{ cursor: 'pointer' }}
          />
          {/* Female Left Leg (wider hips) */}
          <rect
            x="115" y="155" width="30" height="130"
            fill={selected === 'legs' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('legs')}
            style={{ cursor: 'pointer' }}
          />
          {/* Female Right Leg (wider hips) */}
          <rect
            x="155" y="155" width="30" height="130"
            fill={selected === 'legs' ? 'red' : '#eee'}
            stroke="#888"
            onClick={() => handleSelect('legs')}
            style={{ cursor: 'pointer' }}
          />
        </svg>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button
          className={gender === 'male' ? 'gender-btn active' : 'gender-btn'}
          onClick={() => setGender('male')}
          style={{ marginRight: 12 }}
        >
          ♂ Male
        </button>
        <button
          className={gender === 'female' ? 'gender-btn active' : 'gender-btn'}
          onClick={() => setGender('female')}
        >
          ♀ Female
        </button>
      </div>
    </div>
  );
} 