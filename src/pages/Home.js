import React, { useState, useEffect } from 'react';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import LoadingPage from '../components/LoadingPage';
import { Button } from '../components/ui/button';
import { BackgroundBeamsWithCollision } from "../components/ui/background-beams-with-collision";
import { AnimatedTestimonials } from "../components/ui/animated-testimonials";
import { PinContainer } from "../components/ui/3d-pin";
import HeroSection, { HeroSectionLeftImage, FlexAiAudienceSection } from "../components/HeroSection";
import { CardContainer, CardBody, CardItem } from "../components/ui/3d-card";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '../components/AlertDialogDemo';

function BackgroundBeamsWithCollisionDemo() {
  return (
    <BackgroundBeamsWithCollision>
      <div className="relative z-20 text-center">
        <div className="text-2xl md:text-4xl lg:text-7xl font-bold text-black font-sans tracking-tight">
          What's better than random workouts?
        </div>
        <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
          <div className="bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4 text-2xl md:text-4xl lg:text-7xl font-bold font-sans tracking-tight">
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
      name: "vikas yadav",
      designation: "student at 'NGIT' (Osmania University)",
      src: "/image1.png",
    },
    {
      quote:
        "Flex.AI is built to provide a structured workout experience. The platform offers a complete library of guided exercise videos, making it easy to follow and stay consistent on your fitness journey.",
      name: "vikas yadav",
      designation: "founder and ceo of flex.ai",
      src: "/image2.png",
    },
    {
      quote:
        "Biomechanics meet your daily grind, Flex.ai rewires the disciplined mind.",
      name: "Beginners",
      designation: "starting one month ago!",
      src: "/1stone.png",
    },
    {
      quote:
        "Trigger hypertrophy, ignite the flame, Flex.ai's precision is changing the game.",
      name: "Lifters",
      designation: "done using a year",
      src: "/2ndone.svg",
    },
    {
      quote:
        "From eccentric reps to dynamic play, Flex.ai guides the modern way.",
      name: "pros",
      designation: "using flex.ai since 3 years",
      src: "/3rdone.svg",
    },
  ];
  return <AnimatedTestimonials testimonials={testimonials} />;
}

function AnimatedPinDemo() {
  return (
    <div className="h-[40rem] w-full flex items-center justify-center">
      <PinContainer title="x.com/vikas_070v" href="https://x.com/vikas_070v">
        <div className="flex basis-full flex-col p-4 tracking-tight text-slate-100/50 sm:basis-1/2 w-[20rem] h-[20rem]">
          <h3 className="max-w-xs !pb-2 !m-0 font-bold text-base text-slate-100">
            TWITTER
          </h3>
          <div className="text-base !m-0 !p-0 font-normal">
            <span className="text-slate-500">
              WHO IS VIKAS? GET ANSWER HERE!
            </span>
          </div>
          <div className="flex flex-1 w-full rounded-lg mt-4 bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500" />
        </div>
      </PinContainer>
    </div>
  );
}

