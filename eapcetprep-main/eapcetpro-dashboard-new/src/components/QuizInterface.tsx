import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function QuizInterface({ quizId, quizTitle, subject, chapter, onClose }: { quizId: string | number, quizTitle: string, subject?: string, chapter?: string, onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      if (quizId) {
        // Fetch question IDs for this quiz from quizzes table
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('question_id')
          .eq('quiz_id', quizId);

        if (quizData && quizData.length > 0) {
          const questionIds = quizData.map(c => c.question_id);
          
          // Fetch the actual questions
          const { data: questionsData, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .in('id', questionIds)
            .limit(20); // Limit to 20 questions for a quiz
            
          if (questionsData) {
            // Format questions
            const formattedQuestions = questionsData.map(q => {
              // Parse options if it's a string, or use as is if it's already an object/array
              let parsedOptions = [];
              try {
                parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                
                // If options is an object like {a: "...", b: "..."}, convert to array
                if (parsedOptions && !Array.isArray(parsedOptions) && typeof parsedOptions === 'object') {
                  parsedOptions = Object.entries(parsedOptions).map(([id, text]) => ({ id, text }));
                } else if (Array.isArray(parsedOptions) && parsedOptions.length > 0 && typeof parsedOptions[0] === 'string') {
                  // If it's an array of strings
                  const letters = ['a', 'b', 'c', 'd'];
                  parsedOptions = parsedOptions.map((text, i) => ({ id: letters[i] || String(i), text }));
                }
              } catch (e) {
                console.error("Error parsing options", e);
                parsedOptions = [
                  { id: 'a', text: 'Option A' },
                  { id: 'b', text: 'Option B' },
                  { id: 'c', text: 'Option C' },
                  { id: 'd', text: 'Option D' }
                ];
              }

              return {
                id: q.id,
                text: q.question_text,
                options: parsedOptions || [],
                correctOptionId: q.correct_answer?.toLowerCase() || 'a'
              };
            });
            setQuestions(formattedQuestions);
          }
        }
      }
      setLoading(false);
    }
    fetchQuestions();
  }, [quizId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Loading quiz questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col font-sans">
        <header className="bg-white px-4 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-bold text-gray-900 truncate pr-4">{quizTitle}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-600"/>
          </button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No questions found</h3>
          <p className="text-gray-500 mb-6">We couldn't find any questions for this chapter.</p>
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const selectedOptionId = answers[question.id];
  const isAnswered = !!selectedOptionId;

  const handleOptionClick = (optionId: string) => {
    if (isAnswered) return;
    setAnswers(prev => ({ ...prev, [question.id]: optionId }));
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col font-sans">
      <header className="bg-white px-4 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
        <h2 className="font-bold text-gray-900 truncate pr-4">{quizTitle}</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
          <X className="w-5 h-5 text-gray-600"/>
        </button>
      </header>
      
      <div className="bg-white px-4 py-3 border-b border-gray-100 shadow-sm">
        <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-indigo-600">{Math.round(((currentIndex) / questions.length) * 100)}% Completed</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-300 ease-out" 
            style={{width: `${((currentIndex + 1) / questions.length) * 100}%`}}
          ></div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-bold text-gray-900 leading-relaxed">{question.text}</h3>
        </div>
        
        <div className="space-y-3">
          {question.options.map((opt: any) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = opt.id === question.correctOptionId;
            
            let optionClass = "border-gray-200 bg-white hover:border-indigo-300";
            let icon = null;
            let textClass = "text-gray-700";

            if (isAnswered) {
              if (isCorrect) {
                optionClass = "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500";
                icon = <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
                textClass = "text-emerald-900 font-bold";
              } else if (isSelected && !isCorrect) {
                optionClass = "border-red-500 bg-red-50 ring-1 ring-red-500";
                icon = <XCircle className="w-5 h-5 text-red-600" />;
                textClass = "text-red-900 font-bold";
              } else {
                optionClass = "border-gray-200 bg-white opacity-60";
              }
            }

            return (
              <button 
                key={opt.id}
                onClick={() => handleOptionClick(opt.id)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${optionClass}`}
              >
                <span className={`font-medium text-base ${textClass}`}>{opt.text}</span>
                {icon && <div className="flex-shrink-0 ml-3">{icon}</div>}
              </button>
            );
          })}
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-white p-4 border-t border-gray-200 flex justify-between items-center pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-5 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 disabled:opacity-40 flex items-center gap-2 hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        
        {currentIndex < questions.length - 1 ? (
          <button 
            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Next <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-white bg-emerald-600 flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Finish <CheckCircle2 className="w-5 h-5" />
          </button>
        )}
      </footer>
    </div>
  );
}
