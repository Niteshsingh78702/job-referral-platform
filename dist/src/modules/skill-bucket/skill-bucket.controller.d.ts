import { SkillBucketService } from './skill-bucket.service';
import { CreateSkillBucketDto, UpdateSkillBucketDto } from './dto';
export declare class SkillBucketController {
    private readonly skillBucketService;
    constructor(skillBucketService: SkillBucketService);
    getSkillBuckets(includeInactive?: string): Promise<{
        success: boolean;
        data: ({
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
        })[];
    }>;
    getSkillBucketById(id: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    createSkillBucket(dto: CreateSkillBucketDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    updateSkillBucket(id: string, dto: UpdateSkillBucketDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    getSkillStatus(skillBucketId: string, candidateId: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: import("./dto").SkillTestStatusDto;
        message?: undefined;
    }>;
    getValidPasses(candidateId: string): Promise<{
        success: boolean;
        data: {
            skillBucketCode: string;
            skillBucketName: string;
            displayName: string;
            score: number;
            validTill: Date | null;
            daysRemaining: number;
        }[];
    }>;
}
