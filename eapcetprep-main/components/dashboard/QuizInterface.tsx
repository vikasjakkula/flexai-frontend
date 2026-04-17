"use client"

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import QuestionContent from '@/components/QuestionContent';

export default function QuizInterface({ quizId, quizTitle, subject, chapter, onClose }: { quizId: string | number, quizTitle: string, subject?: string, chapter?: string, onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      if (quizId) {
        const { data: quizData } = await supabase
          .from('quizzes')
          .select('question_id')
          .eq('quiz_id', quizId);

        if (quizData && quizData.length > 0) {
          const questionIds = quizData.map((c: any) => c.question_id);

          const { data: questionsData } = await supabase
            .from('questions')
            .select('question_id, question_text, option_a, option_b, option_c, option_d, correct_option')
            .in('question_id', questionIds)
            .limit(20);

          if (questionsData) {
            const formattedQuestions = questionsData.map((q: any) => {
              const options = [
                { id: 'a', text: q.option_a },
                { id: 'b', text: q.option_b },
                { id: 'c', text: q.option_c },
                { id: 'd', text: q.option_d },
              ].filter(o => o.text);

              return {
                id: q.question_id,
                text: q.question_text,
                options,
                correctOptionId: q.correct_option?.trim().toLowerCase() || 'a'
              };
            });
            setQuestions(formattedQuestions);
          }
        }
      }
      setLoading(false);
    }
    init();
  }, [quizId]);

  const handleFinish = async () => {
    const score = questions.filter(q => answers[q.id] === q.correctOptionId).length;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    setSaving(true);
    await fetch('/api/quiz/save-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quiz_id: String(quizId),
        quiz_name: quizTitle,
        subject: subject || '',
        chapter: chapter || '',
        answers,
        score,
        total,
        percentage,
      }),
    });
    setSaving(false);

    setShowResults(true);
  };

  const handleReattempt = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowResults(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Loading quiz questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
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
          <button onClick={onClose} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = questions.filter(q => answers[q.id] === q.correctOptionId).length;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const isGood = percentage >= 60;

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        <header className="bg-white px-4 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-bold text-gray-900 truncate pr-4">{quizTitle}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-600"/>
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isGood ? 'bg-emerald-50' : 'bg-orange-50'}`}>
            <Trophy className={`w-12 h-12 ${isGood ? 'text-emerald-500' : 'text-orange-400'}`} />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h3>
          <p className="text-gray-500 mb-8 font-medium">{chapter}</p>

          <div className={`w-full max-w-xs rounded-2xl p-6 mb-8 ${isGood ? 'bg-emerald-50 border border-emerald-200' : 'bg-orange-50 border border-orange-200'}`}>
            <div className={`text-5xl font-bold mb-2 ${isGood ? 'text-emerald-600' : 'text-orange-500'}`}>
              {percentage}%
            </div>
            <p className="text-gray-600 font-semibold text-lg">
              {score} / {total} correct
            </p>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={handleReattempt}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-5 h-5" /> Try Again
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
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
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
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
          <QuestionContent html={question.text} className="text-lg font-bold text-gray-900 leading-relaxed" />
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
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${optionClass}`}
              >
                <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold uppercase ${isAnswered && isCorrect ? 'border-emerald-500 text-emerald-700' : isAnswered && isSelected && !isCorrect ? 'border-red-500 text-red-700' : 'border-gray-300 text-gray-500'}`}>
                  {opt.id}
                </span>
                <QuestionContent html={opt.text} className={`flex-1 font-medium text-base ${textClass}`} />
                {icon && <div className="flex-shrink-0">{icon}</div>}
              </button>
            );
          })}
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-white p-4 border-t border-gray-200 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" style={{paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'}}>
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
            onClick={handleFinish}
            disabled={saving}
            className="px-6 py-3 rounded-xl font-bold text-white bg-emerald-600 flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Finish'} <CheckCircle2 className="w-5 h-5" />
          </button>
        )}
      </footer>
    </div>
  );
}
