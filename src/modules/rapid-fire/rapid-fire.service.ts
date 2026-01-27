import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionBankService } from '../question-bank/question-bank.service';

interface SessionData {
  userId: string;
  candidateId: string;
  skillBucketId: string;
  testTemplateId: string;
  questionIds: string[];
  answers: Record<string, number>; // questionId -> selectedAnswer
  startedAt: number;
  endsAt: number;
  status: 'ACTIVE' | 'SUBMITTED' | 'EXPIRED' | 'EXITED';
}

// In-memory session storage (in production, use Redis)
const activeSessions = new Map<string, SessionData>();

@Injectable()
export class RapidFireTestService {
  private readonly TEST_DURATION_MS = 20 * 60 * 1000; // 20 minutes

  constructor(
    private prisma: PrismaService,
    private questionBankService: QuestionBankService,
  ) { }

  /**
   * Check if candidate can take a test for a skill bucket
   * Returns status with cooldown info
   */
  async canTakeTest(candidateId: string, skillBucketId: string) {
    // Get skill bucket with test template
    const skillBucket = await this.prisma.skillBucket.findUnique({
      where: { id: skillBucketId },
      include: { TestTemplate: true },
    });

    if (!skillBucket) {
      throw new NotFoundException('Skill bucket not found');
    }

    if (!skillBucket.TestTemplate) {
      throw new BadRequestException('No test configured for this skill');
    }

    // Check for valid passed test (within 7 days)
    const validPassedAttempt = await this.prisma.skillTestAttempt.findFirst({
      where: {
        candidateId,
        skillBucketId,
        isPassed: true,
        validTill: { gt: new Date() },
      },
      orderBy: { attemptedAt: 'desc' },
    });

    if (validPassedAttempt) {
      return {
        canTake: false,
        status: 'ALREADY_PASSED',
        validTill: validPassedAttempt.validTill,
        message: 'You have already passed this test',
      };
    }

    // Check for recent failed test (24-hour cooldown)
    const recentFailedAttempt = await this.prisma.skillTestAttempt.findFirst({
      where: {
        candidateId,
        skillBucketId,
        isPassed: false,
        retestAllowedAt: { gt: new Date() },
      },
      orderBy: { attemptedAt: 'desc' },
    });

    if (recentFailedAttempt) {
      return {
        canTake: false,
        status: 'COOLDOWN',
        retestAllowedAt: recentFailedAttempt.retestAllowedAt,
        message: 'Please wait 24 hours before retaking the test',
      };
    }

    // Check for active session (also clean up expired sessions)
    for (const [sessionId, data] of activeSessions.entries()) {
      // Skip sessions that have expired
      if (Date.now() > data.endsAt) {
        activeSessions.delete(sessionId);
        continue;
      }

      if (
        data.candidateId === candidateId &&
        data.skillBucketId === skillBucketId &&
        data.status === 'ACTIVE'
      ) {
        return {
          canTake: false,
          status: 'IN_PROGRESS',
          sessionId,
          message: 'You have an active test session',
        };
      }
    }

    return {
      canTake: true,
      status: 'AVAILABLE',
      testTemplate: skillBucket.TestTemplate,
      SkillBucket: {
        id: skillBucket.id,
        name: skillBucket.name,
        displayName: skillBucket.displayName,
      },
    };
  }

