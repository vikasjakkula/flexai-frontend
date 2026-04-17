"use client";

import { useState, useEffect, Suspense } from 'react';
import { Inter } from 'next/font/google';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { InlineMath, BlockMath } from '@/components/KaTeX';
import { useSpriteCSS } from '@/hooks/useSpriteCSS';
import { Shimmer, TestQuestionShimmer } from '@/components/Shimmer';

const inter = Inter({ subsets: ['latin'] });

// Helper to get section from question number
const getActiveSectionFromQuestionNumber = (questionNumber: number): string => {
  if (questionNumber >= 1 && questionNumber <= 80) return 'Maths';
  if (questionNumber >= 81 && questionNumber <= 120) return 'Physics';
  if (questionNumber >= 121 && questionNumber <= 160) return 'Chemistry';
  return 'Maths';
};

function SolutionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams.get('resultId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState(1);
  const [activeSection, setActiveSection] = useState('Maths');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      if (!resultId) {
        setError('Result ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/test/results/${resultId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch result');
        }

        setResult(data.result);
        // Set initial section based on first question
        if (data.result?.questions?.length > 0) {
          const firstQNum = data.result.questions[0].question_number;
          setActiveSection(getActiveSectionFromQuestionNumber(firstQNum));
        }
      } catch (err) {
        console.error('Error fetching result:', err);
        setError(err instanceof Error ? err.message : 'Failed to load result');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  // Load sprite CSS when result data is available
  const { loaded: spritesLoaded, error: spriteError } = useSpriteCSS(result?.test?.sprite_css_url);

  // Get current question
  const currentQuestion = result?.questions?.find((q: any) => q.question_number === currentQuestionId);

  // Navigation functions
  const goToQuestion = (questionId: number) => {
    setCurrentQuestionId(questionId);
    setActiveSection(getActiveSectionFromQuestionNumber(questionId));
  };

  const goToNextQuestion = () => {
    if (!result?.questions || result.questions.length === 0) return;
    const nextId = currentQuestionId + 1;
    const maxQuestion = Math.max(...result.questions.map((q: any) => q.question_number));
    if (nextId <= maxQuestion) {
      goToQuestion(nextId);
    }
  };

  const getMaxQuestionNumber = () => {
    if (!result?.questions || result.questions.length === 0) return 0;
    return Math.max(...result.questions.map((q: any) => q.question_number));
  };

  const goToPrevQuestion = () => {
    const prevId = currentQuestionId - 1;
    if (prevId >= 1) {
      goToQuestion(prevId);
    }
  };

  // Get questions by section
  const getQuestionsBySection = (sectionName: string): any[] => {
    if (!result?.questions) return [];
    const normalizedSection = sectionName.toLowerCase();
    
    const filtered = result.questions.filter((q: any) => {
      const qNum = q.question_number;
      if (normalizedSection === 'maths') {
        return qNum >= 1 && qNum <= 80;
      } else if (normalizedSection === 'physics') {
        return qNum >= 81 && qNum <= 120;
      } else if (normalizedSection === 'chemistry') {
        return qNum >= 121 && qNum <= 160;
      }
      return false;
    });
    
    // Sort by question number
    return filtered.sort((a: any, b: any) => a.question_number - b.question_number);
  };

  // Get question status
  const getQuestionStatus = (question: any) => {
    if (!question.userAnswer) return 'unattempted';
    if (question.userAnswer.toLowerCase() === question.correct_option.toLowerCase()) {
      return 'correct';
    }
    return 'wrong';
  };

  // Get question status class for sidebar
  const getQuestionStatusClass = (question: any) => {
    const status = getQuestionStatus(question);
    if (currentQuestionId === question.question_number) {
      return 'bg-blue-600 text-white border-2 border-blue-800';
    }
    if (status === 'correct') {
      return 'bg-green-500 text-white';
    }
    if (status === 'wrong') {
      return 'bg-red-500 text-white';
    }
    return 'bg-gray-300 text-gray-700';
  };

  // Render LaTeX and HTML content
  const renderContent = (content: string) => {
    if (!content) return null;
    
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
      return processedHtml.split('$').map((part, index) => {
        if (index % 2 === 1) {
          return <InlineMath key={index} math={part} />;
        }
        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      });
    }
    
    return <span dangerouslySetInnerHTML={{ __html: processedHtml }} />;
  };

  // Get option text
  const getOptionText = (question: any, option: string): string => {
    const optionMap: Record<string, string> = {
      'a': question.option_a,
      'b': question.option_b,
      'c': question.option_c,
      'd': question.option_d,
      'e': question.option_e || '',
      'f': question.option_f || ''
    };
    return optionMap[option.toLowerCase()] || '';
  };

  if (loading || !spritesLoaded) {
    return (
      <div className={`${inter.className} min-h-screen bg-gray-50`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <Shimmer height="h-5" width="w-5" rounded />
            <Shimmer height="h-6" width="w-40" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <TestQuestionShimmer />
            <TestQuestionShimmer />
          </div>
        </main>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={`${inter.className} min-h-screen flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || 'Result not found'}</p>
          <button
            onClick={() => router.push(`/dashboard/result?resultId=${resultId}`)}
            className="text-blue-600 hover:text-blue-700"
          >
            Go back to Results
          </button>
        </div>
      </div>
    );
  }

  const testName = result.test?.test_name || `Test ${result.test_id}`;
  const sections = [
    { name: 'Maths', key: 'maths' },
    { name: 'Physics', key: 'physics' },
    { name: 'Chemistry', key: 'chemistry' }
  ];

  return (
    <div className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 flex flex-col`}>
      <header className="bg-white border-b border-gray-200 flex justify-between items-center py-2 px-4 sticky top-0 z-50">
        <div className="flex items-center">
          <button
            onClick={() => router.push(`/dashboard/result?resultId=${resultId}`)}
            className="mr-2 p-1 hover:bg-gray-100 rounded"
            aria-label="Back to results"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <span className="text-blue-600 font-bold text-lg ml-2">eapcet<span className="text-gray-900">pro</span></span>
          <span className="ml-4 text-md font-medium hidden md:inline">{testName}</span>
        </div>
        <div className="flex items-center gap-2">
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
        
        {/* Main content */}
        <div className={`flex-1 p-2 sm:p-4 overflow-y-auto pb-20 transition-all duration-300 ${
          isSidebarOpen ? 'md:mr-72' : ''
        }`}>
          <div className="flex mb-4 items-center">
            <div className="flex-1 overflow-x-auto">
              <div className="flex items-center whitespace-nowrap">
                <span className="font-medium mr-2 text-xs sm:text-sm md:text-base">Sections |</span>
                {sections.map(section => (
                  <button 
                    key={section.key}
                    className={`px-2 py-1 mx-1 rounded text-xs sm:text-sm md:text-base ${
                      activeSection === section.name 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200'
                    }`}
                    onClick={() => {
                      const firstQuestionNumber = section.name === 'Maths' ? 1 :
                        section.name === 'Physics' ? 81 :
                        section.name === 'Chemistry' ? 121 : 1;
                      goToQuestion(firstQuestionNumber);
                    }}
                  >
                    {section.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {currentQuestion && (
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-4">
              <div className="flex justify-between items-center mb-4">
                <div className="font-medium text-sm sm:text-base">Question {currentQuestion.question_number}</div>
                <div className="flex items-center gap-2">
                  {getQuestionStatus(currentQuestion) === 'correct' && (
                    <span className="flex items-center gap-1 text-green-600 text-xs sm:text-sm">
                      <CheckCircleIcon className="h-4 w-4" />
                      Correct
                    </span>
                  )}
                  {getQuestionStatus(currentQuestion) === 'wrong' && (
                    <span className="flex items-center gap-1 text-red-600 text-xs sm:text-sm">
                      <XCircleIcon className="h-4 w-4" />
                      Wrong
                    </span>
                  )}
                  {getQuestionStatus(currentQuestion) === 'unattempted' && (
                    <span className="text-gray-500 text-xs sm:text-sm">Unattempted</span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="text-base sm:text-lg mb-4">
                  {renderContent(currentQuestion.question_text)}
                </div>

                <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
                  {['a', 'b', 'c', 'd', 'e', 'f'].map((option) => {
                    const optionText = getOptionText(currentQuestion, option);
                    if (!optionText) return null;
                    
                    const isUserAnswer = currentQuestion.userAnswer?.toLowerCase() === option.toLowerCase();
                    const isCorrectAnswer = currentQuestion.correct_option?.toLowerCase() === option.toLowerCase();
                    
                    let bgColor = 'bg-white';
                    let borderColor = 'border-gray-300';
                    let textColor = 'text-gray-900';
                    let borderWidth = 'border';
                    
                    if (isCorrectAnswer) {
                      bgColor = 'bg-green-50';
                      borderColor = 'border-green-500';
                      textColor = 'text-green-900';
                      borderWidth = 'border-2';
                    }
                    if (isUserAnswer && !isCorrectAnswer) {
                      bgColor = 'bg-red-50';
                      borderColor = 'border-red-500';
                      textColor = 'text-red-900';
                      borderWidth = 'border-2';
                    }
                    
                    return (
                      <div
                        key={option}
                        className={`${borderWidth} ${bgColor} ${borderColor} rounded-lg p-3 sm:p-4`}
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
                            isCorrectAnswer ? 'bg-green-500 text-white' :
                            isUserAnswer && !isCorrectAnswer ? 'bg-red-500 text-white' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {option.toUpperCase()}
                          </div>
                          <div className={`flex-1 ${textColor} text-sm sm:text-base`}>
                            {renderContent(optionText)}
                          </div>
                          {isCorrectAnswer && (
                            <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        {isUserAnswer && (
                          <div className="mt-2 text-xs sm:text-sm text-blue-600 font-medium">
                            Your Answer
                          </div>
                        )}
                        {isCorrectAnswer && (
                          <div className="mt-2 text-xs sm:text-sm text-green-600 font-medium">
                            Correct Answer
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Solution/Explanation */}
              <div className="mt-6 pt-6 border-t border-gray-300">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Solution:</h3>
                {currentQuestion.answer ? (
                  <div className="text-gray-800 text-sm sm:text-base">
                    {renderContent(currentQuestion.answer)}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm sm:text-base italic">
                    Solution not available for this question.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-2">
            <button
              onClick={goToPrevQuestion}
              disabled={currentQuestionId === 1}
              className={`flex items-center text-sm ${
                currentQuestionId === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              <span>Previous</span>
            </button>
            <button
              onClick={goToNextQuestion}
              disabled={currentQuestionId >= getMaxQuestionNumber()}
              className={`flex items-center text-sm ${
                currentQuestionId >= getMaxQuestionNumber()
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <span>Next</span>
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Collapsible sidebar */}
        <div 
          className={`fixed inset-y-0 right-0 w-full md:w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-[60] ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ top: '56px' }}
        >
          <div className="h-[calc(100vh-56px)] flex flex-col">
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
                {/* Section heading */}
                <div className="mb-3 sm:mb-4">
                  <h3 className="font-medium text-gray-900 text-xs sm:text-sm">Section: <span className="text-blue-600">{activeSection}</span></h3>
                </div>

                {/* Question numbers grid */}
                <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-4">
                  {getQuestionsBySection(activeSection).map((question: any) => (
                    <button
                      key={question.question_id}
                      onClick={() => {
                        goToQuestion(question.question_number);
                        if (window.innerWidth < 768) {
                          setIsSidebarOpen(false);
                        }
                      }}
                      className={`w-full h-8 sm:h-9 flex items-center justify-center rounded text-xs sm:text-sm font-medium ${getQuestionStatusClass(question)}`}
                    >
                      {question.question_number}
                    </button>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Wrong</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <span>Unattempted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-between items-center md:hidden z-50">
        <button
          onClick={goToPrevQuestion}
          disabled={currentQuestionId === 1}
          className={`flex items-center px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm ${
            currentQuestionId === 1 ? 'text-gray-400' : 'text-blue-600'
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
          disabled={currentQuestionId >= getMaxQuestionNumber()}
          className={`flex items-center px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm ${
            currentQuestionId >= getMaxQuestionNumber()
              ? 'text-gray-400' 
              : 'text-blue-600'
          }`}
        >
          <span>Next</span>
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

export default function SolutionPage() {
  return (
    <Suspense fallback={
      <div className={`${inter.className} min-h-screen bg-gray-50`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <Shimmer height="h-5" width="w-5" rounded />
            <Shimmer height="h-6" width="w-40" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <TestQuestionShimmer />
            <TestQuestionShimmer />
          </div>
        </main>
      </div>
    }>
      <SolutionPageContent />
    </Suspense>
  );
}

