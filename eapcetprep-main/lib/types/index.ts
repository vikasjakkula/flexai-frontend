// Consolidated type definitions for the application

export interface User {
  id: string;
  name: string;
  college: string;
  email: string;
  phone: string;
  alt_phone?: string;
  is_premium: boolean;
  premium_since?: string;
  created_at: string;
  updated_at?: string;
}

export interface Test {
  test_id: number;
  test_name: string;
  test_date: string;
  shift: string;
  test_type?: 'previous_year' | 'mock';
  year?: string;
  set_name?: string;
  state?: 'TS' | 'AP'; // State filter: TS (Telangana) or AP (Andhra Pradesh)
  field?: string; // Field filter: engineering or medical
  sprite_css_url?: string | null; // URL to sprite CSS file for images in questions
  created_at: string;
}

export interface Section {
  section_id: string;
  test_id: number;
  section_name: string;
}

export interface Question {
  question_id: number;
  section_id: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e?: string;
  option_f?: string;
  correct_option: string;
  chapter?: string | null; // EAPCET chapter for chapter-wise quiz
}

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
  question_times?: Record<number, number>; // question_number -> time_spent_seconds
  is_trial?: boolean;
  trial_question_ids?: number[]; // question_id from DB for trial subset
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
  section_wise_analysis: {
    maths: {
      correct: number;
      wrong: number;
      unattempted: number;
      marks: number;
      time_seconds: number;
      time_correct: number;
      time_wrong: number;
      time_unattempted: number;
    };
    physics: {
      correct: number;
      wrong: number;
      unattempted: number;
      marks: number;
      time_seconds: number;
      time_correct: number;
      time_wrong: number;
      time_unattempted: number;
    };
    chemistry: {
      correct: number;
      wrong: number;
      unattempted: number;
      marks: number;
      time_seconds: number;
      time_correct: number;
      time_wrong: number;
      time_unattempted: number;
    };
  };
  estimated_rank?: {
    estimatedRank: number;
    rankRange: string;
  };
  is_trial?: boolean;
  created_at: string;
}

export interface TestAnalytics {
  user_id: string;
  total_tests_taken: number;
  average_score: number;
  section_wise_average: {
    maths: number;
    physics: number;
    chemistry: number;
  };
  improvement_trend: {
    date: string;
    score: number;
  }[];
  weak_areas: string[];
  strong_areas: string[];
  time_management: {
    average_time_per_question: number;
    section_wise_time: {
      maths: number;
      physics: number;
      chemistry: number;
    };
  };
}

export interface TestData {
  test: Test;
  sections: Section[];
  questions: Question[];
  instructions: {
    duration: number;
    sectionInstructions: {
      name: string;
      questions: number;
      maxMarks: number;
      negativeMarks: number;
      positiveMarks: number;
    }[];
  };
}

export interface TestProgress {
  currentQuestionId: number;
  activeSection: string;
  answers: Record<number, string | null>;
  markedForReview: number[];
  answeredAndMarkedForReview: number[];
  visitedQuestions: number[];
  timeRemaining: number;
}

export interface Order {
  id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  affiliate_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  payment_method: 'upi' | 'bank';
  payment_details: Record<string, any>;
  status: 'pending' | 'active' | 'suspended';
  terms_accepted_at: string;
  created_at: string;
}

