export declare enum InterviewMode {
    CALL = "CALL",
    VIDEO = "VIDEO",
    ONSITE = "ONSITE"
}
export declare class RequestInterviewDto {
    mode: InterviewMode;
    preferredTimeWindow?: string;
    hrNotes?: string;
}
