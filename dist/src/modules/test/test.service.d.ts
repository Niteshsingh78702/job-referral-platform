import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestDto, AddQuestionDto, SubmitAnswerDto, TestEventDto } from './dto';
export declare class TestService {
    private prisma;
    private configService;
    private redis;
    constructor(prisma: PrismaService, configService: ConfigService);
    createTest(dto: CreateTestDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        totalQuestions: number;
        duration: number;
        passingScore: number;
        shuffleQuestions: boolean;
        maxTabSwitches: number;
        difficulty: string;
        isActive: boolean;
    }>;
    addQuestion(testId: string, dto: AddQuestionDto): Promise<{
        id: string;
        createdAt: Date;
        points: number;
        testId: string;
        question: string;
        options: import("@prisma/client/runtime/client").JsonValue;
        correctAnswer: number;
        explanation: string | null;
        orderIndex: number;
    }>;
    getTestById(testId: string): Promise<{
        questions: {
            id: string;
            createdAt: Date;
            points: number;
            testId: string;
            question: string;
            options: import("@prisma/client/runtime/client").JsonValue;
            correctAnswer: number;
            explanation: string | null;
            orderIndex: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        totalQuestions: number;
        duration: number;
        passingScore: number;
        shuffleQuestions: boolean;
        maxTabSwitches: number;
        difficulty: string;
        isActive: boolean;
    }>;
    startTest(applicationId: string, userId: string): Promise<{
        sessionId: string;
        testTitle: string;
        duration: number;
        totalQuestions: number;
        remainingTime: number;
        questions: {
            id: string;
            points: number;
            question: string;
            options: import("@prisma/client/runtime/client").JsonValue;
        }[];
        answers: {
            questionId: string;
            selectedAnswer: number | null;
        }[];
        tabSwitchCount: number;
        maxTabSwitches: number;
    }>;
    getTestSession(sessionId: string, userId: string): Promise<{
        sessionId: string;
        testTitle: string;
        duration: number;
        totalQuestions: number;
        remainingTime: number;
        questions: {
            id: string;
            points: number;
            question: string;
            options: import("@prisma/client/runtime/client").JsonValue;
        }[];
        answers: {
            questionId: string;
            selectedAnswer: number | null;
        }[];
        tabSwitchCount: number;
        maxTabSwitches: number;
    }>;
    submitAnswer(sessionId: string, userId: string, dto: SubmitAnswerDto): Promise<{
        success: boolean;
        questionId: string;
    }>;
    submitTest(sessionId: string, userId: string): Promise<{
        success: boolean;
        sessionId: any;
        score: number;
        isPassed: boolean;
        correctAnswers: any;
        totalQuestions: any;
        isAutoSubmit: boolean;
    }>;
    logTestEvent(sessionId: string, userId: string, dto: TestEventDto): Promise<{
        success: boolean;
        autoSubmitted?: undefined;
        message?: undefined;
        warning?: undefined;
        remainingWarnings?: undefined;
    } | {
        success: boolean;
        autoSubmitted: boolean;
        message: string;
        warning?: undefined;
        remainingWarnings?: undefined;
    } | {
        success: boolean;
        warning: boolean;
        remainingWarnings: number;
        autoSubmitted?: undefined;
        message?: undefined;
    }>;
    private autoSubmitTest;
    private processTestSubmission;
    private shuffleArray;
}
