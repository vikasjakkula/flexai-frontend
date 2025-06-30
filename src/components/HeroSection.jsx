import { ContainerTextFlip } from "./ui/container-text-flip";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export default function HeroSection() {
  const words = ["strong", "focused", "repeat"];
  return (
    <div className="w-full min-h-[90vh] bg-white flex flex-col md:flex-row items-center justify-center px-4 md:px-16 py-12 gap-8">
      {/* Left: Text and animation */}
      <div className="flex-1 flex flex-col items-start justify-center max-w-xl">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(
            "mb-6 text-4xl md:text-6xl font-extrabold leading-tight text-zinc-800"
          )}
        >
          Build Muscle with the Right Moves<ContainerTextFlip words={words} />
        </motion.h1>
       
      </div>
      {/* Right: Image */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src="/iconright.png"
          alt="Hero Illustration"
          className="w-full max-w-2xl h-[28rem] md:h-[36rem] object-contain ml-0 md:ml-40"
        />
      </div>
    </div>
  );
}

export function HeroSectionLeftImage() {
  const words = ["Click", "Watch", "Train", "Repeat."];
  return (
    <div className="w-full min-h-[90vh] bg-white flex flex-col md:flex-row items-center justify-center px-4 md:px-16 py-12 gap-8">
      {/* Left: Image */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src="/iconleft.png"
          alt="Hero Illustration Left"
          className="w-full max-w-2xl h-[28rem] md:h-[36rem] object-contain mr-0 md:mr-40"
        />
      </div>
      {/* Right: Text and animation */}
      <div className="flex-1 flex flex-col items-start justify-center max-w-xl">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(
            "mb-6 text-4xl md:text-6xl font-extrabold leading-tight text-zinc-800"
          )}
        >
          "No more Random Workouts, Just Results"<ContainerTextFlip words={words} />
        </motion.h1>
        {/* Optionally add a subheading here */}
      </div>
    </div>
  );
}

// New: FLEX.AI Audience Section (Kaggle-style)
export function FlexAiAudienceSection() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: '5rem',
      margin: '4rem 0',
      flexWrap: 'wrap',
      width: '100%',
      maxWidth: '1600px',
      minHeight: '320px',
      marginLeft: 'auto',
      marginRight: 'auto',
      padding: '2.5rem 0',
    }}>
      {/* Beginners */}
      <div style={{ maxWidth: 400, flex: 1, minWidth: 260, minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: '2.2rem', marginBottom: 16, fontFamily: 'Raleway, Arial, sans-serif', textAlign: 'center', letterSpacing: 1 }}>Beginners</div>
        <div style={{ color: '#222', fontSize: '1.35rem', marginBottom: 28, fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>Start your fitness journey with easy-to-follow video guides and routines.</div>
        <img src={process.env.PUBLIC_URL + '/1stone.png'} alt="Beginners" style={{ width: 130, height: 130, borderRadius: '50%', background: '#e0f7fa', objectFit: 'contain', marginBottom: 8 }} />
      </div>
      {/* Lifters */}
      <div style={{ maxWidth: 400, flex: 1, minWidth: 260, minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: '2.2rem', marginBottom: 16, fontFamily: 'Raleway, Arial, sans-serif', textAlign: 'center', letterSpacing: 1 }}>Lifters</div>
        <div style={{ color: '#222', fontSize: '1.35rem', marginBottom: 28, fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>Level up with advanced workouts, personalized plans, and progress tracking.</div>
        <img src={process.env.PUBLIC_URL + '/2ndone.svg'} alt="Lifters" style={{ width: 130, height: 130, borderRadius: '50%', background: '#e0f7fa', objectFit: 'contain', marginBottom: 8 }} />
      </div>
      {/* Pros */}
      <div style={{ maxWidth: 400, flex: 1, minWidth: 260, minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: '2.2rem', marginBottom: 16, fontFamily: 'Raleway, Arial, sans-serif', textAlign: 'center', letterSpacing: 1 }}>Pros</div>
        <div style={{ color: '#222', fontSize: '1.35rem', marginBottom: 28, fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>Push your limits with expert routines, nutrition tips, and AI-powered insights.</div>
        <img src={process.env.PUBLIC_URL + '/3rdone.svg'} alt="Pros" style={{ width: 130, height: 130, borderRadius: '50%', background: '#e0f7fa', objectFit: 'contain', marginBottom: 8 }} />
      </div>
    </div>
  );
} 