const Home = () => {
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showTrainerDialog, setShowTrainerDialog] = useState(false);
  const [showPlansDialog, setShowPlansDialog] = useState(false);

  const handleStartNow = () => setShowPopup(true);

  const handlePopupBtn = () => {
    setShowPopup(false);
    navigate('/library');
    setTimeout(() => window.scrollTo(0, 0), 0);
  };

  const handleClosePopup = () => setShowPopup(false);

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
    <div className="center-desktop py-4 bg-[#f4fafd] min-h-screen">
      <HeroSection />
      <div className="relative w-full mb-6" style={{ maxWidth: '100vw', borderRadius: '1rem' }}>
        {/* Top Curve */}
        <svg className="absolute top-0 left-0 w-full h-[100px]" viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,100 Q720,0 1440,100 L1440,0 L0,0 Z" fill="#38bdf8" />
        </svg>
        {/* Main Content */}
        <div className="bg-gradient-to-br from-[#38bdf8] to-[#22a2f4] text-white p-8 pt-20 pb-20 text-center font-raleway font-extrabold text-2xl tracking-wide shadow-2xl relative z-10 flex flex-col items-center justify-center rounded-2xl max-w-full overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-6"></div>
          </div>
          {/* Main Content */}
          <div className="bg-[#38bdf8] text-white p-6 pt-16 pb-16 text-center font-raleway font-extrabold text-2xl tracking-wide shadow-lg relative z-10 flex flex-col items-center justify-center" style={{ borderRadius: '1rem', maxWidth: '100vw' }}>
            <img
              src={process.env.PUBLIC_URL + '/newflex.png'}
              alt="FLEX.AI Logo"
              className="h-12 mx-auto mb-2 block"
            />
            <div className="text-base font-normal mt-2 tracking-normal">
              Your Ultimate Gym Companion
            </div>
            <div className="mt-4 font-semibold text-sm tracking-wider">
              [ GO AHEAD AND START YOUR JOURNEY ]
            </div>
            <button
              className="glow-btn mt-4"
              onClick={handleExplorePlans}
            >
              Get Started
            </button>
          </div>
          {/* Bottom Curve */}
          <svg className="absolute bottom-0 left-0 w-full h-[100px]" viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ transform: 'scaleY(-1)' }}>
            <path d="M0,100 Q720,0 1440,100 L1440,0 L0,0 Z" fill="#38bdf8" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10 px-4 max-w-5xl mx-auto">
        {/* What We Offer */}
        <div className="bg-gradient-to-br from-blue-100 via-white to-purple-100 rounded-2xl shadow-xl p-8 flex flex-col items-start transition-transform hover:scale-[1.025] border border-blue-200">
          <h2 className="text-black font-extrabold text-2xl font-raleway text-left mb-5">🔥 What We Offer 🔥</h2>
          <ul className="space-y-4 text-black font-poppins text-base leading-relaxed">
            <li><span className="font-bold">Smart Workout Routines:</span> Biceps, Triceps, Chest, Shoulders, Legs, Back, Abs, Warm-ups, Cool-downs, Core & 6-pack routines</li>
            <li><span className="font-bold">AI-Powered Exercise Suggestions:</span> Personalized plans for your fitness level, adjusts reps, rest, and sets for you</li>
            <li><span className="font-bold">HD Video Demonstrations:</span> Beginner to pro level tutorials</li>
            <li><span className="font-bold">Nutrition Guidance:</span> Pre/Post workout meals, high-protein diet plans</li>
            <li><span className="font-bold">Weekly Progress Tracking:</span> Weight, muscles, fat loss, and strength progress</li>
            <li><span className="font-bold">Goal-Based Programs:</span> Fat Burn | Muscle Gain | Endurance | Bulk-up, 30 / 60 / 90 Day Challenges</li>
            <li><span className="font-bold">Live Support Options:</span> Ask AI Trainer | Chat with Real Experts</li>
          </ul>
        </div>

        {/* Why Choose FLEX.AI */}
        <div className="bg-gradient-to-br from-yellow-100 via-white to-blue-100 rounded-2xl shadow-xl p-8 flex flex-col items-start transition-transform hover:scale-[1.025] border border-yellow-200">
          <h2 className="text-black font-extrabold text-2xl font-raleway text-left mb-5">Why Choose FLEX.AI?</h2>
          <ul className="space-y-4 text-black font-poppins text-base leading-relaxed">
            <li>✅ Fast, Easy-to-Use Interface</li>
            <li>✅ Scientifically Designed Routines</li>
            <li>✅ AI Personal Coach in Your Pocket</li>
            <li>✅ Track Your Visible Progress</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10 px-4 max-w-5xl mx-auto">
        {/* What Our Users Say */}
        <div className="bg-gradient-to-br from-pink-100 via-white to-orange-100 rounded-2xl shadow-xl p-8 flex flex-col items-start transition-transform hover:scale-[1.025] border border-pink-200">
          <h2 className="text-black font-extrabold text-2xl font-raleway text-left mb-5">What Our Users Say <span role="img" aria-label="fire-heart">❤️‍🔥</span></h2>
          <ul className="space-y-4 text-black font-poppins text-base leading-relaxed">
            <li>⭐ "I never thought an app could replace a real trainer, but FLEX.AI proved me wrong!" <span className="font-semibold">– Anjali M.</span></li>
            <li>⭐ "Gained 5kg muscle in 45 days using FLEX.AI's custom plan. Super effective." <span className="font-semibold">– Rohan K.</span></li>
            <li>⭐ "The AI suggestions are accurate and keep me motivated. This is next-gen fitness." <span className="font-semibold">– Neha V.</span></li>
            <li>⭐ "From lazy to shredded! FLEX.AI is a beast mode unlocker." <span className="font-semibold">– Suresh R.</span></li>
          </ul>
        </div>

        {/* Ready to Transform */}
        <div className="bg-gradient-to-br from-green-100 via-white to-blue-100 rounded-2xl shadow-xl p-8 flex flex-col items-start transition-transform hover:scale-[1.025] border border-green-200">
          <h2 className="text-black font-extrabold text-2xl font-raleway text-left mb-5">🚀 Ready to Transform Your Body?</h2>
          <ol className="list-decimal pl-6 space-y-4 text-black font-poppins text-base leading-relaxed">
            <li>Step 1: Enter your goal (Lose Fat, Build Muscle, etc.)</li>
            <li>Step 2: Select your level (Beginner / Intermediate / Pro)</li>
            <li>Step 3: Start Training with FLEX.AI</li>
          </ol>
          <div className="action-btns flex flex-col md:flex-row gap-4 mt-6 w-full">
            <Button
              onClick={handleStartNow}
              className="w-full max-w-xs bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition"
            >
              START NOW
            </Button>
            <AlertDialog open={showTrainerDialog} onOpenChange={setShowTrainerDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full max-w-xs bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 transition"
                  onClick={e => { e.preventDefault(); setShowTrainerDialog(true); }}
                >
                  JOIN AS A TRAINER
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to join as a trainer. Continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setShowTrainerDialog(false); navigate('/library'); setTimeout(() => window.scrollTo(0, 0), 0); }}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={showPlansDialog} onOpenChange={setShowPlansDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full max-w-xs bg-yellow-500 text-black font-bold rounded-lg shadow hover:bg-yellow-600 transition"
                  onClick={e => { e.preventDefault(); setShowPlansDialog(true); }}
                >
                  EXPLORE PLANS
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to explore plans. Continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setShowPlansDialog(false); navigate('/pricing'); }}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Popup Modal for Step 1 */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl p-8 min-w-[280px] max-w-[90vw] shadow-2xl relative text-center">
            <Button className="absolute top-3 right-4 bg-transparent border-0 text-2xl text-[#1b9df3] font-bold z-[1000] p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={handleClosePopup}>&times;</Button>
            <img src={process.env.PUBLIC_URL + '/GOAL.png'} alt="Choose Your Goal" className="w-full max-w-[300px] mx-auto mb-4 block" />
            <div className="flex flex-col items-center gap-4 mt-4">
              <Button className="bg-[#1b9df3] text-white rounded-full py-3 px-6 font-bold text-base cursor-pointer my-3 shadow-md transition w-full max-w-xs" onClick={handlePopupBtn} aria-label="Lose Fat">
                <img src={process.env.PUBLIC_URL + '/loose fat.png'} alt="Lose Fat" className="w-[100px] h-auto block mx-auto" />
              </Button>
              <Button className="bg-[#1b9df3] text-white rounded-full py-3 px-6 font-bold text-base cursor-pointer my-3 shadow-md transition w-full max-w-xs" onClick={handlePopupBtn} aria-label="Build Muscle">
                <img src={process.env.PUBLIC_URL + '/buildmusle.png'} alt="Build Muscle" className="w-[100px] h-auto block mx-auto" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-row grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        {/* Card 1 */}
        <CardContainer>
          <CardBody className="stat-card bg-[#f8f9fa] rounded-xl p-6 shadow-md text-left">
            <CardItem translateZ={50} className="text-3xl font-bold text-[#222] font-raleway mb-2">1,00,000+</CardItem>
            <CardItem translateZ={30} className="text-lg font-semibold text-[#222] font-raleway mb-2">Fitness Goals Achieved</CardItem>
            <CardItem translateZ={20} className="text-base text-[#555] font-raleway text-sm leading-snug">Over a million professionals trust our apps for their daily workflows.</CardItem>
          </CardBody>
        </CardContainer>
        {/* Card 2 */}
        <CardContainer>
          <CardBody className="stat-card bg-[#111827] rounded-xl p-6 text-white text-left shadow-lg">
            <CardItem translateZ={50} className="text-3xl font-bold font-raleway mb-2">13,00,000+<br />BodyBuilder's Created</CardItem>
            <CardItem translateZ={30} className="text-lg font-semibold font-raleway mb-2">Users reached their muscle gain, weight loss, and endurance goals using FLEX.AI plans.</CardItem>
            <CardItem translateZ={20} className="text-base text-[#b3b3b3] font-raleway text-sm leading-snug">Flex.AI is the simplest way to create beautiful Figure.</CardItem>
          </CardBody>
        </CardContainer>
        {/* Card 3 */}
        <CardContainer>
          <CardBody className="stat-card bg-[#5746ea] rounded-xl p-6 text-white text-left shadow-md">
            <CardItem translateZ={50} className="text-3xl font-bold font-raleway mb-2">95%</CardItem>
            <CardItem translateZ={30} className="text-lg font-semibold font-raleway mb-2">Users Satisfaction</CardItem>
            <CardItem translateZ={20} className="text-base text-[#b3b3b3] font-raleway text-sm leading-snug">Highly rated by fitness enthusiasts for clear guidance and real transformation results.</CardItem>
          </CardBody>
        </CardContainer>
      </div>

      <AnimatedTestimonialsDemo />

      <div className="font-extrabold text-3xl font-raleway mb-2">Follow Me on x ( twitter )</div>

      <div className="font-extrabold text-3xl font-raleway mb-2">To stay Updated! Let's connect here</div>

      <AnimatedPinDemo />

      <BackgroundBeamsWithCollisionDemo />
      <FlexAiAudienceSection />
      <HeroSectionLeftImage />
    </div>
  );
};

export default Home;
