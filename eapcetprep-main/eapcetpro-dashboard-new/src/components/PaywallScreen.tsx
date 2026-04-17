import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Zap, Star } from 'lucide-react';
import SpinwheelModal from './SpinwheelModal';

export default function PaywallScreen({ onComplete }: { onComplete: () => void }) {
  const [showSpinwheel, setShowSpinwheel] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [price, setPrice] = useState(498);

  useEffect(() => {
    // Handle back button / swipe back
    const handlePopState = (e: PopStateEvent) => {
      if (!discountApplied && !showSpinwheel) {
        e.preventDefault();
        setShowSpinwheel(true);
        // Push state back to prevent actual navigation
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [discountApplied, showSpinwheel]);

  const handleCloseAttempt = () => {
    if (!discountApplied) {
      setShowSpinwheel(true);
    } else {
      onComplete();
    }
  };

  const handleSpinComplete = () => {
    setDiscountApplied(true);
    setPrice(249);
    setShowSpinwheel(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Header */}
      <div className="p-4 flex justify-end">
        <button 
          onClick={handleCloseAttempt}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-500 hover:text-gray-900"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 px-6 pb-12 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl text-indigo-600 mb-6">
            <Star className="w-8 h-8 fill-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Unlock Pro Access</h1>
          <p className="text-gray-500">Get unlimited access to all mock tests, chapter-wise questions, and detailed analytics.</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
          {discountApplied && (
            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              50% OFF APPLIED
            </div>
          )}
          
          <div className="flex items-baseline justify-center gap-2 mb-6">
            <span className="text-5xl font-extrabold text-gray-900">₹{price}</span>
            {discountApplied && (
              <span className="text-xl text-gray-400 line-through">₹498</span>
            )}
            <span className="text-gray-500 font-medium">/year</span>
          </div>

          <ul className="space-y-4 mb-8">
            {[
              'Unlimited Mock Tests',
              'Chapter-wise Practice',
              'Detailed Performance Analytics',
              'Previous Year Papers',
              'Ad-free Experience'
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-700 font-medium">{feature}</span>
              </li>
            ))}
          </ul>

          <button 
            onClick={onComplete}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-200"
          >
            <Zap className="w-5 h-5 fill-white" />
            Get Pro Access Now
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            Cancel anytime. Secure payment.
          </p>
        </div>
      </div>

      {showSpinwheel && (
        <SpinwheelModal 
          onComplete={handleSpinComplete} 
          onClose={() => setShowSpinwheel(false)} 
        />
      )}
    </div>
  );
}
