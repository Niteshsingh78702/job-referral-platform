import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFiltersDto, BulkQuestionDto } from './dto';
export declare class QuestionBankService {
    private prisma;
    constructor(prisma: PrismaService);
    createQuestion(dto: CreateQuestionDto, createdById: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        question: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        correctAnswer: number;
        explanation: string | null;
        difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
        category: import("@prisma/client").$Enums.QuestionCategory;
        tags: string[];
        roleType: string | null;
        createdById: string;
    }>;
    bulkUpload(questions: BulkQuestionDto[], createdById: string): Promise<{
        success: number;
        failed: number;
        errors: {
            row: number;
            error: string;
        }[];
    }>;
    getQuestions(filters: QuestionFiltersDto): Promise<{
        questions: {
            id: string;
            createdAt: Date;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            correctAnswer: number;
            difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
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
    getQuestionById(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        question: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        correctAnswer: number;
        explanation: string | null;
        difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
        category: import("@prisma/client").$Enums.QuestionCategory;
        tags: string[];
        roleType: string | null;
        createdById: string;
    }>;
    updateQuestion(id: string, dto: UpdateQuestionDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        question: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        correctAnswer: number;
        explanation: string | null;
        difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
        category: import("@prisma/client").$Enums.QuestionCategory;
        tags: string[];
        roleType: string | null;
        createdById: string;
    }>;
    deleteQuestion(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        question: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        correctAnswer: number;
        explanation: string | null;
        difficulty: import("@prisma/client").$Enums.QuestionDifficulty;
        category: import("@prisma/client").$Enums.QuestionCategory;
        tags: string[];
        roleType: string | null;
        createdById: string;
    }>;
    getRandomQuestions(params: {
        count: number;
        roleType?: string;
        tags?: string[];
        difficulty?: string;
    }): Promise<any[]>;
    getStats(): Promise<{
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
    }>;
    getRoleTypes(): Promise<(string | null)[]>;
    private shuffleArray;
}
