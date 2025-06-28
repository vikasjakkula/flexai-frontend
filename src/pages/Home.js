import React, { useState, useEffect } from 'react';
import '../App.css'; // Corrected path for App.css
import { useNavigate } from 'react-router-dom';
import LoadingPage from '../components/LoadingPage';

const headingStyle = {
  background: '#1b9df3',
  color: 'white',
  padding: '1.5rem',
  borderRadius: '1rem',
  textAlign: 'center',
  fontFamily: 'Raleway, Arial, sans-serif',
  fontWeight: 900,
  fontSize: '2rem',
  letterSpacing: '1px',
  marginBottom: '1.5rem',
  boxShadow: '0 4px 24px rgba(27,157,243,0.15)',
  margin: '0 1rem 1.5rem 1rem'
};

const sectionStyle = {
  background: 'white',
  borderRadius: '1rem',
  padding: '1.5rem',
  margin: '1.5rem 1rem',
  maxWidth: '900px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  fontFamily: 'Poppins, Arial, sans-serif',
  fontSize: '1rem',
  lineHeight: 1.6
};

const modalStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const popupStyle = {
  background: 'white',
  borderRadius: '1rem',
  padding: '2rem 1.5rem 1.5rem 1.5rem',
  minWidth: '280px',
  maxWidth: '90vw',
  boxShadow: '0 4px 24px rgba(27,157,243,0.15)',
  position: 'relative',
  textAlign: 'center',
};

