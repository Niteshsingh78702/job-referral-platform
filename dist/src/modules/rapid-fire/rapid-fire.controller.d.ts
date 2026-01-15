import { RapidFireTestService } from './rapid-fire.service';
export declare class RapidFireController {
    private rapidFireService;
    constructor(rapidFireService: RapidFireTestService);
    checkEligibility(skillBucketId: string, user: any): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    startTest(skillBucketId: string, user: any): Promise<{
        success: boolean;
        message: string;
        data: {
            sessionId: string;
            testName: string;
            duration: number;
            totalQuestions: number;
            remainingTime: number;
            startedAt: string;
            endsAt: string;
        };
    }>;
    getTestState(sessionId: string, user: any): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    submitAnswer(sessionId: string, body: {
        questionId: string;
        selectedAnswer: number;
    }, user: any): Promise<{
        success: boolean;
        data: {
            success: boolean;
            answeredCount: number;
            totalQuestions: number;
        };
    }>;
    submitTest(sessionId: string, user: any): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    exitTest(sessionId: string, user: any): Promise<{
        success: boolean;
        data: {
            success: boolean;
            message: string;
            retestAllowedAt: Date;
        };
    }>;
    getTestHistory(user: any): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
}
