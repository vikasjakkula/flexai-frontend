import React, { useState } from 'react';
import { X, Gift } from 'lucide-react';

export default function SpinwheelModal({ onComplete, onClose }: { onComplete: () => void, onClose: () => void }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const segments = [
    { label: '10% OFF', color: '#F87171' },
    { label: '20% OFF', color: '#FBBF24' },
    { label: '50% OFF', color: '#34D399' },
    { label: 'Try Again', color: '#9CA3AF' },
    { label: '30% OFF', color: '#60A5FA' },
    { label: '5% OFF', color: '#A78BFA' },
  ];

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    
    // We want to land on '50% OFF' which is index 2.
    // Segment 2 is between 120 and 180 degrees. Center is 150 degrees.
    // To put 150 degrees at the top (0 degrees), we need to rotate by -150 or 210 degrees.
    // Let's do 5 full rotations (1800) + 210 = 2010 degrees.
    const targetRotation = 1800 + 210; 
    
    setRotation(targetRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
    }, 4000); // 4 seconds spin duration
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
        {!showResult && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 z-10 hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 text-center">
          {!showResult ? (
            <>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full text-indigo-600 mb-4">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Wait! Don't leave yet</h3>
              <p className="text-gray-500 text-sm mb-8">Spin the wheel to get a special discount on your Pro Access!</p>

              <div className="relative w-64 h-64 mx-auto mb-8">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-8 z-20">
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-gray-900 drop-shadow-md"></div>
                </div>

                {/* Wheel */}
                <div 
                  className="w-full h-full rounded-full border-4 border-white shadow-xl relative transition-transform"
                  style={{ 
                    background: `conic-gradient(
                      #F87171 0deg 60deg,
                      #FBBF24 60deg 120deg,
                      #34D399 120deg 180deg,
                      #9CA3AF 180deg 240deg,
                      #60A5FA 240deg 300deg,
                      #A78BFA 300deg 360deg
                    )`,
                    transform: `rotate(${rotation}deg)`, 
                    transitionDuration: isSpinning ? '4s' : '0s',
                    transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                >
                  {/* Labels */}
                  {segments.map((segment, idx) => {
                    const angle = idx * 60 + 30; // Center of segment
                    return (
                      <div 
                        key={idx}
                        className="absolute top-0 left-0 w-full h-full flex items-start justify-center pt-6"
                        style={{
                          transform: `rotate(${angle}deg)`,
                        }}
                      >
                        <span className="text-white font-bold text-sm tracking-wider drop-shadow-md">
                          {segment.label}
                        </span>
                      </div>
                    );
                  })}
                  
                  {/* Center dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-inner border-4 border-gray-100 flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>

              <button 
                onClick={spinWheel}
                disabled={isSpinning}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSpinning ? 'Spinning...' : 'Spin to Win!'}
              </button>
            </>
          ) : (
            <div className="py-8">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <span className="text-4xl font-black text-emerald-600">50%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
              <p className="text-gray-600 mb-8">You won a 50% discount! Your new price is just <span className="font-bold text-gray-900">₹249</span>.</p>
              
              <button 
                onClick={onComplete}
                className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-[0.98] shadow-lg shadow-emerald-200"
              >
                Claim Discount
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
