import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSkillBucketDto, UpdateSkillBucketDto, SkillTestStatusDto } from './dto';

// Validity duration in days
const TEST_VALIDITY_DAYS = 7;
// Retest cooldown in hours
const RETEST_COOLDOWN_HOURS = 24;

@Injectable()
export class SkillBucketService {
    private readonly logger = new Logger(SkillBucketService.name);

    constructor(private prisma: PrismaService) { }

    // ==========================================
    // ADMIN: Skill Bucket Management
    // ==========================================

    async createSkillBucket(dto: CreateSkillBucketDto) {
        // Check if code already exists
        const existing = await this.prisma.skillBucket.findUnique({
            where: { code: dto.code },
        });

        if (existing) {
            throw new BadRequestException(`Skill bucket with code '${dto.code}' already exists`);
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

    async updateSkillBucket(id: string, dto: UpdateSkillBucketDto) {
        const bucket = await this.prisma.skillBucket.findUnique({
            where: { id },
        });

        if (!bucket) {
            throw new NotFoundException('Skill bucket not found');
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

    async getSkillBucketById(id: string) {
        const bucket = await this.prisma.skillBucket.findUnique({
            where: { id },
            include: {
                test: true,
            },
        });

        if (!bucket) {
            throw new NotFoundException('Skill bucket not found');
        }

        return bucket;
    }

    async getSkillBucketByCode(code: string) {
        const bucket = await this.prisma.skillBucket.findUnique({
            where: { code },
            include: {
                test: true,
            },
        });

        if (!bucket) {
            throw new NotFoundException(`Skill bucket '${code}' not found`);
        }

        return bucket;
    }

    // ==========================================
    // CANDIDATE: Skill Test Status Check
    // ==========================================

    /**
     * Check candidate's skill test status for a specific skill bucket
     * This is the CORE logic for determining:
     * - If candidate has a valid pass (can apply without test)
     * - If candidate has an expired pass (needs retest)
     * - If candidate failed and is in cooldown (cannot retest yet)
     * - If candidate failed and can retest (cooldown expired)
     * - If candidate never took the test
     */
    async checkCandidateSkillStatus(
        candidateId: string,
        skillBucketId: string,
    ): Promise<SkillTestStatusDto> {
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: { id: skillBucketId },
        });

        if (!skillBucket) {
            throw new NotFoundException('Skill bucket not found');
        }

        // Get the most recent attempt for this candidate + skill bucket
        const latestAttempt = await this.prisma.skillTestAttempt.findFirst({
            where: {
                candidateId,
                skillBucketId,
            },
            orderBy: { attemptedAt: 'desc' },
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
                canRetest: true,
                neverTaken: true,
            };
        }

        // Passed attempt
        if (latestAttempt.isPassed) {
            const validTill = latestAttempt.validTill!;
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
                canRetest: !isValid, // Can retest if expired
                neverTaken: false,
            };
        }

        // Failed attempt
        const retestAllowedAt = latestAttempt.retestAllowedAt!;
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
            neverTaken: false,
        };
    }

    /**
     * Check skill status by Job ID (for apply flow)
     */
    async checkCandidateSkillStatusByJobId(
        candidateId: string,
        jobId: string,
    ): Promise<SkillTestStatusDto | null> {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            select: { skillBucketId: true },
        });

        if (!job) {
            throw new NotFoundException('Job not found');
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
     */
    async recordSkillTestAttempt(
        candidateId: string,
        skillBucketId: string,
        isPassed: boolean,
        score: number,
        testSessionId?: string,
    ) {
        const now = new Date();

        // Calculate validity or cooldown based on result
        let validTill: Date | null = null;
        let retestAllowedAt: Date | null = null;

        if (isPassed) {
            // Valid for 7 days
            validTill = new Date(now.getTime() + TEST_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
        } else {
            // Cooldown for 24 hours
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

        this.logger.log(
            `Recorded skill test attempt: candidate=${candidateId}, skill=${skillBucketId}, ` +
            `passed=${isPassed}, score=${score}, validTill=${validTill}, retestAllowedAt=${retestAllowedAt}`
        );

        return attempt;
    }

    /**
     * Get all valid skill passes for a candidate (for displaying badges)
     */
    async getCandidateValidPasses(candidateId: string) {
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
            daysRemaining: Math.ceil(
                (attempt.validTill!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            ),
        }));
    }
}
