import { ReferralService } from './referral.service';
import { ConfirmReferralDto } from './dto';
export declare class ReferralController {
    private readonly referralService;
    constructor(referralService: ReferralService);
    getPendingForHR(userId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        updatedAt: Date;
        hrId: string | null;
        expiresAt: Date | null;
        employeeId: string | null;
        type: import("@prisma/client").$Enums.ReferralType;
        applicationId: string;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    }[]>;
    getPendingForEmployee(userId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        updatedAt: Date;
        hrId: string | null;
        expiresAt: Date | null;
        employeeId: string | null;
        type: import("@prisma/client").$Enums.ReferralType;
        applicationId: string;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    }[]>;
    confirmReferral(referralId: string, userId: string, userRole: string, dto: ConfirmReferralDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        updatedAt: Date;
        hrId: string | null;
        expiresAt: Date | null;
        employeeId: string | null;
        type: import("@prisma/client").$Enums.ReferralType;
        applicationId: string;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    }>;
    markAsContacted(referralId: string, userId: string, feedback?: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        updatedAt: Date;
        hrId: string | null;
        expiresAt: Date | null;
        employeeId: string | null;
        type: import("@prisma/client").$Enums.ReferralType;
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
    getReferralHistory(userId: string, userRole: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        updatedAt: Date;
        hrId: string | null;
        expiresAt: Date | null;
        employeeId: string | null;
        type: import("@prisma/client").$Enums.ReferralType;
        applicationId: string;
        confirmedAt: Date | null;
        contactedAt: Date | null;
        closedAt: Date | null;
        hrFeedback: string | null;
        candidateFeedback: string | null;
    }[]>;
}
