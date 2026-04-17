// Copyright 2025 varun
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use client";

import { useState, useEffect, Suspense } from 'react';
import { Inter } from 'next/font/google';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { TestData, TestProgress, Question } from '@/types/test';
import { startTest, getAttempt, saveProgress, submitAttempt } from '@/utils/test-api';
import { useSpriteCSS } from '@/hooks/useSpriteCSS';
import { QuestionContent } from '@/components/QuestionContent';
import { useTimeTracking, TimeTrackingProvider } from '@/contexts/TimeTrackingContext';
import { Shimmer, TestQuestionShimmer } from '@/components/Shimmer';
import { isFreeTest } from '@/utils/free-tests';

// For rendering LaTeX equations
import { InlineMath, BlockMath } from '@/components/KaTeX';

const inter = Inter({ subsets: ['latin'] });

// Section mapping: full test 1-80 maths, 81-120 physics, 121-160 chemistry; trial 1-5 maths, 6-10 physics, 11-15 chemistry
const getActiveSectionFromQuestionNumber = (questionNumber: number, totalQuestions: number = 160): string => {
  if (totalQuestions === 15) {
    if (questionNumber >= 1 && questionNumber <= 5) return 'Maths';
    if (questionNumber >= 6 && questionNumber <= 10) return 'Physics';
    if (questionNumber >= 11 && questionNumber <= 15) return 'Chemistry';
    return 'Maths';
  }
  if (questionNumber >= 1 && questionNumber <= 80) return 'Maths';
  if (questionNumber >= 81 && questionNumber <= 120) return 'Physics';
  if (questionNumber >= 121 && questionNumber <= 160) return 'Chemistry';
  return 'Maths';
};

// Helper to filter out null values from answers for saving
const getAnswersForSave = (answers: Record<number, string | null>): Record<number, string> => {
  return Object.fromEntries(
    Object.entries(answers).filter(([, value]) => value !== null)
  ) as Record<number, string>;
};

function TestPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = parseInt(searchParams.get('testId') || '1', 10);
  const attemptIdParam = searchParams.get('attemptId');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [attemptId, setAttemptId] = useState<string | null>(attemptIdParam);
  const [progress, setProgress] = useState<TestProgress>({
    currentQuestionId: 1,
    activeSection: '',
    answers: {},
    markedForReview: [],
    answeredAndMarkedForReview: [],
    visitedQuestions: [1],
    timeRemaining: 180 * 60, // 3 hours in seconds
  });
  
  const [showInstructions, setShowInstructions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionTime, setCurrentQuestionTime] = useState(0);
  const [isTrial, setIsTrial] = useState(false);
  
  // Time tracking
  const timeTracking = useTimeTracking();
  
  // Load sprite CSS when test data is available
  const { loaded: spritesLoaded, error: spriteError } = useSpriteCSS(testData?.test?.sprite_css_url);
  
  // Set sidebar open by default on desktop screens
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);
  
  // Load test data and attempt
  useEffect(() => {
    const loadTest = async () => {
      try {
        setLoading(true);
        
        // Check authentication
        const authResponse = await fetch('/api/auth/check-session');
        const authData = await authResponse.json();

        if (!authData.authenticated) {
          localStorage.setItem('redirectPath', `/test/take?testId=${testId}`);
          router.push('/auth/login');
          return;
        }

        let attempt: { is_trial?: boolean; id: string; current_question_id: number; answers: Record<number, string>; marked_for_review: number[]; answered_and_marked: number[]; visited_questions: number[]; time_remaining: number } | null = null;
        let testData: any;

        if (attemptId) {
          const attemptData = await getAttempt(attemptId);
          attempt = attemptData.attempt;
          testData = attemptData.testData;
          setIsTrial(!!(attempt as { is_trial?: boolean }).is_trial);
        }

        // Premium check: skip for free tests and for trial attempts (already loaded above)
        if (!attempt?.is_trial && !isFreeTest(testId)) {
          const premiumResponse = await fetch('/api/auth/premium-check');
          const premiumData = await premiumResponse.json();
          if (!premiumData.isPremium) {
            router.push('/onboarding/paywall');
            return;
          }
        }

        // Get user details
        const userResponse = await fetch('/api/auth/user');
        const userData = await userResponse.json();
        setUserId(userData.id);
        setUserName(userData.name || 'Student');

        if (!attemptId) {
          const startData = await startTest(testId);
          attempt = startData.attempt;
          testData = startData.testData;
          setAttemptId(startData.attemptId);
          router.replace(`/test/take?testId=${testId}&attemptId=${startData.attemptId}`, { scroll: false });
        }

        if (!attempt) {
          throw new Error('Failed to initialize test attempt');
        }

        // Set test data
        setTestData(testData);

        const totalQuestions = testData?.questions?.length ?? 160;
        // Restore progress from attempt
        setProgress({
          currentQuestionId: attempt.current_question_id,
          activeSection: getActiveSectionFromQuestionNumber(attempt.current_question_id, totalQuestions),
          answers: attempt.answers || {},
          markedForReview: attempt.marked_for_review || [],
          answeredAndMarkedForReview: attempt.answered_and_marked || [],
          visitedQuestions: attempt.visited_questions || [attempt.current_question_id],
          timeRemaining: attempt.time_remaining
        });

        // Load time tracking data
        if (attempt.id) {
          await timeTracking.loadTimes(attempt.id);
          // Start tracking current question
          timeTracking.startTracking(attempt.current_question_id, attempt.id);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading test:', error);
        setError(error instanceof Error ? error.message : 'Failed to load test');
        setLoading(false);
      }
    };

    loadTest();
  }, [router, testId, attemptId]);
  
  // Timer functionality
  useEffect(() => {
    if (!testData || !attemptId) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newTimeRemaining = prev.timeRemaining - 1;
        
        if (newTimeRemaining <= 0) {
          clearInterval(timer);
          // Auto submit when time is up
          handleSubmitTest();
          return prev;
        }
        
        return {
          ...prev,
          timeRemaining: newTimeRemaining
        };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [testData, attemptId]);

  // Update current question time display - update more frequently for smoother display
  useEffect(() => {
    if (!testData || !attemptId) return;

    const updateTime = () => {
      const timeSpent = timeTracking.getTimeForQuestion(progress.currentQuestionId);
      setCurrentQuestionTime(timeSpent);
    };

    // Update immediately when question changes
    updateTime();

    // Update every 100ms for smoother, more responsive display
    const timeUpdateInterval = setInterval(updateTime, 100);

    return () => clearInterval(timeUpdateInterval);
  }, [testData, attemptId, progress.currentQuestionId, timeTracking]);

  // Auto-save progress
  useEffect(() => {
    if (!attemptId || !testData || loading) return;

    const autoSaveInterval = setInterval(async () => {
      if (isSaving) return;
      
      try {
        setIsSaving(true);
        await saveProgress(attemptId, {
          answers: getAnswersForSave(progress.answers),
          current_question_id: progress.currentQuestionId,
          time_remaining: progress.timeRemaining,
          marked_for_review: progress.markedForReview,
          answered_and_marked: progress.answeredAndMarkedForReview,
          visited_questions: progress.visitedQuestions
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Don't show error to user for auto-save failures
      } finally {
        setIsSaving(false);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [attemptId, progress, testData, loading, isSaving]);
  
  // Format time as HH:MM:SS
  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format question time as MM:SS
  const formatQuestionTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Current question data
  const currentQuestion = testData?.questions.find(q => q.question_number === progress.currentQuestionId);
  
  // Navigation functions
  const goToQuestion = async (questionId: number) => {
    const totalQuestions = testData?.questions?.length ?? 160;
    const newActiveSection = getActiveSectionFromQuestionNumber(questionId, totalQuestions);
    
    const newVisitedQuestions = progress.visitedQuestions.includes(questionId)
      ? progress.visitedQuestions
      : [...progress.visitedQuestions, questionId];
    
    // Switch time tracking
    if (attemptId && progress.currentQuestionId !== questionId) {
      timeTracking.switchQuestion(progress.currentQuestionId, questionId);
    }
    
    setProgress(prev => ({
      ...prev,
      currentQuestionId: questionId,
      activeSection: newActiveSection,
      visitedQuestions: newVisitedQuestions
    }));

    // Save progress when navigating
    if (attemptId && !isSaving) {
      try {
        await saveProgress(attemptId, {
          current_question_id: questionId,
          visited_questions: newVisitedQuestions
        });
        // Save time tracking
        await timeTracking.saveTimes();
      } catch (error) {
        console.error('Failed to save navigation:', error);
      }
    }
  };
  
  const goToNextQuestion = () => {
    if (!testData) return;
    const nextId = progress.currentQuestionId + 1;
    if (nextId <= testData.questions.length) {
      goToQuestion(nextId);
    }
  };
  
  const goToPrevQuestion = () => {
    const prevId = progress.currentQuestionId - 1;
    if (prevId >= 1) {
      goToQuestion(prevId);
    }
  };
  
  // Answer handling
  const handleSelectAnswer = async (optionId: string) => {
    const questionId = progress.currentQuestionId;
    const isMarkedForReview = progress.markedForReview.includes(questionId);
    
    const newAnswers = {
      ...progress.answers,
      [questionId]: optionId
    };
    
    const newAnsweredAndMarked = isMarkedForReview
      ? [...progress.answeredAndMarkedForReview.filter(id => id !== questionId), questionId]
      : progress.answeredAndMarkedForReview;
    
    const newMarkedForReview = progress.markedForReview.filter(id => id !== questionId);
    
    setProgress(prev => ({
      ...prev,
      answers: newAnswers,
      answeredAndMarkedForReview: newAnsweredAndMarked,
      markedForReview: newMarkedForReview
    }));

    // Save answer immediately
    if (attemptId && !isSaving) {
      try {
        await saveProgress(attemptId, {
          answers: getAnswersForSave(newAnswers),
          answered_and_marked: newAnsweredAndMarked,
          marked_for_review: newMarkedForReview
        });
      } catch (error) {
        console.error('Failed to save answer:', error);
      }
    }
  };
  
  // Review marking
  const handleMarkForReview = () => {
    const questionId = progress.currentQuestionId;
    const isAnswered = progress.answers[questionId] !== undefined;
    
    setProgress(prev => {
      // If already marked for review, unmark it
      if (prev.markedForReview.includes(questionId) || prev.answeredAndMarkedForReview.includes(questionId)) {
        return {
          ...prev,
          markedForReview: prev.markedForReview.filter(id => id !== questionId),
          answeredAndMarkedForReview: prev.answeredAndMarkedForReview.filter(id => id !== questionId)
        };
      }
      
      // Otherwise mark it based on whether it's answered
      if (isAnswered) {
        return {
          ...prev,
          answeredAndMarkedForReview: [...prev.answeredAndMarkedForReview, questionId],
          markedForReview: prev.markedForReview.filter(id => id !== questionId)
        };
      } else {
        return {
          ...prev,
          markedForReview: [...prev.markedForReview, questionId],
          answeredAndMarkedForReview: prev.answeredAndMarkedForReview.filter(id => id !== questionId)
        };
      }
    });
    
    goToNextQuestion();
  };
  
  // Clear response
  const handleClearResponse = () => {
    setProgress(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [progress.currentQuestionId]: null
      },
      answeredAndMarkedForReview: prev.answeredAndMarkedForReview.filter(
        id => id !== progress.currentQuestionId
      )
    }));
  };
  
  // Save and next
  const handleSaveAndNext = () => {
    goToNextQuestion();
  };
  
  // Submit test
  const handleSubmitTest = async () => {
    try {
      if (!attemptId) {
        setError('No active test attempt found');
        return;
      }

      // Set submitting state to show loading indicator
      setIsSubmitting(true);

      // Stop time tracking for current question
      if (progress.currentQuestionId) {
        timeTracking.stopTracking(progress.currentQuestionId);
      }

      // CRITICAL: Save all time tracking data before submission
      // Calculate and save all question times
      const allTimes: Record<number, number> = {};
      if (testData) {
        testData.questions.forEach((q: Question) => {
          allTimes[q.question_number] = timeTracking.getTimeForQuestion(q.question_number);
        });
      }

      // Save all times to database
      try {
        const response = await fetch(`/api/test/attempt/${attemptId}/time`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ times: allTimes }),
        });
        if (!response.ok) {
          console.error('Failed to save times before submission');
        }
        // Wait a bit to ensure database write completes
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error saving times before submission:', error);
      }

      // Also call the context save method
      await timeTracking.saveTimes();

      // Save final progress before submitting
      try {
        await saveProgress(attemptId, {
          answers: getAnswersForSave(progress.answers),
          current_question_id: progress.currentQuestionId,
          time_remaining: progress.timeRemaining,
          marked_for_review: progress.markedForReview,
          answered_and_marked: progress.answeredAndMarkedForReview,
          visited_questions: progress.visitedQuestions
        });
      } catch (error) {
        console.error('Failed to save final progress:', error);
      }

      // Submit test
      const result = await submitAttempt(attemptId);

      // Reset time tracking
      timeTracking.reset();

      // Trial: go to result page (result + rank + sticky pricing); else dashboard result
      if (isTrial) {
        router.push(`/test/result?resultId=${result.id}`);
        return;
      }
      router.push(`/dashboard/result?resultId=${result.id}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit test. Please try again.');
      setIsSubmitting(false); // Reset submitting state on error
    }
  };
  
  // Get question status class
  const getQuestionStatusClass = (questionId: number) => {
    if (progress.answeredAndMarkedForReview.includes(questionId)) {
      return 'bg-yellow-500 text-white relative after:content-["✓"] after:absolute after:text-green-800 after:text-xs after:right-1 after:top-0.5';
    }
    
    if (progress.answers[questionId]) {
      return 'bg-green-500 text-white';
    }
    
    if (progress.markedForReview.includes(questionId)) {
      return 'bg-yellow-500 text-white';
    }
    
    if (progress.visitedQuestions.includes(questionId)) {
      return 'bg-red-500 text-white';
    }
    
    return 'bg-white border border-gray-300';
  };
  
  // Count stats
  const attemptedCount = Object.values(progress.answers).filter(answer => answer !== null).length;
  const notAnsweredCount = progress.visitedQuestions.length - attemptedCount;
  const notVisitedCount = (testData?.questions.length || 0) - progress.visitedQuestions.length;
  const markedCount = progress.markedForReview.length;
  const answeredAndMarkedCount = progress.answeredAndMarkedForReview.length;
  
  // Get questions by section (full test: 1-80, 81-120, 121-160; trial: 1-5, 6-10, 11-15)
  const getQuestionsBySection = (sectionName: string): Question[] => {
    if (!testData) return [];
    const normalizedSection = sectionName.toLowerCase();
    const total = testData.questions.length;
    const isTrial = total === 15;
    
    return testData.questions.filter(q => {
      const qNum = q.question_number;
      if (isTrial) {
        if (normalizedSection === 'maths') return qNum >= 1 && qNum <= 5;
        if (normalizedSection === 'physics') return qNum >= 6 && qNum <= 10;
        if (normalizedSection === 'chemistry') return qNum >= 11 && qNum <= 15;
        return false;
      }
      if (normalizedSection === 'maths') return qNum >= 1 && qNum <= 80;
      if (normalizedSection === 'physics') return qNum >= 81 && qNum <= 120;
      if (normalizedSection === 'chemistry') return qNum >= 121 && qNum <= 160;
      return false;
    });
  };
  
  // Render LaTeX and HTML content
  const renderContent = (content: string) => {
    // This is a simplified approach - in a real app you'd need more robust parsing
    const hasLatex = content.includes('$');
    
    // Create a temporary div to parse HTML and modify image sources
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Find all images and update their src if needed
    const images = tempDiv.getElementsByTagName('img');
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        img.setAttribute('src', `https://testseries.edugorilla.com/${src.startsWith('/') ? src.slice(1) : src}`);
      }
    }
    
    const processedHtml = tempDiv.innerHTML;
    
    if (hasLatex) {
      // Very basic LaTeX handling - actual implementation would be more sophisticated
      return processedHtml.split('$').map((part, index) => {
        if (index % 2 === 1) {
          return <InlineMath key={index} math={part} />;
        }
        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      });
    }
    
    return <span dangerouslySetInnerHTML={{ __html: processedHtml }} />;
  };

  // Test data is now loaded in the main loadTest useEffect above

  if (loading || !spritesLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Shimmer height="h-6" width="w-32" />
            <div className="flex items-center gap-4">
              <Shimmer height="h-8" width="w-24" rounded />
              <Shimmer height="h-8" width="w-24" rounded />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <TestQuestionShimmer />
            <div className="mt-6 flex justify-between">
              <Shimmer height="h-10" width="w-32" rounded />
              <Shimmer height="h-10" width="w-32" rounded />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Test not found</div>
      </div>
    );
  }

  return (
    <div className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 flex flex-col`}>
      <header className="bg-white border-b border-gray-200 flex justify-between items-center py-2 px-4 sticky top-0 z-50">
        <div className="flex items-center">
          <span className="text-blue-600 font-bold text-lg ml-2">eapcet<span className="text-gray-900">pro</span></span>
          <span className="ml-4 text-md font-medium hidden md:inline">{testData.test.test_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gray-200 rounded-md px-2 sm:px-3 py-1">
            <span className="font-medium text-xs sm:text-sm md:text-base">Time: {formatTime(progress.timeRemaining)}</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-blue-600 text-white p-2 rounded-md"
            aria-label={isSidebarOpen ? 'Close question palette' : 'Open question palette'}
          >
            {isSidebarOpen ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Sprite loading warning */}
        {spriteError && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 p-2 text-sm text-center z-40">
            ⚠️ Some images may not display correctly
          </div>
        )}
        
        {/* Main test content - adjusts width when sidebar is open on desktop */}
        <div className={`flex-1 p-2 sm:p-4 overflow-y-auto pb-20 transition-all duration-300 ${
          isSidebarOpen ? 'md:mr-72' : ''
        }`}>
          <div className="flex mb-4 items-center">
            <div className="flex-1 overflow-x-auto">
              <div className="flex items-center whitespace-nowrap">
                <span className="font-medium mr-2 text-xs sm:text-sm md:text-base">Sections |</span>
                {testData.sections.map(section => (
                  <button 
                    key={section.section_id}
                    className={`px-2 py-1 mx-1 rounded text-xs sm:text-sm md:text-base ${
                      progress.activeSection === section.section_name 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200'
                    }`}
                    onClick={() => {
                      const firstQuestionNumber = section.section_name.toLowerCase() === 'maths' ? 1 :
                        section.section_name.toLowerCase() === 'physics' ? 81 :
                        section.section_name.toLowerCase() === 'chemistry' ? 121 : 1;
                      goToQuestion(firstQuestionNumber);
                    }}
                  >
                    {section.section_name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="font-medium text-sm sm:text-base">Question {progress.currentQuestionId}</div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div>
                  <span className="text-gray-600 mr-1 text-xs sm:text-sm">Time:</span>
                  <span className="text-xs sm:text-sm font-medium">{formatQuestionTime(currentQuestionTime)}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-base sm:text-lg mb-4">
                {currentQuestion && renderContent(currentQuestion.question_text)}
              </div>

              <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
                {currentQuestion && (
                  <>
                    <div className="flex items-start sm:items-center">
                      <input
                        type="radio"
                        id="option-a"
                        name="answer"
                        checked={progress.answers[progress.currentQuestionId] === 'a'}
                        onChange={() => handleSelectAnswer('a')}
                        className="mt-1 sm:mt-0 mr-2 h-4 w-4"
                      />
                      <label htmlFor="option-a" className="flex-1 text-sm sm:text-base">
                        <span className="mr-2">a.</span>
                        {renderContent(currentQuestion.option_a)}
                      </label>
                    </div>
                    <div className="flex items-start sm:items-center">
                      <input
                        type="radio"
                        id="option-b"
                        name="answer"
                        checked={progress.answers[progress.currentQuestionId] === 'b'}
                        onChange={() => handleSelectAnswer('b')}
                        className="mt-1 sm:mt-0 mr-2 h-4 w-4"
                      />
                      <label htmlFor="option-b" className="flex-1 text-sm sm:text-base">
                        <span className="mr-2">b.</span>
                        {renderContent(currentQuestion.option_b)}
                      </label>
                    </div>
                    <div className="flex items-start sm:items-center">
                      <input
                        type="radio"
                        id="option-c"
                        name="answer"
                        checked={progress.answers[progress.currentQuestionId] === 'c'}
                        onChange={() => handleSelectAnswer('c')}
                        className="mt-1 sm:mt-0 mr-2 h-4 w-4"
                      />
                      <label htmlFor="option-c" className="flex-1 text-sm sm:text-base">
                        <span className="mr-2">c.</span>
                        {renderContent(currentQuestion.option_c)}
                      </label>
                    </div>
                    <div className="flex items-start sm:items-center">
                      <input
                        type="radio"
                        id="option-d"
                        name="answer"
                        checked={progress.answers[progress.currentQuestionId] === 'd'}
                        onChange={() => handleSelectAnswer('d')}
                        className="mt-1 sm:mt-0 mr-2 h-4 w-4"
                      />
                      <label htmlFor="option-d" className="flex-1 text-sm sm:text-base">
                        <span className="mr-2">d.</span>
                        {renderContent(currentQuestion.option_d)}
                      </label>
                    </div>
                    {currentQuestion.option_e && (
                      <div className="flex items-start sm:items-center">
                        <input
                          type="radio"
                          id="option-e"
                          name="answer"
                          checked={progress.answers[progress.currentQuestionId] === 'e'}
                          onChange={() => handleSelectAnswer('e')}
                          className="mt-1 sm:mt-0 mr-2 h-4 w-4"
                        />
                        <label htmlFor="option-e" className="flex-1 text-sm sm:text-base">
                          <span className="mr-2">e.</span>
                          {renderContent(currentQuestion.option_e)}
                        </label>
                      </div>
                    )}
                    {currentQuestion.option_f && (
                      <div className="flex items-start sm:items-center">
                        <input
                          type="radio"
                          id="option-f"
                          name="answer"
                          checked={progress.answers[progress.currentQuestionId] === 'f'}
                          onChange={() => handleSelectAnswer('f')}
                          className="mt-1 sm:mt-0 mr-2 h-4 w-4"
                        />
                        <label htmlFor="option-f" className="flex-1 text-sm sm:text-base">
                          <span className="mr-2">f.</span>
                          {renderContent(currentQuestion.option_f)}
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 mt-4 sm:mt-8">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleMarkForReview}
                  className="bg-gray-200 text-gray-800 px-3 sm:px-4 py-2 rounded-md hover:bg-gray-300 transition text-sm"
                >
                  Mark for Review & Next
                </button>
                <button
                  onClick={handleClearResponse}
                  className="bg-gray-200 text-gray-800 px-3 sm:px-4 py-2 rounded-md hover:bg-gray-300 transition text-sm"
                >
                  Clear Response
                </button>
              </div>
              <button
                onClick={progress.currentQuestionId === testData.questions.length ? handleSubmitTest : handleSaveAndNext}
                disabled={isSubmitting}
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 transition text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {progress.currentQuestionId === testData.questions.length
                  ? (isSubmitting ? 'Submitting...' : 'Submit Test')
                  : 'Save & Next'}
              </button>
            </div>
          </div>

          <div className="flex justify-between mt-2">
            <button
              onClick={goToPrevQuestion}
              disabled={progress.currentQuestionId === 1}
              className={`flex items-center text-sm ${
                progress.currentQuestionId === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              <span>Previous</span>
            </button>
            <button
              onClick={goToNextQuestion}
              disabled={progress.currentQuestionId === testData.questions.length}
              className={`flex items-center text-sm ${
                progress.currentQuestionId === testData.questions.length ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <span>Next</span>
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Collapsible sidebar - now with mobile optimization */}
        <div 
          className={`fixed inset-y-0 right-0 w-full md:w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-[60] ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ top: '56px' }}
        >
          <div className="h-[calc(100vh-56px)] flex flex-col">
            {/* Close button for sidebar */}
            <div className="flex justify-between items-center p-3 border-b bg-gray-50">
              <span className="font-medium text-sm text-gray-700">Question Palette</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-md transition"
                aria-label="Close sidebar"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 sm:p-4">
                {/* Profile section with stats */}
                <div className="bg-[#3B4B6B] text-white p-3 sm:p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="font-medium text-sm">{userName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#2D3B59] rounded p-2">
                      <span className="text-green-400 font-bold mr-1">{attemptedCount}</span>
                      <span>Attempted</span>
                    </div>
                    <div className="bg-[#2D3B59] rounded p-2">
                      <span className="text-yellow-400 font-bold mr-1">{markedCount}</span>
                      <span>Marked</span>
                    </div>
                    <div className="bg-[#2D3B59] rounded p-2">
                      <span className="text-white font-bold mr-1">{notVisitedCount}</span>
                      <span>Not Visited</span>
                    </div>
                    <div className="bg-[#2D3B59] rounded p-2">
                      <span className="text-red-400 font-bold mr-1">{notAnsweredCount}</span>
                      <span>Not Answered</span>
                    </div>
                    <div className="bg-[#2D3B59] rounded p-2 col-span-2">
                      <span className="text-yellow-400 font-bold mr-1">{answeredAndMarkedCount}</span>
                      <span>Marked & Answered</span>
                    </div>
                  </div>
                </div>

                {/* Section heading */}
                <div className="mb-3 sm:mb-4">
                  <h3 className="font-medium text-gray-900 text-xs sm:text-sm">Section: <span className="text-blue-600">{progress.activeSection}</span></h3>
                </div>

                {/* Question numbers grid */}
                <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-4">
                  {getQuestionsBySection(progress.activeSection).map((question) => (
                    <button
                      key={question.question_id}
                      onClick={() => {
                        goToQuestion(question.question_number);
                        if (window.innerWidth < 768) {
                          setIsSidebarOpen(false);
                        }
                      }}
                      className={`w-full h-8 sm:h-9 flex items-center justify-center rounded text-xs sm:text-sm ${
                        progress.currentQuestionId === question.question_number ? 'bg-red-500 text-white' : 
                        progress.answeredAndMarkedForReview.includes(question.question_number) ? 'bg-yellow-400 text-white relative after:content-["✓"] after:absolute after:text-green-800 after:text-xs after:right-1 after:top-0.5' :
                        progress.markedForReview.includes(question.question_number) ? 'bg-yellow-400 text-white' :
                        progress.answers[question.question_number] ? 'bg-green-500 text-white' :
                        progress.visitedQuestions.includes(question.question_number) ? 'bg-red-500 text-white' :
                        'bg-white border border-gray-300'
                      }`}
                    >
                      {question.question_number}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed bottom buttons */}
            <div className="p-3 sm:p-4 bg-gray-50 border-t">
              <button
                onClick={() => setShowInstructions(true)}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded mb-2 hover:bg-gray-200 transition text-sm font-medium"
              >
                Instructions
              </button>

              <button
                onClick={handleSubmitTest}
                disabled={isSubmitting}
                className={`w-full bg-[#3B4B6B] text-white py-2 rounded transition text-sm font-medium flex items-center justify-center gap-2 ${
                  isSubmitting 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:bg-[#2D3B59]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Submitting Test...</span>
                  </>
                ) : (
                  'SUBMIT TEST'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-between items-center md:hidden z-50">
        <button
          onClick={goToPrevQuestion}
          disabled={progress.currentQuestionId === 1}
          className={`flex items-center px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm ${
            progress.currentQuestionId === 1 ? 'text-gray-400' : 'text-blue-600'
          }`}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          <span>Previous</span>
        </button>
        
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium"
        >
          Question List
        </button>
        
        <button
          onClick={goToNextQuestion}
          disabled={progress.currentQuestionId === testData.questions.length}
          className={`flex items-center px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm ${
            progress.currentQuestionId === testData.questions.length ? 'text-gray-400' : 'text-blue-600'
          }`}
        >
          <span>Next</span>
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

export default function TestPage() {
  return (
    <TimeTrackingProvider>
    <Suspense fallback={
      <div className={`${inter.className} min-h-screen bg-gray-50`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Shimmer height="h-6" width="w-32" />
            <div className="flex items-center gap-4">
              <Shimmer height="h-8" width="w-24" rounded />
              <Shimmer height="h-8" width="w-24" rounded />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <TestQuestionShimmer />
            <div className="mt-6 flex justify-between">
              <Shimmer height="h-10" width="w-32" rounded />
              <Shimmer height="h-10" width="w-32" rounded />
            </div>
          </div>
        </main>
      </div>
    }>
      <TestPageContent />
    </Suspense>
    </TimeTrackingProvider>
  );
}
