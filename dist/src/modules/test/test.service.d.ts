import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestDto, AddQuestionDto, SubmitAnswerDto, TestEventDto } from './dto';
import { SkillBucketService } from '../skill-bucket/skill-bucket.service';
export declare class TestService {
    private prisma;
    private configService;
    private skillBucketService;
    private redis;
    private readonly logger;
    private sessionStore;
    constructor(prisma: PrismaService, configService: ConfigService, skillBucketService: SkillBucketService);
    private initRedis;
    private redisSet;
    private redisGet;
    private redisDel;
    createTest(dto: CreateTestDto): Promise<{
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
    }>;
    addQuestion(testId: string, dto: AddQuestionDto): Promise<{
        id: string;
        createdAt: Date;
        testId: string;
        question: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        correctAnswer: number;
        explanation: string | null;
        points: number;
        orderIndex: number;
    }>;
    getTestById(testId: string): Promise<{
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
    }>;
    startTest(applicationId: string, userId: string): Promise<{
        sessionId: string;
        testTitle: any;
        duration: any;
        totalQuestions: number;
        remainingTime: number;
        questions: any[];
        answers: any;
        tabSwitchCount: number;
        maxTabSwitches: number;
    }>;
    getTestSession(sessionId: string, userId: string): Promise<{
        sessionId: string;
        testTitle: any;
        duration: any;
        totalQuestions: number;
        remainingTime: number;
        questions: any[];
        answers: any;
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
