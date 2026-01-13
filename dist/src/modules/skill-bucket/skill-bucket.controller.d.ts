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
        })[];
    }>;
    getSkillBucketById(id: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    createSkillBucket(dto: CreateSkillBucketDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    updateSkillBucket(id: string, dto: UpdateSkillBucketDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
