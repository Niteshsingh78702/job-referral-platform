import { InterviewService } from './interview.service';
import { RequestInterviewDto, ScheduleInterviewDto } from './dto';
export declare class InterviewController {
    private readonly interviewService;
    constructor(interviewService: InterviewService);
    requestInterview(userId: string, applicationId: string, dto: RequestInterviewDto): Promise<{
        message: string;
        interview: {
            id: string;
            mode: import("@prisma/client").$Enums.InterviewMode;
            status: import("@prisma/client").$Enums.InterviewStatus;
            preferredTimeWindow: string | null;
        };
    }>;
    scheduleInterview(userId: string, interviewId: string, dto: ScheduleInterviewDto): Promise<{
        message: string;
        interview: {
            id: string;
            status: import("@prisma/client").$Enums.InterviewStatus;
            createdAt: Date;
            updatedAt: Date;
            mode: import("@prisma/client").$Enums.InterviewMode;
            applicationId: string;
            paidAt: Date | null;
            preferredTimeWindow: string | null;
            hrNotes: string | null;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            scheduledDate: Date | null;
            scheduledTime: string | null;
            interviewLink: string | null;
            callDetails: string | null;
            requestedAt: Date;
            scheduledAt: Date | null;
            completedAt: Date | null;
        };
    }>;
    getHRInterviews(userId: string, status?: string, jobId?: string): Promise<({
        application: {
            candidate: {
                id: string;
                user: {
                    email: string;
                };
                firstName: string;
                lastName: string;
            };
            job: {
                id: string;
                title: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            createdAt: Date;
            updatedAt: Date;
            jobId: string;
            candidateId: string;
            coverLetter: string | null;
            testScore: number | null;
            testPassedAt: Date | null;
            contactUnlockedAt: Date | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.InterviewStatus;
        createdAt: Date;
        updatedAt: Date;
        mode: import("@prisma/client").$Enums.InterviewMode;
        applicationId: string;
        paidAt: Date | null;
        preferredTimeWindow: string | null;
        hrNotes: string | null;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        scheduledDate: Date | null;
        scheduledTime: string | null;
        interviewLink: string | null;
        callDetails: string | null;
        requestedAt: Date;
        scheduledAt: Date | null;
        completedAt: Date | null;
    })[]>;
    getCandidateInterviews(userId: string): Promise<({
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: {
            id: string;
            companyName: string;
            title: string;
        };
        requestedAt: Date;
        paidAt: Date | null;
    } | {
        scheduledDate: Date | null;
        scheduledTime: string | null;
        interviewLink: string | null;
        callDetails: string | null;
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: {
            id: string;
            companyName: string;
            title: string;
        };
        requestedAt: Date;
        paidAt: Date | null;
    })[]>;
    getInterviewForCandidate(userId: string, interviewId: string): Promise<{
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: {
            id: string;
            companyName: string;
            title: string;
        };
        requestedAt: Date;
    } | {
        message: string;
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: {
            id: string;
            companyName: string;
            title: string;
        };
        requestedAt: Date;
    } | {
        message: string;
        paidAt: Date | null;
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: {
            id: string;
            companyName: string;
            title: string;
        };
        requestedAt: Date;
    } | {
        scheduledDate: Date | null;
        scheduledTime: string | null;
        interviewLink: string | null;
        callDetails: string | null;
        paidAt: Date | null;
        scheduledAt: Date | null;
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: {
            id: string;
            companyName: string;
            title: string;
        };
        requestedAt: Date;
    } | {
        scheduledDate: Date | null;
        scheduledTime: string | null;
        completedAt: Date | null;
        message: string;
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: {
            id: string;
            companyName: string;
            title: string;
        };
        requestedAt: Date;
    }>;
    getAdminStats(): Promise<{
        total: number;
        byStatus: {
            paymentPending: number;
            readyToSchedule: number;
            scheduled: number;
            completed: number;
        };
        flaggedHRs: unknown;
    }>;
    getAdminInterviews(page?: number, limit?: number, status?: string): Promise<{
        interviews: ({
            application: {
                candidate: {
                    firstName: string;
                    lastName: string;
                };
                job: {
                    hr: {
                        companyName: string;
                    } | null;
                    companyName: string;
                    title: string;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                createdAt: Date;
                updatedAt: Date;
                jobId: string;
                candidateId: string;
                coverLetter: string | null;
                testScore: number | null;
                testPassedAt: Date | null;
                contactUnlockedAt: Date | null;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.InterviewStatus;
            createdAt: Date;
            updatedAt: Date;
            mode: import("@prisma/client").$Enums.InterviewMode;
            applicationId: string;
            paidAt: Date | null;
            preferredTimeWindow: string | null;
            hrNotes: string | null;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            scheduledDate: Date | null;
            scheduledTime: string | null;
            interviewLink: string | null;
            callDetails: string | null;
            requestedAt: Date;
            scheduledAt: Date | null;
            completedAt: Date | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
