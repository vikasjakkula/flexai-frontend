"use client"
// pages/index.js

import Head from 'next/head';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] });

const useCountUp = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
};

import { PRICING_PLANS, getDefaultPlan, PlanTier, getProPlan } from '@/utils/pricing'
import { trackLandingView } from '@/lib/facebook-pixel'

// Features list for PRO plan
const PRICING_FEATURES = [
  'Access to all previous year papers since 2015',
  'Unlimited test attempts',
  'Detailed performance analytics',
  'Marks vs rank predictor [predict rank for each test]'
]

// Feature comparison for pricing cards
const FEATURES_COMPARISON = [
  { name: 'All previous year papers', basic: true, pro: true },
  { name: 'Performance analytics', basic: true, pro: true },
  { name: 'Test attempts per paper', basic: '1 attempt', pro: 'Unlimited' },
  { name: 'Rank predictor', basic: false, pro: true },
]

export default function Home() {
  const router = useRouter()
  const [expandedSection, setExpandedSection] = useState('2023');
  const [activeTab, setActiveTab] = useState('ts'); // 'ts' for TS EAPCET, 'ap' for AP EAPCET
  const [selectedTier, setSelectedTier] = useState<PlanTier>('PRO'); // Default to PRO plan
  const [testsData, setTestsData] = useState<any>(null);
  const [apTestsData, setApTestsData] = useState<any>(null);
  const [showScrollBanner, setShowScrollBanner] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const questionPapers = useCountUp(142, 2000);
  const totalQuestions = useCountUp(22720, 2000);
  const mathScore = useCountUp(72, 1500);
  const physicsScore = useCountUp(81, 1500);
  const chemistryScore = useCountUp(65, 1500);
  const [landingHref, setLandingHref] = useState('/landing');
  const [daysUntilExam, setDaysUntilExam] = useState<number | null>(null);

  // Days until EAPCET 2026 (May 9th) - calculated on client to avoid hydration mismatch
  useEffect(() => {
    const examDate = new Date('2026-05-09');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);
    const days = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    setDaysUntilExam(days);
  }, []);

  // Read ?ref= from URL on client to avoid Suspense + useSearchParams
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    setLandingHref(ref ? `/landing?ref=${encodeURIComponent(ref)}` : '/landing');
  }, []);

  // Load TS tests data from JSON file
  useEffect(() => {
    fetch('/tests-data.json')
      .then(res => res.json())
      .then(data => {
        setTestsData(data);
        // Set first year as expanded by default
        if (data.grouped) {
          const years = Object.keys(data.grouped)
            .filter(year => year !== 'mock')
            .sort((a, b) => {
              const yearA = parseInt(a) || 0;
              const yearB = parseInt(b) || 0;
              return yearB - yearA;
            });
          if (years.length > 0) {
            setExpandedSection(years[0]);
          }
        }
      })
      .catch(err => {
        console.log('TS Tests data not available, using default structure');
        setTestsData(null);
      });
  }, []);

  // Load AP tests data from JSON file
  useEffect(() => {
    fetch('/tests-data-ap.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setApTestsData(data);
        // Set first year as expanded by default for AP tests if not already set
        if (data.grouped && activeTab === 'ap') {
          const years = Object.keys(data.grouped)
            .sort((a, b) => {
              const yearA = parseInt(a) || 0;
              const yearB = parseInt(b) || 0;
              return yearB - yearA;
            });
          if (years.length > 0) {
            setExpandedSection(years[0]);
          }
        }
      })
      .catch(err => {
        console.error('AP Tests data not available:', err);
        setApTestsData(null);
      });
  }, [activeTab]);

  // Check if user is already signed in
  useEffect(() => {
    fetch('/api/auth/check-session')
      .then(r => r.json())
      .then(data => { if (data.authenticated) setIsAuthenticated(true) })
      .catch(() => {})
  }, []);

  // Facebook Pixel: fire ViewContent "Landing Page" for retargeting audiences
  useEffect(() => {
    trackLandingView()
  }, []);

  // Handle scroll to show/hide banner
  useEffect(() => {
    const handleScroll = () => {
      // Show banner when scrolled more than 300px
      const scrollY = window.scrollY || window.pageYOffset;
      setShowScrollBanner(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Free trial flow: signup → onboarding → dashboard → (click free recommended tests CTA) → /landing
  const goToFreeTrialSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('redirectPath', '/onboarding');
    }
    router.push('/auth/register');
  };

  const handleTestAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/check-session');
      const data = await response.json();
      
      if (!data.authenticated) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('redirectPath', '/onboarding');
        }
        router.push('/auth/register');
        return;
      }
      
      // Check premium status
      const premiumResponse = await fetch('/api/auth/premium-check');
      const premiumData = await premiumResponse.json();
      
      if (!premiumData.isPremium) {
        // Redirect to paywall if not premium
        router.push('/onboarding/paywall');
        return;
      }
      
      router.push('/dashboard/tests');
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('redirectPath', '/onboarding');
      }
      router.push('/auth/register');
    }
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection('');
    } else {
      setExpandedSection(section);
    }
  };

  const handlePurchase = async () => {
    try {
      // Store selected tier for use in payment flow
      localStorage.setItem('selectedTier', selectedTier)

      // Check if session cookie exists
      const response = await fetch('/api/auth/check-session')
      const data = await response.json()

      // Store redirect path before checking auth
      localStorage.setItem('redirectPath', '/onboarding/paywall')

      if (data.authenticated) {
        // If logged in, go directly to paywall
        router.push('/onboarding/paywall')
      } else {
        // If not logged in, go to login page
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Session check error:', error)
      // On error, redirect to login to be safe
      router.push('/auth/login')
    }
  }

  return (
    <div className={`${inter.className} min-h-screen bg-white text-gray-900`}>
      <Head>
        <title>EAPCET Pro - Master Your EAPCET Preparation</title>
        <meta name="description" content="Ace your TS & AP EAPCET exam with our smart test preparation platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header Section */}
      <header className="container mx-auto px-8 max-w-7xl py-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-blue-600 font-bold text-xl">eapcet<span className="text-gray-900">pro</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-600 hover:text-blue-600">Features</a>
          <a href="#test-series" className="text-gray-600 hover:text-blue-600">Test Series</a>
          <a href="#pricing" className="text-gray-600 hover:text-blue-600">Pricing</a>
          {isAuthenticated ? (
            <button type="button" onClick={() => router.push('/dashboard')} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition font-semibold">Go to Dashboard</button>
          ) : (
            <button type="button" onClick={goToFreeTrialSignup} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">login</button>
          )}
        </nav>
        {isAuthenticated ? (
          <button type="button" onClick={() => router.push('/dashboard')} className="md:hidden bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition font-semibold">
            Dashboard
          </button>
        ) : (
          <button type="button" onClick={goToFreeTrialSignup} className="md:hidden border border-blue-600 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition">
            login
          </button>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-8 max-w-7xl py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm font-semibold text-blue-600 inline-block bg-blue-50 px-4 py-1 rounded-full mb-3">#1 TS & AP EAPCET TEST PREPARATION</p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Improve your TS & AP EAPCET rank <span className="text-blue-600">in last {daysUntilExam ?? 30} days</span> </h1>
            <p className="text-gray-600 mb-6">Practice chapter wise question quizzes and full length previous year paper mock tests to get your DREAM rank</p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-10">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition cursor-pointer font-semibold text-center shadow-lg"
                >
                  Go to Dashboard
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToFreeTrialSignup}
                  className="animate-cta-shake inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition cursor-pointer font-semibold text-center shadow-lg"
                >
                  get started
                </button>
              )}
              <div className="flex items-center gap-2 animate-arrow-bounce">
                <svg
                  className="w-16 h-10 sm:w-20 sm:h-12 shrink-0 text-gray-800"
                  viewBox="0 0 80 48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {/* Hand-drawn squiggly arrow pointing left at the button */}
                  <path d="M72 24 C68 18 58 30 48 24 C38 18 28 30 18 24 C12 20 6 24 4 24 M4 20 L1 24 L4 28" />
                </svg>
                <span className="text-sm sm:text-base font-medium text-gray-800 whitespace-nowrap">click here</span>
              </div>
            </div>
            <div className="flex gap-12">
              <div>
                <p className="text-2xl font-bold text-gray-900">{questionPapers}+</p>
                <p className="text-gray-500 text-sm">Question Papers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalQuestions.toLocaleString()}+</p>
                <p className="text-gray-500 text-sm">Questions</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Your Performance Analytics</h3>
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Mathematics</span>
                  <span className="text-sm font-medium text-gray-900">{mathScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${mathScore}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Physics</span>
                  <span className="text-sm font-medium text-gray-900">{physicsScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${physicsScore}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Chemistry</span>
                  <span className="text-sm font-medium text-gray-900">{chemistryScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${chemistryScore}%` }}></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <p className="text-blue-600 font-bold text-xl">87%</p>
                <p className="text-gray-600 text-xs">Accuracy</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <p className="text-blue-600 font-bold text-xl">142</p>
                <p className="text-gray-600 text-xs">Score</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <p className="text-blue-600 font-bold text-xl">32</p>
                <p className="text-gray-600 text-xs">Mock Tests</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <p className="text-blue-600 font-bold text-xl">2.5k</p>
                <p className="text-gray-600 text-xs">Est. Rank</p>
              </div>
            </div>
          </div>
        </section>

        {/* Test Collection Section */}
        <section id="test-series" className="container mx-auto px-8 max-w-7xl py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Comprehensive Test Collection</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Practice with our extensive library of previous year papers and mock tests designed for TS & AP EAPCET success.</p>
          </div>
          <div className="flex gap-4 justify-center mb-12">
            <button 
              className={`px-6 py-3 rounded-md transition ${activeTab === 'ts' ? 'bg-blue-600 text-white' : 'border border-blue-600 text-blue-600'}`}
              onClick={() => setActiveTab('ts')}
            >
              TS EAPCET
            </button>
            <button 
              className={`px-6 py-3 rounded-md transition ${activeTab === 'ap' ? 'bg-blue-600 text-white' : 'border border-blue-600 text-blue-600'}`}
              onClick={() => setActiveTab('ap')}
            >
              AP EAPCET
            </button>
          </div>

          {/* Test Paper Accordion - Dynamic from JSON */}
          <div className="max-w-4xl mx-auto">
            {activeTab === 'ts' ? (
              !testsData ? (
                <div className="text-center py-8 text-gray-500">Loading TS EAPCET tests...</div>
              ) : (
                <>
                  {Object.entries(testsData.grouped || {})
                    .filter(([year]) => year !== 'mock') // Filter out mock tests for TS EAPCET tab
                    .sort(([a], [b]) => {
                      // Sort years descending (newest first)
                      const yearA = parseInt(a) || 0;
                      const yearB = parseInt(b) || 0;
                      return yearB - yearA;
                    })
                    .map(([year, yearTests]) => {
                      const tests = Array.isArray(yearTests) ? yearTests : [];
                      return (
                      <div key={year} className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
                        <div 
                          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
                          onClick={() => toggleSection(year)}
                        >
                          <h3 className="font-semibold">TS EAPCET {year} Papers</h3>
                          {expandedSection === year ? (
                            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        {expandedSection === year && (
                          <div className="p-4 space-y-4">
                            {tests.map((test: any) => (
                              <div key={test.test_id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex flex-wrap justify-between mb-2">
                                  <h4 className="font-semibold">{test.test_name}</h4>
                                  <div className="flex gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                      </svg>
                                      3 hours
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      160 questions
                                    </span>
                                  </div>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleTestAction(e);
                                  }} 
                                  className="bg-blue-600/90 text-white px-8 py-2 rounded-md hover:bg-blue-700 transition inline-block"
                                >
                                  Take Test
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      );
                    })}
                </>
              )
            ) : (
              // AP EAPCET tab - show AP tests
              apTestsData && apTestsData.grouped ? (
                <div className="space-y-4">
                  {Object.entries(apTestsData.grouped)
                    .sort(([a], [b]) => {
                      // Sort years descending (newest first)
                      const yearA = parseInt(a) || 0;
                      const yearB = parseInt(b) || 0;
                      return yearB - yearA;
                    })
                    .map(([year, yearTests]) => {
                      const tests = Array.isArray(yearTests) ? yearTests : [];
                      return (
                        <div key={year} className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
                          <div 
                            className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
                            onClick={() => toggleSection(year)}
                          >
                            <h3 className="font-semibold">AP EAPCET {year === 'mock' ? 'Mock Tests' : `${year} Papers`}</h3>
                            {expandedSection === year ? (
                              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          {expandedSection === year && (
                            <div className="p-4 space-y-4">
                              {tests.map((test: any) => (
                                <div key={test.test_id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex flex-wrap justify-between mb-2">
                                    <h4 className="font-semibold">{test.test_name}</h4>
                                    <div className="flex gap-4 text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        3 hours
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        160 questions
                                      </span>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleTestAction(e);
                                    }} 
                                    className="bg-blue-600/90 text-white px-8 py-2 rounded-md hover:bg-blue-700 transition inline-block"
                                  >
                                    Take Test
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  {Object.keys(apTestsData.grouped).length === 0 && (
                    <div className="text-center py-8 text-gray-500">No AP EAPCET tests available</div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Loading AP EAPCET tests...</div>
              )
            )}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-8 max-w-7xl py-16 bg-gray-50">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Everything You Need for TS & AP EAPCET Success</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Comprehensive features designed to maximize your score and track your progress effectively.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Real Exam Experience</h3>
              <p className="text-gray-600">Practice with realistic question formats and time constraints to simulate the actual TS & AP EAPCET exam experience.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Detailed Analytics</h3>
              <p className="text-gray-600">Get comprehensive insights into your strengths and weaknesses with subject-wise performance breakdown.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Previous Year Papers</h3>
              <p className="text-gray-600">Access full sets of past TS & AP EAPCET papers with detailed solutions to establish exam patterns.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Topic-wise Tests</h3>
              <p className="text-gray-600">Practice specific subjects and topics to improve your understanding in each topic.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Time Management</h3>
              <p className="text-gray-600">Learn to manage your time effectively with our detailed test performance and analysis reports.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Peer Comparison</h3>
              <p className="text-gray-600">Track your progress against other test-takers with comprehensive analytical comparisons.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600/95 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-700/20"></div>
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23fff" fill-opacity="0.05" fill-rule="evenodd"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3Ccircle cx="13" cy="13" r="3"/%3E%3C/g%3E%3C/svg%3E")'
          }}></div>
          <div className="container mx-auto px-8 max-w-7xl text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready to Ace Your TS & AP EAPCET?</h2>
            <p className="max-w-2xl mx-auto mb-10 text-white/90 text-lg">Join thousands of successful students who have achieved their dream ranks with eapcetpro.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                type="button"
                onClick={goToFreeTrialSignup}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                get started
              </button>
              <p className="text-white/80 text-sm">Limited time offer - Save 64% today!</p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-8 max-w-7xl py-16">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 mb-2">Pricing</p>
            <h2 className="text-3xl font-bold mb-3">Choose Your Plan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Unlock all features and ace your EAPCET exam</p>
          </div>

          {/* Pricing Plans - Two Tier */}
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* BASIC Card */}
              <div
                onClick={() => setSelectedTier('BASIC')}
                className={`relative flex flex-col p-6 border-2 rounded-xl cursor-pointer transition ${
                  selectedTier === 'BASIC'
                    ? 'border-blue-600 bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >

                <div className="mt-2">
                  <h3 className="text-xl font-bold text-gray-900">BASIC</h3>
                  <p className="text-sm text-gray-600 mb-3">4 Months</p>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold text-gray-900">₹299</span>
                    <span className="text-sm text-gray-500 ml-1">after trial</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {FEATURES_COMPARISON.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {feature.basic ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={feature.basic ? 'text-gray-700' : 'text-gray-400'}>
                          {typeof feature.basic === 'string' ? `${feature.name}: ${feature.basic}` : feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedTier === 'BASIC' ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {selectedTier === 'BASIC' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                    <span className="text-sm text-gray-600">Select BASIC</span>
                  </div>
                </div>
              </div>

              {/* PRO Card */}
              <div
                onClick={() => setSelectedTier('PRO')}
                className={`relative flex flex-col p-6 border-2 rounded-xl cursor-pointer transition ${
                  selectedTier === 'PRO'
                    ? 'border-blue-600 bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="absolute -top-3 left-4 flex gap-2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    POPULAR
                  </span>
                  <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    RANK BOOSTER UNLIMITED
                  </span>
                </div>
                <div className="mt-2">
                  <h3 className="text-xl font-bold text-gray-900">PRO</h3>
                  <p className="text-sm text-gray-600 mb-3">Rank Booster Unlimited</p>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold text-gray-900">₹399</span>
                    <span className="text-sm text-gray-500 ml-1">one-time</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {FEATURES_COMPARISON.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">
                          {typeof feature.pro === 'string' ? `${feature.name}: ${feature.pro}` : feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedTier === 'PRO' ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {selectedTier === 'PRO' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                    <span className="text-sm text-gray-600">Select PRO</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Button */}
            <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl shadow-md p-6">
              <button
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition cursor-pointer font-semibold text-lg mb-4"
                onClick={handlePurchase}
              >
                {selectedTier === 'PRO' ? 'Pay ₹399 Now' : 'Pay ₹299 Now'}
              </button>
              <div className="flex items-center justify-center gap-2">
                <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-5" />
                <p className="text-xs text-gray-500">
                  {selectedTier === 'PRO' ? 'One-time payment • Rank Booster Unlimited' : '3-day free trial • Cancel anytime'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Affiliate Section */}
        <section id="affiliate" className="container mx-auto px-8 max-w-7xl py-8 mb-8">
          <div className="max-w-3xl mx-auto border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3">Affiliate Program</h3>
            <p className="text-gray-600 mb-4">Recommend eapcetpro to others and earn income! Join our affiliate program and earn commission on each successful referral.</p>
            <Link href="/affiliate/register" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition cursor-pointer inline-block">Become an Affiliate</Link>
          </div>
        </section>
      </main>

      {/* Scroll Banner - Shows when user scrolls */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          showScrollBanner ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-full bg-blue-600 shadow-lg">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-white font-semibold text-lg mb-1">Ready to Start Your Preparation?</p>
                <p className="text-white/90 text-sm">Join thousands of successful students</p>
              </div>
              <button
                type="button"
                onClick={goToFreeTrialSignup}
                className="w-full sm:w-auto bg-white text-blue-600 px-6 py-3 rounded-md hover:bg-gray-100 transition font-semibold text-center"
              >
                get started
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 pt-12 pb-6">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-blue-600 font-bold text-xl">eapcet<span className="text-gray-900">pro</span></span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Helping students ace their TS & AP EAPCET exams with comprehensive preparation tools.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-blue-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link></li>
                <li><a href="#features" className="text-gray-600 hover:text-blue-600">Features</a></li>
                <li><a href="#test-series" className="text-gray-600 hover:text-blue-600">Test Series</a></li>
                <li><a href="#pricing" className="text-gray-600 hover:text-blue-600">Pricing</a></li>
                <li><Link href="/about" className="text-gray-600 hover:text-blue-600">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-blue-600">Contact Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms-and-conditions" className="text-gray-600 hover:text-blue-600">Terms and Conditions</Link></li>
                <li><Link href="/privacy-policy" className="text-gray-600 hover:text-blue-600">Privacy Policy</Link></li>
                <li><Link href="/refund-cancellation-policy" className="text-gray-600 hover:text-blue-600">Refund & Cancellation Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <a href="https://wa.me/919182607873" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">WhatsApp: +91 9182607873</a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 mt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">© 2025 eapcetpro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}