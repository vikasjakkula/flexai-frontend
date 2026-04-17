"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface QuestionTimeData {
  startTime: number | null;
  accumulatedTime: number; // in seconds
}

interface TimeTrackingState {
  questionTimers: Record<number, QuestionTimeData>;
  currentQuestionId: number | null;
  attemptId: string | null;
}

interface TimeTrackingContextType {
  questionTimers: Record<number, QuestionTimeData>;
  currentQuestionId: number | null;
  startTracking: (questionId: number, attemptId: string) => void;
  stopTracking: (questionId: number) => void;
  switchQuestion: (fromQuestionId: number, toQuestionId: number) => void;
  getTimeForQuestion: (questionId: number) => number;
  getTimeForSubject: (subject: 'maths' | 'physics' | 'chemistry') => number;
  saveTimes: () => Promise<void>;
  loadTimes: (attemptId: string) => Promise<void>;
  reset: () => void;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

export function TimeTrackingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TimeTrackingState>({
    questionTimers: {},
    currentQuestionId: null,
    attemptId: null,
  });

  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  // Initialize question timer if it doesn't exist
  const initializeQuestion = useCallback((questionId: number) => {
    setState(prev => {
      if (!prev.questionTimers[questionId]) {
        return {
          ...prev,
          questionTimers: {
            ...prev.questionTimers,
            [questionId]: {
              startTime: null,
              accumulatedTime: 0,
            },
          },
        };
      }
      return prev;
    });
  }, []);

  // Start tracking time for a question
  const startTracking = useCallback((questionId: number, attemptId: string) => {
    setState(prev => {
      // Stop current question if any
      const updatedTimers = { ...prev.questionTimers };
      
      if (prev.currentQuestionId && prev.currentQuestionId !== questionId) {
        const currentTimer = updatedTimers[prev.currentQuestionId];
        if (currentTimer && currentTimer.startTime !== null) {
          const elapsed = Math.floor((Date.now() - currentTimer.startTime) / 1000);
          updatedTimers[prev.currentQuestionId] = {
            ...currentTimer,
            startTime: null,
            accumulatedTime: currentTimer.accumulatedTime + elapsed,
          };
        }
      }

      // Initialize new question if needed
      if (!updatedTimers[questionId]) {
        updatedTimers[questionId] = {
          startTime: null,
          accumulatedTime: 0,
        };
      }

      // Start tracking new question
      updatedTimers[questionId] = {
        ...updatedTimers[questionId],
        startTime: Date.now(),
      };

      return {
        questionTimers: updatedTimers,
        currentQuestionId: questionId,
        attemptId,
      };
    });
  }, []);

  // Stop tracking time for a question
  const stopTracking = useCallback((questionId: number) => {
    setState(prev => {
      const timer = prev.questionTimers[questionId];
      if (!timer || timer.startTime === null) return prev;

      const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
      return {
        ...prev,
        questionTimers: {
          ...prev.questionTimers,
          [questionId]: {
            startTime: null,
            accumulatedTime: timer.accumulatedTime + elapsed,
          },
        },
        currentQuestionId: prev.currentQuestionId === questionId ? null : prev.currentQuestionId,
      };
    });
  }, []);

  // Switch from one question to another
  const switchQuestion = useCallback((fromQuestionId: number, toQuestionId: number) => {
    setState(prev => {
      const updatedTimers = { ...prev.questionTimers };
      
      // Stop tracking current question
      const fromTimer = updatedTimers[fromQuestionId];
      if (fromTimer && fromTimer.startTime !== null) {
        const elapsed = Math.floor((Date.now() - fromTimer.startTime) / 1000);
        updatedTimers[fromQuestionId] = {
          ...fromTimer,
          startTime: null,
          accumulatedTime: fromTimer.accumulatedTime + elapsed,
        };
      }

      // Initialize new question if needed
      if (!updatedTimers[toQuestionId]) {
        updatedTimers[toQuestionId] = {
          startTime: null,
          accumulatedTime: 0,
        };
      }

      // Start tracking new question
      updatedTimers[toQuestionId] = {
        ...updatedTimers[toQuestionId],
        startTime: Date.now(),
      };

      return {
        ...prev,
        questionTimers: updatedTimers,
        currentQuestionId: toQuestionId,
      };
    });
  }, []);

