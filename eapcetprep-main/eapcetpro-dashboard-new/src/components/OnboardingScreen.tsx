import React, { useState } from 'react';
import { ChevronRight, BookOpen, Target, Award } from 'lucide-react';

const slides = [
  {
    title: "Master Your Subjects",
    description: "Access comprehensive chapter-wise tests and study materials designed for EAPCET.",
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-50"
  },
  {
    title: "Track Your Progress",
    description: "Get detailed analytics and performance insights to identify your weak areas.",
    icon: Target,
    color: "text-indigo-500",
    bg: "bg-indigo-50"
  },
  {
    title: "Achieve Your Goals",
    description: "Take full-length mock tests and prepare to ace your final examination.",
    icon: Award,
    color: "text-emerald-500",
    bg: "bg-emerald-50"
  }
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      onComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const SlideIcon = slides[currentSlide].icon;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className={`w-32 h-32 rounded-full ${slides[currentSlide].bg} flex items-center justify-center mb-8 transition-colors duration-500`}>
          <SlideIcon className={`w-16 h-16 ${slides[currentSlide].color}`} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{slides[currentSlide].title}</h2>
        <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">
          {slides[currentSlide].description}
        </p>
      </div>

      <div className="p-8 pb-12">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-200'}`}
            />
          ))}
        </div>

        <button 
          onClick={nextSlide}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors active:scale-[0.98]"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
