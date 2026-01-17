import { InterviewService } from './interview.service';
import { ConfirmInterviewDto } from './dto';
export declare class InterviewController {
    private readonly interviewService;
    constructor(interviewService: InterviewService);
    confirmInterview(userId: string, applicationId: string, dto: ConfirmInterviewDto): Promise<{
        message: string;
        interview: {
            id: string;
            mode: import("@prisma/client").$Enums.InterviewMode;
            status: import("@prisma/client").$Enums.InterviewStatus;
            scheduledDate: Date | null;
            scheduledTime: string | null;
        };
    }>;
    getHRInterviews(userId: string, status?: string, jobId?: string): Promise<{
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
    }[]>;
    getCandidateInterviews(userId: string): Promise<({
        scheduledDate: Date | null;
        scheduledTime: string | null;
        hrNote: string | null;
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: any;
        createdAt: Date;
        paidAt: Date | null;
    } | {
        requiresPayment: boolean;
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: any;
        createdAt: Date;
        paidAt: Date | null;
    })[]>;
    getInterviewForCandidate(userId: string, interviewId: string): Promise<{
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: any;
        createdAt: Date;
    } | {
        message: string;
        requiresPayment: boolean;
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: any;
        createdAt: Date;
    } | {
        scheduledDate: Date | null;
        scheduledTime: string | null;
        hrNote: string | null;
        paidAt: Date | null;
        message: string;
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: any;
        createdAt: Date;
    } | {
        message: string;
        id: string;
        mode: import("@prisma/client").$Enums.InterviewMode;
        status: import("@prisma/client").$Enums.InterviewStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        job: any;
        createdAt: Date;
    }>;
    getAdminStats(): Promise<{
        total: number;
        byStatus: {
            confirmed: number;
            paymentSuccess: number;
            completed: number;
            candidateNoShow: number;
            hrNoShow: number;
        };
        flaggedHRs: unknown;
    }>;
    getAdminInterviews(page?: number, limit?: number, status?: string): Promise<{
        interviews: {
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
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    markNoShow(adminUserId: string, interviewId: string, type: 'CANDIDATE' | 'HR'): Promise<{
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
    markCompleted(adminUserId: string, interviewId: string): Promise<{
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
}
