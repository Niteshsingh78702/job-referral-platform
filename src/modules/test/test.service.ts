import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestDto, AddQuestionDto, SubmitAnswerDto, TestEventDto } from './dto';
import {
    TestSessionStatus,
    ApplicationStatus,
    ReferralStatus,
    AuditAction,
    REDIS_KEYS,
} from '../../common/constants';

interface TestSessionData {
    sessionId: string;
    applicationId: string;
    testId: string;
    userId: string;
    startedAt: number;
    endsAt: number;
    questionOrder: number[];
    tabSwitchCount: number;
    maxTabSwitches: number;
}

@Injectable()
export class TestService {
    private redis: Redis;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.redis = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
        });
    }

    // ===========================================
    // ADMIN: Test Management
    // ===========================================

    async createTest(dto: CreateTestDto) {
        return this.prisma.test.create({
            data: {
                title: dto.title,
                description: dto.description,
                duration: dto.duration || 30,
                passingScore: dto.passingScore || 70,
                totalQuestions: dto.totalQuestions || 20,
                shuffleQuestions: dto.shuffleQuestions ?? true,
                maxTabSwitches: dto.maxTabSwitches || 2,
                difficulty: dto.difficulty || 'MEDIUM',
            },
        });
    }

    async addQuestion(testId: string, dto: AddQuestionDto) {
        const test = await this.prisma.test.findUnique({
            where: { id: testId },
            include: { questions: true },
        });

        if (!test) {
            throw new NotFoundException('Test not found');
        }

        return this.prisma.testQuestion.create({
            data: {
                testId,
                question: dto.question,
                options: dto.options,
                correctAnswer: dto.correctAnswer,
                explanation: dto.explanation,
                points: dto.points || 1,
                orderIndex: test.questions.length,
            },
        });
    }

    async getTestById(testId: string) {
        const test = await this.prisma.test.findUnique({
            where: { id: testId },
            include: {
                questions: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });

        if (!test) {
            throw new NotFoundException('Test not found');
        }

        return test;
    }

    // ===========================================
    // CANDIDATE: Test Taking
    // ===========================================

    async startTest(applicationId: string, userId: string) {
        // Verify application exists and is in correct state
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                candidate: { include: { user: true } },
                job: { include: { test: { include: { questions: true } } } },
                testSessions: true,
            },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.candidate.userId !== userId) {
            throw new ForbiddenException('Not authorized to access this application');
        }

        if (application.status !== ApplicationStatus.TEST_PENDING) {
            throw new BadRequestException('Test not available for this application');
        }

        if (!application.job.test) {
            throw new BadRequestException('No test configured for this job');
        }

        // Check if already has an active or completed session
        const existingSession = application.testSessions.find(
            (s) => s.status !== TestSessionStatus.EXPIRED,
        );

        if (existingSession) {
            if (existingSession.status === TestSessionStatus.ACTIVE) {
                // Return existing session (resume)
                return this.getTestSession(existingSession.id, userId);
            }
            throw new BadRequestException('Test already attempted for this application');
        }

        const test = application.job.test;
        const now = Date.now();
        const endsAt = now + test.duration * 60 * 1000;

        // Shuffle questions if enabled
        let questionOrder = test.questions.map((_, i) => i);
        if (test.shuffleQuestions) {
            questionOrder = this.shuffleArray([...questionOrder]);
        }

        // Create test session in database
        const session = await this.prisma.testSession.create({
            data: {
                applicationId,
                testId: test.id,
                status: TestSessionStatus.ACTIVE,
                startedAt: new Date(),
                endsAt: new Date(endsAt),
                totalQuestions: test.questions.length,
                questionOrder,
            },
        });

        // Store session in Redis with TTL
        const sessionData: TestSessionData = {
            sessionId: session.id,
            applicationId,
            testId: test.id,
            userId,
            startedAt: now,
            endsAt,
            questionOrder,
            tabSwitchCount: 0,
            maxTabSwitches: test.maxTabSwitches,
        };

        await this.redis.set(
            REDIS_KEYS.TEST_SESSION(session.id),
            JSON.stringify(sessionData),
            'PX',
            endsAt - now + 60000, // Add 1 minute buffer
        );

        // Log audit
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: AuditAction.TEST_START,
                entityType: 'TestSession',
                entityId: session.id,
                metadata: { applicationId, testId: test.id },
            },
        });

        return this.getTestSession(session.id, userId);
    }

    async getTestSession(sessionId: string, userId: string) {
        // Get from Redis first
        const redisData = await this.redis.get(REDIS_KEYS.TEST_SESSION(sessionId));

        if (!redisData) {
            // Session might have expired
            throw new BadRequestException('Test session expired or not found');
        }

        const sessionData: TestSessionData = JSON.parse(redisData);

        if (sessionData.userId !== userId) {
            throw new ForbiddenException('Not authorized to access this session');
        }

        // Check if time expired
        if (Date.now() > sessionData.endsAt) {
            await this.autoSubmitTest(sessionId);
            throw new BadRequestException('Test time has expired');
        }

        // Get session with questions
        const session = await this.prisma.testSession.findUnique({
            where: { id: sessionId },
            include: {
                test: {
                    include: {
                        questions: {
                            orderBy: { orderIndex: 'asc' },
                            select: {
                                id: true,
                                question: true,
                                options: true,
                                points: true,
                                // Exclude correctAnswer
                            },
                        },
                    },
                },
                answers: true,
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        // Reorder questions based on shuffled order
        const orderedQuestions = sessionData.questionOrder.map(
            (i) => session.test.questions[i],
        );

        return {
            sessionId: session.id,
            testTitle: session.test.title,
            duration: session.test.duration,
            totalQuestions: session.totalQuestions,
            remainingTime: Math.max(0, Math.floor((sessionData.endsAt - Date.now()) / 1000)),
            questions: orderedQuestions,
            answers: session.answers.map((a) => ({
                questionId: a.questionId,
                selectedAnswer: a.selectedAnswer,
            })),
            tabSwitchCount: sessionData.tabSwitchCount,
            maxTabSwitches: sessionData.maxTabSwitches,
        };
    }

    async submitAnswer(sessionId: string, userId: string, dto: SubmitAnswerDto) {
        // Validate session from Redis
        const redisData = await this.redis.get(REDIS_KEYS.TEST_SESSION(sessionId));

        if (!redisData) {
            throw new BadRequestException('Test session expired or not found');
        }

        const sessionData: TestSessionData = JSON.parse(redisData);

        if (sessionData.userId !== userId) {
            throw new ForbiddenException('Not authorized');
        }

        if (Date.now() > sessionData.endsAt) {
            await this.autoSubmitTest(sessionId);
            throw new BadRequestException('Test time has expired');
        }

        // Verify question belongs to this test
        const question = await this.prisma.testQuestion.findFirst({
            where: {
                id: dto.questionId,
                testId: sessionData.testId,
            },
        });

        if (!question) {
            throw new BadRequestException('Invalid question');
        }

        // Check if answer is valid
        if (dto.selectedAnswer < 0 || dto.selectedAnswer >= (question.options as any[]).length) {
            throw new BadRequestException('Invalid answer option');
        }

        // Save or update answer
        const isCorrect = dto.selectedAnswer === question.correctAnswer;

        await this.prisma.testAnswer.upsert({
            where: {
                sessionId_questionId: {
                    sessionId,
                    questionId: dto.questionId,
                },
            },
            create: {
                sessionId,
                questionId: dto.questionId,
                selectedAnswer: dto.selectedAnswer,
                isCorrect,
            },
            update: {
                selectedAnswer: dto.selectedAnswer,
                isCorrect,
                answeredAt: new Date(),
            },
        });

        return { success: true, questionId: dto.questionId };
    }

    async submitTest(sessionId: string, userId: string) {
        // Validate session
        const session = await this.prisma.testSession.findUnique({
            where: { id: sessionId },
            include: {
                application: { include: { candidate: true } },
                test: true,
                answers: true,
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.application.candidate.userId !== userId) {
            throw new ForbiddenException('Not authorized');
        }

        if (session.status !== TestSessionStatus.ACTIVE) {
            throw new BadRequestException('Test already submitted');
        }

        return this.processTestSubmission(session, false);
    }

    async logTestEvent(sessionId: string, userId: string, dto: TestEventDto) {
        // Get session from Redis
        const redisData = await this.redis.get(REDIS_KEYS.TEST_SESSION(sessionId));

        if (!redisData) {
            return { success: false };
        }

        const sessionData: TestSessionData = JSON.parse(redisData);

        if (sessionData.userId !== userId) {
            return { success: false };
        }

        // Log event
        await this.prisma.testEvent.create({
            data: {
                sessionId,
                eventType: dto.eventType,
                eventData: dto.eventData,
            },
        });

        // Handle tab switch
        if (dto.eventType === 'TAB_SWITCH') {
            sessionData.tabSwitchCount++;

            // Update Redis
            await this.redis.set(
                REDIS_KEYS.TEST_SESSION(sessionId),
                JSON.stringify(sessionData),
                'KEEPTTL',
            );

            // Log audit
            await this.prisma.auditLog.create({
                data: {
                    userId,
                    action: AuditAction.TEST_TAB_SWITCH,
                    entityType: 'TestSession',
                    entityId: sessionId,
                    metadata: { count: sessionData.tabSwitchCount },
                },
            });

            // Check if exceeds max
            if (sessionData.tabSwitchCount >= sessionData.maxTabSwitches) {
                // Auto-submit test
                await this.autoSubmitTest(sessionId);
                return {
                    success: true,
                    autoSubmitted: true,
                    message: 'Test auto-submitted due to too many tab switches',
                };
            }

            return {
                success: true,
                warning: true,
                remainingWarnings: sessionData.maxTabSwitches - sessionData.tabSwitchCount,
            };
        }

        return { success: true };
    }

    // ===========================================
    // INTERNAL HELPERS
    // ===========================================

    private async autoSubmitTest(sessionId: string) {
        const session = await this.prisma.testSession.findUnique({
            where: { id: sessionId },
            include: {
                application: { include: { candidate: true } },
                test: true,
                answers: true,
            },
        });

        if (!session || session.status !== TestSessionStatus.ACTIVE) {
            return;
        }

        return this.processTestSubmission(session, true);
    }

    private async processTestSubmission(session: any, isAutoSubmit: boolean) {
        const correctAnswers = session.answers.filter((a: any) => a.isCorrect).length;
        const score = (correctAnswers / session.totalQuestions) * 100;
        const isPassed = score >= session.test.passingScore;

        // Update session
        await this.prisma.testSession.update({
            where: { id: session.id },
            data: {
                status: isAutoSubmit
                    ? TestSessionStatus.AUTO_SUBMITTED
                    : TestSessionStatus.SUBMITTED,
                submittedAt: new Date(),
                score,
                correctAnswers,
                isPassed,
            },
        });

        // Update application status
        const newStatus = isPassed
            ? ApplicationStatus.TEST_PASSED
            : ApplicationStatus.TEST_FAILED;

        await this.prisma.jobApplication.update({
            where: { id: session.applicationId },
            data: {
                status: newStatus,
                testScore: score,
                testPassedAt: isPassed ? new Date() : null,
            },
        });

        // If passed, create referral entry
        if (isPassed) {
            await this.prisma.referral.create({
                data: {
                    applicationId: session.applicationId,
                    type: 'HR_DIRECT', // Default to HR, can be changed to employee
                    status: ReferralStatus.PENDING,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                },
            });
        }

        // Clear Redis
        await this.redis.del(REDIS_KEYS.TEST_SESSION(session.id));

        // Log audit
        await this.prisma.auditLog.create({
            data: {
                userId: session.application.candidate.userId,
                action: AuditAction.TEST_SUBMIT,
                entityType: 'TestSession',
                entityId: session.id,
                metadata: { score, isPassed, isAutoSubmit },
            },
        });

        return {
            success: true,
            sessionId: session.id,
            score,
            isPassed,
            correctAnswers,
            totalQuestions: session.totalQuestions,
            isAutoSubmit,
        };
    }

    private shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
