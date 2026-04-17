import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Menu, X, Clock, Info, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MockTestInterfaceProps {
  testId: string | number;
  testTitle: string;
  onClose: () => void;
}

type Section = 'Mathematics' | 'Physics' | 'Chemistry';
type QuestionStatus = 'answered' | 'not_visited' | 'not_answered' | 'marked' | 'marked_answered';

interface Question {
  id: number;
  section: Section;
  text: string;
  options: string[];
}

export default function MockTestInterface({ testId, testTitle, onClose }: MockTestInterfaceProps) {
  const [view, setView] = useState<'instructions' | 'test'>('instructions');
  const [agreed, setAgreed] = useState(false);
  const [language, setLanguage] = useState('English');
  
  const [timeLeft, setTimeLeft] = useState(180 * 60); // 180 minutes in seconds
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});
  const [currentSection, setCurrentSection] = useState<Section>('Mathematics');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  
  const [answers, setAnswers] = useState<Record<number, { status: QuestionStatus, selectedOption?: number }>>({});
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId)
        .order('section_id')
        .order('question_number');

      if (data) {
        const formattedQuestions: Question[] = data.map(q => {
          let parsedOptions = [];
          try {
            parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            if (parsedOptions && !Array.isArray(parsedOptions) && typeof parsedOptions === 'object') {
              parsedOptions = Object.values(parsedOptions);
            }
          } catch (e) {
            parsedOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
          }

          // Map section_id to Section type
          let section: Section = 'Mathematics';
          if (q.section_id.toLowerCase().includes('phy')) section = 'Physics';
          if (q.section_id.toLowerCase().includes('chem')) section = 'Chemistry';

          return {
            id: q.id,
            section,
            text: q.question_text,
            options: parsedOptions || []
          };
        });
        setAllQuestions(formattedQuestions);
        
        // Initialize answers state
        const initialAnswers: Record<number, { status: QuestionStatus }> = {};
        formattedQuestions.forEach(q => {
          initialAnswers[q.id] = { status: 'not_visited' };
        });
        // Mark first question as not_answered initially if viewed
        const firstQ = formattedQuestions.find(q => q.section === 'Mathematics');
        if (firstQ) {
          initialAnswers[firstQ.id] = { status: 'not_answered' };
        }
        setAnswers(initialAnswers);
      }
      setLoading(false);
    }
    fetchQuestions();
  }, [testId]);

  const currentSectionQuestions = allQuestions.filter(q => q.section === currentSection);
  const currentQuestion = currentSectionQuestions[currentQuestionIndex];

  // Timer logic
  useEffect(() => {
    if (view === 'test' && timeLeft > 0 && currentQuestion) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setQuestionTimes(prev => ({
          ...prev,
          [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
        }));
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      // Handle auto submit
      onClose();
    }
  }, [view, timeLeft, onClose, currentQuestion?.id]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatQuestionTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    if (agreed) {
      setView('test');
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOption: optionIndex,
        status: prev[currentQuestion.id]?.status === 'marked' ? 'marked_answered' : 'answered'
      }
    }));
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        status: 'not_answered',
        selectedOption: undefined
      }
    }));
  };

  const handleMarkForReview = () => {
    if (!currentQuestion) return;
    setAnswers(prev => {
      const currentAns = prev[currentQuestion.id] || { status: 'not_visited' };
      const hasAnswer = currentAns.selectedOption !== undefined;
      return {
        ...prev,
        [currentQuestion.id]: {
          ...currentAns,
          status: hasAnswer ? 'marked_answered' : 'marked'
        }
      };
    });
    goToNextQuestion();
  };

  const handleSaveAndNext = () => {
    if (!currentQuestion) return;
    setAnswers(prev => {
      const currentAns = prev[currentQuestion.id] || { status: 'not_visited' };
      const hasAnswer = currentAns.selectedOption !== undefined;
      return {
        ...prev,
        [currentQuestion.id]: {
          ...currentAns,
          status: hasAnswer ? 'answered' : 'not_answered'
        }
      };
    });
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < currentSectionQuestions.length - 1) {
      const nextQ = currentSectionQuestions[currentQuestionIndex + 1];
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      updateQuestionStatusOnVisit(nextQ.id);
    } else {
      // Move to next section if available
      const sections: Section[] = ['Mathematics', 'Physics', 'Chemistry'];
      const currentIdx = sections.indexOf(currentSection);
      if (currentIdx < sections.length - 1) {
        setCurrentSection(sections[currentIdx + 1]);
        setCurrentQuestionIndex(0);
        const nextQ = allQuestions.find(q => q.section === sections[currentIdx + 1]);
        if (nextQ) updateQuestionStatusOnVisit(nextQ.id);
      }
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevQ = currentSectionQuestions[currentQuestionIndex - 1];
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      updateQuestionStatusOnVisit(prevQ.id);
    } else {
      // Move to prev section if available
      const sections: Section[] = ['Mathematics', 'Physics', 'Chemistry'];
      const currentIdx = sections.indexOf(currentSection);
      if (currentIdx > 0) {
        setCurrentSection(sections[currentIdx - 1]);
        const prevSectionQuestions = allQuestions.filter(q => q.section === sections[currentIdx - 1]);
        setCurrentQuestionIndex(prevSectionQuestions.length - 1);
        const prevQ = prevSectionQuestions[prevSectionQuestions.length - 1];
        if (prevQ) updateQuestionStatusOnVisit(prevQ.id);
      }
    }
  };

  const jumpToQuestion = (index: number) => {
    const q = currentSectionQuestions[index];
    setCurrentQuestionIndex(index);
    updateQuestionStatusOnVisit(q.id);
    if (window.innerWidth < 768) {
      setShowPalette(false);
    }
  };

  const updateQuestionStatusOnVisit = (qId: number) => {
    setAnswers(prev => {
      if (prev[qId]?.status === 'not_visited') {
        return { ...prev, [qId]: { ...prev[qId], status: 'not_answered' } };
      }
      return prev;
    });
  };

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case 'answered': return 'bg-[#28a745] text-white border-[#28a745] rounded-md';
      case 'not_answered': return 'bg-[#dc3545] text-white border-[#dc3545] rounded-md';
      case 'not_visited': return 'bg-white text-gray-700 border-gray-300 rounded-md';
      case 'marked': return 'bg-[#6f42c1] text-white border-[#6f42c1] rounded-full';
      case 'marked_answered': return 'bg-[#6f42c1] text-white border-[#6f42c1] rounded-full relative after:content-["✓"] after:absolute after:-bottom-1 after:-right-1 after:bg-[#28a745] after:text-white after:text-[8px] after:w-3.5 after:h-3.5 after:rounded-full after:flex after:items-center after:justify-center';
      default: return 'bg-white text-gray-700 border-gray-300 rounded-md';
    }
  };

  const getStatusCount = (status: QuestionStatus) => {
    return Object.values(answers).filter((a: any) => a.status === status).length;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Loading test questions...</p>
      </div>
    );
  }

  if (allQuestions.length === 0) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col font-sans">
        <header className="bg-[#2c3e50] text-white p-4 flex justify-between items-center shrink-0">
          <h1 className="text-xl font-bold">eapcetpro</h1>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">No questions found</h3>
          <p className="text-gray-500 mb-6">We couldn't find any questions for this test.</p>
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (view === 'instructions') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden font-sans">
        <header className="bg-[#2c3e50] text-white p-4 flex justify-between items-center shrink-0">
          <h1 className="text-xl font-bold">eapcetpro</h1>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 border-b pb-4 gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">General Instructions:</h2>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-sm font-medium text-gray-600">View in:</span>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option>English</option>
                  <option>Telugu</option>
                </select>
              </div>
            </div>

            <div className="space-y-6 text-sm text-gray-700">
              <p className="font-semibold text-base">Read the following instructions carefully.</p>
              
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full border-collapse border border-gray-300 text-left text-xs sm:text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 font-semibold">SI No.</th>
                      <th className="border border-gray-300 p-2 font-semibold">Section</th>
                      <th className="border border-gray-300 p-2 font-semibold">Questions</th>
                      <th className="border border-gray-300 p-2 font-semibold">Max Marks</th>
                      <th className="border border-gray-300 p-2 font-semibold">-ve Marks</th>
                      <th className="border border-gray-300 p-2 font-semibold">+ve Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">1</td>
                      <td className="border border-gray-300 p-2">Mathematics</td>
                      <td className="border border-gray-300 p-2">80</td>
                      <td className="border border-gray-300 p-2">80</td>
                      <td className="border border-gray-300 p-2">0</td>
                      <td className="border border-gray-300 p-2">1</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">2</td>
                      <td className="border border-gray-300 p-2">Physics</td>
                      <td className="border border-gray-300 p-2">40</td>
                      <td className="border border-gray-300 p-2">40</td>
                      <td className="border border-gray-300 p-2">0</td>
                      <td className="border border-gray-300 p-2">1</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">3</td>
                      <td className="border border-gray-300 p-2">Chemistry</td>
                      <td className="border border-gray-300 p-2">40</td>
                      <td className="border border-gray-300 p-2">40</td>
                      <td className="border border-gray-300 p-2">0</td>
                      <td className="border border-gray-300 p-2">1</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ul className="list-disc pl-5 space-y-2">
                <li>Total duration of the examination is 180 Min.</li>
                <li>Your clock will be set at the server. The countdown timer at the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You need not terminate the examination or submit your paper.</li>
                <li>The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:</li>
              </ul>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200 text-xs md:text-sm">
                <div className="flex items-start md:items-center gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 shrink-0 flex items-center justify-center bg-[#28a745] text-white font-bold rounded-md shadow-sm">1</div>
                  <span className="mt-1 md:mt-0">You have answered the question.</span>
                </div>
                <div className="flex items-start md:items-center gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 shrink-0 flex items-center justify-center bg-[#dc3545] text-white font-bold rounded-md shadow-sm">2</div>
                  <span className="mt-1 md:mt-0">You have not answered the question.</span>
                </div>
                <div className="flex items-start md:items-center gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 shrink-0 flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-bold rounded-md shadow-sm">3</div>
                  <span className="mt-1 md:mt-0">You have not visited the question yet.</span>
                </div>
                <div className="flex items-start md:items-center gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 shrink-0 flex items-center justify-center bg-[#6f42c1] text-white font-bold rounded-full shadow-sm">4</div>
                  <span className="mt-1 md:mt-0">You have not answered the question but have marked for review.</span>
                </div>
                <div className="flex items-start md:items-center gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 shrink-0 flex items-center justify-center bg-[#6f42c1] text-white font-bold rounded-full shadow-sm relative after:content-['✓'] after:absolute after:-bottom-1 after:-right-1 after:bg-[#28a745] after:text-white after:text-[10px] after:w-4 after:h-4 after:rounded-full after:flex after:items-center after:justify-center">5</div>
                  <span className="mt-1 md:mt-0">You have answered the question but have marked for review.</span>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-800">
                <p className="font-semibold mb-2">Choose your default language</p>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border border-blue-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option>English</option>
                  <option>Telugu</option>
                </select>
                <p className="mt-2 text-xs">Please note all questions will appear in your default language. This language can be changed for a particular question later on.</p>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
                <input 
                  type="checkbox" 
                  id="agree" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer select-none">
                  I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of /not wearing /not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to a disciplinary action, which may include ban from future Tests/Examinations.
                </label>
              </div>
            </div>
          </div>
        </div>

        <footer className="bg-white border-t border-gray-200 p-3 md:p-4 flex justify-between items-center shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 pb-safe">
          <button 
            onClick={onClose}
            className="px-4 py-2 md:px-6 md:py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 md:gap-2 text-sm md:text-base"
          >
            <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Go back</span><span className="sm:hidden">Back</span>
          </button>
          <button 
            onClick={handleStartTest}
            disabled={!agreed}
            className={`px-5 py-2 md:px-8 md:py-2.5 font-bold rounded-lg transition-all shadow-sm text-sm md:text-base ${
              agreed 
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            I am ready to begin
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#f8f9fa] z-50 flex flex-col font-sans">
      {/* Test Header */}
      <header className="bg-white border-b border-gray-200 px-3 py-2 md:px-4 md:py-3 flex justify-between items-center shrink-0 z-20">
        <div className="font-bold text-lg md:text-xl text-[#1a73e8] tracking-tight truncate">eapcet<span className="text-gray-900">pro</span></div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-[#e9ecef] px-2 py-1 md:px-3 md:py-1.5 rounded flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium text-gray-800">
            <Clock className="w-3 h-3 md:w-4 md:h-4" /> {formatTime(timeLeft)}
          </div>
          <button 
            onClick={() => setShowPalette(!showPalette)}
            className="bg-[#1a73e8] text-white p-1 md:p-1.5 rounded hover:bg-blue-700 md:hidden"
          >
            {showPalette ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Sections Bar */}
      <div className="bg-white border-b border-gray-200 px-2 py-1.5 md:px-4 md:py-2 flex items-center gap-1 md:gap-2 overflow-x-auto scrollbar-transparent shrink-0">
        <span className="text-xs md:text-sm font-medium text-gray-800 mr-1 md:mr-2 shrink-0">Sections |</span>
        {(['Chemistry', 'Mathematics', 'Physics'] as Section[]).map(section => (
          <button
            key={section}
            onClick={() => {
              setCurrentSection(section);
              setCurrentQuestionIndex(0);
              const firstQ = allQuestions.find(q => q.section === section);
              if (firstQ) updateQuestionStatusOnVisit(firstQ.id);
            }}
            className={`px-3 py-1 md:px-4 md:py-1.5 rounded text-xs md:text-sm whitespace-nowrap transition-colors ${
              currentSection === section
                ? 'bg-white text-[#1a73e8] border border-gray-200 shadow-sm'
                : 'bg-[#f1f3f4] text-gray-700 hover:bg-gray-200 border border-transparent'
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Question Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2 md:p-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 min-h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-100">
                <h2 className="text-base md:text-lg font-medium text-gray-800">Question {currentQuestionIndex + 1}</h2>
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="text-xs md:text-sm font-medium text-gray-600">Time: {formatQuestionTime(questionTimes[currentQuestion.id] || 0)}</span>
                </div>
              </div>

              <div className="flex-1">
                <div className="text-sm md:text-base text-gray-800 mb-6 md:mb-8 leading-relaxed">
                  <p className="mb-4">{currentQuestion?.text}</p>
                </div>

                <div className="space-y-2 md:space-y-3">
                  {currentQuestion?.options.map((option, idx) => {
                    const isSelected = answers[currentQuestion.id]?.selectedOption === idx;
                    return (
                      <label 
                        key={idx} 
                        className="flex items-start md:items-center gap-3 p-2 md:p-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className={`mt-0.5 md:mt-0 w-4 h-4 md:w-5 md:h-5 shrink-0 rounded-full border flex items-center justify-center ${isSelected ? 'border-gray-800' : 'border-gray-400'}`}>
                          {isSelected && <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-800"></div>}
                        </div>
                        <span className="text-gray-800 text-sm md:text-base">{String.fromCharCode(97 + idx)}. {option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons inside the card */}
              <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                <button 
                  onClick={handleMarkForReview}
                  className="w-full py-2.5 md:py-3 bg-[#e9ecef] text-gray-700 font-medium rounded hover:bg-gray-300 transition-colors text-xs md:text-sm"
                >
                  Mark for Review & Next
                </button>
                <button 
                  onClick={handleClearResponse}
                  className="w-full py-2.5 md:py-3 bg-[#e9ecef] text-gray-700 font-medium rounded hover:bg-gray-300 transition-colors text-xs md:text-sm"
                >
                  Clear Response
                </button>
                <button 
                  onClick={handleSaveAndNext}
                  className="w-full py-2.5 md:py-3 bg-[#28a745] text-white font-medium rounded hover:bg-[#218838] transition-colors text-xs md:text-sm"
                >
                  Save & Next
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="bg-white border-t border-gray-200 p-2 md:p-3 shrink-0 flex justify-between items-center pb-safe">
            <button 
              onClick={goToPrevQuestion}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors px-2 py-1"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Previous</span>
            </button>
            <button 
              onClick={() => setShowPalette(true)}
              className="md:hidden bg-[#1a73e8] text-white px-3 py-1.5 rounded font-medium text-xs flex items-center gap-1"
            >
              <Menu className="w-3 h-3" /> Palette
            </button>
            <button 
              onClick={goToNextQuestion}
              className="flex items-center gap-1 text-[#1a73e8] hover:text-blue-800 font-medium text-sm transition-colors px-2 py-1"
            >
              <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        {/* Overlay for mobile */}
        {showPalette && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => setShowPalette(false)}
          />
        )}
        <div className={`
          fixed inset-y-0 right-0 w-[85vw] sm:w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col
          md:relative md:translate-x-0 md:shadow-none md:border-l md:border-gray-200 md:w-80
          ${showPalette ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-3 md:p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
            <h3 className="font-medium text-gray-800 text-sm md:text-base">Question Palette</h3>
            <button onClick={() => setShowPalette(false)} className="text-gray-500 hover:text-gray-800 md:hidden p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-white">
            {/* User Info & Stats */}
            <div className="bg-[#3b4b6b] rounded-lg p-3 md:p-4 mb-4 md:mb-6 text-white shadow-sm">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shrink-0">
                  <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </div>
                <span className="font-medium text-xs md:text-sm truncate">Student</span>
              </div>
              
              <div className="grid grid-cols-2 gap-1.5 md:gap-2 text-[10px] md:text-xs font-medium">
                <div className="bg-[#2c3852] p-2 md:p-2.5 rounded flex items-center gap-1.5 md:gap-2">
                  <span className="text-[#28a745] font-bold">{getStatusCount('answered')}</span> Attempted
                </div>
                <div className="bg-[#2c3852] p-2 md:p-2.5 rounded flex items-center gap-1.5 md:gap-2">
                  <span className="text-[#ffc107] font-bold">{getStatusCount('marked')}</span> Marked
                </div>
                <div className="bg-[#2c3852] p-2 md:p-2.5 rounded flex items-center gap-1.5 md:gap-2">
                  <span className="text-white font-bold">{getStatusCount('not_visited')}</span> Not Visited
                </div>
                <div className="bg-[#2c3852] p-2 md:p-2.5 rounded flex items-center gap-1.5 md:gap-2">
                  <span className="text-[#dc3545] font-bold">{getStatusCount('not_answered')}</span> Not Answered
                </div>
                <div className="bg-[#2c3852] p-2 md:p-2.5 rounded col-span-2 flex items-center gap-1.5 md:gap-2">
                  <span className="text-[#ffc107] font-bold">{getStatusCount('marked_answered')}</span> Marked & Answered
                </div>
              </div>
            </div>

            <div className="mb-2 md:mb-3 flex justify-between items-center">
              <h4 className="font-medium text-xs md:text-sm text-gray-700">Section: <span className="text-[#1a73e8]">{currentSection}</span></h4>
            </div>

            <div className="grid grid-cols-5 gap-1.5 md:gap-2">
              {currentSectionQuestions.map((q, idx) => {
                const status = answers[q.id]?.status || 'not_visited';
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => jumpToQuestion(idx)}
                    className={`
                      w-full aspect-square flex items-center justify-center text-xs md:text-sm font-medium border rounded transition-all
                      ${getStatusColor(status)}
                      ${isCurrent ? 'ring-2 ring-[#1a73e8] ring-offset-1 z-10' : ''}
                      ${status === 'marked' || status === 'marked_answered' ? 'rounded-full' : ''}
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 md:p-4 border-t border-gray-200 bg-white shrink-0 space-y-2 md:space-y-3 pb-safe md:pb-4">
            <button 
              onClick={() => setView('instructions')}
              className="w-full py-2.5 md:py-3 bg-[#f8f9fa] text-gray-700 font-medium rounded hover:bg-gray-200 transition-colors text-xs md:text-sm border border-gray-200"
            >
              Instructions
            </button>
            <button 
              onClick={onClose}
              className="w-full py-2.5 md:py-3 bg-[#3b4b6b] text-white font-medium rounded hover:bg-[#2c3852] transition-colors text-xs md:text-sm shadow-sm"
            >
              SUBMIT TEST
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
