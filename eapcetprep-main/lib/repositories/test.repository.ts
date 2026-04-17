// Repository for test-related database operations

import { createClient } from '@/utils/supabase/server';
import { Test, Question, Section, TestAttempt, TestResult } from '@/lib/types';
import { NotFoundError } from '@/lib/utils/errors';

export class TestRepository {
  private supabase = createClient();

  async getTestById(testId: number): Promise<Test | null> {
    const { data, error } = await this.supabase
      .from('tests')
      .select('*')
      .eq('test_id', testId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Test;
  }

  async getAllTests(state?: 'TS' | 'AP', field?: string): Promise<Test[]> {
    let query = this.supabase
      .from('tests')
      .select('*');

    // Filter by state if provided
    if (state) {
      query = query.eq('state', state);
    }

    // Filter by field if provided (engineering or medical)
    if (field) {
      query = query.eq('field', field);
    }

    const { data, error } = await query.order('test_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tests: ${error.message}`);
    }

    return (data || []) as Test[];
  }

  async getTestQuestions(testId: number): Promise<Question[]> {
    // Get all sections for this test with their names
    const { data: sections, error: sectionsError } = await this.supabase
      .from('sections')
      .select('section_id, section_name')
      .eq('test_id', testId)
      .order('section_id');

    if (sectionsError || !sections || sections.length === 0) {
      return [];
    }

    const sectionIds = sections.map(s => s.section_id);

    // Get all questions for these sections
    const { data: questions, error: questionsError } = await this.supabase
      .from('questions')
      .select('*')
      .in('section_id', sectionIds)
      .order('question_number', { ascending: true });

    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }

    if (!questions || questions.length === 0) {
      return [];
    }

    // Use question numbers directly from database (already global: 1-160)
    // No offset calculation needed
    return (questions as Question[]).sort((a, b) => a.question_number - b.question_number);
  }

  async getTestSections(testId: number): Promise<Section[]> {
    const { data, error } = await this.supabase
      .from('sections')
      .select('*')
      .eq('test_id', testId)
      .order('section_id');

    if (error) {
      throw new Error(`Failed to fetch sections: ${error.message}`);
    }

    return (data || []) as Section[];
  }

  async getTestData(testId: number): Promise<{ test: Test; sections: Section[]; questions: Question[] }> {
    const test = await this.getTestById(testId);
    if (!test) {
      throw new NotFoundError('Test');
    }

    const [sections, questions] = await Promise.all([
      this.getTestSections(testId),
      this.getTestQuestions(testId)
    ]);

    return { test, sections, questions };
  }

