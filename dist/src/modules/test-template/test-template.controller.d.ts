import { TestTemplateService } from './test-template.service';
import { CreateTestTemplateDto, UpdateTestTemplateDto, TemplateFiltersDto, AssignTemplateDto } from './dto';
export declare class TestTemplateController {
    private testTemplateService;
    constructor(testTemplateService: TestTemplateService);
    createTemplate(dto: CreateTestTemplateDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            testType: import("@prisma/client").$Enums.TestType;
            duration: number;
            passingCriteria: number;
            questionPoolSize: number;
            autoSelect: boolean;
            selectionTags: string[];
            selectionRoleType: string | null;
            allowSkip: boolean;
            showLiveScore: boolean;
        };
    }>;
    getTemplates(filters: TemplateFiltersDto): Promise<{
        success: boolean;
        data: ({
            skillBuckets: {
                id: string;
                name: string;
                code: string;
            }[];
            _count: {
                testSessions: number;
            };
        } & {
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            testType: import("@prisma/client").$Enums.TestType;
            duration: number;
            passingCriteria: number;
            questionPoolSize: number;
            autoSelect: boolean;
            selectionTags: string[];
            selectionRoleType: string | null;
            allowSkip: boolean;
            showLiveScore: boolean;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getTemplate(id: string): Promise<{
        success: boolean;
        data: {
            availableQuestions: number;
            skillBuckets: {
                id: string;
                name: string;
                code: string;
            }[];
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            testType: import("@prisma/client").$Enums.TestType;
            duration: number;
            passingCriteria: number;
            questionPoolSize: number;
            autoSelect: boolean;
            selectionTags: string[];
            selectionRoleType: string | null;
            allowSkip: boolean;
            showLiveScore: boolean;
        };
    }>;
    previewQuestions(id: string, count?: number): Promise<{
        success: boolean;
        data: {
            id: string;
            question: string;
            difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
            category: import("@prisma/client").$Enums.QuestionCategory;
            tags: string[];
        }[];
    }>;
    updateTemplate(id: string, dto: UpdateTestTemplateDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            testType: import("@prisma/client").$Enums.TestType;
            duration: number;
            passingCriteria: number;
            questionPoolSize: number;
            autoSelect: boolean;
            selectionTags: string[];
            selectionRoleType: string | null;
            allowSkip: boolean;
            showLiveScore: boolean;
        };
    }>;
    assignToSkillBucket(id: string, dto: AssignTemplateDto): Promise<{
        success: boolean;
        message: string;
    }>;
    unassignFromSkillBucket(skillBucketId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteTemplate(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
