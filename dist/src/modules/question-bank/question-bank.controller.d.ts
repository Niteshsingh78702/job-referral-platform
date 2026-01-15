import { QuestionBankService } from './question-bank.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFiltersDto, BulkUploadDto } from './dto';
export declare class QuestionBankController {
    private questionBankService;
    constructor(questionBankService: QuestionBankService);
    createQuestion(dto: CreateQuestionDto, user: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
            isActive: boolean;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            correctAnswer: number;
            explanation: string | null;
            category: import("@prisma/client").$Enums.QuestionCategory;
            tags: string[];
            roleType: string | null;
            createdById: string;
        };
    }>;
    bulkUpload(dto: BulkUploadDto, user: any): Promise<{
        success: boolean;
        message: string;
        data: {
            success: number;
            failed: number;
            errors: {
                row: number;
                error: string;
            }[];
        };
    }>;
    getQuestions(filters: QuestionFiltersDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            correctAnswer: number;
            category: import("@prisma/client").$Enums.QuestionCategory;
            tags: string[];
            roleType: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getStats(): Promise<{
        success: boolean;
        data: {
            total: number;
            byRole: {
                roleType: string;
                count: number;
            }[];
            byDifficulty: {
                difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
                count: number;
            }[];
            byCategory: {
                category: import("@prisma/client").$Enums.QuestionCategory;
                count: number;
            }[];
        };
    }>;
    getRoleTypes(): Promise<{
        success: boolean;
        data: (string | null)[];
    }>;
    getQuestion(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
            isActive: boolean;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            correctAnswer: number;
            explanation: string | null;
            category: import("@prisma/client").$Enums.QuestionCategory;
            tags: string[];
            roleType: string | null;
            createdById: string;
        };
    }>;
    updateQuestion(id: string, dto: UpdateQuestionDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
            isActive: boolean;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            correctAnswer: number;
            explanation: string | null;
            category: import("@prisma/client").$Enums.QuestionCategory;
            tags: string[];
            roleType: string | null;
            createdById: string;
        };
    }>;
    deleteQuestion(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