  /** Get test data for a trial attempt: only trial_question_ids, renumbered 1–15 (5 maths, 5 physics, 5 chemistry). */
  async getTestDataForTrial(attempt: TestAttempt): Promise<{ test: Test; sections: Section[]; questions: Question[] }> {
    const test = await this.getTestById(attempt.test_id);
    if (!test) {
      throw new NotFoundError('Test');
    }
    const ids = attempt.trial_question_ids || [];
    if (ids.length === 0) {
      return { test, sections: [], questions: [] };
    }
    const questionsRaw = await this.getQuestionsByIds(ids);
    const byId = new Map(questionsRaw.map((q) => [q.question_id, q]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as Question[];
    const questions: Question[] = ordered.map((q, index) => ({
      ...q,
      question_number: index + 1
    }));
    const sections: Section[] = [
      { section_id: 'trial_maths', test_id: test.test_id, section_name: 'Mathematics' },
      { section_id: 'trial_physics', test_id: test.test_id, section_name: 'Physics' },
      { section_id: 'trial_chemistry', test_id: test.test_id, section_name: 'Chemistry' }
    ];
    return { test, sections, questions };
  }

  async getInProgressAttempt(userId: string, testId: number): Promise<TestAttempt | null> {
    const { data, error } = await this.supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('test_id', testId)
      .eq('status', 'in_progress')
      .single();

    if (error || !data) {
      return null;
    }

    return data as TestAttempt;
  }

  async createAttempt(attempt: Omit<TestAttempt, 'id' | 'created_at' | 'updated_at'>): Promise<TestAttempt> {
    const row: Record<string, unknown> = {
      user_id: attempt.user_id,
      test_id: attempt.test_id,
      status: attempt.status,
      started_at: attempt.started_at,
      time_remaining: attempt.time_remaining,
      current_question_id: attempt.current_question_id,
      answers: attempt.answers,
      marked_for_review: attempt.marked_for_review,
      answered_and_marked: attempt.answered_and_marked,
      visited_questions: attempt.visited_questions
    };
    if (attempt.is_trial) {
      row.is_trial = true;
      row.trial_question_ids = attempt.trial_question_ids ?? [];
    }
    const { data, error } = await this.supabase
      .from('test_attempts')
      .insert(row)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create attempt: ${error.message}`);
    }

    return data as TestAttempt;
  }

  /** Fetch questions by their DB question_id (for trial subset). */
  async getQuestionsByIds(questionIds: number[]): Promise<Question[]> {
    if (!questionIds.length) return [];
    const { data, error } = await this.supabase
      .from('questions')
      .select('*')
      .in('question_id', questionIds);

    if (error) {
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }
    return (data || []) as Question[];
  }

  async getAttemptById(attemptId: string, userId: string): Promise<TestAttempt | null> {
    const { data, error } = await this.supabase
      .from('test_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as TestAttempt;
  }

  async updateAttempt(
    attemptId: string,
    userId: string,
    updates: Partial<Pick<TestAttempt, 'answers' | 'current_question_id' | 'time_remaining' | 'marked_for_review' | 'answered_and_marked' | 'visited_questions' | 'status' | 'submitted_at'>>
  ): Promise<TestAttempt> {
    const { data, error } = await this.supabase
      .from('test_attempts')
      .update(updates)
      .eq('id', attemptId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update attempt: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundError('Test attempt');
    }

    return data as TestAttempt;
  }

  async updateAttemptStatus(
    attemptId: string,
    userId: string,
    status: 'submitted' | 'abandoned',
    submittedAt?: string
  ): Promise<TestAttempt> {
    // Update status - we already verified it's in_progress in the service layer
    // Don't add .eq('status', 'in_progress') here because we want to update it regardless
    // The unique constraint will prevent issues if somehow it's already submitted
    const updates: any = { status };
    if (submittedAt) {
      updates.submitted_at = submittedAt;
    }

    const { data, error } = await this.supabase
      .from('test_attempts')
      .update(updates)
      .eq('id', attemptId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      // If update fails, try to get current attempt to see what happened
      const currentAttempt = await this.getAttemptById(attemptId, userId);
      if (currentAttempt && currentAttempt.status === status) {
        // Status is already correct, return it
        return currentAttempt;
      }
      throw new Error(`Failed to update attempt status: ${error.message}`);
    }

    if (!data) {
      // Attempt not found or already updated, fetch current state
      const currentAttempt = await this.getAttemptById(attemptId, userId);
      if (!currentAttempt) {
        throw new NotFoundError('Test attempt');
      }
      return currentAttempt;
    }

    return data as TestAttempt;
  }

  async createResult(result: Omit<TestResult, 'id' | 'created_at'>): Promise<TestResult> {
    const row: Record<string, unknown> = {
      attempt_id: result.attempt_id,
      user_id: result.user_id,
      test_id: result.test_id,
      submitted_at: result.submitted_at,
      time_taken: result.time_taken,
      answers: result.answers,
      section_wise_marks: result.section_wise_marks,
      total_marks: result.total_marks,
      correct_answers: result.correct_answers,
      wrong_answers: result.wrong_answers,
      unattempted: result.unattempted,
      section_wise_analysis: result.section_wise_analysis
    };
    if (result.is_trial) {
      row.is_trial = true;
    }
    const { data, error } = await this.supabase
      .from('test_results')
      .insert(row)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create result: ${error.message}`);
    }

    return data as TestResult;
  }

  async getUserResults(userId: string, limit: number = 10): Promise<TestResult[]> {
    const { data, error } = await this.supabase
      .from('test_results')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch results: ${error.message}`);
    }

    return (data || []) as TestResult[];
  }

  async getResultById(resultId: string, userId: string): Promise<TestResult | null> {
    const { data, error } = await this.supabase
      .from('test_results')
      .select('*')
      .eq('id', resultId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as TestResult;
  }

  /** Fetch result by id only (for public demo result - no user check). */
  async getResultByIdOnly(resultId: string): Promise<TestResult | null> {
    const { data, error } = await this.supabase
      .from('test_results')
      .select('*')
      .eq('id', resultId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as TestResult;
  }

  async getResultByAttemptId(attemptId: string, userId: string): Promise<TestResult | null> {
    const { data, error } = await this.supabase
      .from('test_results')
      .select('*')
      .eq('attempt_id', attemptId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as TestResult;
  }

  async getUserAttempts(userId: string): Promise<TestAttempt[]> {
    const { data, error } = await this.supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch attempts: ${error.message}`);
    }

    return (data || []) as TestAttempt[];
  }

  async updateEstimatedRank(
    resultId: string,
    userId: string,
    estimatedRank: { estimatedRank: number; rankRange: string }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('test_results')
      .update({ estimated_rank: estimatedRank })
      .eq('id', resultId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update estimated rank: ${error.message}`);
    }
  }
}

