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
var SkillBucketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillBucketService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const TEST_VALIDITY_DAYS = 7;
const RETEST_COOLDOWN_HOURS = 24;
let SkillBucketService = SkillBucketService_1 = class SkillBucketService {
    prisma;
    logger = new common_1.Logger(SkillBucketService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSkillBucket(dto) {
        const existing = await this.prisma.skillBucket.findUnique({
            where: { code: dto.code },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Skill bucket with code '${dto.code}' already exists`);
        }
        return this.prisma.skillBucket.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                displayName: dto.displayName || `HR Shortlisting Check - ${dto.name}`,
                experienceMin: dto.experienceMin ?? 0,
                experienceMax: dto.experienceMax ?? 3,
                testId: dto.testId,
            },
            include: {
                test: true,
            },
        });
    }
    async updateSkillBucket(id, dto) {
        const bucket = await this.prisma.skillBucket.findUnique({
            where: { id },
        });
        if (!bucket) {
            throw new common_1.NotFoundException('Skill bucket not found');
        }
        return this.prisma.skillBucket.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                displayName: dto.displayName,
                experienceMin: dto.experienceMin,
                experienceMax: dto.experienceMax,
                isActive: dto.isActive,
                testId: dto.testId,
            },
            include: {
                test: true,
            },
        });
    }
    async getSkillBuckets(includeInactive = false) {
        return this.prisma.skillBucket.findMany({
            where: includeInactive ? {} : { isActive: true },
            include: {
                test: {
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                        totalQuestions: true,
                    },
                },
                _count: {
                    select: {
                        jobs: true,
                        attempts: true,
                    },
                },
            },
            orderBy: { code: 'asc' },
        });
    }
    async getSkillBucketById(id) {
        const bucket = await this.prisma.skillBucket.findUnique({
            where: { id },
            include: {
                test: true,
            },
        });
        if (!bucket) {
            throw new common_1.NotFoundException('Skill bucket not found');
        }
        return bucket;
    }
    async getSkillBucketByCode(code) {
        const bucket = await this.prisma.skillBucket.findUnique({
            where: { code },
            include: {
                test: true,
            },
        });
        if (!bucket) {
            throw new common_1.NotFoundException(`Skill bucket '${code}' not found`);
        }
        return bucket;
    }
    async checkCandidateSkillStatus(candidateId, skillBucketId) {
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: { id: skillBucketId },
        });
        if (!skillBucket) {
            throw new common_1.NotFoundException('Skill bucket not found');
        }
        const latestAttempt = await this.prisma.skillTestAttempt.findFirst({
            where: {
                candidateId,
                skillBucketId,
            },
            orderBy: { attemptedAt: 'desc' },
        });
        const now = new Date();
        if (!latestAttempt) {
            return {
                skillBucketId,
                skillBucketCode: skillBucket.code,
                skillBucketName: skillBucket.name,
                displayName: skillBucket.displayName || skillBucket.name,
                isPassed: false,
                isValid: false,
                isFailed: false,
                canRetest: true,
                neverTaken: true,
            };
        }
        if (latestAttempt.isPassed) {
            const validTill = latestAttempt.validTill;
            const isValid = now <= validTill;
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
                canRetest: !isValid,
                neverTaken: false,
            };
        }
        const retestAllowedAt = latestAttempt.retestAllowedAt;
        const canRetest = now >= retestAllowedAt;
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
            neverTaken: false,
        };
    }
    async checkCandidateSkillStatusByJobId(candidateId, jobId) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            select: { skillBucketId: true },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        if (!job.skillBucketId) {
            return null;
        }
        return this.checkCandidateSkillStatus(candidateId, job.skillBucketId);
    }
    async recordSkillTestAttempt(candidateId, skillBucketId, isPassed, score, testSessionId) {
        const now = new Date();
        let validTill = null;
        let retestAllowedAt = null;
        if (isPassed) {
            validTill = new Date(now.getTime() + TEST_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
        }
        else {
            retestAllowedAt = new Date(now.getTime() + RETEST_COOLDOWN_HOURS * 60 * 60 * 1000);
        }
        const attempt = await this.prisma.skillTestAttempt.create({
            data: {
                candidateId,
                skillBucketId,
                isPassed,
                score,
                validTill,
                retestAllowedAt,
                testSessionId,
            },
        });
        this.logger.log(`Recorded skill test attempt: candidate=${candidateId}, skill=${skillBucketId}, ` +
            `passed=${isPassed}, score=${score}, validTill=${validTill}, retestAllowedAt=${retestAllowedAt}`);
        return attempt;
    }
    async getCandidateValidPasses(candidateId) {
        const now = new Date();
        const validAttempts = await this.prisma.skillTestAttempt.findMany({
            where: {
                candidateId,
                isPassed: true,
                validTill: {
                    gte: now,
                },
            },
            include: {
                skillBucket: {
                    select: {
                        code: true,
                        name: true,
                        displayName: true,
                    },
                },
            },
            orderBy: { validTill: 'desc' },
        });
        return validAttempts.map(attempt => ({
            skillBucketCode: attempt.skillBucket.code,
            skillBucketName: attempt.skillBucket.name,
            displayName: attempt.skillBucket.displayName || attempt.skillBucket.name,
            score: attempt.score,
            validTill: attempt.validTill,
            daysRemaining: Math.ceil((attempt.validTill.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        }));
    }
};
exports.SkillBucketService = SkillBucketService;
exports.SkillBucketService = SkillBucketService = SkillBucketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SkillBucketService);
//# sourceMappingURL=skill-bucket.service.js.map