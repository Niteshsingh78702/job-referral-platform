import { EmployeeService } from './employee.service';
import { UpdateEmployeeProfileDto, ReferralFiltersDto, EarningsFiltersDto } from './dto';
export declare class EmployeeController {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    getProfile(userId: string): Promise<{
        currentTier: {
            current: {
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                minReferrals: number;
                commissionPercent: number;
                bonusPerReferral: number;
                badgeIcon: string | null;
            } | null;
            next: {
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                minReferrals: number;
                commissionPercent: number;
                bonusPerReferral: number;
                badgeIcon: string | null;
            } | null;
            referralsToNextTier: number | null;
        } | null;
        user: {
            email: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            emailVerified: boolean;
            phoneVerified: boolean;
            lastLoginAt: Date | null;
        };
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
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                minReferrals: number;
                commissionPercent: number;
                bonusPerReferral: number;
                badgeIcon: string | null;
            } | null;
            next: {
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
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
        candidateTestScore: number | null;
        application: {
            testSessions: {
                score: number | null;
            }[];
            candidate: {
                id: string;
                skills: {
                    name: string;
                    level: number;
                }[];
                firstName: string;
                lastName: string;
                headline: string | null;
                totalExperience: number | null;
                currentCompany: string | null;
            };
            job: {
                id: string;
                companyName: string;
                title: string;
                location: string;
                referralFee: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            jobId: string;
            candidateId: string;
            coverLetter: string | null;
            testScore: number | null;
            testPassedAt: Date | null;
            contactUnlockedAt: Date | null;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ReferralStatus;
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
        data: ({
            application: {
                candidate: {
                    firstName: string;
                    lastName: string;
                    headline: string | null;
                };
                job: {
                    companyName: string;
                    title: string;
                    referralFee: number;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                jobId: string;
                candidateId: string;
                coverLetter: string | null;
                testScore: number | null;
                testPassedAt: Date | null;
                contactUnlockedAt: Date | null;
            };
            earning: {
                status: import("@prisma/client").$Enums.EarningStatus;
                amount: number;
                paidAt: Date | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ReferralStatus;
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
        })[];
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
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ReferralStatus;
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
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.EarningStatus;
            employeeId: string;
            amount: number;
            paidAt: Date | null;
            processedAt: Date | null;
            bonusAmount: number;
            commissionRate: number | null;
            referralId: string;
            bonusReason: string | null;
            tierName: string | null;
            payoutReference: string | null;
            payoutMethod: string | null;
        };
    }>;
    getEarnings(userId: string, filters: EarningsFiltersDto): Promise<{
        data: ({
            referral: {
                application: {
                    candidate: {
                        firstName: string;
                        lastName: string;
                    };
                    job: {
                        companyName: string;
                        title: string;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    status: import("@prisma/client").$Enums.ApplicationStatus;
                    jobId: string;
                    candidateId: string;
                    coverLetter: string | null;
                    testScore: number | null;
                    testPassedAt: Date | null;
                    contactUnlockedAt: Date | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.ReferralStatus;
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.EarningStatus;
            employeeId: string;
            amount: number;
            paidAt: Date | null;
            processedAt: Date | null;
            bonusAmount: number;
            commissionRate: number | null;
            referralId: string;
            bonusReason: string | null;
            tierName: string | null;
            payoutReference: string | null;
            payoutMethod: string | null;
        })[];
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
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            minReferrals: number;
            commissionPercent: number;
            bonusPerReferral: number;
            badgeIcon: string | null;
        } | null;
        next: {
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
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
            email: string;
            designation: string | null;
            referralCount: number;
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
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.NotificationType;
        message: string;
        isRead: boolean;
        readAt: Date | null;
    }[]>;
    markNotificationRead(userId: string, notificationId: string): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.NotificationType;
        message: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    markReferralAsHired(referralId: string): Promise<{
        success: boolean;
    }>;
}
