// Test constants for the application
export const TEST_CONSTANTS = {
  // Test duration
  DURATION_MINUTES: 180,
  DURATION_SECONDS: 180 * 60, // 10800 seconds

  // Question counts per section
  MATHS_QUESTIONS: 80,
  PHYSICS_QUESTIONS: 40,
  CHEMISTRY_QUESTIONS: 40,
  TOTAL_QUESTIONS: 160,

  // Section names
  SECTIONS: ['maths', 'physics', 'chemistry'] as const,
  SECTION_NAMES: {
    maths: 'Mathematics',
    physics: 'Physics',
    chemistry: 'Chemistry'
  } as const,

  // Question number ranges
  MATHS_START: 1,
  MATHS_END: 80,
  PHYSICS_START: 81,
  PHYSICS_END: 120,
  CHEMISTRY_START: 121,
  CHEMISTRY_END: 160,

  // Scoring
  MARKS_PER_CORRECT: 1,
  NEGATIVE_MARKING: false, // Currently no negative marking

  // Test attempt status
  ATTEMPT_STATUS: {
    IN_PROGRESS: 'in_progress',
    SUBMITTED: 'submitted',
    ABANDONED: 'abandoned'
  } as const,

  // Auto-save interval (milliseconds)
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds

  // Test types
  TEST_TYPES: {
    PREVIOUS_YEAR: 'previous_year',
    MOCK: 'mock'
  } as const
} as const;

// Helper function to get section from question number
export function getSectionFromQuestionNumber(questionNumber: number): 'maths' | 'physics' | 'chemistry' {
  if (questionNumber >= TEST_CONSTANTS.MATHS_START && questionNumber <= TEST_CONSTANTS.MATHS_END) {
    return 'maths';
  } else if (questionNumber >= TEST_CONSTANTS.PHYSICS_START && questionNumber <= TEST_CONSTANTS.PHYSICS_END) {
    return 'physics';
  } else if (questionNumber >= TEST_CONSTANTS.CHEMISTRY_START && questionNumber <= TEST_CONSTANTS.CHEMISTRY_END) {
    return 'chemistry';
  }
  throw new Error(`Invalid question number: ${questionNumber}`);
}

// Helper function to get section name from question number
export function getSectionNameFromQuestionNumber(questionNumber: number): string {
  const section = getSectionFromQuestionNumber(questionNumber);
  return TEST_CONSTANTS.SECTION_NAMES[section];
}

