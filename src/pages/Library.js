// src/pages/Library.js
import React, { useState, useRef, useEffect } from 'react';
import MuscleMap from '../components/MuscleMap';
import LoadingPage from '../components/LoadingPage';

const gymVideo = process.env.PUBLIC_URL + '/videos/gym01.mp4';

const muscleGroups = [
  {
    key: 'biceps',
    label: ' Biceps',
    description: 'Biceps are the muscles on the front of your upper arm, responsible for flexing the elbow.',
    exercises: [
      { name: 'Dumbbell Curl', icon: '🏋️' },
      { name: 'Hammer Curl', icon: '🔨' },
      { name: 'Barbell Curl', icon: '🏋️‍♂️' },
      { name: 'Concentration Curl', icon: '🧘' },
    ],
  },
  {
    key: 'triceps',
    label: 'Triceps',
    description: 'Triceps are the muscles on the back of your upper arm, responsible for extending the elbow.',
    exercises: [
      { name: 'Tricep Pushdown', icon: '⬇️' },
      { name: 'Overhead Extension', icon: '🙆' },
      { name: 'Dips', icon: '↕️' },
      { name: 'Skullcrusher', icon: '💀' },
    ],
  },
  {
    key: 'chest',
    label: 'Chest',
    description: 'Chest muscles (pectorals) are responsible for pushing movements and upper body strength.',
    exercises: [
      { name: 'Bench Press', icon: '🏋️‍♂️' },
      { name: 'Push-Up', icon: '🤸' },
      { name: 'Incline Dumbbell Press', icon: '📈' },
      { name: 'Chest Fly', icon: '🦋' },
    ],
  },
  {
    key: 'back',
    label: 'Back',
    description: 'Back muscles support posture and pulling movements, including lats, traps, and rhomboids.',
    exercises: [
      { name: 'Pull-Up', icon: '🧗' },
      { name: 'Barbell Row', icon: '🏋️‍♂️' },
      { name: 'Lat Pulldown', icon: '⬇️' },
      { name: 'Face Pull', icon: '🎣' },
    ],
  },
  {
    key: 'Shoulders',
    label: 'Shoulders',
    description: 'Shoulder muscles (deltoids) are responsible for lifting and rotating the arm.',
    exercises: [
      { name: 'Overhead Press', icon: '🏋️' },
      { name: 'Lateral Raise', icon: '➡️' },
      { name: 'Front Raise', icon: '⬆️' },
      { name: 'Reverse Fly', icon: '🦋' },
    ],
  },
  {
    key: 'legs',
    label: 'Legs',
    description: 'Leg muscles include quads, hamstrings, glutes, and calves, powering lower body movement.',
    exercises: [
      { name: 'Squat', icon: '🏋️‍♂️' },
      { name: 'Lunge', icon: '🚶' },
      { name: 'Leg Press', icon: '🦵' },
      { name: 'Calf Raise', icon: '🦶' },
    ],
  },
  {
    key: 'abs',
    label: 'Abs / Core',
    description: 'Core muscles stabilize your body and support nearly every movement.',
    exercises: [
      { name: 'Plank', icon: '🧘' },
      { name: 'Crunch', icon: '💥' },
      { name: 'Leg Raise', icon: '⬆️' },
      { name: 'Russian Twist', icon: '🔄' },
    ],
  },
  {
    key: 'fullbody',
    label: 'Full-Body / Functional',
    description: 'Full-body and functional exercises train multiple muscle groups and improve coordination.',
    exercises: [
      { name: 'Burpee', icon: '🤸' },
      { name: 'Kettlebell Swing', icon: '��️' },
      { name: "Farmer's Walk", icon: '🚶‍♂️' },
      { name: 'Mountain Climber', icon: '⛰️' },
    ],
  },
  {
    key: 'misc',
    label: 'Miscellaneous',
    description: 'Cardio, agility, and recovery exercises for overall fitness and health.',
    exercises: [
      { name: 'Jump Rope', icon: '🪢' },
      { name: 'Treadmill', icon: '🏃' },
      { name: 'Foam Rolling', icon: '🧽' },
      { name: 'Stretching', icon: '🤸' },
    ],
  },
];

const accordionStyle = {
  background: 'linear-gradient(120deg, #ffffff 0%, #e3f0ff 100%)',
  borderRadius: '18px',
  boxShadow: '0 4px 24px rgba(30, 144, 255, 0.08)',
  margin: '18px 0',
  padding: '0',
  fontFamily: 'Poppins, Raleway, Arial, sans-serif',
  transition: 'box-shadow 0.3s',
};

