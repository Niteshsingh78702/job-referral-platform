import { PrismaService } from '../../prisma/prisma.service';
import { CreateSkillBucketDto, UpdateSkillBucketDto, SkillTestStatusDto } from './dto';
export declare class SkillBucketService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSkillBucket(dto: CreateSkillBucketDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        testId: string | null;
        experienceMin: number;
        experienceMax: number;
        testTemplateId: string | null;
        code: string;
        displayName: string | null;
    }>;
    updateSkillBucket(id: string, dto: UpdateSkillBucketDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        testId: string | null;
        experienceMin: number;
        experienceMax: number;
        testTemplateId: string | null;
        code: string;
        displayName: string | null;
    }>;
    getSkillBuckets(includeInactive?: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        testId: string | null;
        experienceMin: number;
        experienceMax: number;
        testTemplateId: string | null;
        code: string;
        displayName: string | null;
    }[]>;
    getSkillBucketById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        testId: string | null;
        experienceMin: number;
        experienceMax: number;
        testTemplateId: string | null;
        code: string;
        displayName: string | null;
    }>;
    getSkillBucketByCode(code: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        testId: string | null;
        experienceMin: number;
        experienceMax: number;
        testTemplateId: string | null;
        code: string;
        displayName: string | null;
    }>;
    checkCandidateSkillStatus(candidateId: string, skillBucketId: string): Promise<SkillTestStatusDto>;
    checkCandidateSkillStatusByJobId(candidateId: string, jobId: string): Promise<SkillTestStatusDto | null>;
    recordSkillTestAttempt(candidateId: string, skillBucketId: string, isPassed: boolean, score: number, testSessionId?: string): Promise<{
        id: string;
        skillBucketId: string;
        candidateId: string;
        score: number;
        isPassed: boolean;
        attemptedAt: Date;
        validTill: Date | null;
        retestAllowedAt: Date | null;
        testSessionId: string | null;
    }>;
    getCandidateValidPasses(candidateId: string): Promise<{
        skillBucketCode: any;
        skillBucketName: any;
        displayName: any;
        score: number;
        validTill: Date | null;
        daysRemaining: number;
    }[]>;
    checkAllRequiredSkillsForJob(candidateId: string, jobId: string): Promise<{
        canApply: boolean;
        missingTests: SkillTestStatusDto[];
        passedTests: SkillTestStatusDto[];
        hasRequirements: boolean;
    }>;
    deleteSkillBucket(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        testId: string | null;
        experienceMin: number;
        experienceMax: number;
        testTemplateId: string | null;
        code: string;
        displayName: string | null;
    }>;
    addSkillRequirementToJob(jobId: string, skillBucketId: string, displayOrder?: number): Promise<{
        id: string;
        createdAt: Date;
        skillBucketId: string;
        jobId: string;
        displayOrder: number;
    }>;
    removeSkillRequirementFromJob(jobId: string, skillBucketId: string): Promise<{
        id: string;
        createdAt: Date;
        skillBucketId: string;
        jobId: string;
        displayOrder: number;
    }>;
    getJobSkillRequirements(jobId: string): Promise<{
        legacySkillBucket: any;
        compositeRequirements: any;
    }>;
}
