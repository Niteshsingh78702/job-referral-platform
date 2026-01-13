"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_service_1 = require("../../prisma/prisma.service");
const constants_1 = require("../../common/constants");
const skill_bucket_service_1 = require("../skill-bucket/skill-bucket.service");
let TestService = TestService_1 = class TestService {
    prisma;
    configService;
    skillBucketService;
    redis = null;
    logger = new common_1.Logger(TestService_1.name);
    sessionStore = new Map();
    constructor(prisma, configService, skillBucketService) {
        this.prisma = prisma;
        this.configService = configService;
        this.skillBucketService = skillBucketService;
        this.initRedis();
    }
    initRedis() {
        const redisUrl = this.configService.get('REDIS_URL');
        const redisHost = this.configService.get('REDIS_HOST');
        if (redisUrl || redisHost) {
            try {
                if (redisUrl) {
                    this.redis = new ioredis_1.default(redisUrl);
                }
                else {
                    this.redis = new ioredis_1.default({
                        host: redisHost || 'localhost',
                        port: this.configService.get('REDIS_PORT', 6379),
                        password: this.configService.get('REDIS_PASSWORD'),
                    });
                }
                this.redis.on('error', (err) => {
                    this.logger.warn(`Redis error: ${err.message}. Using in-memory storage.`);
                    this.redis = null;
                });
            }
            catch {
                this.logger.warn('Redis not available. Test sessions will use in-memory storage.');
            }
        }
        else {
            this.logger.log('Redis not configured. Test sessions will use in-memory storage.');
        }
    }
    async redisSet(key, value, pxMs) {
        if (this.redis) {
            try {
                if (pxMs) {
                    await this.redis.set(key, value, 'PX', pxMs);
                }
                else {
                    await this.redis.set(key, value);
                }
                return;
            }
            catch {
            }
        }
        this.sessionStore.set(key, { data: value, expiry: pxMs ? Date.now() + pxMs : Date.now() + 3600000 });
    }
    async redisGet(key) {
        if (this.redis) {
            try {
                return await this.redis.get(key);
            }
            catch {
            }
        }
        const stored = this.sessionStore.get(key);
        if (!stored)
            return null;
        if (Date.now() > stored.expiry) {
            this.sessionStore.delete(key);
            return null;
        }
        return stored.data;
    }
    async redisDel(key) {
        if (this.redis) {
            try {
                await this.redis.del(key);
            }
            catch {
            }
        }
        this.sessionStore.delete(key);
    }
    async createTest(dto) {
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
    async addQuestion(testId, dto) {
        const test = await this.prisma.test.findUnique({
            where: { id: testId },
            include: { questions: true },
        });
        if (!test) {
            throw new common_1.NotFoundException('Test not found');
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
    async getTestById(testId) {
        const test = await this.prisma.test.findUnique({
            where: { id: testId },
            include: {
                questions: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
        if (!test) {
            throw new common_1.NotFoundException('Test not found');
        }
        return test;
    }
    async startTest(applicationId, userId) {
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                candidate: { include: { user: true } },
                job: { include: { test: { include: { questions: true } } } },
                testSessions: true,
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        if (application.candidate.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized to access this application');
        }
        if (application.status !== constants_1.ApplicationStatus.TEST_PENDING) {
            throw new common_1.BadRequestException('Test not available for this application');
        }
        if (!application.job.test) {
            throw new common_1.BadRequestException('No test configured for this job');
        }
        const existingSession = application.testSessions.find((s) => s.status !== constants_1.TestSessionStatus.EXPIRED);
        if (existingSession) {
            if (existingSession.status === constants_1.TestSessionStatus.ACTIVE) {
                return this.getTestSession(existingSession.id, userId);
            }
            throw new common_1.BadRequestException('Test already attempted for this application');
        }
        const test = application.job.test;
        const now = Date.now();
        const endsAt = now + test.duration * 60 * 1000;
        let questionOrder = test.questions.map((_, i) => i);
        if (test.shuffleQuestions) {
            questionOrder = this.shuffleArray([...questionOrder]);
        }
        const session = await this.prisma.testSession.create({
            data: {
                applicationId,
                testId: test.id,
                status: constants_1.TestSessionStatus.ACTIVE,
                startedAt: new Date(),
                endsAt: new Date(endsAt),
                totalQuestions: test.questions.length,
                questionOrder,
            },
        });
        const sessionData = {
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
        await this.redisSet(constants_1.REDIS_KEYS.TEST_SESSION(session.id), JSON.stringify(sessionData), endsAt - now + 60000);
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: constants_1.AuditAction.TEST_START,
                entityType: 'TestSession',
                entityId: session.id,
                metadata: { applicationId, testId: test.id },
            },
        });
        return this.getTestSession(session.id, userId);
    }
    async getTestSession(sessionId, userId) {
        const redisData = await this.redisGet(constants_1.REDIS_KEYS.TEST_SESSION(sessionId));
        if (!redisData) {
            throw new common_1.BadRequestException('Test session expired or not found');
        }
        const sessionData = JSON.parse(redisData);
        if (sessionData.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized to access this session');
        }
        if (Date.now() > sessionData.endsAt) {
            await this.autoSubmitTest(sessionId);
            throw new common_1.BadRequestException('Test time has expired');
        }
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
                            },
                        },
                    },
                },
                answers: true,
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        if (!session.test) {
            throw new common_1.BadRequestException('This is a rapid-fire test session. Use the rapid-fire endpoints.');
        }
        const orderedQuestions = sessionData.questionOrder.map((i) => session.test.questions[i]);
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
    async submitAnswer(sessionId, userId, dto) {
        const redisData = await this.redisGet(constants_1.REDIS_KEYS.TEST_SESSION(sessionId));
        if (!redisData) {
            throw new common_1.BadRequestException('Test session expired or not found');
        }
        const sessionData = JSON.parse(redisData);
        if (sessionData.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (Date.now() > sessionData.endsAt) {
            await this.autoSubmitTest(sessionId);
            throw new common_1.BadRequestException('Test time has expired');
        }
        const question = await this.prisma.testQuestion.findFirst({
            where: {
                id: dto.questionId,
                testId: sessionData.testId,
            },
        });
        if (!question) {
            throw new common_1.BadRequestException('Invalid question');
        }
        if (dto.selectedAnswer < 0 || dto.selectedAnswer >= question.options.length) {
            throw new common_1.BadRequestException('Invalid answer option');
        }
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
    async submitTest(sessionId, userId) {
        const session = await this.prisma.testSession.findUnique({
            where: { id: sessionId },
            include: {
                application: { include: { candidate: true } },
                test: true,
                answers: true,
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        if (session.application && session.application.candidate.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (session.status !== constants_1.TestSessionStatus.ACTIVE) {
            throw new common_1.BadRequestException('Test already submitted');
        }
        return this.processTestSubmission(session, false);
    }
    async logTestEvent(sessionId, userId, dto) {
        const redisData = await this.redisGet(constants_1.REDIS_KEYS.TEST_SESSION(sessionId));
        if (!redisData) {
            return { success: false };
        }
        const sessionData = JSON.parse(redisData);
        if (sessionData.userId !== userId) {
            return { success: false };
        }
        await this.prisma.testEvent.create({
            data: {
                sessionId,
                eventType: dto.eventType,
                eventData: dto.eventData,
            },
        });
        if (dto.eventType === 'TAB_SWITCH') {
            sessionData.tabSwitchCount++;
            await this.redisSet(constants_1.REDIS_KEYS.TEST_SESSION(sessionId), JSON.stringify(sessionData));
            await this.prisma.auditLog.create({
                data: {
                    userId,
                    action: constants_1.AuditAction.TEST_TAB_SWITCH,
                    entityType: 'TestSession',
                    entityId: sessionId,
                    metadata: { count: sessionData.tabSwitchCount },
                },
            });
            if (sessionData.tabSwitchCount >= sessionData.maxTabSwitches) {
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
    async autoSubmitTest(sessionId) {
        const session = await this.prisma.testSession.findUnique({
            where: { id: sessionId },
            include: {
                application: { include: { candidate: true } },
                test: true,
                answers: true,
            },
        });
        if (!session || session.status !== constants_1.TestSessionStatus.ACTIVE) {
            return;
        }
        return this.processTestSubmission(session, true);
    }
    async processTestSubmission(session, isAutoSubmit) {
        const correctAnswers = session.answers.filter((a) => a.isCorrect).length;
        const score = (correctAnswers / session.totalQuestions) * 100;
        const isPassed = score >= session.test.passingScore;
        await this.prisma.testSession.update({
            where: { id: session.id },
            data: {
                status: isAutoSubmit
                    ? constants_1.TestSessionStatus.AUTO_SUBMITTED
                    : constants_1.TestSessionStatus.SUBMITTED,
                submittedAt: new Date(),
                score,
                correctAnswers,
                isPassed,
            },
        });
        const newStatus = isPassed
            ? constants_1.ApplicationStatus.TEST_PASSED
            : constants_1.ApplicationStatus.TEST_FAILED;
        await this.prisma.jobApplication.update({
            where: { id: session.applicationId },
            data: {
                status: newStatus,
                testScore: score,
                testPassedAt: isPassed ? new Date() : null,
            },
        });
        try {
            const application = await this.prisma.jobApplication.findUnique({
                where: { id: session.applicationId },
                include: {
                    candidate: true,
                    job: {
                        include: {
                            skillBucket: true,
                        },
                    },
                },
            });
            if (application?.job?.skillBucketId) {
                await this.skillBucketService.recordSkillTestAttempt(application.candidate.id, application.job.skillBucketId, isPassed, score, session.id);
                this.logger.log(`Recorded skill test attempt for candidate ${application.candidate.id} ` +
                    `on skill bucket ${application.job.skillBucketId}: passed=${isPassed}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to record skill test attempt:', error);
        }
        if (isPassed) {
            await this.prisma.referral.create({
                data: {
                    applicationId: session.applicationId,
                    type: 'HR_DIRECT',
                    status: constants_1.ReferralStatus.PENDING,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
        }
        await this.redisDel(constants_1.REDIS_KEYS.TEST_SESSION(session.id));
        await this.prisma.auditLog.create({
            data: {
                userId: session.application.candidate.userId,
                action: constants_1.AuditAction.TEST_SUBMIT,
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
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};
exports.TestService = TestService;
exports.TestService = TestService = TestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        skill_bucket_service_1.SkillBucketService])
], TestService);
//# sourceMappingURL=test.service.js.map