// New API utilities for test management using attempt-based flow

export interface TestAttempt {
  id: string;
  user_id: string;
  test_id: number;
  status: 'in_progress' | 'submitted' | 'abandoned';
  started_at: string;
  submitted_at?: string;
  time_remaining: number;
  current_question_id: number;
  answers: Record<number, string>;
  marked_for_review: number[];
  answered_and_marked: number[];
  visited_questions: number[];
  created_at: string;
  updated_at: string;
}

export interface TestResult {
  id: string;
  attempt_id: string;
  user_id: string;
  test_id: number;
  submitted_at: string;
  time_taken: number;
  answers: Record<number, string>;
  section_wise_marks: {
    maths: number;
    physics: number;
    chemistry: number;
  };
  total_marks: number;
  correct_answers: number;
  wrong_answers: number;
  unattempted: number;
  section_wise_analysis: any;
}

// Start a new test or resume existing one
export async function startTest(testId: number): Promise<{
  attemptId: string;
  attempt: TestAttempt;
  testData: any;
}> {
  const response = await fetch('/api/test/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ testId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start test');
  }

  const data = await response.json();
  return {
    attemptId: data.attemptId,
    attempt: data.attempt,
    testData: data.testData
  };
}

// Get attempt details
export async function getAttempt(attemptId: string): Promise<{
  attempt: TestAttempt;
  testData: any;
}> {
  const response = await fetch(`/api/test/attempt/${attemptId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get attempt');
  }

  const data = await response.json();
  return {
    attempt: data.attempt,
    testData: data.testData
  };
}

// Save test progress
export async function saveProgress(
  attemptId: string,
  updates: {
    answers?: Record<number, string>;
    current_question_id?: number;
    time_remaining?: number;
    marked_for_review?: number[];
    answered_and_marked?: number[];
    visited_questions?: number[];
  }
): Promise<TestAttempt> {
  const response = await fetch(`/api/test/attempt/${attemptId}/save`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save progress');
  }

  const data = await response.json();
  return data.attempt;
}

// Submit test
export async function submitAttempt(attemptId: string): Promise<{
  id: string;
  total_marks: number;
  correct_answers: number;
  wrong_answers: number;
  unattempted: number;
  section_wise_marks: {
    maths: number;
    physics: number;
    chemistry: number;
  };
  submitted_at: string;
}> {
  const response = await fetch(`/api/test/attempt/${attemptId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit test');
  }

  const data = await response.json();
  return data.result;
}

