import { TestService } from './test.service';
import { CreateTestDto, AddQuestionDto, SubmitAnswerDto, TestEventDto } from './dto';
export declare class TestController {
    private readonly testService;
    constructor(testService: TestService);
    createTest(dto: CreateTestDto): Promise<{
        id: string;
        title: string;
        description: string | null;
        duration: number;
        passingScore: number;
        totalQuestions: number;
        shuffleQuestions: boolean;
        maxTabSwitches: number;
        difficulty: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addQuestion(testId: string, dto: AddQuestionDto): Promise<{
        id: string;
        createdAt: Date;
        question: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        correctAnswer: number;
        explanation: string | null;
        points: number;
        orderIndex: number;
        testId: string;
    }>;
    getTest(testId: string): Promise<{
        questions: {
            id: string;
            createdAt: Date;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            correctAnswer: number;
            explanation: string | null;
            points: number;
            orderIndex: number;
            testId: string;
        }[];
    } & {
        id: string;
        title: string;
        description: string | null;
        duration: number;
        passingScore: number;
        totalQuestions: number;
        shuffleQuestions: boolean;
        maxTabSwitches: number;
        difficulty: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    startTest(applicationId: string, userId: string): Promise<{
        sessionId: string;
        testTitle: string;
        duration: number;
        totalQuestions: number;
        remainingTime: number;
        questions: {
            id: string;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            points: number;
        }[];
        answers: {
            questionId: string;
            selectedAnswer: number | null;
        }[];
        tabSwitchCount: number;
        maxTabSwitches: number;
    }>;
    getSession(sessionId: string, userId: string): Promise<{
        sessionId: string;
        testTitle: string;
        duration: number;
        totalQuestions: number;
        remainingTime: number;
        questions: {
            id: string;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            points: number;
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
    logEvent(sessionId: string, userId: string, dto: TestEventDto): Promise<{
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
}
