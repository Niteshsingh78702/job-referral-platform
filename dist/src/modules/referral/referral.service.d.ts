import { PrismaService } from '../../prisma/prisma.service';
import { ConfirmReferralDto } from './dto';
export declare class ReferralService {
    private prisma;
    constructor(prisma: PrismaService);
    getPendingReferralsForHR(hrUserId: string): Promise<({
        application: {
            candidate: {
                skills: {
                    id: string;
                    candidateId: string;
                    name: string;
                    level: number;
                    yearsOfExp: number | null;
                }[];
                firstName: string;
                lastName: string;
                headline: string | null;
                totalExperience: number | null;
                currentCompany: string | null;
            };
            job: {
                title: string;
                companyName: string;
            };
        } & {
            id: string;
            candidateId: string;
            jobId: string;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            coverLetter: string | null;
            testScore: number | null;
            testPassedAt: Date | null;
            contactUnlockedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
        type: import("@prisma/client").$Enums.ReferralType;
        employeeId: string | null;
        hrId: string | null;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        expiresAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    })[]>;
    getPendingReferralsForEmployee(employeeUserId: string): Promise<({
        application: {
            candidate: {
                skills: {
                    id: string;
                    candidateId: string;
                    name: string;
                    level: number;
                    yearsOfExp: number | null;
                }[];
                firstName: string;
                lastName: string;
                headline: string | null;
                totalExperience: number | null;
            };
            job: {
                title: string;
                companyName: string;
                location: string;
            };
        } & {
            id: string;
            candidateId: string;
            jobId: string;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            coverLetter: string | null;
            testScore: number | null;
            testPassedAt: Date | null;
            contactUnlockedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
        type: import("@prisma/client").$Enums.ReferralType;
        employeeId: string | null;
        hrId: string | null;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        expiresAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    })[]>;
    confirmReferral(referralId: string, userId: string, userRole: string, dto: ConfirmReferralDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
        type: import("@prisma/client").$Enums.ReferralType;
        employeeId: string | null;
        hrId: string | null;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        expiresAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    }>;
    markAsContacted(referralId: string, userId: string, feedback?: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
        type: import("@prisma/client").$Enums.ReferralType;
        employeeId: string | null;
        hrId: string | null;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        expiresAt: Date | null;
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
            candidateId: string;
            jobId: string;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            coverLetter: string | null;
            testScore: number | null;
            testPassedAt: Date | null;
            contactUnlockedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
        type: import("@prisma/client").$Enums.ReferralType;
        employeeId: string | null;
        hrId: string | null;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        expiresAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    })[]>;
}
