// Service for test-related business logic

import { TestRepository } from '@/lib/repositories/test.repository';
import { TestAttempt, TestResult, Question } from '@/lib/types';
import { TEST_CONSTANTS, getSectionFromQuestionNumber } from '@/lib/constants/test.constants';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { validateTestId, validateQuestionNumber, validateAnswerOption } from '@/lib/utils/validation';

export class TestService {
  private repository: TestRepository;

  constructor() {
    this.repository = new TestRepository();
  }

  async startTest(userId: string, testId: number): Promise<{ attempt: TestAttempt; testData: any }> {
    validateTestId(testId);

    // Check if there's an existing in-progress attempt
    const existingAttempt = await this.repository.getInProgressAttempt(userId, testId);
    
    if (existingAttempt) {
      // Return existing attempt with test data
      const testData = await this.repository.getTestData(testId);
      return {
        attempt: existingAttempt,
        testData: this.formatTestData(testData)
      };
    }

    // Create new attempt
    const test = await this.repository.getTestById(testId);
    if (!test) {
      throw new NotFoundError('Test');
    }

    const attempt: Omit<TestAttempt, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      test_id: testId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      time_remaining: TEST_CONSTANTS.DURATION_SECONDS,
      current_question_id: 1,
      answers: {},
      marked_for_review: [],
      answered_and_marked: [],
      visited_questions: [1]
    };

