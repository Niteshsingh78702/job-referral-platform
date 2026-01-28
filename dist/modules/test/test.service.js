"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TestService", {
    enumerable: true,
    get: function() {
        return TestService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _ioredis = /*#__PURE__*/ _interop_require_default(require("ioredis"));
const _prismaservice = require("../../prisma/prisma.service");
const _constants = require("../../common/constants");
const _skillbucketservice = require("../skill-bucket/skill-bucket.service");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
let TestService = class TestService {
    initRedis() {
        const redisUrl = this.configService.get('REDIS_URL');
        const redisHost = this.configService.get('REDIS_HOST');
        if (redisUrl || redisHost) {
            try {
                if (redisUrl) {
                    this.redis = new _ioredis.default(redisUrl);
                } else {
                    this.redis = new _ioredis.default({
                        host: redisHost || 'localhost',
                        port: this.configService.get('REDIS_PORT', 6379),
                        password: this.configService.get('REDIS_PASSWORD')
                    });
                }
                this.redis.on('error', (err)=>{
                    this.logger.warn(`Redis error: ${err.message}. Using in-memory storage.`);
                    this.redis = null;
                });
            } catch  {
                this.logger.warn('Redis not available. Test sessions will use in-memory storage.');
            }
        } else {
            this.logger.log('Redis not configured. Test sessions will use in-memory storage.');
        }
    }
    // Helper methods for Redis operations with fallback
    async redisSet(key, value, pxMs) {
        if (this.redis) {
            try {
                if (pxMs) {
                    await this.redis.set(key, value, 'PX', pxMs);
                } else {
                    await this.redis.set(key, value);
                }
                return;
            } catch  {
            // Fall through to in-memory
            }
        }
        this.sessionStore.set(key, {
            data: value,
            expiry: pxMs ? Date.now() + pxMs : Date.now() + 3600000
        });
    }
    async redisGet(key) {
        if (this.redis) {
            try {
                return await this.redis.get(key);
            } catch  {
            // Fall through
            }
        }
        const stored = this.sessionStore.get(key);
        if (!stored) return null;
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
            } catch  {
            // Fall through
            }
        }
        this.sessionStore.delete(key);
    }
    // ===========================================
    // ADMIN: Test Management
    // ===========================================
    async createTest(dto) {
        return this.prisma.test.create({
            data: {
                id: _crypto.randomUUID(),
                title: dto.title,
                description: dto.description,
                duration: dto.duration || 30,
                passingScore: dto.passingScore || 70,
                totalTestQuestion: dto.totalQuestions || 20,
                shuffleTestQuestion: dto.shuffleQuestions ?? true,
                maxTabSwitches: dto.maxTabSwitches || 2,
                difficulty: dto.difficulty || 'MEDIUM',
                updatedAt: new Date()
            }
        });
    }
    async addQuestion(testId, dto) {
        const test = await this.prisma.test.findUnique({
            where: {
                id: testId
            },
            include: {
                TestQuestion: true
            }
        });
        if (!test) {
            throw new _common.NotFoundException('Test not found');
        }
        return this.prisma.testQuestion.create({
            data: {
                id: _crypto.randomUUID(),
                testId,
                question: dto.question,
                options: dto.options,
                correctAnswer: dto.correctAnswer,
                explanation: dto.explanation,
                points: dto.points || 1,
                orderIndex: test.TestQuestion.length
            }
        });
    }
    async getTestById(testId) {
        const test = await this.prisma.test.findUnique({
            where: {
                id: testId
            },
            include: {
                TestQuestion: {
                    orderBy: {
                        orderIndex: 'asc'
                    }
                }
            }
        });
        if (!test) {
            throw new _common.NotFoundException('Test not found');
        }
        return test;
    }
    // ===========================================
    // ADMIN: Role-Based Test Management
    // ===========================================
    async createRoleTest(dto) {
        // Check if test already exists for this skill bucket (role)
        const existingBucket = await this.prisma.skillBucket.findUnique({
            where: {
                id: dto.skillBucketId
            },
            include: {
                Test: true,
                TestTemplate: true
            }
        });
        if (!existingBucket) {
            throw new _common.NotFoundException('Skill bucket (role) not found');
        }
        if (existingBucket.testId || existingBucket.testTemplateId) {
            throw new _common.BadRequestException('Test already exists for this role. Each role can have only one test.');
        }
        // Create the Test (for backward compatibility)
        const test = await this.prisma.test.create({
            data: {
                id: _crypto.randomUUID(),
                title: dto.title,
                description: dto.description,
                duration: dto.duration || 30,
                passingScore: dto.passingScore || 70,
                totalQuestions: dto.totalQuestions || 20,
                validityDays: dto.validityDays || 7,
                isActive: dto.isActive || false,
                updatedAt: new Date()
            }
        });
        // Also create TestTemplate (for rapid-fire tests)
        const testTemplate = await this.prisma.testTemplate.create({
            data: {
                id: _crypto.randomUUID(),
                name: dto.title,
                description: dto.description,
                duration: dto.duration || 20,
                passingCriteria: dto.passingScore || 70,
                testValidityDays: dto.validityDays || 7,
                questionPoolSize: dto.totalQuestions || 20,
                selectionRoleType: existingBucket.code,
                isActive: dto.isActive || true,
                updatedAt: new Date()
            }
        });
        // Link both Test and TestTemplate to skill bucket
        await this.prisma.skillBucket.update({
            where: {
                id: dto.skillBucketId
            },
            data: {
                testId: test.id,
                testTemplateId: testTemplate.id
            }
        });
        return {
            ...test,
            testTemplate
        };
    }
    async getAllRoleTests() {
        const skillBuckets = await this.prisma.skillBucket.findMany({
            include: {
                Test: {
                    include: {
                        TestQuestion: true,
                        _count: {
                            select: {
                                TestSession: true
                            }
                        }
                    }
                },
                TestTemplate: {
                    select: {
                        selectionRoleType: true
                    }
                }
            }
        });
        // For each bucket, count available questions from QuestionBank
        const roleTestsWithQuestionCount = await Promise.all(skillBuckets.map(async (bucket)=>{
            // Use TestTemplate.selectionRoleType if set, otherwise use bucket.code
            const roleType = bucket.TestTemplate?.selectionRoleType || bucket.code;
            const availableQuestions = await this.prisma.questionBank.count({
                where: {
                    roleType: roleType,
                    isActive: true
                }
            });
            return {
                skillBucketId: bucket.id,
                skillBucketName: bucket.name,
                skillBucketCode: bucket.code,
                test: bucket.Test ? {
                    id: bucket.Test.id,
                    title: bucket.Test.title,
                    description: bucket.Test.description,
                    duration: bucket.Test.duration,
                    passingScore: bucket.Test.passingScore,
                    totalQuestions: bucket.Test.totalQuestions,
                    validityDays: bucket.Test.validityDays,
                    isActive: bucket.Test.isActive,
                    questionsCount: availableQuestions,
                    sessionsCount: bucket.Test._count.TestSession,
                    createdAt: bucket.Test.createdAt
                } : null
            };
        }));
        return roleTestsWithQuestionCount;
    }
    async getTestBySkillBucket(skillBucketId) {
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: {
                id: skillBucketId
            },
            include: {
                Test: {
                    include: {
                        TestQuestion: {
                            orderBy: {
                                orderIndex: 'asc'
                            }
                        }
                    }
                }
            }
        });
        if (!skillBucket) {
            throw new _common.NotFoundException('Skill bucket not found');
        }
        if (!skillBucket.Test) {
            throw new _common.NotFoundException('No test found for this role');
        }
        return {
            skillBucket: {
                id: skillBucket.id,
                name: skillBucket.name,
                code: skillBucket.code
            },
            test: skillBucket.Test
        };
    }
    async updateTest(testId, dto) {
        const test = await this.prisma.test.findUnique({
            where: {
                id: testId
            },
            include: {
                TestQuestion: true
            }
        });
        if (!test) {
            throw new _common.NotFoundException('Test not found');
        }
        // Validate activation - cannot activate without questions
        if (dto.isActive === true && test.TestQuestion.length === 0) {
            throw new _common.BadRequestException('Cannot activate test without questions. Add at least one question first.');
        }
        return this.prisma.test.update({
            where: {
                id: testId
            },
            data: {
                ...dto.title && {
                    title: dto.title
                },
                ...dto.description !== undefined && {
                    description: dto.description
                },
                ...dto.duration && {
                    duration: dto.duration
                },
                ...dto.passingScore && {
                    passingScore: dto.passingScore
                },
                ...dto.totalQuestions && {
                    totalQuestions: dto.totalQuestions
                },
                ...dto.validityDays && {
                    validityDays: dto.validityDays
                },
                ...dto.isActive !== undefined && {
                    isActive: dto.isActive
                },
                updatedAt: new Date()
            }
        });
    }
    async activateTest(testId) {
        const test = await this.prisma.test.findUnique({
            where: {
                id: testId
            },
            include: {
                SkillBucket: true
            }
        });
        if (!test) {
            throw new _common.NotFoundException('Test not found');
        }
        // Check if there are questions in QuestionBank matching the skill bucket code
        const skillBucketCode = test.SkillBucket?.code;
        const questionCount = await this.prisma.questionBank.count({
            where: {
                roleType: skillBucketCode || '',
                isActive: true
            }
        });
        if (questionCount === 0) {
            throw new _common.BadRequestException(`Cannot activate test without questions. No questions found in Question Bank for role type "${skillBucketCode}". Add questions first using CSV upload.`);
        }
        return this.prisma.test.update({
            where: {
                id: testId
            },
            data: {
                isActive: true,
                updatedAt: new Date()
            }
        });
    }
    async deactivateTest(testId) {
        const test = await this.prisma.test.findUnique({
            where: {
                id: testId
            }
        });
        if (!test) {
            throw new _common.NotFoundException('Test not found');
        }
        return this.prisma.test.update({
            where: {
                id: testId
            },
            data: {
                isActive: false,
                updatedAt: new Date()
            }
        });
    }
    // ===========================================
    // Candidate: Test Eligibility & Taking
    // ===========================================
    async getTestEligibility(candidateId, jobId) {
        // Get job with skill bucket and test info
        const job = await this.prisma.job.findUnique({
            where: {
                id: jobId
            },
            include: {
                SkillBucket: {
                    include: {
                        Test: true
                    }
                }
            }
        });
        if (!job) {
            throw new _common.NotFoundException('Job not found');
        }
        if (!job.SkillBucket || !job.SkillBucket.Test) {
            return {
                eligible: false,
                reason: 'NO_TEST_CONFIGURED',
                message: 'No test is configured for this job role.'
            };
        }
        const test = job.SkillBucket.Test;
        if (!test.isActive) {
            return {
                eligible: false,
                reason: 'TEST_INACTIVE',
                message: 'Test is currently not available for this role.'
            };
        }
        // Check for existing attempt
        const existingAttempt = await this.prisma.candidateTestAttempt.findUnique({
            where: {
                candidateId_jobId: {
                    candidateId,
                    jobId
                }
            }
        });
        if (existingAttempt) {
            if (existingAttempt.status === _constants.CandidateTestAttemptStatus.PASSED) {
                return {
                    eligible: false,
                    reason: 'ALREADY_PASSED',
                    message: 'You have already passed the test for this job.',
                    attemptStatus: existingAttempt.status,
                    score: existingAttempt.score
                };
            }
            if (existingAttempt.status === _constants.CandidateTestAttemptStatus.FAILED) {
                return {
                    eligible: false,
                    reason: 'ALREADY_FAILED',
                    message: 'You have already failed the test for this job. Re-attempts are not allowed.',
                    attemptStatus: existingAttempt.status,
                    score: existingAttempt.score
                };
            }
            if (existingAttempt.status === _constants.CandidateTestAttemptStatus.EXPIRED) {
                return {
                    eligible: false,
                    reason: 'TEST_EXPIRED',
                    message: 'The test validity period has expired.',
                    attemptStatus: existingAttempt.status
                };
            }
            if (existingAttempt.status === _constants.CandidateTestAttemptStatus.IN_PROGRESS) {
                return {
                    eligible: true,
                    reason: 'IN_PROGRESS',
                    message: 'You have an ongoing test session.',
                    attemptStatus: existingAttempt.status,
                    testSessionId: existingAttempt.testSessionId
                };
            }
            // NOT_STARTED - check if expired
            if (new Date() > existingAttempt.expiresAt) {
                // Mark as expired
                await this.prisma.candidateTestAttempt.update({
                    where: {
                        id: existingAttempt.id
                    },
                    data: {
                        status: _constants.CandidateTestAttemptStatus.EXPIRED
                    }
                });
                return {
                    eligible: false,
                    reason: 'TEST_EXPIRED',
                    message: 'The test validity period has expired.',
                    attemptStatus: _constants.CandidateTestAttemptStatus.EXPIRED
                };
            }
            // NOT_STARTED and still valid
            return {
                eligible: true,
                reason: 'READY',
                message: 'You can start the test.',
                attemptStatus: existingAttempt.status,
                expiresAt: existingAttempt.expiresAt,
                test: {
                    id: test.id,
                    title: test.title,
                    duration: test.duration,
                    totalQuestions: test.totalQuestions,
                    passingScore: test.passingScore
                }
            };
        }
        // No attempt exists - eligible to start
        return {
            eligible: true,
            reason: 'NO_ATTEMPT',
            message: 'You can start the test.',
            test: {
                id: test.id,
                title: test.title,
                duration: test.duration,
                totalQuestions: test.totalQuestions,
                passingScore: test.passingScore,
                validityDays: test.validityDays
            }
        };
    }
    // ===========================================
    // Candidate: Test Taking
    // ===========================================
    async startTest(applicationId, userId) {
        // Verify application exists and is in correct state
        const application = await this.prisma.jobApplication.findUnique({
            where: {
                id: applicationId
            },
            include: {
                Candidate: {
                    include: {
                        User: true
                    }
                },
                Job: {
                    include: {
                        Test: {
                            include: {
                                TestQuestion: true
                            }
                        }
                    }
                },
                TestSession: true
            }
        });
        if (!application) {
            throw new _common.NotFoundException('Application not found');
        }
        if (application.Candidate.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized to access this application');
        }
        if (application.status !== _constants.ApplicationStatus.TEST_REQUIRED && application.status !== _constants.ApplicationStatus.TEST_PENDING && application.status !== _constants.ApplicationStatus.APPLIED) {
            throw new _common.BadRequestException('Test not available for this application');
        }
        if (!application.Job.Test) {
            throw new _common.BadRequestException('No test configured for this job');
        }
        // Defense-in-depth: Check skill test cooldown if job has skill bucket
        if (application.Job.skillBucketId) {
            const skillStatus = await this.skillBucketService.checkCandidateSkillStatus(application.Candidate.id, application.Job.skillBucketId);
            // Block if candidate is in retest cooldown (failed recently)
            if (skillStatus.isFailed && !skillStatus.canRetest) {
                throw new _common.BadRequestException(`Retest not allowed yet. Please wait ${skillStatus.retestInHours} hours before retrying.`);
            }
            // Also check if already passed and still valid (shouldn't need to retake)
            if (skillStatus.isPassed && skillStatus.isValid) {
                throw new _common.BadRequestException(`You already have a valid skill pass for this role (valid for ${skillStatus.validDaysRemaining} more days). No need to retake the test.`);
            }
        }
        // Check if already has an active or completed session
        const existingSession = application.TestSession.find((s)=>s.status !== _constants.TestSessionStatus.EXPIRED);
        if (existingSession) {
            if (existingSession.status === _constants.TestSessionStatus.ACTIVE) {
                // Return existing session (resume)
                return this.getTestSession(existingSession.id, userId);
            }
            throw new _common.BadRequestException('Test already attempted for this application');
        }
        const test = application.Job.Test;
        const now = Date.now();
        const endsAt = now + test.duration * 60 * 1000;
        // Shuffle questions if enabled
        let questionOrder = test.TestQuestion.map((_, i)=>i);
        if (test.shuffleQuestions) {
            questionOrder = this.shuffleArray([
                ...questionOrder
            ]);
        }
        // Create test session in database
        const session = await this.prisma.testSession.create({
            data: {
                id: _crypto.randomUUID(),
                applicationId,
                testId: test.id,
                status: _constants.TestSessionStatus.ACTIVE,
                startedAt: new Date(),
                endsAt: new Date(endsAt),
                totalTestQuestion: test.TestQuestion.length,
                questionOrder
            }
        });
        // Store session in Redis with TTL
        const sessionData = {
            sessionId: session.id,
            applicationId,
            testId: test.id,
            userId,
            startedAt: now,
            endsAt,
            questionOrder,
            tabSwitchCount: 0,
            maxTabSwitches: test.maxTabSwitches
        };
        await this.redisSet(_constants.REDIS_KEYS.TEST_SESSION(session.id), JSON.stringify(sessionData), endsAt - now + 60000);
        // Log audit
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId,
                action: _constants.AuditAction.TEST_START,
                entityType: 'TestSession',
                entityId: session.id,
                metadata: {
                    applicationId,
                    testId: test.id
                }
            }
        });
        return this.getTestSession(session.id, userId);
    }
    async getTestSession(sessionId, userId) {
        // Get from Redis/memory first
        const redisData = await this.redisGet(_constants.REDIS_KEYS.TEST_SESSION(sessionId));
        if (!redisData) {
            // Session might have expired
            throw new _common.BadRequestException('Test session expired or not found');
        }
        const sessionData = JSON.parse(redisData);
        if (sessionData.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized to access this session');
        }
        // Check if time expired
        if (Date.now() > sessionData.endsAt) {
            await this.autoSubmitTest(sessionId);
            throw new _common.BadRequestException('Test time has expired');
        }
        // Get session with questions
        const session = await this.prisma.testSession.findUnique({
            where: {
                id: sessionId
            },
            include: {
                Test: {
                    include: {
                        TestQuestion: {
                            orderBy: {
                                orderIndex: 'asc'
                            },
                            select: {
                                id: true,
                                question: true,
                                options: true,
                                points: true
                            }
                        }
                    }
                },
                TestAnswer: true
            }
        });
        if (!session) {
            throw new _common.NotFoundException('Session not found');
        }
        // Standard test - check that test relation exists
        if (!session.Test) {
            throw new _common.BadRequestException('This is a rapid-fire test session. Use the rapid-fire endpoints.');
        }
        // Reorder questions based on shuffled order
        const orderedQuestions = sessionData.questionOrder.map((i)=>session.Test.TestQuestion[i]);
        return {
            sessionId: session.id,
            testTitle: session.Test.title,
            duration: session.Test.duration,
            totalTestQuestion: session.totalQuestions,
            remainingTime: Math.max(0, Math.floor((sessionData.endsAt - Date.now()) / 1000)),
            TestQuestion: orderedQuestions,
            answers: session.TestAnswer.map((a)=>({
                    questionId: a.questionId,
                    selectedAnswer: a.selectedAnswer
                })),
            tabSwitchCount: sessionData.tabSwitchCount,
            maxTabSwitches: sessionData.maxTabSwitches
        };
    }
    async submitAnswer(sessionId, userId, dto) {
        // Validate session from storage
        const redisData = await this.redisGet(_constants.REDIS_KEYS.TEST_SESSION(sessionId));
        if (!redisData) {
            throw new _common.BadRequestException('Test session expired or not found');
        }
        const sessionData = JSON.parse(redisData);
        if (sessionData.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized');
        }
        if (Date.now() > sessionData.endsAt) {
            await this.autoSubmitTest(sessionId);
            throw new _common.BadRequestException('Test time has expired');
        }
        // Verify question belongs to this test
        const question = await this.prisma.testQuestion.findFirst({
            where: {
                id: dto.questionId,
                testId: sessionData.testId
            }
        });
        if (!question) {
            throw new _common.BadRequestException('Invalid question');
        }
        // Check if answer is valid
        if (dto.selectedAnswer < 0 || dto.selectedAnswer >= question.options.length) {
            throw new _common.BadRequestException('Invalid answer option');
        }
        // Save or update answer
        const isCorrect = dto.selectedAnswer === question.correctAnswer;
        await this.prisma.testAnswer.upsert({
            where: {
                sessionId_questionId: {
                    sessionId,
                    questionId: dto.questionId
                }
            },
            create: {
                sessionId,
                questionId: dto.questionId,
                selectedAnswer: dto.selectedAnswer,
                isCorrect
            },
            update: {
                selectedAnswer: dto.selectedAnswer,
                isCorrect,
                answeredAt: new Date()
            }
        });
        return {
            success: true,
            questionId: dto.questionId
        };
    }
    async submitTest(sessionId, userId) {
        // Validate session
        const session = await this.prisma.testSession.findUnique({
            where: {
                id: sessionId
            },
            include: {
                JobApplication: {
                    include: {
                        Candidate: true
                    }
                },
                Test: true,
                answers: true
            }
        });
        if (!session) {
            throw new _common.NotFoundException('Session not found');
        }
        // Check authorization (application may be null for rapid fire tests)
        if (session.application && session.application.candidate.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized');
        }
        if (session.status !== _constants.TestSessionStatus.ACTIVE) {
            throw new _common.BadRequestException('Test already submitted');
        }
        return this.processTestSubmission(session, false);
    }
    async logTestEvent(sessionId, userId, dto) {
        // Get session from storage
        const redisData = await this.redisGet(_constants.REDIS_KEYS.TEST_SESSION(sessionId));
        if (!redisData) {
            return {
                success: false
            };
        }
        const sessionData = JSON.parse(redisData);
        if (sessionData.userId !== userId) {
            return {
                success: false
            };
        }
        // Log event
        await this.prisma.testEvent.create({
            data: {
                id: _crypto.randomUUID(),
                sessionId,
                eventType: dto.eventType,
                eventData: dto.eventData
            }
        });
        // Handle tab switch
        if (dto.eventType === 'TAB_SWITCH') {
            sessionData.tabSwitchCount++;
            // Update session storage
            await this.redisSet(_constants.REDIS_KEYS.TEST_SESSION(sessionId), JSON.stringify(sessionData));
            // Log audit
            await this.prisma.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId,
                    action: _constants.AuditAction.TEST_TAB_SWITCH,
                    entityType: 'TestSession',
                    entityId: sessionId,
                    metadata: {
                        count: sessionData.tabSwitchCount
                    }
                }
            });
            // Check if exceeds max
            if (sessionData.tabSwitchCount >= sessionData.maxTabSwitches) {
                // Auto-submit test
                await this.autoSubmitTest(sessionId);
                return {
                    success: true,
                    autoSubmitted: true,
                    message: 'Test auto-submitted due to too many tab switches'
                };
            }
            return {
                success: true,
                warning: true,
                remainingWarnings: sessionData.maxTabSwitches - sessionData.tabSwitchCount
            };
        }
        return {
            success: true
        };
    }
    // ===========================================
    // INTERNAL HELPERS
    // ===========================================
    async autoSubmitTest(sessionId) {
        const session = await this.prisma.testSession.findUnique({
            where: {
                id: sessionId
            },
            include: {
                JobApplication: {
                    include: {
                        Candidate: true
                    }
                },
                Test: true,
                answers: true
            }
        });
        if (!session || session.status !== _constants.TestSessionStatus.ACTIVE) {
            return;
        }
        return this.processTestSubmission(session, true);
    }
    async processTestSubmission(session, isAutoSubmit) {
        const correctAnswers = session.answers.filter((a)=>a.isCorrect).length;
        const score = correctAnswers / session.totalQuestions * 100;
        const isPassed = score >= session.test.passingScore;
        // Update session
        await this.prisma.testSession.update({
            where: {
                id: session.id
            },
            data: {
                status: isAutoSubmit ? _constants.TestSessionStatus.AUTO_SUBMITTED : _constants.TestSessionStatus.SUBMITTED,
                submittedAt: new Date(),
                score,
                correctAnswers,
                isPassed
            }
        });
        // Update application status - PASSED goes to WAITING for HR review
        const newStatus = isPassed ? _constants.ApplicationStatus.TEST_PASSED_WAITING_HR : _constants.ApplicationStatus.REJECTED;
        await this.prisma.jobApplication.update({
            where: {
                id: session.applicationId
            },
            data: {
                status: newStatus,
                testScore: score,
                testPassedAt: isPassed ? new Date() : null
            }
        });
        // SKILL-BASED Test: Record skill test attempt if job has a skill bucket
        try {
            const application = await this.prisma.jobApplication.findUnique({
                where: {
                    id: session.applicationId
                },
                include: {
                    Candidate: true,
                    Job: {
                        include: {
                            SkillBucket: true
                        }
                    }
                }
            });
            if (application?.Job?.skillBucketId) {
                await this.skillBucketService.recordSkillTestAttempt(application.Candidate.id, application.Job.skillBucketId, isPassed, score, session.id);
                this.logger.log(`Recorded skill test attempt for candidate ${application.Candidate.id} ` + `on skill bucket ${application.Job.skillBucketId}: passed=${isPassed}`);
            }
        } catch (error) {
            this.logger.error('Failed to record skill test attempt:', error);
        // Don't fail the submission if skill tracking fails
        }
        // If passed, create referral entry
        if (isPassed) {
            await this.prisma.referral.create({
                data: {
                    id: _crypto.randomUUID(),
                    applicationId: session.applicationId,
                    type: 'HR_DIRECT',
                    status: _constants.ReferralStatus.PENDING,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date()
                }
            });
        }
        // Clear session storage
        await this.redisDel(_constants.REDIS_KEYS.TEST_SESSION(session.id));
        // Log audit
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId: session.application.candidate.userId,
                action: _constants.AuditAction.TEST_SUBMIT,
                entityType: 'TestSession',
                entityId: session.id,
                metadata: {
                    score,
                    isPassed,
                    isAutoSubmit
                }
            }
        });
        return {
            success: true,
            sessionId: session.id,
            score,
            isPassed,
            correctAnswers,
            totalTestQuestion: session.totalQuestions,
            isAutoSubmit
        };
    }
    shuffleArray(array) {
        for(let i = array.length - 1; i > 0; i--){
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [
                array[j],
                array[i]
            ];
        }
        return array;
    }
    constructor(prisma, configService, skillBucketService){
        this.prisma = prisma;
        this.configService = configService;
        this.skillBucketService = skillBucketService;
        this.redis = null;
        this.logger = new _common.Logger(TestService.name);
        // In-memory fallback for test sessions
        this.sessionStore = new Map();
        this.initRedis();
    }
};
TestService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _skillbucketservice.SkillBucketService === "undefined" ? Object : _skillbucketservice.SkillBucketService
    ])
], TestService);

//# sourceMappingURL=test.service.js.map