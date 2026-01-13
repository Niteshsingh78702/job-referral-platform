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
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            duration: number;
            isActive: boolean;
            testType: import("@prisma/client").$Enums.TestType;
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
            _count: {
                testSessions: number;
            };
            skillBuckets: {
                id: string;
                name: string;
                code: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            duration: number;
            isActive: boolean;
            testType: import("@prisma/client").$Enums.TestType;
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
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            duration: number;
            isActive: boolean;
            testType: import("@prisma/client").$Enums.TestType;
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
            difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
            question: string;
            category: import("@prisma/client").$Enums.QuestionCategory;
            tags: string[];
        }[];
    }>;
    updateTemplate(id: string, dto: UpdateTestTemplateDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            duration: number;
            isActive: boolean;
            testType: import("@prisma/client").$Enums.TestType;
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