  // Get accumulated time for a question
  const getTimeForQuestion = useCallback((questionId: number): number => {
    const timer = state.questionTimers[questionId];
    if (!timer) return 0;

    let total = timer.accumulatedTime;
    if (timer.startTime !== null) {
      total += Math.floor((Date.now() - timer.startTime) / 1000);
    }
    return total;
  }, [state.questionTimers]);

  // Get total time for a subject
  const getTimeForSubject = useCallback((subject: 'maths' | 'physics' | 'chemistry'): number => {
    let total = 0;
    const range = 
      subject === 'maths' ? [1, 80] :
      subject === 'physics' ? [81, 120] :
      [121, 160];

    for (let qNum = range[0]; qNum <= range[1]; qNum++) {
      total += getTimeForQuestion(qNum);
    }
    return total;
  }, [getTimeForQuestion]);

  // Save times to database
  const saveTimes = useCallback(async () => {
    if (!state.attemptId) return;

    // Calculate current accumulated times
    const timesToSave: Record<number, number> = {};
    Object.keys(state.questionTimers).forEach(qNumStr => {
      const qNum = parseInt(qNumStr);
      timesToSave[qNum] = getTimeForQuestion(qNum);
    });

    try {
      const response = await fetch(`/api/test/attempt/${state.attemptId}/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ times: timesToSave }),
      });

      if (!response.ok) {
        console.error('Failed to save times');
      }
    } catch (error) {
      console.error('Error saving times:', error);
    }
  }, [state.attemptId, state.questionTimers, getTimeForQuestion]);

  // Load times from database
  const loadTimes = useCallback(async (attemptId: string) => {
    try {
      const response = await fetch(`/api/test/attempt/${attemptId}/time`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.times) {
        const loadedTimers: Record<number, QuestionTimeData> = {};
        Object.entries(data.times).forEach(([qNumStr, time]) => {
          loadedTimers[parseInt(qNumStr)] = {
            startTime: null,
            accumulatedTime: time as number,
          };
        });

        setState(prev => ({
          ...prev,
          questionTimers: loadedTimers,
          attemptId,
        }));
      }
    } catch (error) {
      console.error('Error loading times:', error);
    }
  }, []);

  // Reset all timers
  const reset = useCallback(() => {
    setState({
      questionTimers: {},
      currentQuestionId: null,
      attemptId: null,
    });
  }, []);

  // Auto-save every 5 seconds
  useEffect(() => {
    if (!state.attemptId) return;

    saveIntervalRef.current = setInterval(() => {
      const now = Date.now();
      // Throttle: only save if 5 seconds have passed
      if (now - lastSaveRef.current >= 5000) {
        saveTimes();
        lastSaveRef.current = now;
      }
    }, 5000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [state.attemptId, saveTimes]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.attemptId) {
        // Use sendBeacon for reliable unload save
        const timesToSave: Record<number, number> = {};
        Object.keys(state.questionTimers).forEach(qNumStr => {
          const qNum = parseInt(qNumStr);
          timesToSave[qNum] = getTimeForQuestion(qNum);
        });
        
        // Use FormData for sendBeacon (JSON not supported)
        const formData = new FormData();
        formData.append('times', JSON.stringify(timesToSave));
        
        navigator.sendBeacon(
          `/api/test/attempt/${state.attemptId}/time`,
          formData
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.attemptId, state.questionTimers, getTimeForQuestion]);

  // Save when tab becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state.attemptId) {
        saveTimes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.attemptId, saveTimes]);

  const value: TimeTrackingContextType = {
    questionTimers: state.questionTimers,
    currentQuestionId: state.currentQuestionId,
    startTracking,
    stopTracking,
    switchQuestion,
    getTimeForQuestion,
    getTimeForSubject,
    saveTimes,
    loadTimes,
    reset,
  };

  return (
    <TimeTrackingContext.Provider value={value}>
      {children}
    </TimeTrackingContext.Provider>
  );
}

export function useTimeTracking() {
  const context = useContext(TimeTrackingContext);
  if (context === undefined) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
}