  /**
   * Start a rapid fire test
   */
  async startTest(userId: string, candidateId: string, skillBucketId: string) {
    // Check if can take test
    const eligibility = await this.canTakeTest(candidateId, skillBucketId);

    if (!eligibility.canTake) {
      // If there's an active session, include the sessionId in the error response
      if (eligibility.sessionId) {
        throw new BadRequestException({
          message: eligibility.message,
          sessionId: eligibility.sessionId,
          status: eligibility.status,
        });
      }
      throw new BadRequestException(eligibility.message);
    }

    const skillBucket = await this.prisma.skillBucket.findUnique({
      where: { id: skillBucketId },
      include: { TestTemplate: true },
    });

    const template = skillBucket!.TestTemplate!;

    // Get random questions for this role
    const questions = await this.questionBankService.getRandomQuestions({
      count: template.questionPoolSize,
      roleType: template.selectionRoleType || skillBucket!.code,
      tags: template.selectionTags,
    });

    if (questions.length === 0) {
      throw new BadRequestException('No questions available for this test');
    }

    // Create session ID
    const sessionId = `rf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    // Store session data
    const sessionData: SessionData = {
      userId,
      candidateId,
      skillBucketId,
      testTemplateId: template.id,
      questionIds: questions.map((q) => q.id),
      answers: {},
      startedAt: now,
      endsAt: now + this.TEST_DURATION_MS,
      status: 'ACTIVE',
    };

    activeSessions.set(sessionId, sessionData);

    // Create database record (no applicationId needed for rapid fire tests)
    await this.prisma.testSession.create({
      data: {
        id: sessionId,
        testTemplateId: template.id,
        status: 'ACTIVE',
        startedAt: new Date(now),
        endsAt: new Date(now + this.TEST_DURATION_MS),
        totalQuestions: questions.length,
        selectedQuestionIds: questions.map((q) => q.id),
      },
    });

    return {
      sessionId,
      testName: template.name,
      duration: template.duration,
      totalQuestionBank: questions.length,
      remainingTime: Math.floor(this.TEST_DURATION_MS / 1000),
      startedAt: new Date(now).toISOString(),
      endsAt: new Date(now + this.TEST_DURATION_MS).toISOString(),
    };
  }

  /**
   * Get test state with all questions
   */
  async getTestState(sessionId: string, userId: string) {
    const session = await this.validateSession(sessionId, userId);

    // Get all questions
    const questions = await this.prisma.questionBank.findMany({
      where: { id: { in: session.questionIds } },
      select: {
        id: true,
        question: true,
        options: true,
        difficulty: true,
        // Don't include correctAnswer!
      },
    });

    // Map to include answer status
    const questionsWithStatus = session.questionIds.map((qId, index) => {
      const question = questions.find((q) => q.id === qId);
      return {
        index: index + 1,
        id: qId,
        question: question?.question,
        options: question?.options,
        difficulty: question?.difficulty,
        answered: session.answers[qId] !== undefined,
        selectedAnswer: session.answers[qId],
      };
    });

    const now = Date.now();
    const remainingTime = Math.max(
      0,
      Math.floor((session.endsAt - now) / 1000),
    );

    // Auto-submit if time expired
    if (remainingTime <= 0 && session.status === 'ACTIVE') {
      await this.submitTest(sessionId, userId, true);
      throw new BadRequestException(
        'Test time has expired. Your answers have been auto-submitted.',
      );
    }

    return {
      sessionId,
      status: session.status,
      totalQuestionBank: session.questionIds.length,
      answeredCount: Object.keys(session.answers).length,
      remainingTime,
      QuestionBank: questionsWithStatus,
    };
  }

  /**
   * Submit answer for a question
   */
  async submitAnswer(
    sessionId: string,
    userId: string,
    questionId: string,
    selectedAnswer: number,
  ) {
    const session = await this.validateSession(sessionId, userId);

    // Check if question belongs to this session
    if (!session.questionIds.includes(questionId)) {
      throw new BadRequestException('Question not part of this test');
    }

    // Validate answer range
    if (selectedAnswer < 0 || selectedAnswer > 3) {
      throw new BadRequestException('Invalid answer selection');
    }

    // Save answer (allows changing - going back)
    session.answers[questionId] = selectedAnswer;

    return {
      success: true,
      answeredCount: Object.keys(session.answers).length,
      totalQuestionBank: session.questionIds.length,
    };
  }

  /**
   * Submit the entire test
   */
  async submitTest(sessionId: string, userId: string, isAutoSubmit = false) {
    const session = activeSessions.get(sessionId);

    if (!session) {
      throw new NotFoundException('Test session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Test already submitted');
    }

    // Calculate score
    const questions = await this.prisma.questionBank.findMany({
      where: { id: { in: session.questionIds } },
      select: { id: true, correctAnswer: true, explanation: true },
    });

    let correctCount = 0;
    const results: any[] = [];

    questions.forEach((q) => {
      const userAnswer = session.answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;

      results.push({
        questionId: q.id,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      });
    });

    const totalQuestions = session.questionIds.length;
    const score =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Get passing criteria from template
    const template = await this.prisma.testTemplate.findUnique({
      where: { id: session.testTemplateId },
    });

    const passingScore = template?.passingCriteria || 70;
    const isPassed = score >= passingScore;

    // Update session status
    session.status = 'SUBMITTED';

    // Create skill test attempt record
    const attemptedAt = new Date();
    await this.prisma.skillTestAttempt.create({
      data: {
        id: crypto.randomUUID(),
        candidateId: session.candidateId,
        skillBucketId: session.skillBucketId,
        isPassed,
        score,
        attemptedAt,
        validTill: isPassed
          ? new Date(attemptedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
          : null,
        retestAllowedAt: isPassed
          ? null
          : new Date(attemptedAt.getTime() + 24 * 60 * 60 * 1000),
        testSessionId: sessionId,
      },
    });

    // Update test session in DB
    await this.prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: isAutoSubmit ? 'AUTO_SUBMITTED' : 'SUBMITTED',
        submittedAt: new Date(),
        score,
        correctAnswers: correctCount,
        isPassed,
      },
    });

    // Clean up session from memory
    activeSessions.delete(sessionId);

    return {
      success: true,
      isAutoSubmit,
      score: Math.round(score * 10) / 10,
      correctCount,
      totalQuestions,
      isPassed,
      passingScore,
      message: isPassed
        ? '🎉 Congratulations! You passed the test!'
        : `You scored ${score.toFixed(1)}%. You need ${passingScore}% to pass. You can retry after 24 hours.`,
      results: isPassed ? undefined : results, // Only show details if failed
      retestAllowedAt: isPassed
        ? null
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Exit test (marks as failed)
   */
  async exitTest(sessionId: string, userId: string) {
    const session = activeSessions.get(sessionId);

    if (!session) {
      throw new NotFoundException('Test session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Test already completed');
    }

    // Mark as failed with 0 score
    session.status = 'EXITED';

    // Create failed attempt
    const attemptedAt = new Date();
    await this.prisma.skillTestAttempt.create({
      data: {
        id: crypto.randomUUID(),
        candidateId: session.candidateId,
        skillBucketId: session.skillBucketId,
        isPassed: false,
        score: 0,
        attemptedAt,
        validTill: null,
        retestAllowedAt: new Date(attemptedAt.getTime() + 24 * 60 * 60 * 1000),
        testSessionId: sessionId,
      },
    });

    // Update test session in DB
    await this.prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: 'EXPIRED', // Using EXPIRED for exited tests
        submittedAt: new Date(),
        score: 0,
        correctAnswers: 0,
        isPassed: false,
      },
    });

    // Clean up
    activeSessions.delete(sessionId);

    return {
      success: true,
      message:
        'Test exited. This counts as a failed attempt. You can retry after 24 hours.',
      retestAllowedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Validate session and check authorization
   * Returns session data or throws appropriate error
   */
  private async validateSession(sessionId: string, userId: string): Promise<SessionData> {
    let session = activeSessions.get(sessionId);

    // If not in memory, try to restore from database
    if (!session) {
      session = await this.restoreSessionFromDb(sessionId, userId);
    }

    if (!session) {
      throw new NotFoundException('Test session not found or expired');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this test');
    }

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Test is no longer active');
    }

    // Check time expiry
    if (Date.now() > session.endsAt) {
      session.status = 'EXPIRED';
      throw new BadRequestException('Test time has expired');
    }

    return session;
  }

  /**
   * Restore session from database if server restarted
   */
  private async restoreSessionFromDb(sessionId: string, userId: string): Promise<SessionData | null> {
    try {
      const dbSession = await this.prisma.testSession.findUnique({
        where: { id: sessionId },
        include: { TestTemplate: { include: { SkillBucket: true } } },
      });

      if (!dbSession) {
        return null;
      }

      // Check if session is active and not expired
      if (dbSession.status !== 'ACTIVE' || !dbSession.endsAt || new Date() > dbSession.endsAt) {
        return null;
      }

      // Get the user's candidate record
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, Candidate: { select: { id: true } } },
      });

      if (!user?.Candidate?.id) {
        return null;
      }

      // Restore session data
      const sessionData: SessionData = {
        userId: userId,
        candidateId: user.Candidate.id,
        skillBucketId: dbSession.TestTemplate?.skillBucketId || '',
        testTemplateId: dbSession.testTemplateId,
        questionIds: dbSession.selectedQuestionIds || [],
        answers: {}, // Answers are lost after restart - user needs to re-answer
        startedAt: dbSession.startedAt?.getTime() || Date.now(),
        endsAt: dbSession.endsAt.getTime(),
        status: 'ACTIVE',
      };

      // Store back in memory
      activeSessions.set(sessionId, sessionData);

      console.log(`Session ${sessionId} restored from database for user ${userId}`);
      return sessionData;
    } catch (error) {
      console.error('Error restoring session from DB:', error);
      return null;
    }
  }

  /**
   * Get test history for a candidate
   */

  async getTestHistory(candidateId: string) {
    const attempts = await this.prisma.skillTestAttempt.findMany({
      where: { candidateId },
      include: {
        SkillBucket: {
          select: { id: true, name: true, displayName: true },
        },
      },
      orderBy: { attemptedAt: 'desc' },
      take: 20,
    });

    return attempts.map((a) => ({
      id: a.id,
      SkillBucket: a.SkillBucket,
      score: a.score,
      isPassed: a.isPassed,
      attemptedAt: a.attemptedAt,
      validTill: a.validTill,
      retestAllowedAt: a.retestAllowedAt,
    }));
  }
}
