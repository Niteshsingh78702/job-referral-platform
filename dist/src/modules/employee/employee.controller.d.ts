import { EmployeeService } from './employee.service';
import { UpdateEmployeeProfileDto, ReferralFiltersDto, EarningsFiltersDto } from './dto';
export declare class EmployeeController {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    getProfile(userId: string): Promise<{
        currentTier: {
            current: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                minReferrals: number;
                commissionPercent: number;
                bonusPerReferral: number;
                badgeIcon: string | null;
            } | null;
            next: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                minReferrals: number;
                commissionPercent: number;
                bonusPerReferral: number;
                badgeIcon: string | null;
            } | null;
            referralsToNextTier: number | null;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyName: string;
        companyEmail: string;
        designation: string | null;
        linkedinUrl: string | null;
        points: number;
        employeeId: string | null;
        isVerified: boolean;
        verifiedAt: Date | null;
        referralCount: number;
        successfulReferrals: number;
        badges: string[];
    }>;
    updateProfile(userId: string, dto: UpdateEmployeeProfileDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyName: string;
        companyEmail: string;
        designation: string | null;
        linkedinUrl: string | null;
        points: number;
        employeeId: string | null;
        isVerified: boolean;
        verifiedAt: Date | null;
        referralCount: number;
        successfulReferrals: number;
        badges: string[];
    }>;
    getDashboardStats(userId: string): Promise<{
        totalReferrals: number;
        successfulReferrals: number;
        pendingReferrals: number;
        confirmedReferrals: number;
        availableReferrals: number;
        thisMonthReferrals: number;
        totalEarnings: number;
        paidEarnings: number;
        pendingEarnings: number;
        points: number;
        badges: string[];
        currentTier: {
            current: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                minReferrals: number;
                commissionPercent: number;
                bonusPerReferral: number;
                badgeIcon: string | null;
            } | null;
            next: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                minReferrals: number;
                commissionPercent: number;
                bonusPerReferral: number;
                badgeIcon: string | null;
            } | null;
            referralsToNextTier: number | null;
        } | null;
    }>;
    getAvailableReferrals(userId: string, search?: string): Promise<{
        potentialEarning: number;
        candidateTestScore: any;
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
    getMyReferrals(userId: string, filters: ReferralFiltersDto): Promise<{
        data: {
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
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    confirmReferral(userId: string, applicationId: string): Promise<{
        referral: {
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
        };
        earning: {
            id: string;
            status: import("@prisma/client").$Enums.EarningStatus;
            createdAt: Date;
            updatedAt: Date;
            employeeId: string;
            amount: number;
            paidAt: Date | null;
            processedAt: Date | null;
            payoutMethod: string | null;
            bonusAmount: number;
            commissionRate: number | null;
            bonusReason: string | null;
            tierName: string | null;
            payoutReference: string | null;
            referralId: string;
        };
    }>;
    getEarnings(userId: string, filters: EarningsFiltersDto): Promise<{
        data: {
            id: string;
            status: import("@prisma/client").$Enums.EarningStatus;
            createdAt: Date;
            updatedAt: Date;
            employeeId: string;
            amount: number;
            paidAt: Date | null;
            processedAt: Date | null;
            payoutMethod: string | null;
            bonusAmount: number;
            commissionRate: number | null;
            bonusReason: string | null;
            tierName: string | null;
            payoutReference: string | null;
            referralId: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        summary: {
            totalAmount: number;
            byStatus: Record<string, {
                count: number;
                amount: number;
            }>;
        };
    }>;
    getCurrentTier(userId: string): Promise<{
        current: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            minReferrals: number;
            commissionPercent: number;
            bonusPerReferral: number;
            badgeIcon: string | null;
        } | null;
        next: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            minReferrals: number;
            commissionPercent: number;
            bonusPerReferral: number;
            badgeIcon: string | null;
        } | null;
        referralsToNextTier: number | null;
    } | null>;
    getLeaderboard(userId: string, period?: 'month' | 'all'): Promise<{
        leaderboard: {
            rank: number;
            employeeId: string;
            email: any;
            designation: string | null;
            referralCount: any;
            successfulReferrals: number;
            points: number;
            badges: string[];
            isCurrentUser: boolean;
        }[];
        currentUserRank: number | null;
        currentUserStats: {
            referralCount: number;
            successfulReferrals: number;
            points: number;
        };
    }>;
    getNotifications(userId: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.NotificationType;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        message: string;
        isRead: boolean;
        readAt: Date | null;
    }[]>;
    markNotificationRead(userId: string, notificationId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.NotificationType;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        message: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    markReferralAsHired(referralId: string): Promise<{
        success: boolean;
    }>;
}
