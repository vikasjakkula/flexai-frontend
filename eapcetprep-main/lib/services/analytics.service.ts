import { createClient } from '@/utils/supabase/server';
import { TestResult } from '@/lib/types';

interface QuestionTime {
  question_number: number;
  time_spent_seconds: number;
}

interface SubjectMetrics {
  score: number;
  time: number;
  correct: number;
  wrong: number;
  unattempted: number;
}

export class AnalyticsService {
  private supabase = createClient();

  /**
   * Calculate and store analytics for a submitted test
   */
  async calculateAndStoreTestAnalytics(attemptId: string, result: TestResult): Promise<void> {
    try {
      // Get all question times for this attempt
      let questionTimes = await this.getQuestionTimes(attemptId);
      
      // Get test questions to determine correct answers
      const { data: questions, error: questionsError } = await this.supabase
        .from('questions')
        .select('question_number, correct_option, section_id')
        .eq('test_id', result.test_id)
        .order('question_number');

      if (questionsError || !questions) {
        throw new Error('Failed to fetch questions');
    }

      // Get attempt answers
      const answers = result.answers as Record<number, string>;

      // Calculate overall metrics
      const correctCount = result.correct_answers;
      const wrongCount = result.wrong_answers;
      const unattemptedCount = result.unattempted;

      // FALLBACK: If no question times found, distribute total time proportionally
      const totalTimeFromResult = result.time_taken || 0;
      if (questionTimes.length === 0 && totalTimeFromResult > 0) {
        // Distribute time proportionally based on answer counts
        const totalAnswered = correctCount + wrongCount;
        
        // Create estimated question times
        questionTimes = questions.map(q => {
          const userAnswer = answers[q.question_number];
          const isAnswered = !!userAnswer;
          
          // Distribute time: answered questions get more time, unattempted get less
          const avgTimePerAnswered = totalAnswered > 0 ? (totalTimeFromResult * 0.9) / totalAnswered : 0;
          const avgTimePerUnattempted = unattemptedCount > 0 ? (totalTimeFromResult * 0.1) / unattemptedCount : 0;
          
          return {
            question_number: q.question_number,
            time_spent_seconds: isAnswered ? Math.round(avgTimePerAnswered) : Math.round(avgTimePerUnattempted),
          };
        });
        
        // Also save these estimated times to the database for future reference
        try {
          const timesObj: Record<string, number> = {};
          questionTimes.forEach(qt => {
            timesObj[qt.question_number.toString()] = qt.time_spent_seconds;
          });
          
          await this.supabase
            .from('test_attempts')
            .update({ question_times: timesObj })
            .eq('id', attemptId);
        } catch (error) {
          console.error('Failed to save estimated times:', error);
        }
    }

      // Calculate time by answer status
      const timeMetrics = this.calculateTimeByStatus(questionTimes, answers, questions);
      
      // Calculate subject-wise metrics
      const mathsMetrics = this.calculateSubjectMetrics(questionTimes, answers, questions, 'maths');
      const physicsMetrics = this.calculateSubjectMetrics(questionTimes, answers, questions, 'physics');
      const chemistryMetrics = this.calculateSubjectMetrics(questionTimes, answers, questions, 'chemistry');

      // Calculate total time
      const totalTime = questionTimes.length > 0 
        ? questionTimes.reduce((sum, qt) => sum + qt.time_spent_seconds, 0)
        : totalTimeFromResult;

      // Calculate accuracy
      const totalQuestions = questions.length;
      const accuracyPercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

      // Store analytics (upsert to handle retries and backfill)
      const { error: insertError } = await this.supabase
        .from('test_result_analytics')
        .upsert({
          attempt_id: attemptId,
          user_id: result.user_id,
          test_id: result.test_id,
          submitted_at: result.submitted_at,
          total_score: result.total_marks,
          total_marks: 160, // EAMCET total marks
          correct_count: correctCount,
          wrong_count: wrongCount,
          unattempted_count: unattemptedCount,
          total_time_seconds: totalTime,
          time_correct_seconds: timeMetrics.correct,
          time_wrong_seconds: timeMetrics.wrong,
          time_unattempted_seconds: timeMetrics.unattempted,
          maths_score: mathsMetrics.score,
          physics_score: physicsMetrics.score,
          chemistry_score: chemistryMetrics.score,
          maths_time_seconds: mathsMetrics.time,
          physics_time_seconds: physicsMetrics.time,
          chemistry_time_seconds: chemistryMetrics.time,
          accuracy_percentage: accuracyPercentage,
        }, { onConflict: 'attempt_id' });

      if (insertError) {
        throw insertError;
      }

      // Update user averages
      await this.updateUserAverages(result.user_id);
    } catch (error) {
      console.error('Error calculating analytics:', error);
      throw error;
    }
  }

