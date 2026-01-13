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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RapidFireTestService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const question_bank_service_1 = require("../question-bank/question-bank.service");
const activeSessions = new Map();
let RapidFireTestService = class RapidFireTestService {
    prisma;
    questionBankService;
    TEST_DURATION_MS = 20 * 60 * 1000;
    constructor(prisma, questionBankService) {
        this.prisma = prisma;
        this.questionBankService = questionBankService;
    }
    async canTakeTest(candidateId, skillBucketId) {
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: { id: skillBucketId },
            include: { testTemplate: true },
        });
        if (!skillBucket) {
            throw new common_1.NotFoundException('Skill bucket not found');
        }
        if (!skillBucket.testTemplateId) {
            throw new common_1.BadRequestException('No test configured for this skill');
        }
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
        for (const [sessionId, data] of activeSessions.entries()) {
            if (data.candidateId === candidateId && data.skillBucketId === skillBucketId && data.status === 'ACTIVE') {
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
            testTemplate: skillBucket.testTemplate,
            skillBucket: {
                id: skillBucket.id,
                name: skillBucket.name,
                displayName: skillBucket.displayName,
            },
        };
    }
    async startTest(userId, candidateId, skillBucketId) {
        const eligibility = await this.canTakeTest(candidateId, skillBucketId);
        if (!eligibility.canTake) {
            throw new common_1.BadRequestException(eligibility.message);
        }
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: { id: skillBucketId },
            include: { testTemplate: true },
        });
        const template = skillBucket.testTemplate;
        const questions = await this.questionBankService.getRandomQuestions({
            count: template.questionPoolSize,
            roleType: template.selectionRoleType || skillBucket.code,
            tags: template.selectionTags,
        });
        if (questions.length === 0) {
            throw new common_1.BadRequestException('No questions available for this test');
        }
        const sessionId = `rf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        const sessionData = {
            userId,
            candidateId,
            skillBucketId,
            testTemplateId: template.id,
            questionIds: questions.map(q => q.id),
            answers: {},
            startedAt: now,
            endsAt: now + this.TEST_DURATION_MS,
            status: 'ACTIVE',
        };
        activeSessions.set(sessionId, sessionData);
        await this.prisma.testSession.create({
            data: {
                id: sessionId,
                testTemplateId: template.id,
                status: 'ACTIVE',
                startedAt: new Date(now),
                endsAt: new Date(now + this.TEST_DURATION_MS),
                totalQuestions: questions.length,
                selectedQuestionIds: questions.map(q => q.id),
            },
        });
        return {
            sessionId,
            testName: template.name,
            duration: template.duration,
            totalQuestions: questions.length,
            remainingTime: Math.floor(this.TEST_DURATION_MS / 1000),
            startedAt: new Date(now).toISOString(),
            endsAt: new Date(now + this.TEST_DURATION_MS).toISOString(),
        };
    }
    async getTestState(sessionId, userId) {
        const session = this.validateSession(sessionId, userId);
        const questions = await this.prisma.questionBank.findMany({
            where: { id: { in: session.questionIds } },
            select: {
                id: true,
                question: true,
                options: true,
                difficulty: true,
            },
        });
        const questionsWithStatus = session.questionIds.map((qId, index) => {
            const question = questions.find(q => q.id === qId);
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
        const remainingTime = Math.max(0, Math.floor((session.endsAt - now) / 1000));
        if (remainingTime <= 0 && session.status === 'ACTIVE') {
            await this.submitTest(sessionId, userId, true);
            throw new common_1.BadRequestException('Test time has expired. Your answers have been auto-submitted.');
        }
        return {
            sessionId,
            status: session.status,
            totalQuestions: session.questionIds.length,
            answeredCount: Object.keys(session.answers).length,
            remainingTime,
            questions: questionsWithStatus,
        };
    }
    async submitAnswer(sessionId, userId, questionId, selectedAnswer) {
        const session = this.validateSession(sessionId, userId);
        if (!session.questionIds.includes(questionId)) {
            throw new common_1.BadRequestException('Question not part of this test');
        }
        if (selectedAnswer < 0 || selectedAnswer > 3) {
            throw new common_1.BadRequestException('Invalid answer selection');
        }
        session.answers[questionId] = selectedAnswer;
        return {
            success: true,
            answeredCount: Object.keys(session.answers).length,
            totalQuestions: session.questionIds.length,
        };
    }
    async submitTest(sessionId, userId, isAutoSubmit = false) {
        const session = activeSessions.get(sessionId);
        if (!session) {
            throw new common_1.NotFoundException('Test session not found');
        }
        if (session.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (session.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('Test already submitted');
        }
        const questions = await this.prisma.questionBank.findMany({
            where: { id: { in: session.questionIds } },
            select: { id: true, correctAnswer: true, explanation: true },
        });
        let correctCount = 0;
        const results = [];
        questions.forEach(q => {
            const userAnswer = session.answers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            if (isCorrect)
                correctCount++;
            results.push({
                questionId: q.id,
                userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect,
                explanation: q.explanation,
            });
        });
        const totalQuestions = session.questionIds.length;
        const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
        const template = await this.prisma.testTemplate.findUnique({
            where: { id: session.testTemplateId },
        });
        const passingScore = template?.passingCriteria || 70;
        const isPassed = score >= passingScore;
        session.status = 'SUBMITTED';
        const attemptedAt = new Date();
        await this.prisma.skillTestAttempt.create({
            data: {
                candidateId: session.candidateId,
                skillBucketId: session.skillBucketId,
                isPassed,
                score,
                attemptedAt,
                validTill: isPassed ? new Date(attemptedAt.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
                retestAllowedAt: isPassed ? null : new Date(attemptedAt.getTime() + 24 * 60 * 60 * 1000),
                testSessionId: sessionId,
            },
        });
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
            results: isPassed ? undefined : results,
            retestAllowedAt: isPassed ? null : new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
    }
    async exitTest(sessionId, userId) {
        const session = activeSessions.get(sessionId);
        if (!session) {
            throw new common_1.NotFoundException('Test session not found');
        }
        if (session.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (session.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('Test already completed');
        }
        session.status = 'EXITED';
        const attemptedAt = new Date();
        await this.prisma.skillTestAttempt.create({
            data: {
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
        await this.prisma.testSession.update({
            where: { id: sessionId },
            data: {
                status: 'EXPIRED',
                submittedAt: new Date(),
                score: 0,
                correctAnswers: 0,
                isPassed: false,
            },
        });
        activeSessions.delete(sessionId);
        return {
            success: true,
            message: 'Test exited. This counts as a failed attempt. You can retry after 24 hours.',
            retestAllowedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
    }
    validateSession(sessionId, userId) {
        const session = activeSessions.get(sessionId);
        if (!session) {
            throw new common_1.NotFoundException('Test session not found or expired');
        }
        if (session.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized to access this test');
        }
        if (session.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('Test is no longer active');
        }
        if (Date.now() > session.endsAt) {
            session.status = 'EXPIRED';
            throw new common_1.BadRequestException('Test time has expired');
        }
        return session;
    }
    async getTestHistory(candidateId) {
        const attempts = await this.prisma.skillTestAttempt.findMany({
            where: { candidateId },
            include: {
                skillBucket: {
                    select: { id: true, name: true, displayName: true },
                },
            },
            orderBy: { attemptedAt: 'desc' },
            take: 20,
        });
        return attempts.map(a => ({
            id: a.id,
            skillBucket: a.skillBucket,
            score: a.score,
            isPassed: a.isPassed,
            attemptedAt: a.attemptedAt,
            validTill: a.validTill,
            retestAllowedAt: a.retestAllowedAt,
        }));
    }
};
exports.RapidFireTestService = RapidFireTestService;
exports.RapidFireTestService = RapidFireTestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        question_bank_service_1.QuestionBankService])
], RapidFireTestService);
//# sourceMappingURL=rapid-fire.service.js.map