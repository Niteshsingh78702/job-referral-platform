"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RapidFireTestService", {
    enumerable: true,
    get: function() {
        return RapidFireTestService;
    }
});
const _common = require("@nestjs/common");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _prismaservice = require("../../prisma/prisma.service");
const _questionbankservice = require("../question-bank/question-bank.service");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
// In-memory session storage (in production, use Redis)
const activeSessions = new Map();
let RapidFireTestService = class RapidFireTestService {
    /**
   * Check if candidate can take a test for a skill bucket
   * Returns status with cooldown info
   */ async canTakeTest(candidateId, skillBucketId) {
        // Get skill bucket with test template
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: {
                id: skillBucketId
            },
            include: {
                TestTemplate: true
            }
        });
        if (!skillBucket) {
            throw new _common.NotFoundException('Skill bucket not found');
        }
        if (!skillBucket.TestTemplate) {
            throw new _common.BadRequestException('No test configured for this skill');
        }
        // Check for valid passed test (within 7 days)
        const validPassedAttempt = await this.prisma.skillTestAttempt.findFirst({
            where: {
                candidateId,
                skillBucketId,
                isPassed: true,
                validTill: {
                    gt: new Date()
                }
            },
            orderBy: {
                attemptedAt: 'desc'
            }
        });
        if (validPassedAttempt) {
            return {
                canTake: false,
                status: 'ALREADY_PASSED',
                validTill: validPassedAttempt.validTill,
                message: 'You have already passed this test'
            };
        }
        // Check for recent failed test (24-hour cooldown)
        const recentFailedAttempt = await this.prisma.skillTestAttempt.findFirst({
            where: {
                candidateId,
                skillBucketId,
                isPassed: false,
                retestAllowedAt: {
                    gt: new Date()
                }
            },
            orderBy: {
                attemptedAt: 'desc'
            }
        });
        if (recentFailedAttempt) {
            return {
                canTake: false,
                status: 'COOLDOWN',
                retestAllowedAt: recentFailedAttempt.retestAllowedAt,
                message: 'Please wait 24 hours before retaking the test'
            };
        }
        // Check for active session (also clean up expired sessions)
        for (const [sessionId, data] of activeSessions.entries()){
            // Skip sessions that have expired
            if (Date.now() > data.endsAt) {
                activeSessions.delete(sessionId);
                continue;
            }
            if (data.candidateId === candidateId && data.skillBucketId === skillBucketId && data.status === 'ACTIVE') {
                return {
                    canTake: false,
                    status: 'IN_PROGRESS',
                    sessionId,
                    message: 'You have an active test session'
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
                displayName: skillBucket.displayName
            }
        };
    }
    /**
   * Start a rapid fire test
   */ async startTest(userId, candidateId, skillBucketId) {
        // Ensure candidateId is valid - look up from DB if not provided
        let resolvedCandidateId = candidateId;
        if (!resolvedCandidateId) {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: userId
                },
                select: {
                    Candidate: {
                        select: {
                            id: true
                        }
                    }
                }
            });
            resolvedCandidateId = user?.Candidate?.id;
            if (!resolvedCandidateId) {
                throw new _common.BadRequestException('Candidate profile not found. Please complete your profile first.');
            }
            console.log(`Resolved candidateId ${resolvedCandidateId} from database for user ${userId}`);
        }
        // Check if can take test
        const eligibility = await this.canTakeTest(resolvedCandidateId, skillBucketId);
        if (!eligibility.canTake) {
            // If there's an active session, include the sessionId in the error response
            if (eligibility.sessionId) {
                throw new _common.BadRequestException({
                    message: eligibility.message,
                    sessionId: eligibility.sessionId,
                    status: eligibility.status
                });
            }
            throw new _common.BadRequestException(eligibility.message);
        }
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: {
                id: skillBucketId
            },
            include: {
                TestTemplate: true
            }
        });
        const template = skillBucket.TestTemplate;
        // Get random questions for this role
        const questions = await this.questionBankService.getRandomQuestions({
            count: template.questionPoolSize,
            roleType: template.selectionRoleType || skillBucket.code,
            tags: template.selectionTags
        });
        if (questions.length === 0) {
            throw new _common.BadRequestException('No questions available for this test');
        }
        // Create session ID
        const sessionId = `rf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        // Store session data
        const sessionData = {
            userId,
            candidateId: resolvedCandidateId,
            skillBucketId,
            testTemplateId: template.id,
            questionIds: questions.map((q)=>q.id),
            answers: {},
            startedAt: now,
            endsAt: now + this.TEST_DURATION_MS,
            status: 'ACTIVE'
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
                selectedQuestionIds: questions.map((q)=>q.id)
            }
        });
        return {
            sessionId,
            testName: template.name,
            duration: template.duration,
            totalQuestionBank: questions.length,
            remainingTime: Math.floor(this.TEST_DURATION_MS / 1000),
            startedAt: new Date(now).toISOString(),
            endsAt: new Date(now + this.TEST_DURATION_MS).toISOString()
        };
    }
    /**
   * Get test state with all questions
   */ async getTestState(sessionId, userId) {
        const session = await this.validateSession(sessionId, userId);
        // Get all questions
        const questions = await this.prisma.questionBank.findMany({
            where: {
                id: {
                    in: session.questionIds
                }
            },
            select: {
                id: true,
                question: true,
                options: true,
                difficulty: true
            }
        });
        // Map to include answer status
        const questionsWithStatus = session.questionIds.map((qId, index)=>{
            const question = questions.find((q)=>q.id === qId);
            return {
                index: index + 1,
                id: qId,
                question: question?.question,
                options: question?.options,
                difficulty: question?.difficulty,
                answered: session.answers[qId] !== undefined,
                selectedAnswer: session.answers[qId]
            };
        });
        const now = Date.now();
        const remainingTime = Math.max(0, Math.floor((session.endsAt - now) / 1000));
        // Auto-submit if time expired
        if (remainingTime <= 0 && session.status === 'ACTIVE') {
            await this.submitTest(sessionId, userId, true);
            throw new _common.BadRequestException('Test time has expired. Your answers have been auto-submitted.');
        }
        return {
            sessionId,
            status: session.status,
            totalQuestionBank: session.questionIds.length,
            answeredCount: Object.keys(session.answers).length,
            remainingTime,
            QuestionBank: questionsWithStatus
        };
    }
    /**
   * Submit answer for a question
   */ async submitAnswer(sessionId, userId, questionId, selectedAnswer) {
        const session = await this.validateSession(sessionId, userId);
        // Check if question belongs to this session
        if (!session.questionIds.includes(questionId)) {
            throw new _common.BadRequestException('Question not part of this test');
        }
        // Validate answer range
        if (selectedAnswer < 0 || selectedAnswer > 3) {
            throw new _common.BadRequestException('Invalid answer selection');
        }
        // Save answer (allows changing - going back)
        session.answers[questionId] = selectedAnswer;
        return {
            success: true,
            answeredCount: Object.keys(session.answers).length,
            totalQuestionBank: session.questionIds.length
        };
    }
    /**
   * Submit the entire test
   */ async submitTest(sessionId, userId, isAutoSubmit = false) {
        let session = activeSessions.get(sessionId);
        // Try to restore from DB if not in memory
        if (!session) {
            session = await this.restoreSessionFromDb(sessionId, userId);
        }
        if (!session) {
            throw new _common.NotFoundException('Test session not found');
        }
        if (session.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized');
        }
        if (session.status !== 'ACTIVE') {
            throw new _common.BadRequestException('Test already submitted');
        }
        // Calculate score
        const questions = await this.prisma.questionBank.findMany({
            where: {
                id: {
                    in: session.questionIds
                }
            },
            select: {
                id: true,
                correctAnswer: true,
                explanation: true
            }
        });
        let correctCount = 0;
        const results = [];
        questions.forEach((q)=>{
            const userAnswer = session.answers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            if (isCorrect) correctCount++;
            results.push({
                questionId: q.id,
                userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect,
                explanation: q.explanation
            });
        });
        const totalQuestions = session.questionIds.length;
        const score = totalQuestions > 0 ? correctCount / totalQuestions * 100 : 0;
        // Get passing criteria from template
        const template = await this.prisma.testTemplate.findUnique({
            where: {
                id: session.testTemplateId
            }
        });
        const passingScore = template?.passingCriteria || 70;
        const isPassed = score >= passingScore;
        // Update session status
        session.status = 'SUBMITTED';
        // Create skill test attempt record
        const attemptedAt = new Date();
        await this.prisma.skillTestAttempt.create({
            data: {
                id: _crypto.randomUUID(),
                candidateId: session.candidateId,
                skillBucketId: session.skillBucketId,
                isPassed,
                score,
                attemptedAt,
                validTill: isPassed ? new Date(attemptedAt.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
                retestAllowedAt: isPassed ? null : new Date(attemptedAt.getTime() + 24 * 60 * 60 * 1000),
                testSessionId: sessionId
            }
        });
        // Update test session in DB
        await this.prisma.testSession.update({
            where: {
                id: sessionId
            },
            data: {
                status: isAutoSubmit ? 'AUTO_SUBMITTED' : 'SUBMITTED',
                submittedAt: new Date(),
                score,
                correctAnswers: correctCount,
                isPassed
            }
        });
        // Update applications for this candidate with the same skillBucketId
        // This ensures the application status reflects the test result
        const applicationsToUpdate = await this.prisma.jobApplication.findMany({
            where: {
                candidateId: session.candidateId,
                Job: {
                    skillBucketId: session.skillBucketId
                },
                status: {
                    in: [
                        'APPLIED',
                        'TEST_PENDING',
                        'TEST_REQUIRED',
                        'TEST_IN_PROGRESS'
                    ]
                }
            },
            select: {
                id: true
            }
        });
        if (applicationsToUpdate.length > 0) {
            const applicationIds = applicationsToUpdate.map((a)=>a.id);
            if (isPassed) {
                // Update applications to TEST_PASSED_WAITING_HR
                await this.prisma.jobApplication.updateMany({
                    where: {
                        id: {
                            in: applicationIds
                        }
                    },
                    data: {
                        status: 'TEST_PASSED_WAITING_HR',
                        testPassedAt: new Date(),
                        testScore: score
                    }
                });
                console.log(`Updated ${applicationIds.length} applications to TEST_PASSED_WAITING_HR for candidate ${session.candidateId}`);
            } else {
                // Update applications to TEST_FAILED
                await this.prisma.jobApplication.updateMany({
                    where: {
                        id: {
                            in: applicationIds
                        }
                    },
                    data: {
                        status: 'TEST_FAILED',
                        testScore: score
                    }
                });
                console.log(`Updated ${applicationIds.length} applications to TEST_FAILED for candidate ${session.candidateId}`);
            }
        }
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
            message: isPassed ? '🎉 Congratulations! You passed the test!' : `You scored ${score.toFixed(1)}%. You need ${passingScore}% to pass. You can retry after 24 hours.`,
            results: isPassed ? undefined : results,
            retestAllowedAt: isPassed ? null : new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
    }
    /**
   * Exit test (marks as failed)
   */ async exitTest(sessionId, userId) {
        let session = activeSessions.get(sessionId);
        // Try to restore from DB if not in memory
        if (!session) {
            session = await this.restoreSessionFromDb(sessionId, userId);
        }
        if (!session) {
            throw new _common.NotFoundException('Test session not found');
        }
        if (session.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized');
        }
        if (session.status !== 'ACTIVE') {
            throw new _common.BadRequestException('Test already completed');
        }
        // Mark as failed with 0 score
        session.status = 'EXITED';
        // Create failed attempt
        const attemptedAt = new Date();
        await this.prisma.skillTestAttempt.create({
            data: {
                id: _crypto.randomUUID(),
                candidateId: session.candidateId,
                skillBucketId: session.skillBucketId,
                isPassed: false,
                score: 0,
                attemptedAt,
                validTill: null,
                retestAllowedAt: new Date(attemptedAt.getTime() + 24 * 60 * 60 * 1000),
                testSessionId: sessionId
            }
        });
        // Update test session in DB
        await this.prisma.testSession.update({
            where: {
                id: sessionId
            },
            data: {
                status: 'EXPIRED',
                submittedAt: new Date(),
                score: 0,
                correctAnswers: 0,
                isPassed: false
            }
        });
        // Clean up
        activeSessions.delete(sessionId);
        return {
            success: true,
            message: 'Test exited. This counts as a failed attempt. You can retry after 24 hours.',
            retestAllowedAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
    }
    /**
   * Validate session and check authorization
   * Returns session data or throws appropriate error
   */ async validateSession(sessionId, userId) {
        let session = activeSessions.get(sessionId);
        // If not in memory, try to restore from database
        if (!session) {
            session = await this.restoreSessionFromDb(sessionId, userId);
        }
        if (!session) {
            throw new _common.NotFoundException('Test session not found or expired');
        }
        if (session.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized to access this test');
        }
        if (session.status !== 'ACTIVE') {
            throw new _common.BadRequestException('Test is no longer active');
        }
        // Check time expiry
        if (Date.now() > session.endsAt) {
            session.status = 'EXPIRED';
            throw new _common.BadRequestException('Test time has expired');
        }
        return session;
    }
    /**
   * Restore session from database if server restarted
   */ async restoreSessionFromDb(sessionId, userId) {
        try {
            const dbSession = await this.prisma.testSession.findUnique({
                where: {
                    id: sessionId
                },
                include: {
                    TestTemplate: {
                        include: {
                            SkillBucket: true
                        }
                    }
                }
            });
            if (!dbSession) {
                console.log(`Session ${sessionId} not found in database`);
                return undefined;
            }
            // Check if session is active and not expired
            if (dbSession.status !== 'ACTIVE' || !dbSession.endsAt || new Date() > dbSession.endsAt) {
                console.log(`Session ${sessionId} is not active or expired`);
                return undefined;
            }
            // Get the user's candidate record
            const user = await this.prisma.user.findUnique({
                where: {
                    id: userId
                },
                select: {
                    id: true,
                    Candidate: {
                        select: {
                            id: true
                        }
                    }
                }
            });
            if (!user?.Candidate?.id) {
                console.log(`User ${userId} has no candidate record`);
                return undefined;
            }
            // Get skillBucketId from the first SkillBucket in the array
            // TestTemplate has SkillBucket as an array relation
            const skillBuckets = dbSession.TestTemplate?.SkillBucket || [];
            const skillBucketId = skillBuckets.length > 0 ? skillBuckets[0].id : '';
            // Restore session data
            const sessionData = {
                userId: userId,
                candidateId: user.Candidate.id,
                skillBucketId: skillBucketId,
                testTemplateId: dbSession.testTemplateId || '',
                questionIds: dbSession.selectedQuestionIds || [],
                answers: {},
                startedAt: dbSession.startedAt?.getTime() || Date.now(),
                endsAt: dbSession.endsAt.getTime(),
                status: 'ACTIVE'
            };
            // Store back in memory
            activeSessions.set(sessionId, sessionData);
            console.log(`Session ${sessionId} restored from database for user ${userId}, candidateId: ${user.Candidate.id}`);
            return sessionData;
        } catch (error) {
            console.error('Error restoring session from DB:', error);
            return undefined;
        }
    }
    /**
   * Get test history for a candidate
   */ async getTestHistory(candidateId) {
        const attempts = await this.prisma.skillTestAttempt.findMany({
            where: {
                candidateId
            },
            include: {
                SkillBucket: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true
                    }
                }
            },
            orderBy: {
                attemptedAt: 'desc'
            },
            take: 20
        });
        return attempts.map((a)=>({
                id: a.id,
                SkillBucket: a.SkillBucket,
                score: a.score,
                isPassed: a.isPassed,
                attemptedAt: a.attemptedAt,
                validTill: a.validTill,
                retestAllowedAt: a.retestAllowedAt
            }));
    }
    constructor(prisma, questionBankService){
        this.prisma = prisma;
        this.questionBankService = questionBankService;
        this.TEST_DURATION_MS = 20 * 60 * 1000; // 20 minutes
    }
};
RapidFireTestService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _questionbankservice.QuestionBankService === "undefined" ? Object : _questionbankservice.QuestionBankService
    ])
], RapidFireTestService);

//# sourceMappingURL=rapid-fire.service.js.map