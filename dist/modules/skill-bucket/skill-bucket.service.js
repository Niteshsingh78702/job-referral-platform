"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SkillBucketService", {
    enumerable: true,
    get: function() {
        return SkillBucketService;
    }
});
const _common = require("@nestjs/common");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _prismaservice = require("../../prisma/prisma.service");
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
// Validity duration in days
const TEST_VALIDITY_DAYS = 7;
// Retest cooldown in hours
const RETEST_COOLDOWN_HOURS = 24;
let SkillBucketService = class SkillBucketService {
    // ==========================================
    // ADMIN: Skill Bucket Management
    // ==========================================
    async createSkillBucket(dto) {
        // Check if code already exists
        const existing = await this.prisma.skillBucket.findUnique({
            where: {
                code: dto.code
            }
        });
        if (existing) {
            throw new _common.BadRequestException(`Skill bucket with code '${dto.code}' already exists`);
        }
        return this.prisma.skillBucket.create({
            data: {
                id: _crypto.randomUUID(),
                code: dto.code,
                name: dto.name,
                description: dto.description,
                displayName: dto.displayName || `HR Shortlisting Check - ${dto.name}`,
                experienceMin: dto.experienceMin ?? 0,
                experienceMax: dto.experienceMax ?? 3,
                updatedAt: new Date()
            },
            include: {
                Test: true
            }
        });
    }
    async updateSkillBucket(id, dto) {
        const bucket = await this.prisma.skillBucket.findUnique({
            where: {
                id
            }
        });
        if (!bucket) {
            throw new _common.NotFoundException('Skill bucket not found');
        }
        return this.prisma.skillBucket.update({
            where: {
                id
            },
            data: {
                name: dto.name,
                description: dto.description,
                displayName: dto.displayName,
                experienceMin: dto.experienceMin,
                experienceMax: dto.experienceMax,
                isActive: dto.isActive,
                testId: dto.testId
            },
            include: {
                Test: true
            }
        });
    }
    async getSkillBuckets(includeInactive = false) {
        return this.prisma.skillBucket.findMany({
            where: includeInactive ? {} : {
                isActive: true
            },
            include: {
                Test: {
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                        totalQuestions: true
                    }
                },
                _count: {
                    select: {
                        Job: true,
                        SkillTestAttempt: true
                    }
                }
            },
            orderBy: {
                code: 'asc'
            }
        });
    }
    async getSkillBucketById(id) {
        const bucket = await this.prisma.skillBucket.findUnique({
            where: {
                id
            },
            include: {
                Test: true
            }
        });
        if (!bucket) {
            throw new _common.NotFoundException('Skill bucket not found');
        }
        return bucket;
    }
    async getSkillBucketByCode(code) {
        const bucket = await this.prisma.skillBucket.findUnique({
            where: {
                code
            },
            include: {
                Test: true
            }
        });
        if (!bucket) {
            throw new _common.NotFoundException(`Skill bucket '${code}' not found`);
        }
        return bucket;
    }
    // ==========================================
    // Candidate: Skill Test Status Check
    // ==========================================
    /**
   * Check candidate's skill test status for a specific skill bucket
   * This is the CORE logic for determining:
   * - If candidate has a valid pass (can apply without test)
   * - If candidate has an expired pass (needs retest)
   * - If candidate failed and is in cooldown (cannot retest yet)
   * - If candidate failed and can retest (cooldown expired)
   * - If candidate never took the test
   */ async checkCandidateSkillStatus(candidateId, skillBucketId) {
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: {
                id: skillBucketId
            }
        });
        if (!skillBucket) {
            throw new _common.NotFoundException('Skill bucket not found');
        }
        // Get the most recent attempt for this candidate + skill bucket
        const latestAttempt = await this.prisma.skillTestAttempt.findFirst({
            where: {
                candidateId,
                skillBucketId
            },
            orderBy: {
                attemptedAt: 'desc'
            }
        });
        const now = new Date();
        // Never taken
        if (!latestAttempt) {
            return {
                skillBucketId,
                skillBucketCode: skillBucket.code,
                skillBucketName: skillBucket.name,
                displayName: skillBucket.displayName || skillBucket.name,
                isPassed: false,
                isValid: false,
                isFailed: false,
                canReTest: true,
                neverTaken: true
            };
        }
        // Passed attempt
        if (latestAttempt.isPassed) {
            const validTill = latestAttempt.validTill;
            const isValid = now <= validTill;
            // Calculate days remaining
            const msRemaining = validTill.getTime() - now.getTime();
            const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
            return {
                skillBucketId,
                skillBucketCode: skillBucket.code,
                skillBucketName: skillBucket.name,
                displayName: skillBucket.displayName || skillBucket.name,
                isPassed: true,
                isValid,
                score: latestAttempt.score,
                validTill,
                validDaysRemaining: isValid ? daysRemaining : 0,
                isFailed: false,
                canReTest: !isValid,
                neverTaken: false
            };
        }
        // Failed attempt
        const retestAllowedAt = latestAttempt.retestAllowedAt;
        const canRetest = now >= retestAllowedAt;
        // Calculate hours until retest
        const msUntilRetest = retestAllowedAt.getTime() - now.getTime();
        const hoursUntilRetest = Math.ceil(msUntilRetest / (1000 * 60 * 60));
        return {
            skillBucketId,
            skillBucketCode: skillBucket.code,
            skillBucketName: skillBucket.name,
            displayName: skillBucket.displayName || skillBucket.name,
            isPassed: false,
            isValid: false,
            score: latestAttempt.score,
            isFailed: true,
            canRetest,
            retestAllowedAt,
            retestInHours: canRetest ? 0 : hoursUntilRetest,
            neverTaken: false
        };
    }
    /**
   * Check skill status by Job ID (for apply flow)
   */ async checkCandidateSkillStatusByJobId(candidateId, jobId) {
        const job = await this.prisma.job.findUnique({
            where: {
                id: jobId
            },
            select: {
                skillBucketId: true
            }
        });
        if (!job) {
            throw new _common.NotFoundException('Job not found');
        }
        // If job has no skill bucket, no test required
        if (!job.skillBucketId) {
            return null;
        }
        return this.checkCandidateSkillStatus(candidateId, job.skillBucketId);
    }
    // ==========================================
    // RECORD TEST ATTEMPTS
    // ==========================================
    /**
   * Record a skill test attempt after test submission
   * Called from TestService after test is graded
   */ async recordSkillTestAttempt(candidateId, skillBucketId, isPassed, score, testSessionId) {
        const now = new Date();
        // Get configured validity/cooldown from TestTemplate (via SkillBucket)
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: {
                id: skillBucketId
            },
            include: {
                TestTemplate: true
            }
        });
        // Use configured values or defaults
        const validityDays = skillBucket?.TestTemplate?.testValidityDays ?? TEST_VALIDITY_DAYS;
        const cooldownHours = skillBucket?.TestTemplate?.retestCooldownHours ?? RETEST_COOLDOWN_HOURS;
        // Calculate validity or cooldown based on result
        let validTill = null;
        let retestAllowedAt = null;
        if (isPassed) {
            // Valid for configured days
            validTill = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
        } else {
            // Cooldown for configured hours
            retestAllowedAt = new Date(now.getTime() + cooldownHours * 60 * 60 * 1000);
        }
        const attempt = await this.prisma.skillTestAttempt.create({
            data: {
                id: _crypto.randomUUID(),
                candidateId,
                skillBucketId,
                isPassed,
                score,
                validTill,
                retestAllowedAt,
                testSessionId
            }
        });
        this.logger.log(`Recorded skill test attempt: candidate=${candidateId}, skill=${skillBucketId}, ` + `passed=${isPassed}, score=${score}, validTill=${validTill}, retestAllowedAt=${retestAllowedAt}, ` + `validityDays=${validityDays}, cooldownHours=${cooldownHours}`);
        return attempt;
    }
    /**
   * Get all valid skill passes for a candidate (for displaying badges)
   */ async getCandidateValidPasses(candidateId) {
        const now = new Date();
        const validAttempts = await this.prisma.skillTestAttempt.findMany({
            where: {
                candidateId,
                isPassed: true,
                validTill: {
                    gte: now
                }
            },
            include: {
                SkillBucket: {
                    select: {
                        code: true,
                        name: true,
                        displayName: true
                    }
                }
            },
            orderBy: {
                validTill: 'desc'
            }
        });
        return validAttempts.map((attempt)=>({
                skillBucketCode: attempt.SkillBucket.code,
                skillBucketName: attempt.SkillBucket.name,
                displayName: attempt.SkillBucket.displayName || attempt.SkillBucket.name,
                score: attempt.score,
                validTill: attempt.validTill,
                daysRemaining: Math.ceil((attempt.validTill.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            }));
    }
    // ==========================================
    // COMPOSITE SKILL REQUIREMENTS (Full Stack etc.)
    // ==========================================
    /**
   * Check ALL required skills for a job (supports composite skill requirements)
   * For Full Stack jobs that require both Java Backend AND React Frontend
   *
   * Returns:
   * - canApply: true if ALL required skills are passed and valid
   * - missingTests: array of skills that need to be taken/retaken
   * - passedTests: array of skills already passed and valid
   */ async checkAllRequiredSkillsForJob(candidateId, jobId) {
        // Get job with both legacy single skill bucket and new composite requirements
        const job = await this.prisma.job.findUnique({
            where: {
                id: jobId
            },
            include: {
                JobRequiredSkillBucket: {
                    include: {
                        SkillBucket: true
                    },
                    orderBy: {
                        displayOrder: 'asc'
                    }
                }
            }
        });
        if (!job) {
            throw new _common.NotFoundException('Job not found');
        }
        // Collect all required skill bucket IDs
        const requiredSkillBucketIds = [];
        // 1. Check legacy single skill bucket (backward compatibility)
        if (job.skillBucketId) {
            requiredSkillBucketIds.push(job.skillBucketId);
        }
        // 2. Check new composite skill requirements
        for (const req of job.JobRequiredSkillBucket){
            if (!requiredSkillBucketIds.includes(req.skillBucketId)) {
                requiredSkillBucketIds.push(req.skillBucketId);
            }
        }
        // No skill requirements - can apply freely
        if (requiredSkillBucketIds.length === 0) {
            return {
                canApply: true,
                missingTests: [],
                passedTests: [],
                hasRequirements: false
            };
        }
        // Check each required skill
        const passedTests = [];
        const missingTests = [];
        for (const skillBucketId of requiredSkillBucketIds){
            const status = await this.checkCandidateSkillStatus(candidateId, skillBucketId);
            if (status.isPassed && status.isValid) {
                passedTests.push(status);
            } else {
                missingTests.push(status);
            }
        }
        return {
            canApply: missingTests.length === 0,
            missingTests,
            passedTests,
            hasRequirements: true
        };
    }
    // ==========================================
    // ADMIN: Delete Skill Bucket
    // ==========================================
    async deleteSkillBucket(id) {
        const bucket = await this.prisma.skillBucket.findUnique({
            where: {
                id
            },
            include: {
                _count: {
                    select: {
                        Job: true,
                        SkillTestAttempt: true,
                        JobRequiredSkillBucket: true
                    }
                }
            }
        });
        if (!bucket) {
            throw new _common.NotFoundException('Skill bucket not found');
        }
        // Check if skill bucket is in use
        if (bucket._count.Job > 0 || bucket._count.JobRequiredSkillBucket > 0) {
            throw new _common.BadRequestException(`Cannot delete skill bucket: it is assigned to ${bucket._count.Job + bucket._count.JobRequiredSkillBucket} job(s). Deactivate it instead.`);
        }
        // If there are attempts, just deactivate instead of hard delete
        if (bucket._count.SkillTestAttempt > 0) {
            return this.prisma.skillBucket.update({
                where: {
                    id
                },
                data: {
                    isActive: false
                }
            });
        }
        // Safe to hard delete
        return this.prisma.skillBucket.delete({
            where: {
                id
            }
        });
    }
    // ==========================================
    // ADMIN: Add/Remove Skill Requirements from Job
    // ==========================================
    async addSkillRequirementToJob(jobId, skillBucketId, displayOrder = 0) {
        // Verify job exists
        const job = await this.prisma.job.findUnique({
            where: {
                id: jobId
            }
        });
        if (!job) {
            throw new _common.NotFoundException('Job not found');
        }
        // Verify skill bucket exists
        const bucket = await this.prisma.skillBucket.findUnique({
            where: {
                id: skillBucketId
            }
        });
        if (!bucket) {
            throw new _common.NotFoundException('Skill bucket not found');
        }
        // Create the requirement (upsert to avoid duplicates)
        return this.prisma.jobRequiredSkillBucket.upsert({
            where: {
                jobId_skillBucketId: {
                    jobId,
                    skillBucketId
                }
            },
            create: {
                id: _crypto.randomUUID(),
                jobId,
                skillBucketId,
                displayOrder
            },
            update: {
                displayOrder
            },
            include: {
                SkillBucket: true
            }
        });
    }
    async removeSkillRequirementFromJob(jobId, skillBucketId) {
        const requirement = await this.prisma.jobRequiredSkillBucket.findUnique({
            where: {
                jobId_skillBucketId: {
                    jobId,
                    skillBucketId
                }
            }
        });
        if (!requirement) {
            throw new _common.NotFoundException('Skill requirement not found for this job');
        }
        return this.prisma.jobRequiredSkillBucket.delete({
            where: {
                jobId_skillBucketId: {
                    jobId,
                    skillBucketId
                }
            }
        });
    }
    async getJobSkillRequirements(jobId) {
        const job = await this.prisma.job.findUnique({
            where: {
                id: jobId
            },
            include: {
                SkillBucket: true,
                JobRequiredSkillBucket: {
                    include: {
                        SkillBucket: true
                    },
                    orderBy: {
                        displayOrder: 'asc'
                    }
                }
            }
        });
        if (!job) {
            throw new _common.NotFoundException('Job not found');
        }
        return {
            legacySkillBucket: job.SkillBucket,
            compositeRequirements: job.JobRequiredSkillBucket
        };
    }
    constructor(prisma){
        this.prisma = prisma;
        this.logger = new _common.Logger(SkillBucketService.name);
    }
};
SkillBucketService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], SkillBucketService);

//# sourceMappingURL=skill-bucket.service.js.map