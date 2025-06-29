import React, { useState, useEffect } from 'react';
import '../App.css'; // Corrected path for App.css
import { useNavigate } from 'react-router-dom';
import LoadingPage from '../components/LoadingPage';
import { Button } from '../components/ui/button';
import { BackgroundBeamsWithCollision } from "../components/ui/background-beams-with-collision";
import { AnimatedTestimonials } from "../components/ui/animated-testimonials";
import { PinContainer } from "../components/ui/3d-pin";


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

function BackgroundBeamsWithCollisionDemo() {
  return (
    <BackgroundBeamsWithCollision>
      <div className="relative z-20 text-center">
        <div className="text-2xl md:text-4xl lg:text-7xl font-bold text-black dark:text-white font-sans tracking-tight">
          What's better than random workouts?
        </div>
        <div
          className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
          <div
            className="bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4 text-2xl md:text-4xl lg:text-7xl font-bold font-sans tracking-tight"
          >
            FLEX.AI is here
          </div>
        </div>
      </div>
    </BackgroundBeamsWithCollision>
  );
}

function AnimatedTestimonialsDemo() {
  const testimonials = [
    {
      quote:
        "The attention to detail and innovative features have completely transformed our workflow. This is exactly what we've been looking for.",
      name: "Sarah Chen",
      designation: "Product Manager at TechFlow",
      src: "/image1.png",
    },
    {
      quote:
        "Implementation was seamless and the results exceeded our expectations. The platform's flexibility is remarkable.",
      name: "Michael Rodriguez",
      designation: "CTO at InnovateSphere",
      src: "/image2.png",
    },
    {
      quote:
        "This solution has significantly improved our team's productivity. The intuitive interface makes complex tasks simple.",
      name: "Emily Watson",
      designation: "Operations Director at CloudScale",
      src: "/image3.png",
    },
    {
      quote:
        "Outstanding support and robust features. It's rare to find a product that delivers on all its promises.",
      name: "James Kim",
      designation: "Engineering Lead at DataPro",
      src: "/image4.png",
    },
    {
      quote:
        "The scalability and performance have been game-changing for our organization. Highly recommend to any growing business.",
      name: "Lisa Thompson",
      designation: "VP of Technology at FutureNet",
      src: "/image5.png",
    },
  ];
  return <AnimatedTestimonials testimonials={testimonials} />;
}