const closeBtnStyle = {
  position: 'absolute',
  top: '0.75rem',
  right: '1rem',
  background: 'transparent',
  border: 'none',
  fontSize: '1.5rem',
  color: '#1b9df3',
  cursor: 'pointer',
  fontWeight: 700,
  zIndex: 1000,
  padding: '0.5rem',
  minWidth: '44px',
  minHeight: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const popupBtnStyle = {
  background: '#1b9df3',
  color: 'white',
  border: 'none',
  borderRadius: '2rem',
  padding: '0.75rem 1.5rem',
  fontWeight: 700,
  fontSize: '1rem',
  cursor: 'pointer',
  margin: '0.75rem',
  boxShadow: '0 2px 8px #1b9df355',
  transition: 'background 0.2s, transform 0.2s',
  minHeight: '44px',
  minWidth: '120px'
};

const Home = () => {
  const [showPopup, setShowPopup] = React.useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Remove navigation from START NOW, open popup instead
  const handleStartNow = () => setShowPopup(true);

  // Popup buttons: close popup, show levels
  const handlePopupBtn = () => {
    setShowPopup(false);
    navigate('/library');
    setTimeout(() => window.scrollTo(0, 0), 0);
  };

  // Close popup
  const handleClosePopup = () => setShowPopup(false);

  // Handler for Explore Plans button
  const handleExplorePlans = () => {
    navigate('/pricing');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div style={{ padding: '1rem 0', background: '#f4fafd', minHeight: '100vh' }}>
      <div style={headingStyle}>
        <img
          src={process.env.PUBLIC_URL + '/newflex.png'}
          alt="FLEX.AI Logo"
          style={{
            height: '48px',
            display: 'block',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '0.5rem'
          }}
        />
        <div style={{ fontSize: '1rem', fontWeight: 400, marginTop: '0.5rem', letterSpacing: 0 }}>
          Your Ultimate Gym Companion
        </div>
        <div style={{ marginTop: '1rem', fontWeight: 600, fontSize: '0.9rem', letterSpacing: 1 }}>
          [ GO AHEAD AND START YOUR JOURNEY ]
        </div>
        <button
          className="glow-btn"
          style={{ marginTop: '1rem' }}
          onClick={handleExplorePlans}
        >
          Get Started
        </button>
      </div>

      <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{
          color: '#1b9df3',
          fontWeight: 800,
          fontSize: '1.5rem',
          fontFamily: 'Raleway, Arial, sans-serif',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>🔥 What We Offer 🔥</h2>

        <div style={{ maxWidth: '750px', width: '100%' }}>
          <ul style={{
            listStyleType: 'none',
            padding: 0,
            margin: 0,
            textAlign: 'left'
          }}>
            <li style={{ marginBottom: '0.75rem' }}><b>Smart Workout Routines:</b> Biceps, Triceps, Chest, Shoulders, Legs, Back, Abs, Warm-ups, Cool-downs, Core & 6-pack routines</li>
            <li style={{ marginBottom: '0.75rem' }}><b>AI-Powered Exercise Suggestions:</b> Personalized plans for your fitness level, adjusts reps, rest, and sets for you</li>
            <li style={{ marginBottom: '0.75rem' }}><b>HD Video Demonstrations:</b> Beginner to pro level tutorials</li>
            <li style={{ marginBottom: '0.75rem' }}><b>Nutrition Guidance:</b> Pre/Post workout meals, high-protein diet plans</li>
            <li style={{ marginBottom: '0.75rem' }}><b>Weekly Progress Tracking:</b> Weight, muscles, fat loss, and strength progress</li>
            <li style={{ marginBottom: '0.75rem' }}><b>Goal-Based Programs:</b> Fat Burn | Muscle Gain | Endurance | Bulk-up, 30 / 60 / 90 Day Challenges</li>
            <li style={{ marginBottom: '0.75rem' }}><b>Live Support Options:</b> Ask AI Trainer | Chat with Real Experts</li>
          </ul>
        </div>
      </div>

      <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{
          color: '#1b9df3',
          fontWeight: 800,
          fontSize: '1.5rem',
          fontFamily: 'Raleway, Arial, sans-serif',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>Why Choose FLEX.AI?</h2>

        <div style={{ maxWidth: '750px', width: '100%' }}>
          <ul style={{
            listStyleType: 'none',
            padding: 0,
            margin: 0,
            textAlign: 'left'
          }}>
            <li style={{ marginBottom: '0.75rem' }}>✅ Fast, Easy-to-Use Interface</li>
            <li style={{ marginBottom: '0.75rem' }}>✅ Scientifically Designed Routines</li>
            <li style={{ marginBottom: '0.75rem' }}>✅ AI Personal Coach in Your Pocket</li>
            <li style={{ marginBottom: '0.75rem' }}>✅ Track Your Visible Progress</li>
          </ul>
        </div>
      </div>

      <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{
          color: '#1b9df3',
          fontWeight: 800,
          fontSize: '1.5rem',
          fontFamily: 'Raleway, Arial, sans-serif',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>What Our Users Say ❤️‍🔥</h2>

        <div style={{ maxWidth: '750px', width: '100%' }}>
          <ul style={{
            listStyleType: 'none',
            padding: 0,
            margin: 0,
            textAlign: 'left'
          }}>
            <li style={{ marginBottom: '0.75rem' }}>⭐ "I never thought an app could replace a real trainer, but FLEX.AI proved me wrong!" – Anjali M.</li>
            <li style={{ marginBottom: '0.75rem' }}>⭐ "Gained 5kg muscle in 45 days using FLEX.AI's custom plan. Super effective." – Rohan K.</li>
            <li style={{ marginBottom: '0.75rem' }}>⭐ "The AI suggestions are accurate and keep me motivated. This is next-gen fitness." – Neha V.</li>
            <li style={{ marginBottom: '0.75rem' }}>⭐ "From lazy to shredded! FLEX.AI is a beast mode unlocker." – Suresh R.</li>
          </ul>
        </div>
      </div>

      <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{
          color: '#1b9df3',
          fontWeight: 800,
          fontSize: '1.5rem',
          fontFamily: 'Raleway, Arial, sans-serif',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>🚀 Ready to Transforming Your Body?</h2>

        <div style={{ maxWidth: '750px', width: '100%' }}>
          <ol style={{
            listStyleType: 'decimal',
            padding: 0,
            margin: 0,
            textAlign: 'left',
            paddingLeft: '1.5rem'
          }}>
            <li style={{ marginBottom: '0.75rem' }}>Step 1: Enter your goal (Lose Fat, Build Muscle, etc.)</li>
            <li style={{ marginBottom: '0.75rem' }}>Step 2: Select your level (Beginner / Intermediate / Pro)</li>
            <li style={{ marginBottom: '0.75rem' }}>Step 3: Start Training with FLEX.AI</li>
          </ol>
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem', 
          marginTop: '1.5rem',
          width: '100%',
          maxWidth: '400px'
        }}>
          <button
            className="pulse-blue-btn"
            onClick={handleStartNow}
            style={{ width: '100%', maxWidth: '300px' }}
          >
            [ START NOW ]
          </button>
          <button
            className="pulse-blue-btn"
            onClick={() => navigate('/library')}
            onMouseUp={() => setTimeout(() => window.scrollTo(0, 0), 0)}
            style={{ width: '100%', maxWidth: '300px' }}
          >
            [ JOIN AS A TRAINER ]
          </button>
          <button
            className="pulse-blue-btn"
            onClick={handleExplorePlans}
            style={{ width: '100%', maxWidth: '300px' }}
          >
            [ EXPLORE PLANS ]
          </button>
        </div>
      </div>

      {/* Popup Modal for Step 1 */}
      {showPopup && (
        <div style={modalStyle}>
          <div style={popupStyle}>
            <button style={closeBtnStyle} onClick={handleClosePopup}>&times;</button>
            <img src={process.env.PUBLIC_URL + '/GOAL.png'} alt="Choose Your Goal" style={{ width: '100%', maxWidth: '300px', margin: '0 auto 1rem auto', display: 'block' }} />
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem', 
              marginTop: '1rem' 
            }}>
              <button style={{...popupBtnStyle, width: '100%', maxWidth: '200px'}} onClick={handlePopupBtn} aria-label="Lose Fat">
                <img src={process.env.PUBLIC_URL + '/loose fat.png'} alt="Lose Fat" style={{ width: '100px', height: 'auto', display: 'block' }} />
              </button>
              <button style={{...popupBtnStyle, width: '100%', maxWidth: '200px'}} onClick={handlePopupBtn} aria-label="Build Muscle">
                <img src={process.env.PUBLIC_URL + '/buildmusle.png'} alt="Build Muscle" style={{ width: '100px', height: 'auto', display: 'block' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem', 
        margin: '2rem 1rem', 
        flexWrap: 'wrap' 
      }}>
        {/* Card 1 */}
        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: '1rem', 
          padding: '1.5rem', 
          width: '100%', 
          maxWidth: '320px', 
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', 
          textAlign: 'left' 
        }}>
          <div style={{ fontWeight: 900, fontSize: '1.8rem', fontFamily: 'Raleway, Arial, sans-serif', color: '#222', marginBottom: '0.5rem' }}>1,00,000+</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Raleway, Arial, sans-serif', color: '#222', marginBottom: '0.5rem' }}>Fitness Goals Achieved</div>
          <div style={{ color: '#555', fontSize: '0.9rem', fontFamily: 'Raleway, Arial, sans-serif', lineHeight: 1.5 }}>Over a million professionals trust our apps for their daily workflows.</div>
        </div>
        {/* Card 2 */}
        <div style={{ 
          background: '#111827', 
          borderRadius: '1rem', 
          padding: '1.5rem', 
          width: '100%', 
          maxWidth: '320px', 
          color: 'white', 
          textAlign: 'left', 
          boxShadow: '0 2px 12px rgba(0,0,0,0.10)' 
        }}>
          <div style={{ fontWeight: 900, fontSize: '1.8rem', fontFamily: 'Raleway, Arial, sans-serif', marginBottom: '0.5rem' }}>13,00,000+<br/>BodyBuilder's Created</div>
          <div style={{ fontWeight: 400, fontSize: '1rem', fontFamily: 'Raleway, Arial, sans-serif', marginBottom: '0.5rem' }}>Users reached their muscle gain, weight loss, and endurance goals using FLEX.AI plans.</div>
          <div style={{ color: '#b3b3b3', fontSize: '0.9rem', fontFamily: 'Raleway, Arial, sans-serif', lineHeight: 1.5 }}>Flex.AI is the simplest way to create beautiful Figure.</div>
        </div>
        {/* Card 3 */}
        <div style={{ 
          background: '#5746ea', 
          borderRadius: '1rem', 
          padding: '1.5rem', 
          width: '100%', 
          maxWidth: '320px', 
          color: 'white', 
          textAlign: 'left', 
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)' 
        }}>
          <div style={{ fontWeight: 900, fontSize: '1.8rem', fontFamily: 'Raleway, Arial, sans-serif', marginBottom: '0.5rem' }}>95%</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Raleway, Arial, sans-serif', marginBottom: '0.5rem' }}>Users Satisfaction</div>
          <div style={{ color: '#e0e0ff', fontSize: '0.9rem', fontFamily: 'Raleway, Arial, sans-serif', lineHeight: 1.5 }}>Highly rated by fitness enthusiasts for clear guidance and real transformation results.</div>
        </div>
      </div>
      
    </div>
  );
};

export default Home;
