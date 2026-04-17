import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, ChevronRight, PlayCircle, ArrowLeft } from 'lucide-react';
import { getQuizzes } from '../lib/dataStore';

const subjects = ['Mathematics', 'Physics', 'Chemistry'];

export default function ChapterTab({ setActiveQuiz }: { setActiveQuiz: (quiz: {id: string | number, title: string, subject?: string, chapter?: string}) => void }) {
  // 1. Tabs (Maths, Physics, Chemistry)
  const [activeSubject, setActiveSubject] = useState('Mathematics');
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getQuizzes();
      if (data) {
        setAllQuizzes(data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Reset expanded chapter when subject changes
  useEffect(() => {
    setExpandedChapter(null);
  }, [activeSubject]);

  // 2. Chapter list per tab
  const chapterList = useMemo(() => {
    // Filter: subject = the active tab
    const filteredBySubject = allQuizzes.filter(q => q.subject === activeSubject);
    
    // Grouping: Group by chapter.
    const chapterGroups = new Map<string, Set<string>>();
    filteredBySubject.forEach(q => {
      if (!q.chapter) return;
      if (!chapterGroups.has(q.chapter)) {
        chapterGroups.set(q.chapter, new Set());
      }
      // For each chapter, count distinct quiz_id values.
      chapterGroups.get(q.chapter)!.add(q.quiz_id);
    });

    return Array.from(chapterGroups.entries()).map(([chapter, quizIds]) => ({
      chapter,
      quizCount: quizIds.size
    }));
  }, [allQuizzes, activeSubject]);

  // 3. Quizzes when a chapter is expanded
  const expandedChapterQuizzes = useMemo(() => {
    if (!expandedChapter) return [];
    
    // Filter: subject = active tab + chapter = expanded chapter
    const filtered = allQuizzes.filter(q => q.subject === activeSubject && q.chapter === expandedChapter);
    
    // Grouping: Group by quiz_id. Return unique (quiz_id, quiz_name) pairs.
    const uniqueQuizzes = new Map<string, string>();
    filtered.forEach(q => {
      uniqueQuizzes.set(q.quiz_id, q.quiz_name);
    });

    return Array.from(uniqueQuizzes.entries()).map(([quiz_id, quiz_name]) => ({
      quiz_id,
      quiz_name
    }));
  }, [allQuizzes, activeSubject, expandedChapter]);

  if (expandedChapter) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => setExpandedChapter(null)}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">{expandedChapter}</h2>
        </div>

        <div className="space-y-3">
          {expandedChapterQuizzes.map((quiz) => (
            <div key={quiz.quiz_id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{quiz.quiz_name}</h4>
                  <p className="text-xs text-gray-500 font-medium">Quiz</p>
                </div>
              </div>
              <div className="text-right">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setActiveQuiz({ 
                      id: quiz.quiz_id, 
                      title: quiz.quiz_name, 
                      subject: activeSubject, 
                      chapter: expandedChapter 
                    }); 
                  }}
                  className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Start
                </button>
              </div>
            </div>
          ))}
          {expandedChapterQuizzes.length === 0 && (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl border-dashed">
              <p className="text-gray-500 font-medium">No quizzes found for this chapter.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Chapter wise quizzes</h2>
      
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {subjects.map(subject => (
          <button
            key={subject}
            onClick={() => setActiveSubject(subject)}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
              activeSubject === subject 
                ? 'bg-gray-900 text-white shadow-sm' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl border-dashed">
            <p className="text-gray-500 font-medium">Loading chapters...</p>
          </div>
        ) : chapterList.length > 0 ? chapterList.map((item) => (
          <div 
            key={item.chapter} 
            onClick={() => setExpandedChapter(item.chapter)}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1 pr-4">
                {/* Show: chapter name + quiz count */}
                <h4 className="font-bold text-gray-900 text-base mb-1">{item.chapter}</h4>
                <p className="text-sm text-gray-500 font-medium">{item.quizCount} {item.quizCount === 1 ? 'Quiz' : 'Quizzes'}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          </div>
        )) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl border-dashed">
            <p className="text-gray-500 font-medium">No chapters available for {activeSubject}</p>
          </div>
        )}
      </div>
    </div>
  );
}