function AnimatedPinDemo() {
  return (
    <div className="h-[40rem] w-full flex items-center justify-center ">
      <PinContainer title="/ui.aceternity.com" href="https://x.com/vikas_070v">
        <div
          className="flex basis-full flex-col p-4 tracking-tight text-slate-100/50 sm:basis-1/2 w-[20rem] h-[20rem] ">
          <h3 className="max-w-xs !pb-2 !m-0 font-bold  text-base text-slate-100">
            Aceternity UI
          </h3>
          <div className="text-base !m-0 !p-0 font-normal">
            <span className="text-slate-500 ">
              Customizable Tailwind CSS and Framer Motion Components.
            </span>
          </div>
          <div
            className="flex flex-1 w-full rounded-lg mt-4 bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500" />
        </div>
      </PinContainer>
    </div>
  );
}

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
    <div className="center-desktop" style={{ padding: '1rem 0', background: '#f4fafd', minHeight: '100vh' }}>
      <div style={headingStyle} className="section-center">
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
          onClick={handleExplorePlans}
          style={{ marginTop: '1rem' }}
        >
          Get Started
        </button>
      </div>

      <div style={{ ...sectionStyle }} className="section-center">
        <h2 style={{
          color: '#1b9df3',
          fontWeight: 800,
          fontSize: '1.5rem',
          fontFamily: 'Raleway, Arial, sans-serif',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>🔥 What We Offer 🔥</h2>
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

      <div style={{ ...sectionStyle }} className="section-center">
        <h2 style={{
          color: '#1b9df3',
          fontWeight: 800,
          fontSize: '1.5rem',
          fontFamily: 'Raleway, Arial, sans-serif',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>Why Choose FLEX.AI?</h2>
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

      <div style={{ ...sectionStyle }} className="section-center">
        <h2 style={{
          color: '#1b9df3',
          fontWeight: 800,
          fontSize: '1.5rem',
          fontFamily: 'Raleway, Arial, sans-serif',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>What Our Users Say ❤️‍🔥</h2>
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

      <div style={{ ...sectionStyle }} className="section-center">
        <h2 style={{
          color: '#1b9df3',
          fontWeight: 800,
          fontSize: '1.5rem',
          fontFamily: 'Raleway, Arial, sans-serif',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>🚀 Ready to Transforming Your Body?</h2>
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
        <div className="action-btns">
          <Button
            onClick={handleStartNow}
            style={{ width: '100%', maxWidth: '300px' }}
          >
            START NOW
          </Button>
          <Button
            onClick={() => navigate('/library')}
            onMouseUp={() => setTimeout(() => window.scrollTo(0, 0), 0)}
            style={{ width: '100%', maxWidth: '300px' }}
          >
            JOIN AS A TRAINER
          </Button>
          <Button
            onClick={handleExplorePlans}
            style={{ width: '100%', maxWidth: '300px' }}
          >
            EXPLORE PLANS
          </Button>
        </div>
      </div>

      {/* Popup Modal for Step 1 */}
      {showPopup && (
        <div style={modalStyle}>
          <div style={popupStyle}>
            <Button style={closeBtnStyle} onClick={handleClosePopup}>&times;</Button>
            <img src={process.env.PUBLIC_URL + '/GOAL.png'} alt="Choose Your Goal" style={{ width: '100%', maxWidth: '300px', margin: '0 auto 1rem auto', display: 'block' }} />
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem', 
              marginTop: '1rem' 
            }}>
              <Button style={{...popupBtnStyle, width: '100%', maxWidth: '200px'}} onClick={handlePopupBtn} aria-label="Lose Fat">
                <img src={process.env.PUBLIC_URL + '/loose fat.png'} alt="Lose Fat" style={{ width: '100px', height: 'auto', display: 'block' }} />
              </Button>
              <Button style={{...popupBtnStyle, width: '100%', maxWidth: '200px'}} onClick={handlePopupBtn} aria-label="Build Muscle">
                <img src={process.env.PUBLIC_URL + '/buildmusle.png'} alt="Build Muscle" style={{ width: '100px', height: 'auto', display: 'block' }} />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-row">
        {/* Card 1 */}
        <div className="stat-card" style={{ 
          background: '#f8f9fa', 
          borderRadius: '1rem', 
          padding: '1.5rem', 
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', 
          textAlign: 'left' 
        }}>
          <div style={{ fontWeight: 900, fontSize: '1.8rem', fontFamily: 'Raleway, Arial, sans-serif', color: '#222', marginBottom: '0.5rem' }}>1,00,000+</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Raleway, Arial, sans-serif', color: '#222', marginBottom: '0.5rem' }}>Fitness Goals Achieved</div>
          <div style={{ color: '#555', fontSize: '0.9rem', fontFamily: 'Raleway, Arial, sans-serif', lineHeight: 1.5 }}>Over a million professionals trust our apps for their daily workflows.</div>
        </div>
        {/* Card 2 */}
        <div className="stat-card" style={{ 
          background: '#111827', 
          borderRadius: '1rem', 
          padding: '1.5rem', 
          color: 'white', 
          textAlign: 'left', 
          boxShadow: '0 2px 12px rgba(0,0,0,0.10)' 
        }}>
          <div style={{ fontWeight: 900, fontSize: '1.8rem', fontFamily: 'Raleway, Arial, sans-serif', marginBottom: '0.5rem' }}>13,00,000+<br/>BodyBuilder's Created</div>
          <div style={{ fontWeight: 400, fontSize: '1rem', fontFamily: 'Raleway, Arial, sans-serif', marginBottom: '0.5rem' }}>Users reached their muscle gain, weight loss, and endurance goals using FLEX.AI plans.</div>
          <div style={{ color: '#b3b3b3', fontSize: '0.9rem', fontFamily: 'Raleway, Arial, sans-serif', lineHeight: 1.5 }}>Flex.AI is the simplest way to create beautiful Figure.</div>
        </div>
        {/* Card 3 */}
        <div className="stat-card" style={{ 
          background: '#5746ea', 
          borderRadius: '1rem', 
          padding: '1.5rem', 
          color: 'white', 
          textAlign: 'left', 
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)' 
        }}>
          <div style={{ fontWeight: 900, fontSize: '1.8rem', fontFamily: 'Raleway, Arial, sans-serif', marginBottom: '0.5rem' }}>95%</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Raleway, Arial, sans-serif', marginBottom: '0.5rem' }}>Users Satisfaction</div>
          <div style={{ color: '#e0e0ff', fontSize: '0.9rem', fontFamily: 'Raleway, Arial, sans-serif', lineHeight: 1.5 }}>Highly rated by fitness enthusiasts for clear guidance and real transformation results.</div>
        </div>
      </div>

      <AnimatedTestimonialsDemo />

      <div style={{ fontWeight: 900, fontSize: '2.2rem', fontFamily: 'Raleway, Arial, sans-serif', marginBottom: '0.5rem' }}>
        Follow Me on x ( twitter )
      </div>

      <div style={{ fontWeight: 900, fontSize: '2.2rem', fontFamily: 'Raleway, Arial, sans-serif', marginBottom: '0.5rem' }}>
        To stay Updated ! Let connect here 
      </div>

      <AnimatedPinDemo />

      <BackgroundBeamsWithCollisionDemo />

    </div>
  );
};

export default Home;