  /**
   * Get question times for an attempt
   */
  private async getQuestionTimes(attemptId: string): Promise<QuestionTime[]> {
    const { data: attempt, error } = await this.supabase
      .from('test_attempts')
      .select('question_times')
      .eq('id', attemptId)
      .single();

    if (error) {
      throw error;
    }

    if (!attempt || !attempt.question_times) {
      return [];
    }

    // Convert JSONB to QuestionTime array
    const questionTimes: QuestionTime[] = [];
    const timesObj = attempt.question_times as Record<string, number>;
    
    Object.entries(timesObj).forEach(([qNumStr, time]) => {
      questionTimes.push({
        question_number: parseInt(qNumStr),
        time_spent_seconds: time,
      });
    });

    return questionTimes;
  }

  /**
   * Calculate time spent on correct/wrong/unattempted answers
   */
  private calculateTimeByStatus(
    questionTimes: QuestionTime[],
    answers: Record<number, string>,
    questions: Array<{ question_number: number; correct_option: string }>
  ): { correct: number; wrong: number; unattempted: number } {
    let timeCorrect = 0;
    let timeWrong = 0;
    let timeUnattempted = 0;

    questionTimes.forEach(qt => {
      const question = questions.find(q => q.question_number === qt.question_number);
      if (!question) return;

      const userAnswer = answers[qt.question_number];
      const isCorrect = userAnswer?.toLowerCase() === question.correct_option.toLowerCase();
      const isUnattempted = !userAnswer;

      if (isCorrect) {
        timeCorrect += qt.time_spent_seconds;
      } else if (isUnattempted) {
        timeUnattempted += qt.time_spent_seconds;
      } else {
        timeWrong += qt.time_spent_seconds;
      }
    });

    return { correct: timeCorrect, wrong: timeWrong, unattempted: timeUnattempted };
  }

  /**
   * Calculate metrics for a specific subject
   */
  private calculateSubjectMetrics(
    questionTimes: QuestionTime[],
    answers: Record<number, string>,
    questions: Array<{ question_number: number; correct_option: string }>,
    subject: 'maths' | 'physics' | 'chemistry'
  ): SubjectMetrics {
    const range = 
      subject === 'maths' ? [1, 80] :
      subject === 'physics' ? [81, 120] :
      [121, 160];

    let score = 0;
    let time = 0;
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    questions
      .filter(q => q.question_number >= range[0] && q.question_number <= range[1])
      .forEach(question => {
        const userAnswer = answers[question.question_number];
        const isCorrect = userAnswer?.toLowerCase() === question.correct_option.toLowerCase();
        const isUnattempted = !userAnswer;

        if (isCorrect) {
          score += 1; // EAMCET: +1 for correct
          correct++;
        } else if (!isUnattempted) {
          score -= 0.25; // EAMCET: -0.25 for wrong
          wrong++;
        } else {
          unattempted++;
        }

        // Add time for this question
        const qt = questionTimes.find(qt => qt.question_number === question.question_number);
        if (qt) {
          time += qt.time_spent_seconds;
        }
      });

    return { score, time, correct, wrong, unattempted };
  }

