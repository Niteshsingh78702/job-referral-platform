import { PrismaService } from '../../prisma/prisma.service';
import { CreateSkillBucketDto, UpdateSkillBucketDto, SkillTestStatusDto } from './dto';
export declare class SkillBucketService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSkillBucket(dto: CreateSkillBucketDto): Promise<{
        test: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            duration: number;
            difficulty: string;
            totalQuestions: number;
            title: string;
            passingScore: number;
            shuffleQuestions: boolean;
            maxTabSwitches: number;
        } | null;
    } & {
        id: string;
        name: string;
        code: string;
        testId: string | null;
        description: string | null;
        displayName: string | null;
        experienceMin: number;
        experienceMax: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        testTemplateId: string | null;
    }>;
    updateSkillBucket(id: string, dto: UpdateSkillBucketDto): Promise<{
        test: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            duration: number;
            difficulty: string;
            totalQuestions: number;
            title: string;
            passingScore: number;
            shuffleQuestions: boolean;
            maxTabSwitches: number;
        } | null;
    } & {
        id: string;
        name: string;
        code: string;
        testId: string | null;
        description: string | null;
        displayName: string | null;
        experienceMin: number;
        experienceMax: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        testTemplateId: string | null;
    }>;
    getSkillBuckets(includeInactive?: boolean): Promise<({
        test: {
            id: string;
            duration: number;
            totalQuestions: number;
            title: string;
        } | null;
        _count: {
            jobs: number;
            attempts: number;
        };
    } & {
        id: string;
        name: string;
        code: string;
        testId: string | null;
        description: string | null;
        displayName: string | null;
        experienceMin: number;
        experienceMax: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        testTemplateId: string | null;
    })[]>;
    getSkillBucketById(id: string): Promise<{
        test: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            duration: number;
            difficulty: string;
            totalQuestions: number;
            title: string;
            passingScore: number;
            shuffleQuestions: boolean;
            maxTabSwitches: number;
        } | null;
    } & {
        id: string;
        name: string;
        code: string;
        testId: string | null;
        description: string | null;
        displayName: string | null;
        experienceMin: number;
        experienceMax: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        testTemplateId: string | null;
    }>;
    getSkillBucketByCode(code: string): Promise<{
        test: {
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            duration: number;
            difficulty: string;
            totalQuestions: number;
            title: string;
            passingScore: number;
            shuffleQuestions: boolean;
            maxTabSwitches: number;
        } | null;
    } & {
        id: string;
        name: string;
        code: string;
        testId: string | null;
        description: string | null;
        displayName: string | null;
        experienceMin: number;
        experienceMax: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        testTemplateId: string | null;
    }>;
    checkCandidateSkillStatus(candidateId: string, skillBucketId: string): Promise<SkillTestStatusDto>;
    checkCandidateSkillStatusByJobId(candidateId: string, jobId: string): Promise<SkillTestStatusDto | null>;
    recordSkillTestAttempt(candidateId: string, skillBucketId: string, isPassed: boolean, score: number, testSessionId?: string): Promise<{
        id: string;
        candidateId: string;
        skillBucketId: string;
        isPassed: boolean;
        score: number;
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
