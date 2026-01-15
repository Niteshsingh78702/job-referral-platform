import { PrismaService } from '../../prisma/prisma.service';
import { QuestionBankService } from '../question-bank/question-bank.service';
export declare class RapidFireTestService {
    private prisma;
    private questionBankService;
    private readonly TEST_DURATION_MS;
    constructor(prisma: PrismaService, questionBankService: QuestionBankService);
    canTakeTest(candidateId: string, skillBucketId: string): Promise<{
        canTake: boolean;
        status: string;
        validTill: Date | null;
        message: string;
        retestAllowedAt?: undefined;
        sessionId?: undefined;
        testTemplate?: undefined;
        skillBucket?: undefined;
    } | {
        canTake: boolean;
        status: string;
        retestAllowedAt: Date | null;
        message: string;
        validTill?: undefined;
        sessionId?: undefined;
        testTemplate?: undefined;
        skillBucket?: undefined;
    } | {
        canTake: boolean;
        status: string;
        sessionId: string;
        message: string;
        validTill?: undefined;
        retestAllowedAt?: undefined;
        testTemplate?: undefined;
        skillBucket?: undefined;
    } | {
        canTake: boolean;
        status: string;
        testTemplate: {
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
        } | null;
        skillBucket: {
            id: string;
            name: string;
            displayName: string | null;
        };
        validTill?: undefined;
        message?: undefined;
        retestAllowedAt?: undefined;
        sessionId?: undefined;
    }>;
    startTest(userId: string, candidateId: string, skillBucketId: string): Promise<{
        sessionId: string;
        testName: string;
        duration: number;
        totalQuestions: number;
        remainingTime: number;
        startedAt: string;
        endsAt: string;
    }>;
    getTestState(sessionId: string, userId: string): Promise<{
        sessionId: string;
        status: "ACTIVE" | "EXPIRED" | "SUBMITTED" | "EXITED";
        totalQuestions: number;
        answeredCount: number;
        remainingTime: number;
        questions: {
            index: number;
            id: string;
            question: string | undefined;
            options: import("@prisma/client/runtime/library").JsonValue | undefined;
            difficulty: import("@prisma/client").$Enums.QuestionDifficulty | undefined;
            answered: boolean;
            selectedAnswer: number;
        }[];
    }>;
    submitAnswer(sessionId: string, userId: string, questionId: string, selectedAnswer: number): Promise<{
        success: boolean;
        answeredCount: number;
        totalQuestions: number;
    }>;
    submitTest(sessionId: string, userId: string, isAutoSubmit?: boolean): Promise<{
        success: boolean;
        isAutoSubmit: boolean;
        score: number;
        correctCount: number;
        totalQuestions: number;
        isPassed: boolean;
        passingScore: number;
        message: string;
        results: any[] | undefined;
        retestAllowedAt: Date | null;
    }>;
    exitTest(sessionId: string, userId: string): Promise<{
        success: boolean;
        message: string;
        retestAllowedAt: Date;
    }>;
    private validateSession;
    getTestHistory(candidateId: string): Promise<{
        id: string;
        skillBucket: {
            id: string;
            name: string;
            displayName: string | null;
        };
        score: number;
        isPassed: boolean;
        attemptedAt: Date;
        validTill: Date | null;
        retestAllowedAt: Date | null;
    }[]>;
}
