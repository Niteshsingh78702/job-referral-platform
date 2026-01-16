export declare enum InterviewMode {
    CALL = "CALL",
    VIDEO = "VIDEO",
    ONSITE = "ONSITE"
}
export declare class ConfirmInterviewDto {
    scheduledDate: string;
    scheduledTime: string;
    mode: InterviewMode;
    hrNote?: string;
}
