import { PrismaService } from '../../prisma/prisma.service';
import { UpdateEmployeeProfileDto, ReferralFiltersDto, EarningsFiltersDto } from './dto';
export declare class EmployeeService {
    private prisma;
    constructor(prisma: PrismaService);
    private getOrCreateEmployee;
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
        employeeId: string | null;
        companyName: string;
        userId: string;
        companyEmail: string;
        designation: string | null;
        linkedinUrl: string | null;
        points: number;
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
        candidateTestScore: number | null;
        application: {
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
                title: string;
                companyName: string;
                location: string;
                referralFee: number;
            };
            testSessions: {
                score: number | null;
            }[];
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
                    title: string;
                    companyName: string;
                    referralFee: number;
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
            earning: {
                status: import("@prisma/client").$Enums.EarningStatus;
                amount: number;
                paidAt: Date | null;
            } | null;
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
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.EarningStatus;
            createdAt: Date;
            updatedAt: Date;
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
    private getCurrentTierInternal;
    updateProfile(userId: string, dto: UpdateEmployeeProfileDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        companyName: string;
        userId: string;
        companyEmail: string;
        designation: string | null;
        linkedinUrl: string | null;
        points: number;
        isVerified: boolean;
        verifiedAt: Date | null;
        referralCount: number;
        successfulReferrals: number;
        badges: string[];
    }>;
    private checkAndAwardBadges;
    markReferralAsHired(referralId: string): Promise<{
        success: boolean;
    }>;
    getNotifications(userId: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        message: string;
        userId: string;
        isRead: boolean;
        readAt: Date | null;
    }[]>;
    markNotificationRead(userId: string, notificationId: string): Promise<{
        id: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        message: string;
        userId: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
}
