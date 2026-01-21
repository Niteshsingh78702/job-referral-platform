import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    UpdateEmployeeProfileDto,
    ReferralFiltersDto,
    EarningsFiltersDto,
} from './dto';
import {
    ReferralStatus,
    ReferralType,
    ApplicationStatus,
    EarningStatus,
} from '../../common/constants';

@Injectable()
export class EmployeeService {
    constructor(private prisma: PrismaService) { }

    // Helper to get or create employee profile
    private async getOrCreateEmployee(userId: string) {
        let employee = await this.prisma.employee.findUnique({
            where: { userId },
            include: {
                User: {
                    select: {
                        email: true,
                        phone: true,
                        emailVerified: true,
                        phoneVerified: true,
                        lastLoginAt: true,
                        role: true,
                    },
                },
            },
        });

        // If employee doesn't exist but user has EMPLOYEE role, create one
        if (!employee) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });

            if (user && user.role === 'EMPLOYEE') {
                // Auto-create employee profile
                employee = await this.prisma.employee.create({
                    data: {
                        userId: user.id,
                        companyName: user.email.split('@')[1]?.split('.')[0] || 'Unknown Company',
                        companyEmail: user.email,
                        isVerified: false,
                    },
                    include: {
                        User: {
                            select: {
                                email: true,
                                phone: true,
                                emailVerified: true,
                                phoneVerified: true,
                                lastLoginAt: true,
                                role: true,
                            },
                        },
                    },
                });
            }
        }

        return employee;
    }

    // Get employee profile with stats
    async getProfile(userId: string) {
        const employee = await this.getOrCreateEmployee(userId);

        if (!employee) {
            throw new NotFoundException('Employee profile not found. Please ensure you registered as an Employee.');
        }

        // Get current tier
        const tier = await this.getCurrentTier(userId);

        return {
            ...Employee,
            currentTier: tier,
        };
    }

    // Get dashboard statistics
    async getDashboardStats(userId: string) {
        const employee = await this.getOrCreateEmployee(userId);

        if (!employee) {
            throw new NotFoundException('Employee profile not found. Please ensure you registered as an Employee.');
        }

        // Get referral stats
        const referralStats = await this.prisma.referral.groupBy({
            by: ['status'],
            where: { employeeId: employee.id },
            _count: true,
        });

        // Get earnings summary
        const earningsStats = await this.prisma.employeeEarning.aggregate({
            where: { employeeId: employee.id },
            _sum: {
                amount: true,
                bonusAmount: true,
            },
        });

        const paidEarnings = await this.prisma.employeeEarning.aggregate({
            where: {
                employeeId: employee.id,
                status: EarningStatus.PAID,
            },
            _sum: {
                amount: true,
                bonusAmount: true,
            },
        });

        const pendingEarnings = await this.prisma.employeeEarning.aggregate({
            where: {
                employeeId: employee.id,
                status: { in: [EarningStatus.PENDING, EarningStatus.ELIGIBLE] },
            },
            _sum: {
                amount: true,
                bonusAmount: true,
            },
        });

        // Get available referrals count
        const availableReferrals = await this.prisma.referral.count({
            where: {
                status: ReferralStatus.PENDING,
                type: ReferralType.Employee,
                employeeId: null,
                JobApplication: {
                    Job: {
                        companyName: {
                            equals: employee.companyName,
                            mode: 'insensitive',
                        },
                    },
                },
            },
        });

        // Get this month's referrals
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thisMonthReferrals = await this.prisma.referral.count({
            where: {
                employeeId: employee.id,
                createdAt: { gte: startOfMonth },
            },
        });

        const currentTier = await this.getCurrentTier(userId);

        return {
            totalReferral: employee.referralCount,
            successfulReferral: employee.successfulReferrals,
            pendingReferral:
                referralStats.find((s) => s.status === ReferralStatus.PENDING)?._count ||
                0,
            confirmedReferral:
                referralStats.find((s) => s.status === ReferralStatus.CONFIRMED)?._count ||
                0,
            availableReferrals,
            thisMonthReferrals,
            totalEarnings:
                (earningsStats._sum.amount || 0) +
                (earningsStats._sum.bonusAmount || 0),
            paidEarnings:
                (paidEarnings._sum.amount || 0) + (paidEarnings._sum.bonusAmount || 0),
            pendingEarnings:
                (pendingEarnings._sum.amount || 0) +
                (pendingEarnings._sum.bonusAmount || 0),
            points: employee.points,
            badges: employee.badges,
            currentTier: currentTier,
        };
    }

    // Get available referrals - candidates awaiting referral at employee's company
    async getAvailableReferrals(userId: string, search?: string) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new NotFoundException('Employee profile not found');
        }

        if (!employee.isVerified) {
            throw new ForbiddenException(
                'Your employee account is not verified yet. Please wait for verification.'
            );
        }

        const referrals = await this.prisma.referral.findMany({
            where: {
                status: ReferralStatus.PENDING,
                type: ReferralType.Employee,
                employeeId: null, // Not yet claimed by any employee
                JobApplication: {
                    Job: {
                        companyName: {
                            equals: employee.companyName,
                            mode: 'insensitive',
                        },
                    },
                    ...(search
                        ? {
                            OR: [
                                {
                                    Candidate: {
                                        firstName: { contains: search, mode: 'insensitive' },
                                    },
                                },
                                {
                                    Candidate: {
                                        lastName: { contains: search, mode: 'insensitive' },
                                    },
                                },
                                {
                                    Job: {
                                        title: { contains: search, mode: 'insensitive' },
                                    },
                                },
                            ],
                        }
                        : {}),
                },
            },
            include: {
                JobApplication: {
                    include: {
                        Candidate: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                headline: true,
                                totalExperience: true,
                                currentCompany: true,
                                JobSkill: {
                                    select: { name: true, level: true },
                                },
                            },
                        },
                        Job: {
                            select: {
                                id: true,
                                title: true,
                                companyName: true,
                                location: true,
                                referralFee: true,
                            },
                        },
                        TestSession: {
                            where: { isPassed: true },
                            select: { score: true },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate potential earning for each
        const tier = await this.getCurrentTier(userId);
        const commissionRate = tier?.current?.commissionPercent || 10; // Default 10%
        const bonusPerReferral = tier?.current?.bonusPerReferral || 0;

        return referrals.map((ref) => ({
            ...ref,
            potentialEarning:
                (ref.application.job.referralFee * commissionRate) / 100 +
                bonusPerReferral,
            candidateTestScore: ref.application.testSessions[0]?.score || null,
        }));
    }

    // Get employee's referrals with filters
    async getMyReferrals(userId: string, filters: ReferralFiltersDto) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new NotFoundException('Employee profile not found');
        }

        const { status, fromDate, toDate, page = 1, limit = 10 } = filters;

        const where: any = {
            employeeId: employee.id,
        };

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (fromDate) {
            where.createdAt = { ...(where.createdAt || {}), gte: new Date(fromDate) };
        }

        if (toDate) {
            where.createdAt = { ...(where.createdAt || {}), lte: new Date(toDate) };
        }

        const [referrals, total] = await Promise.all([
            this.prisma.referral.findMany({
                where,
                include: {
                    JobApplication: {
                        include: {
                            Candidate: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    headline: true,
                                },
                            },
                            Job: {
                                select: {
                                    title: true,
                                    companyName: true,
                                    referralFee: true,
                                },
                            },
                        },
                    },
                    earning: {
                        select: {
                            amount: true,
                            status: true,
                            paidAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.referral.count({ where }),
        ]);

        return {
            data: referrals,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Confirm/claim a referral
    async confirmReferral(userId: string, applicationId: string) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new NotFoundException('Employee profile not found');
        }

        if (!employee.isVerified) {
            throw new ForbiddenException('Your employee account is not verified');
        }

        // Find the referral for this application
        const referral = await this.prisma.referral.findUnique({
            where: { applicationId },
            include: {
                JobApplication: {
                    include: {
                        Job: true,
                    },
                },
            },
        });

        if (!referral) {
            throw new NotFoundException('Referral not found');
        }

        if (referral.status !== ReferralStatus.PENDING) {
            throw new BadRequestException('Referral is not in pending state');
        }

        if (referral.employeeId) {
            throw new BadRequestException('Referral already claimed by another employee');
        }

        // Verify company match
        if (
            employee.companyName.toLowerCase() !==
            referral.application.job.companyName.toLowerCase()
        ) {
            throw new ForbiddenException('Cannot refer for a different company');
        }

        // Get current tier for commission calculation
        const tier = await this.getCurrentTierInternal(employee.id);
        const commissionRate = tier?.current?.commissionPercent || 10;
        const bonusAmount = tier?.current?.bonusPerReferral || 0;
        const earningAmount =
            (referral.application.job.referralFee * commissionRate) / 100;

        // Perform transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Update referral
            const updatedReferral = await tx.referral.update({
                where: { id: referral.id },
                data: {
                    employeeId: employee.id,
                    status: ReferralStatus.CONFIRMED,
                    confirmedAt: new Date(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
                },
            });

            // Update application status - keep as APPLIED (waiting for HR interview confirmation)
            await tx.jobApplication.update({
                where: { id: referral.applicationId },
                data: { status: ApplicationStatus.APPLIED },
            });

            // Create earning record
            const earning = await tx.employeeEarning.create({
                data: {
                    employeeId: employee.id,
                    referralId: referral.id,
                    amount: earningAmount,
                    bonusAmount: bonusAmount,
                    status: EarningStatus.PENDING,
                    tierName: tier?.current?.name || 'Base',
                    commissionRate: commissionRate,
                },
            });

            // Update employee stats
            await tx.employee.update({
                where: { id: employee.id },
                data: {
                    referralCount: { increment: 1 },
                    points: { increment: 10 }, // 10 points per referral
                },
            });

            return { Referral: updatedReferral, earning };
        });

        // Check for badge achievements
        await this.checkAndAwardBadges(employee.id);

        return result;
    }

    // Get earnings history
    async getEarnings(userId: string, filters: EarningsFiltersDto) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new NotFoundException('Employee profile not found');
        }

        const { status, fromDate, toDate, page = 1, limit = 10 } = filters;

        const where: any = {
            employeeId: employee.id,
        };

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (fromDate) {
            where.createdAt = { ...(where.createdAt || {}), gte: new Date(fromDate) };
        }

        if (toDate) {
            where.createdAt = { ...(where.createdAt || {}), lte: new Date(toDate) };
        }

        const [earnings, total, summary] = await Promise.all([
            this.prisma.employeeEarning.findMany({
                where,
                include: {
                    Referral: {
                        include: {
                            JobApplication: {
                                include: {
                                    Candidate: {
                                        select: { firstName: true, lastName: true },
                                    },
                                    Job: {
                                        select: { title: true, companyName: true },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.employeeEarning.count({ where }),
            this.prisma.employeeEarning.aggregate({
                where: { employeeId: employee.id },
                _sum: { amount: true, bonusAmount: true },
            }),
        ]);

        // Group by status for summary
        const statusSummary = await this.prisma.employeeEarning.groupBy({
            by: ['status'],
            where: { employeeId: employee.id },
            _sum: { amount: true, bonusAmount: true },
            _count: true,
        });

        return {
            data: earnings,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            summary: {
                totalAmount:
                    (summary._sum.amount || 0) + (summary._sum.bonusAmount || 0),
                byStatus: statusSummary.reduce(
                    (acc, item) => {
                        acc[item.status] = {
                            count: item._count,
                            amount:
                                (item._sum.amount || 0) + (item._sum.bonusAmount || 0),
                        };
                        return acc;
                    },
                    {} as Record<string, { count: number; amount: number }>
                ),
            },
        };
    }

    // Get company leaderboard
    async getLeaderboard(userId: string, period: 'month' | 'all' = 'all') {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new NotFoundException('Employee profile not found');
        }

        let dateFilter = {};
        if (period === 'month') {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            dateFilter = { createdAt: { gte: startOfMonth } };
        }

        // Get all employees from same company with their referral count
        const employees = await this.prisma.employee.findMany({
            where: {
                companyName: { equals: employee.companyName, mode: 'insensitive' },
                isVerified: true,
            },
            select: {
                id: true,
                userId: true,
                designation: true,
                referralCount: true,
                successfulReferral: true,
                points: true,
                badges: true,
                User: {
                    select: {
                        email: true,
                    },
                },
                Referral: period === 'month'
                    ? {
                        where: dateFilter,
                        select: { id: true },
                    }
                    : undefined,
            },
            orderBy:
                period === 'month'
                    ? undefined
                    : { successfulReferral: 'desc' },
            take: 20,
        });

        // Sort by month count if monthly
        let leaderboard = employees.map((emp, index) => ({
            rank: index + 1,
            employeeId: emp.id,
            email: emp.user.email.replace(/(.{3}).*@/, '$1***@'), // Partial hide email
            designation: emp.designation,
            referralCount:
                period === 'month'
                    ? emp.referrals?.length || 0
                    : emp.referralCount,
            successfulReferral: emp.successfulReferrals,
            points: emp.points,
            badges: emp.badges,
            isCurrentUser: emp.userId === userId,
        }));

        if (period === 'month') {
            leaderboard = leaderboard
                .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
                .map((emp, index) => ({ ...emp, rank: index + 1 }));
        }

        // Find current user's rank if not in top 20
        const currentUserInLeaderboard = leaderboard.find((e) => e.isCurrentUser);
        let currentUserRank: number | null = null;

        if (!currentUserInLeaderboard) {
            // Calculate rank
            const higherRanked = await this.prisma.employee.count({
                where: {
                    companyName: { equals: employee.companyName, mode: 'insensitive' },
                    successfulReferral: { gt: employee.successfulReferrals },
                },
            });
            currentUserRank = higherRanked + 1;
        }

        return {
            leaderboard: leaderboard.slice(0, 10),
            currentUserRank: currentUserInLeaderboard?.rank || currentUserRank,
            currentUserStats: {
                referralCount: employee.referralCount,
                successfulReferral: employee.successfulReferrals,
                points: employee.points,
            },
        };
    }

    // Get current tier
    async getCurrentTier(userId: string) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            return null;
        }

        return this.getCurrentTierInternal(employee.id);
    }

    private async getCurrentTierInternal(employeeId: string) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
        });

        if (!employee) {
            return null;
        }

        const tier = await this.prisma.commissionTier.findFirst({
            where: {
                minReferral: { lte: employee.successfulReferrals },
                isActive: true,
            },
            orderBy: { minReferral: 'desc' },
        });

        // Get next tier
        const nextTier = await this.prisma.commissionTier.findFirst({
            where: {
                minReferral: { gt: employee.successfulReferrals },
                isActive: true,
            },
            orderBy: { minReferral: 'asc' },
        });

        return {
            current: tier,
            next: nextTier,
            referralsToNextTier: nextTier
                ? nextTier.minReferrals - employee.successfulReferrals
                : null,
        };
    }

    // Update employee profile
    async updateProfile(userId: string, dto: UpdateEmployeeProfileDto) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new NotFoundException('Employee profile not found');
        }

        return this.prisma.employee.update({
            where: { id: employee.id },
            data: {
                designation: dto.designation,
                employeeId: dto.employeeId,
                linkedinUrl: dto.linkedinUrl,
            },
        });
    }

    // Check and award badges
    private async checkAndAwardBadges(employeeId: string) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
        });

        if (!employee) return;

        const badges = [...employee.badges];

        // First referral badge
        if (employee.referralCount === 1 && !badges.includes('first-referral')) {
            badges.push('first-referral');
        }

        // 5 referrals badge
        if (employee.referralCount >= 5 && !badges.includes('referral-pro')) {
            badges.push('referral-pro');
        }

        // 10 referrals badge
        if (employee.referralCount >= 10 && !badges.includes('super-referrer')) {
            badges.push('super-referrer');
        }

        // 25 referrals badge
        if (employee.referralCount >= 25 && !badges.includes('referral-champion')) {
            badges.push('referral-champion');
        }

        // First successful hire badge
        if (
            employee.successfulReferrals >= 1 &&
            !badges.includes('first-hire')
        ) {
            badges.push('first-hire');
        }

        // 5 successful hires badge
        if (
            employee.successfulReferrals >= 5 &&
            !badges.includes('hiring-hero')
        ) {
            badges.push('hiring-hero');
        }

        if (badges.length !== employee.badges.length) {
            await this.prisma.employee.update({
                where: { id: employeeId },
                data: { badges },
            });
        }
    }

    // Mark referral as hired (called by HR/Admin)
    async markReferralAsHired(referralId: string) {
        const referral = await this.prisma.referral.findUnique({
            where: { id: referralId },
            include: {
                earning: true,
                Employee: true,
            },
        });

        if (!referral) {
            throw new NotFoundException('Referral not found');
        }

        if (referral.status !== ReferralStatus.CONFIRMED) {
            throw new BadRequestException('Referral must be confirmed first');
        }

        return this.prisma.$transaction(async (tx) => {
            // Update referral status
            await tx.referral.update({
                where: { id: referralId },
                data: {
                    status: ReferralStatus.CLOSED,
                    closedAt: new Date(),
                },
            });

            // Update earning to eligible
            if (referral.EmployeeEarning) {
                await tx.employeeEarning.update({
                    where: { id: referral.employeeEarning.id },
                    data: { status: EarningStatus.ELIGIBLE },
                });
            }

            // Update employee stats
            if (referral.employeeId) {
                await tx.employee.update({
                    where: { id: referral.employeeId },
                    data: {
                        successfulReferral: { increment: 1 },
                        points: { increment: 50 }, // Bonus points for successful hire
                    },
                });

                // Check for badges
                await this.checkAndAwardBadges(referral.employeeId);
            }

            return { success: true };
        });
    }

    // Get notifications for employee
    async getNotifications(userId: string, limit = 10) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    // Mark notification as read
    async markNotificationRead(userId: string, notificationId: string) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true, readAt: new Date() },
        });
    }
}
