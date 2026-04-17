/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Headset, 
  Download, 
  Home, 
  BookOpen, 
  FileText, 
  BarChart3,
  X,
  User
} from 'lucide-react';

import HomeTab from './components/HomeTab';
import ChapterTab from './components/ChapterTab';
import MockTab from './components/MockTab';
import AnalyticsTab from './components/AnalyticsTab';
import ProfileTab from './components/ProfileTab';
import QuizInterface from './components/QuizInterface';
import MockTestInterface from './components/MockTestInterface';

export default function App() {
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showDownloadBanner, setShowDownloadBanner] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [activeQuiz, setActiveQuiz] = useState<{id: string | number, title: string, subject?: string, chapter?: string} | null>(null);
  const [activeMockTest, setActiveMockTest] = useState<{id: string | number, title: string} | null>(null);

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab 
          showDownloadBanner={showDownloadBanner} 
          setShowDownloadDialog={setShowDownloadDialog} 
          setActiveTab={setActiveTab}
        />;
      case 'chapter':
        return <ChapterTab setActiveQuiz={setActiveQuiz} />;
      case 'mock':
        return <MockTab setActiveMockTest={setActiveMockTest} />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <HomeTab 
          showDownloadBanner={showDownloadBanner} 
          setShowDownloadDialog={setShowDownloadDialog} 
          setActiveTab={setActiveTab}
        />;
    }
  };

  if (activeQuiz) {
    return <QuizInterface quizId={activeQuiz.id} quizTitle={activeQuiz.title} subject={activeQuiz.subject} chapter={activeQuiz.chapter} onClose={() => setActiveQuiz(null)} />;
  }

  if (activeMockTest) {
    return <MockTestInterface testId={activeMockTest.id} testTitle={activeMockTest.title} onClose={() => setActiveMockTest(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative pb-24 overflow-x-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="font-bold text-xl text-indigo-600 tracking-tight">eapcetpro</div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
              <Headset className="w-4 h-4" />
              Support
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center border border-indigo-100 hover:bg-indigo-100 transition-colors"
            >
              V
            </button>
          </div>
        </header>

        <main className="p-4">
          {renderTab()}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 px-6 py-2 flex justify-between items-center z-30 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'chapter', icon: BookOpen, label: 'Chapter wise' },
            { id: 'mock', icon: FileText, label: 'Mock tests' },
            { id: 'analytics', icon: BarChart3, label: 'Performance' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 min-w-[64px] py-2 ${
                  isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-50' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'fill-indigo-50' : ''}`} />
                </div>
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Download Dialog Overlay */}
        {showDownloadDialog && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all scale-100 border border-gray-100">
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <Download className="w-7 h-7" />
                  </div>
                  <button 
                    onClick={() => setShowDownloadDialog(false)}
                    className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-lg p-2 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">Add to Homescreen</h3>
                <p className="text-gray-600 text-sm mb-8 leading-relaxed font-medium">
                  Install the EapcetPro app on your device for a faster, better experience. Access your tests and analytics anytime, anywhere.
                </p>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setShowDownloadDialog(false);
                      setShowDownloadBanner(false);
                    }}
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all active:scale-[0.98]"
                  >
                    Show me how
                  </button>
                  <button 
                    onClick={() => {
                      setShowDownloadDialog(false);
                      setShowDownloadBanner(false);
                    }}
                    className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors active:scale-[0.98]"
                  >
                    I have already downloaded
                  </button>
                  <button 
                    onClick={() => {
                      setShowDownloadDialog(false);
                      setShowDownloadBanner(false);
                    }}
                    className="w-full py-3 text-gray-500 font-bold hover:text-gray-800 transition-colors text-sm"
                  >
                    Don't show this again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Global styles for hiding scrollbar but keeping functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .scrollbar-transparent::-webkit-scrollbar {
            height: 4px;
        }
        .scrollbar-transparent::-webkit-scrollbar-track {
            background: transparent;
        }
        .scrollbar-transparent::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.1);
            border-radius: 10px;
        }
        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom, 1rem);
        }
        @keyframes wave {
          0% { transform: rotate(0.0deg) }
          10% { transform: rotate(14.0deg) }
          20% { transform: rotate(-8.0deg) }
          30% { transform: rotate(14.0deg) }
          40% { transform: rotate(-4.0deg) }
          50% { transform: rotate(10.0deg) }
          60% { transform: rotate(0.0deg) }
          100% { transform: rotate(0.0deg) }
        }
        .animate-wave {
          animation: wave 2.5s infinite;
        }
      `}} />
    </div>
  );
}

