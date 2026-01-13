import { PrismaService } from '../../prisma/prisma.service';
import { CreateSkillBucketDto, UpdateSkillBucketDto, SkillTestStatusDto } from './dto';
export declare class SkillBucketService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSkillBucket(dto: CreateSkillBucketDto): Promise<{
        test: {
            difficulty: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            duration: number;
            title: string;
            passingScore: number;
            totalQuestions: number;
            shuffleQuestions: boolean;
            maxTabSwitches: number;
        } | null;
    } & {
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        displayName: string | null;
        experienceMin: number;
        experienceMax: number;
        testId: string | null;
        testTemplateId: string | null;
    }>;
    updateSkillBucket(id: string, dto: UpdateSkillBucketDto): Promise<{
        test: {
            difficulty: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            duration: number;
            title: string;
            passingScore: number;
            totalQuestions: number;
            shuffleQuestions: boolean;
            maxTabSwitches: number;
        } | null;
    } & {
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        displayName: string | null;
        experienceMin: number;
        experienceMax: number;
        testId: string | null;
        testTemplateId: string | null;
    }>;
    getSkillBuckets(includeInactive?: boolean): Promise<({
        _count: {
            jobs: number;
            attempts: number;
        };
        test: {
            id: string;
            duration: number;
            title: string;
            totalQuestions: number;
        } | null;
    } & {
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        displayName: string | null;
        experienceMin: number;
        experienceMax: number;
        testId: string | null;
        testTemplateId: string | null;
    })[]>;
    getSkillBucketById(id: string): Promise<{
        test: {
            difficulty: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            duration: number;
            title: string;
            passingScore: number;
            totalQuestions: number;
            shuffleQuestions: boolean;
            maxTabSwitches: number;
        } | null;
    } & {
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        displayName: string | null;
        experienceMin: number;
        experienceMax: number;
        testId: string | null;
        testTemplateId: string | null;
    }>;
    getSkillBucketByCode(code: string): Promise<{
        test: {
            difficulty: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            duration: number;
            title: string;
            passingScore: number;
            totalQuestions: number;
            shuffleQuestions: boolean;
            maxTabSwitches: number;
        } | null;
    } & {
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        displayName: string | null;
        experienceMin: number;
        experienceMax: number;
        testId: string | null;
        testTemplateId: string | null;
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
        skillBucketCode: string;
        skillBucketName: string;
        displayName: string;
        score: number;
        validTill: Date | null;
        daysRemaining: number;
    }[]>;
}
