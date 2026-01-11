import { ReferralService } from './referral.service';
import { ConfirmReferralDto } from './dto';
export declare class ReferralController {
    private readonly referralService;
    constructor(referralService: ReferralService);
    getPendingForHR(userId: string): Promise<({
        application: {
            candidate: {
                firstName: string;
                lastName: string;
                headline: string | null;
                totalExperience: number | null;
                currentCompany: string | null;
                skills: {
                    id: string;
                    name: string;
                    level: number;
                    yearsOfExp: number | null;
                    candidateId: string;
                }[];
            };
            job: {
                companyName: string;
                title: string;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            updatedAt: Date;
            candidateId: string;
            jobId: string;
            coverLetter: string | null;
            testScore: number | null;
            testPassedAt: Date | null;
            contactUnlockedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ReferralStatus;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.ReferralType;
        expiresAt: Date | null;
        employeeId: string | null;
        hrId: string | null;
        applicationId: string;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    })[]>;
    getPendingForEmployee(userId: string): Promise<({
        application: {
            candidate: {
                firstName: string;
                lastName: string;
                headline: string | null;
                totalExperience: number | null;
                skills: {
                    id: string;
                    name: string;
                    level: number;
                    yearsOfExp: number | null;
                    candidateId: string;
                }[];
            };
            job: {
                companyName: string;
                location: string;
                title: string;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            updatedAt: Date;
            candidateId: string;
            jobId: string;
            coverLetter: string | null;
            testScore: number | null;
            testPassedAt: Date | null;
            contactUnlockedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ReferralStatus;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.ReferralType;
        expiresAt: Date | null;
        employeeId: string | null;
        hrId: string | null;
        applicationId: string;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    })[]>;
    confirmReferral(referralId: string, userId: string, userRole: string, dto: ConfirmReferralDto): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ReferralStatus;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.ReferralType;
        expiresAt: Date | null;
        employeeId: string | null;
        hrId: string | null;
        applicationId: string;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    }>;
    markAsContacted(referralId: string, userId: string, feedback?: string): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ReferralStatus;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.ReferralType;
        expiresAt: Date | null;
        employeeId: string | null;
        hrId: string | null;
        applicationId: string;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    }>;
    closeReferral(referralId: string, userId: string, feedback?: string): Promise<{
        success: boolean;
    }>;
    getReferralHistory(userId: string, userRole: string): Promise<({
        application: {
            candidate: {
                firstName: string;
                lastName: string;
            };
            job: {
                title: string;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            updatedAt: Date;
            candidateId: string;
            jobId: string;
            coverLetter: string | null;
            testScore: number | null;
            testPassedAt: Date | null;
            contactUnlockedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ReferralStatus;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.ReferralType;
        expiresAt: Date | null;
        employeeId: string | null;
        hrId: string | null;
        applicationId: string;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    })[]>;
}