    try {
      const newAttempt = await this.repository.createAttempt(attempt);
      const testData = await this.repository.getTestData(testId);

      return {
        attempt: newAttempt,
        testData: this.formatTestData(testData)
      };
    } catch (error: any) {
      // Handle race condition - if attempt was created by another request, fetch it
      if (error.message?.includes('unique_in_progress_attempt') || error.message?.includes('duplicate key')) {
        const existingAttempt = await this.repository.getInProgressAttempt(userId, testId);
        if (existingAttempt) {
          const testData = await this.repository.getTestData(testId);
          return {
            attempt: existingAttempt,
            testData: this.formatTestData(testData)
          };
        }
      }
      throw error;
    }
  }

  async getAttempt(attemptId: string, userId: string): Promise<{ attempt: TestAttempt; testData: any }> {
    const attempt = await this.repository.getAttemptById(attemptId, userId);
    
    if (!attempt) {
      throw new NotFoundError('Test attempt');
    }

    if (attempt.is_trial && attempt.trial_question_ids?.length) {
      const testData = await this.repository.getTestDataForTrial(attempt);
      return {
        attempt,
        testData: this.formatTrialTestData(testData)
      };
    }

    const testData = await this.repository.getTestData(attempt.test_id);
    return {
      attempt,
      testData: this.formatTestData(testData)
    };
  }

  /** Start a 15-min trial: 5 random questions per subject from the given test. */
  async startTrialTest(userId: string, testId: number): Promise<{ attempt: TestAttempt; testData: any }> {
    validateTestId(testId);
    const { questions } = await this.repository.getTestData(testId);
    const maths = questions.filter((q) => q.question_number >= 1 && q.question_number <= 80);
    const physics = questions.filter((q) => q.question_number >= 81 && q.question_number <= 120);
    const chemistry = questions.filter((q) => q.question_number >= 121 && q.question_number <= 160);

    const pick = (arr: Question[], n: number) => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, n);
    };
    const maths5 = pick(maths, 5);
    const physics5 = pick(physics, 5);
    const chemistry5 = pick(chemistry, 5);
    const trialQuestionIds = [...maths5, ...physics5, ...chemistry5].map((q) => q.question_id);

    const attemptPayload: Omit<TestAttempt, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      test_id: testId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      time_remaining: 15 * 60,
      current_question_id: 1,
      answers: {},
      marked_for_review: [],
      answered_and_marked: [],
      visited_questions: [1],
      is_trial: true,
      trial_question_ids: trialQuestionIds
    };

    const newAttempt = await this.repository.createAttempt(attemptPayload);
    const testData = await this.repository.getTestDataForTrial(newAttempt);
    return {
      attempt: newAttempt,
      testData: this.formatTrialTestData(testData)
    };
  }

  async saveProgress(
    attemptId: string,
    userId: string,
    updates: {
      answers?: Record<number, string>;
      current_question_id?: number;
      time_remaining?: number;
      marked_for_review?: number[];
      answered_and_marked?: number[];
      visited_questions?: number[];
    }
  ): Promise<TestAttempt> {
    const attempt = await this.repository.getAttemptById(attemptId, userId);
    
    if (!attempt) {
      throw new NotFoundError('Test attempt');
    }

    if (attempt.status !== 'in_progress') {
      throw new ValidationError('Cannot update a submitted or abandoned test');
    }

    // Validate updates
    if (updates.current_question_id !== undefined) {
      validateQuestionNumber(updates.current_question_id);
    }

    if (updates.answers) {
      for (const [questionNum, answer] of Object.entries(updates.answers)) {
        validateQuestionNumber(parseInt(questionNum));
        if (answer && !validateAnswerOption(answer)) {
          throw new ValidationError(`Invalid answer option: ${answer}`);
        }
      }
    }

    // Merge answers
    const mergedAnswers = {
      ...attempt.answers,
      ...(updates.answers || {})
    };

    // Update visited questions
    const visitedQuestions = new Set(attempt.visited_questions);
    if (updates.current_question_id) {
      visitedQuestions.add(updates.current_question_id);
    }
    if (updates.visited_questions) {
      updates.visited_questions.forEach(q => visitedQuestions.add(q));
    }

    // Update marked for review
    const markedForReview = new Set(attempt.marked_for_review);
    if (updates.marked_for_review) {
      updates.marked_for_review.forEach(q => markedForReview.add(q));
    }

    // Update answered and marked
    const answeredAndMarked = new Set(attempt.answered_and_marked);
    if (updates.answered_and_marked) {
      updates.answered_and_marked.forEach(q => answeredAndMarked.add(q));
    }

    // If question is answered and marked, add to answered_and_marked
    for (const [qNum, answer] of Object.entries(mergedAnswers)) {
      const questionNum = parseInt(qNum);
      if (answer && markedForReview.has(questionNum)) {
        answeredAndMarked.add(questionNum);
      }
    }

    const updatedAttempt = await this.repository.updateAttempt(attemptId, userId, {
      answers: mergedAnswers,
      current_question_id: updates.current_question_id ?? attempt.current_question_id,
      time_remaining: updates.time_remaining ?? attempt.time_remaining,
      marked_for_review: Array.from(markedForReview),
      answered_and_marked: Array.from(answeredAndMarked),
      visited_questions: Array.from(visitedQuestions)
    });

    return updatedAttempt;
  }

  async submitTest(attemptId: string, userId: string): Promise<TestResult> {
    // First, check if result already exists (handles race condition)
    const existingResult = await this.repository.getResultByAttemptId(attemptId, userId);
    if (existingResult) {
      // Result already exists, just return it
      return existingResult;
    }

    const attempt = await this.repository.getAttemptById(attemptId, userId);
    
    if (!attempt) {
      throw new NotFoundError('Test attempt');
    }

    if (attempt.status !== 'in_progress') {
      // If already submitted, try to get the result
      const result = await this.repository.getResultByAttemptId(attemptId, userId);
      if (result) {
        return result;
      }
      throw new ValidationError('Test has already been submitted');
    }

    // Get test questions (trial uses subset)
    const questions = attempt.is_trial && attempt.trial_question_ids?.length
      ? (await this.repository.getTestDataForTrial(attempt)).questions
      : (await this.repository.getTestData(attempt.test_id)).questions;

    const questionTimes = attempt.question_times || {};
    const evaluation = this.evaluateAnswers(questions, attempt.answers, questionTimes);

    const durationSeconds = attempt.is_trial ? 15 * 60 : TEST_CONSTANTS.DURATION_SECONDS;
    const result: Omit<TestResult, 'id' | 'created_at'> = {
      attempt_id: attemptId,
      user_id: userId,
      test_id: attempt.test_id,
      submitted_at: new Date().toISOString(),
      time_taken: durationSeconds - attempt.time_remaining,
      answers: attempt.answers,
      section_wise_marks: evaluation.section_wise_marks,
      total_marks: evaluation.total_marks,
      correct_answers: evaluation.correct_answers,
      wrong_answers: evaluation.wrong_answers,
      unattempted: evaluation.unattempted,
      section_wise_analysis: evaluation.section_wise_analysis,
      ...(attempt.is_trial && { is_trial: true })
    };

    // Try to create result (will fail if duplicate due to unique constraint)
    let savedResult: TestResult;
    try {
      savedResult = await this.repository.createResult(result);
    } catch (error: any) {
      // If result already exists (race condition), fetch it
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        const existingResult = await this.repository.getResultByAttemptId(attemptId, userId);
        if (existingResult) {
          savedResult = existingResult;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // Update attempt status - MUST succeed to ensure data consistency
    // If this fails, we have a problem because result exists but attempt is still in_progress
    try {
      const updatedAttempt = await this.repository.updateAttemptStatus(attemptId, userId, 'submitted', result.submitted_at);
      
      // Verify the update succeeded
      if (updatedAttempt.status !== 'submitted') {
        console.error('Attempt status update did not succeed. Current status:', updatedAttempt.status);
        // Try one more time with direct update
        await this.repository.updateAttempt(attemptId, userId, {
          status: 'submitted',
          submitted_at: result.submitted_at
        });
      }
    } catch (error: any) {
      // This is critical - if we can't update the status, log it as an error
      // but still return the result since it was created successfully
      console.error('CRITICAL: Failed to update attempt status after creating result:', error.message);
      console.error('Attempt ID:', attemptId, 'Result ID:', savedResult.id);
      
      // Try one more time with a direct update (without status check)
      try {
        await this.repository.updateAttempt(attemptId, userId, {
          status: 'submitted',
          submitted_at: result.submitted_at
        });
      } catch (retryError: any) {
        console.error('Retry update also failed:', retryError.message);
        // At this point, we've created the result but status update failed
        // This is a data inconsistency that needs manual fixing
        // But we return the result anyway since it was successfully created
      }
    }

    return savedResult;
  }

  async getAllTests(state?: 'TS' | 'AP', field?: string) {
    return await this.repository.getAllTests(state, field);
  }

  async getUserResults(userId: string, limit?: number) {
    return await this.repository.getUserResults(userId, limit);
  }

  async getResultById(resultId: string, userId: string) {
    const result = await this.repository.getResultById(resultId, userId);
    if (!result) {
      throw new NotFoundError('Test result');
    }

    // Get test details and questions
    const test = await this.repository.getTestById(result.test_id);
    const { questions } = await this.repository.getTestData(result.test_id);

    // Map questions with user answers and status
    const questionsWithAnswers = questions.map(question => {
      const userAnswer = result.answers[question.question_number];
      const isCorrect = userAnswer?.toUpperCase() === question.correct_option.toUpperCase();
      const isAnswered = !!userAnswer;
      
      return {
        ...question,
        userAnswer: userAnswer || null,
        isCorrect,
        isAnswered,
        status: !isAnswered ? 'unattempted' : isCorrect ? 'correct' : 'wrong'
      };
    });

    return {
      ...result,
      test,
      questions: questionsWithAnswers
    };
  }

  /** Get result by id only (for public demo). No user check. */
  async getResultByIdForDemo(resultId: string) {
    const result = await this.repository.getResultByIdOnly(resultId);
    if (!result) {
      throw new NotFoundError('Test result');
    }

    const test = await this.repository.getTestById(result.test_id);
    const { questions } = await this.repository.getTestData(result.test_id);

    const questionsWithAnswers = questions.map(question => {
      const userAnswer = result.answers[question.question_number];
      const isCorrect = userAnswer?.toUpperCase() === question.correct_option.toUpperCase();
      const isAnswered = !!userAnswer;

      return {
        ...question,
        userAnswer: userAnswer || null,
        isCorrect,
        isAnswered,
        status: !isAnswered ? 'unattempted' : isCorrect ? 'correct' : 'wrong'
      };
    });

    return {
      ...result,
      test,
      questions: questionsWithAnswers
    };
  }

  private evaluateAnswers(
    questions: Question[],
    answers: Record<number, string>,
    questionTimes: Record<number, number>
  ) {
    const sectionAnalysis = {
      maths: { 
        correct: 0, 
        wrong: 0, 
        unattempted: 0, 
        marks: 0,
        time_seconds: 0,
        time_correct: 0,
        time_wrong: 0,
        time_unattempted: 0
      },
      physics: { 
        correct: 0, 
        wrong: 0, 
        unattempted: 0, 
        marks: 0,
        time_seconds: 0,
        time_correct: 0,
        time_wrong: 0,
        time_unattempted: 0
      },
      chemistry: { 
        correct: 0, 
        wrong: 0, 
        unattempted: 0, 
        marks: 0,
        time_seconds: 0,
        time_correct: 0,
        time_wrong: 0,
        time_unattempted: 0
      }
    };

    let totalCorrect = 0;
    let totalWrong = 0;
    let totalUnattempted = 0;

    questions.forEach(question => {
      const section = this.getSectionFromSectionId(question.section_id);
      const userAnswer = answers[question.question_number];
      const questionTime = questionTimes[question.question_number] || 0;

      // Add time to section total
      sectionAnalysis[section].time_seconds += questionTime;

      if (!userAnswer) {
        totalUnattempted++;
        sectionAnalysis[section].unattempted++;
        sectionAnalysis[section].time_unattempted += questionTime;
      } else if (userAnswer.toUpperCase() === question.correct_option.toUpperCase()) {
        totalCorrect++;
        sectionAnalysis[section].correct++;
        sectionAnalysis[section].marks += TEST_CONSTANTS.MARKS_PER_CORRECT;
        sectionAnalysis[section].time_correct += questionTime;
      } else {
        totalWrong++;
        sectionAnalysis[section].wrong++;
        sectionAnalysis[section].time_wrong += questionTime;
      }
    });

    return {
      section_wise_marks: {
        maths: sectionAnalysis.maths.marks,
        physics: sectionAnalysis.physics.marks,
        chemistry: sectionAnalysis.chemistry.marks
      },
      total_marks: totalCorrect,
      correct_answers: totalCorrect,
      wrong_answers: totalWrong,
      unattempted: totalUnattempted,
      section_wise_analysis: sectionAnalysis
    };
  }

  private getSectionFromSectionId(sectionId: string): 'maths' | 'physics' | 'chemistry' {
    // section_id format: "test_1_maths" or similar
    const lowerSectionId = sectionId.toLowerCase();
    
    if (lowerSectionId.includes('math')) return 'maths';
    if (lowerSectionId.includes('phys')) return 'physics';
    if (lowerSectionId.includes('chem')) return 'chemistry';
    
    // Fallback: try to extract from section_id parts
    const parts = lowerSectionId.split('_');
    const lastPart = parts[parts.length - 1];
    
    if (lastPart.includes('math')) return 'maths';
    if (lastPart.includes('phys')) return 'physics';
    if (lastPart.includes('chem')) return 'chemistry';
    
    // Default fallback
    return 'maths';
  }

  private formatTestData(data: { test: any; sections: any[]; questions: Question[] }) {
    return {
      test: data.test,
      sections: data.sections,
      questions: data.questions,
      instructions: {
        duration: TEST_CONSTANTS.DURATION_MINUTES,
        sectionInstructions: [
          {
            name: TEST_CONSTANTS.SECTION_NAMES.maths,
            questions: TEST_CONSTANTS.MATHS_QUESTIONS,
            maxMarks: TEST_CONSTANTS.MATHS_QUESTIONS,
            negativeMarks: 0,
            positiveMarks: 1
          },
          {
            name: TEST_CONSTANTS.SECTION_NAMES.physics,
            questions: TEST_CONSTANTS.PHYSICS_QUESTIONS,
            maxMarks: TEST_CONSTANTS.PHYSICS_QUESTIONS,
            negativeMarks: 0,
            positiveMarks: 1
          },
          {
            name: TEST_CONSTANTS.SECTION_NAMES.chemistry,
            questions: TEST_CONSTANTS.CHEMISTRY_QUESTIONS,
            maxMarks: TEST_CONSTANTS.CHEMISTRY_QUESTIONS,
            negativeMarks: 0,
            positiveMarks: 1
          }
        ]
      }
    };
  }

  private formatTrialTestData(data: { test: any; sections: any[]; questions: Question[] }) {
    return {
      test: { ...data.test, isTrial: true },
      sections: data.sections,
      questions: data.questions,
      instructions: {
        duration: 15,
        sectionInstructions: [
          { name: TEST_CONSTANTS.SECTION_NAMES.maths, questions: 5, maxMarks: 5, negativeMarks: 0, positiveMarks: 1 },
          { name: TEST_CONSTANTS.SECTION_NAMES.physics, questions: 5, maxMarks: 5, negativeMarks: 0, positiveMarks: 1 },
          { name: TEST_CONSTANTS.SECTION_NAMES.chemistry, questions: 5, maxMarks: 5, negativeMarks: 0, positiveMarks: 1 }
        ]
      }
    };
  }
}