  /**
   * Update user averages across all tests
   */
  async updateUserAverages(userId: string): Promise<void> {
    try {
      // Get all submitted test analytics for user
      const { data: allAnalytics, error } = await this.supabase
        .from('test_result_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: true });

      if (error) {
        throw error;
      }

      if (!allAnalytics || allAnalytics.length === 0) {
        return;
      }

      // Calculate averages
      const count = allAnalytics.length;
      const averages = {
        avg_score: this.average(allAnalytics.map(a => a.total_score)),
        avg_total_marks: 160, // Constant
        avg_correct_count: this.average(allAnalytics.map(a => a.correct_count)),
        avg_wrong_count: this.average(allAnalytics.map(a => a.wrong_count)),
        avg_unattempted_count: this.average(allAnalytics.map(a => a.unattempted_count)),
        avg_total_time_seconds: this.average(allAnalytics.map(a => a.total_time_seconds)),
        avg_time_correct_seconds: this.average(allAnalytics.map(a => a.time_correct_seconds)),
        avg_time_wrong_seconds: this.average(allAnalytics.map(a => a.time_wrong_seconds)),
        avg_time_unattempted_seconds: this.average(allAnalytics.map(a => a.time_unattempted_seconds)),
        avg_maths_score: this.average(allAnalytics.map(a => a.maths_score)),
        avg_physics_score: this.average(allAnalytics.map(a => a.physics_score)),
        avg_chemistry_score: this.average(allAnalytics.map(a => a.chemistry_score)),
        avg_maths_time_seconds: this.average(allAnalytics.map(a => a.maths_time_seconds)),
        avg_physics_time_seconds: this.average(allAnalytics.map(a => a.physics_time_seconds)),
        avg_chemistry_time_seconds: this.average(allAnalytics.map(a => a.chemistry_time_seconds)),
        avg_accuracy_percentage: this.average(allAnalytics.map(a => a.accuracy_percentage)),
        total_tests_taken: count,
        last_updated_at: new Date().toISOString(),
    };

      // Upsert user averages
      const { error: upsertError } = await this.supabase
        .from('user_test_averages')
        .upsert({
          user_id: userId,
          ...averages,
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        throw upsertError;
      }
    } catch (error) {
      console.error('Error updating user averages:', error);
      throw error;
    }
  }

  /**
   * Get all test analytics for a user
   */
  async getUserTestAnalytics(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('test_result_analytics')
      .select(`
        *,
        tests:test_id (
          test_name,
          test_date
        )
      `)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get user averages
   */
  async getUserAverages(userId: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('user_test_averages')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No averages found
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Get single test analytics
   */
  async getTestAnalytics(attemptId: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('test_result_analytics')
      .select(`
        *,
        tests:test_id (
          test_name,
          test_date
        )
      `)
      .eq('attempt_id', attemptId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
      }

    return data;
  }

  /**
   * Get section-wise performance averages for a user
   */
  async getSectionWisePerformance(userId: string): Promise<{
    maths: { average: number };
    physics: { average: number };
    chemistry: { average: number };
  }> {
    const analytics = await this.getUserTestAnalytics(userId);
    
    if (!analytics || analytics.length === 0) {
      return {
        maths: { average: 0 },
        physics: { average: 0 },
        chemistry: { average: 0 },
      };
    }

    const mathsScores = analytics.map((a: any) => a.maths_score || 0);
    const physicsScores = analytics.map((a: any) => a.physics_score || 0);
    const chemistryScores = analytics.map((a: any) => a.chemistry_score || 0);

    return {
      maths: { average: this.average(mathsScores) },
      physics: { average: this.average(physicsScores) },
      chemistry: { average: this.average(chemistryScores) },
    };
  }

  /**
   * Helper: Calculate average
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum / numbers.length;
  }
}
