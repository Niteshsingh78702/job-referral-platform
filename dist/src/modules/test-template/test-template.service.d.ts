import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestTemplateDto, UpdateTestTemplateDto, TemplateFiltersDto, AssignTemplateDto } from './dto';
export declare class TestTemplateService {
    private prisma;
    constructor(prisma: PrismaService);
    createTemplate(dto: CreateTestTemplateDto): Promise<{
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
    }>;
    getTemplates(filters: TemplateFiltersDto): Promise<{
        templates: ({
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
    getTemplateById(id: string): Promise<{
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
    }>;
    updateTemplate(id: string, dto: UpdateTestTemplateDto): Promise<{
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
    }>;
    deleteTemplate(id: string): Promise<{
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
    }>;
    assignToSkillBucket(templateId: string, dto: AssignTemplateDto): Promise<{
        success: boolean;
        message: string;
    }>;
    unassignFromSkillBucket(skillBucketId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private getAvailableQuestionCount;
    previewQuestions(templateId: string, count?: number): Promise<{
        id: string;
        question: string;
        difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
        category: import("@prisma/client").$Enums.QuestionCategory;
        tags: string[];
    }[]>;
}