const Library = () => {
  const [open, setOpen] = useState(null);
  const [videoExercise, setVideoExercise] = useState(null);
  const [videoGroup, setVideoGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingPage />;

  const handleAccordion = (key) => {
    setOpen(open === key ? null : key);
    setVideoExercise(null);
    setVideoGroup(null);
  };

  const handleShowVideo = (groupKey, exerciseName) => {
    setVideoExercise(exerciseName);
    setVideoGroup(groupKey);
  };

  const handleCloseVideo = () => {
    setVideoExercise(null);
    setVideoGroup(null);
  };

  return (
    <div ref={containerRef} style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #f8fbff 0%, #e3f0ff 100%)', padding: '0 0 48px 0' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px 0 16px' }}>
        <img
          src={process.env.PUBLIC_URL + '/library.png'}
          alt="Choose Your Muscle Group"
          style={{
            display: 'block',
            margin: '0 auto 32px auto',
            maxWidth: '340px',
            width: '100%',
            borderRadius: '18px',
            boxShadow: '0 4px 24px rgba(30,144,255,0.10)',
            objectFit: 'cover',
          }}
        />
        {muscleGroups.map((group) => (
          <div key={group.key} style={{ ...accordionStyle, boxShadow: open === group.key ? '0 8px 32px rgba(30,144,255,0.16)' : accordionStyle.boxShadow, transition: 'box-shadow 0.3s' }}>
            <button
              aria-expanded={open === group.key}
              aria-controls={`panel-${group.key}`}
              onClick={() => handleAccordion(group.key)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                outline: 'none',
                fontFamily: 'Poppins, Raleway, Arial, sans-serif',
                fontWeight: 600,
                fontSize: '1.25rem',
                textAlign: 'left',
                padding: '22px 28px',
                borderRadius: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.2s',
                color: '#1b263b',
              }}
            >
              <span style={{ fontSize: '1.7rem', marginRight: 18 }}>{group.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: '1.3rem', color: '#0072ff', transition: 'transform 0.3s', transform: open === group.key ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
            </button>
            <div
              id={`panel-${group.key}`}
              style={{
                maxHeight: open === group.key ? 500 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.5s cubic-bezier(0.4,0,0.2,1)',
                background: open === group.key ? 'rgba(255,255,255,0.95)' : 'transparent',
                borderRadius: '0 0 18px 18px',
                boxShadow: open === group.key ? '0 2px 12px rgba(30,144,255,0.07)' : 'none',
                padding: open === group.key ? '0 28px 22px 28px' : '0 28px',
                opacity: open === group.key ? 1 : 0,
                pointerEvents: open === group.key ? 'auto' : 'none',
              }}
            >
              {open === group.key && !videoExercise && (
                <div style={{ animation: 'fadeIn 0.7s' }}>
                  <p style={{ fontSize: '1.08rem', color: '#3a506b', margin: '18px 0 14px 0', fontWeight: 500 }}>{group.description}</p>
                  <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                    {group.exercises.map((ex, idx) => (
                      <li key={ex.name} style={{
                        background: '#f1f7ff',
                        margin: '10px 0',
                        borderRadius: '12px',
                        padding: '12px 18px',
                        fontSize: '1.08rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 1px 4px rgba(30,144,255,0.04)',
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                      }}
                        onClick={() => handleShowVideo(group.key, ex.name)}
                      >
                        
                        {ex.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {open === group.key && videoExercise && videoGroup === group.key && (
                <div style={{
                  animation: 'fadeIn 0.7s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 0',
                }}>
                  <button
                    onClick={handleCloseVideo}
                    style={{
                      background: '#f44336',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '14px 32px',
                      marginBottom: '18px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(244,67,54,0.10)',
                      fontFamily: 'Poppins, Raleway, Arial, sans-serif',
                      transition: 'background 0.2s',
                    }}
                  >
                    {`Close ${videoExercise} Pop-up`}
                  </button>
                  <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: 12, color: '#1b263b', fontFamily: 'Poppins, Raleway, Arial, sans-serif' }}>{videoExercise}</div>
                  <video
                    src={gymVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      maxWidth: 400,
                      borderRadius: '16px',
                      boxShadow: '0 4px 24px rgba(30,144,255,0.13)',
                      background: '#000',
                      marginBottom: 8,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <MuscleMap />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Raleway:wght@400;600&display=swap');
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Library;
