export declare class CreateTestDto {
    title: string;
    description?: string;
    duration?: number;
    passingScore?: number;
    totalQuestions?: number;
    shuffleQuestions?: boolean;
    maxTabSwitches?: number;
    difficulty?: string;
}
export declare class AddQuestionDto {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    points?: number;
}
export declare class SubmitAnswerDto {
    questionId: string;
    selectedAnswer: number;
}
export declare class TestEventDto {
    eventType: 'TAB_SWITCH' | 'COPY_ATTEMPT' | 'PASTE_ATTEMPT' | 'RIGHT_CLICK' | 'FOCUS_LOST';
    eventData?: any;
}
