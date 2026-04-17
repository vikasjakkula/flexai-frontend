export interface Test {
  test_id: number;
  test_name: string;
  test_date: string;
  shift: string;
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
  answer?: string;
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

export interface TestData {
  test: Test;
  sections: Section[];
  questions: Question[];
  instructions: {
    duration: number;
    sectionInstructions: {
      name: string;
      questions: number;
    }[];
  };
}

export interface TestResult {
  result_id: string;
  user_id: string;
  test_id: number;
  submitted_at: string;
  time_taken: number; // in seconds
  answers: Record<number, string>; // question_number -> selected_option
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
    };
    physics: {
      correct: number;
      wrong: number;
      unattempted: number;
      marks: number;
    };
    chemistry: {
      correct: number;
      wrong: number;
      unattempted: number;
      marks: number;
    };
  };
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