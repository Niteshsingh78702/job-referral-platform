import { SkillBucketService } from './skill-bucket.service';
import { CreateSkillBucketDto, UpdateSkillBucketDto } from './dto';
export declare class SkillBucketController {
    private readonly skillBucketService;
    constructor(skillBucketService: SkillBucketService);
    getSkillBuckets(includeInactive?: string): Promise<{
        success: boolean;
        data: ({
            test: {
                id: string;
                title: string;
                duration: number;
                totalQuestions: number;
            } | null;
            _count: {
                jobs: number;
                attempts: number;
            };
        } & {
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
        })[];
    }>;
    getSkillBucketById(id: string): Promise<{
        success: boolean;
        data: {
            test: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                description: string | null;
                duration: number;
                passingScore: number;
                totalQuestions: number;
                shuffleQuestions: boolean;
                maxTabSwitches: number;
                difficulty: string;
                isActive: boolean;
            } | null;
        } & {
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
        };
    }>;
    createSkillBucket(dto: CreateSkillBucketDto): Promise<{
        success: boolean;
        message: string;
        data: {
            test: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                description: string | null;
                duration: number;
                passingScore: number;
                totalQuestions: number;
                shuffleQuestions: boolean;
                maxTabSwitches: number;
                difficulty: string;
                isActive: boolean;
            } | null;
        } & {
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
        };
    }>;
    updateSkillBucket(id: string, dto: UpdateSkillBucketDto): Promise<{
        success: boolean;
        message: string;
        data: {
            test: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                description: string | null;
                duration: number;
                passingScore: number;
                totalQuestions: number;
                shuffleQuestions: boolean;
                maxTabSwitches: number;
                difficulty: string;
                isActive: boolean;
            } | null;
        } & {
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
