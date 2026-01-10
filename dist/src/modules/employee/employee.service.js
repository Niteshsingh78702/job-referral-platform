"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const constants_1 = require("../../common/constants");
let EmployeeService = class EmployeeService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateEmployee(userId) {
        let employee = await this.prisma.employee.findUnique({
            where: { userId },
            include: {
                user: {
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
        if (!employee) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (user && user.role === 'EMPLOYEE') {
                employee = await this.prisma.employee.create({
                    data: {
                        userId: user.id,
                        companyName: user.email.split('@')[1]?.split('.')[0] || 'Unknown Company',
                        companyEmail: user.email,
                        isVerified: false,
                    },
                    include: {
                        user: {
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
    async getProfile(userId) {
        const employee = await this.getOrCreateEmployee(userId);
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not found. Please ensure you registered as an Employee.');
        }
        const tier = await this.getCurrentTier(userId);
        return {
            ...employee,
            currentTier: tier,
        };
    }
    async getDashboardStats(userId) {
        const employee = await this.getOrCreateEmployee(userId);
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not found. Please ensure you registered as an Employee.');
        }
        const referralStats = await this.prisma.referral.groupBy({
            by: ['status'],
            where: { employeeId: employee.id },
            _count: true,
        });
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
                status: constants_1.EarningStatus.PAID,
            },
            _sum: {
                amount: true,
                bonusAmount: true,
            },
        });
        const pendingEarnings = await this.prisma.employeeEarning.aggregate({
            where: {
                employeeId: employee.id,
                status: { in: [constants_1.EarningStatus.PENDING, constants_1.EarningStatus.ELIGIBLE] },
            },
            _sum: {
                amount: true,
                bonusAmount: true,
            },
        });
        const availableReferrals = await this.prisma.referral.count({
            where: {
                status: constants_1.ReferralStatus.PENDING,
                type: constants_1.ReferralType.EMPLOYEE,
                employeeId: null,
                application: {
                    job: {
                        companyName: {
                            equals: employee.companyName,
                            mode: 'insensitive',
                        },
                    },
                },
            },
        });
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
            totalReferrals: employee.referralCount,
            successfulReferrals: employee.successfulReferrals,
            pendingReferrals: referralStats.find((s) => s.status === constants_1.ReferralStatus.PENDING)?._count ||
                0,
            confirmedReferrals: referralStats.find((s) => s.status === constants_1.ReferralStatus.CONFIRMED)?._count ||
                0,
            availableReferrals,
            thisMonthReferrals,
            totalEarnings: (earningsStats._sum.amount || 0) +
                (earningsStats._sum.bonusAmount || 0),
            paidEarnings: (paidEarnings._sum.amount || 0) + (paidEarnings._sum.bonusAmount || 0),
            pendingEarnings: (pendingEarnings._sum.amount || 0) +
                (pendingEarnings._sum.bonusAmount || 0),
            points: employee.points,
            badges: employee.badges,
            currentTier: currentTier,
        };
    }
    async getAvailableReferrals(userId, search) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not found');
        }
        if (!employee.isVerified) {
            throw new common_1.ForbiddenException('Your employee account is not verified yet. Please wait for verification.');
        }
        const referrals = await this.prisma.referral.findMany({
            where: {
                status: constants_1.ReferralStatus.PENDING,
                type: constants_1.ReferralType.EMPLOYEE,
                employeeId: null,
                application: {
                    job: {
                        companyName: {
                            equals: employee.companyName,
                            mode: 'insensitive',
                        },
                    },
                    ...(search
                        ? {
                            OR: [
                                {
                                    candidate: {
                                        firstName: { contains: search, mode: 'insensitive' },
                                    },
                                },
                                {
                                    candidate: {
                                        lastName: { contains: search, mode: 'insensitive' },
                                    },
                                },
                                {
                                    job: {
                                        title: { contains: search, mode: 'insensitive' },
                                    },
                                },
                            ],
                        }
                        : {}),
                },
            },
            include: {
                application: {
                    include: {
                        candidate: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                headline: true,
                                totalExperience: true,
                                currentCompany: true,
                                skills: {
                                    select: { name: true, level: true },
                                },
                            },
                        },
                        job: {
                            select: {
                                id: true,
                                title: true,
                                companyName: true,
                                location: true,
                                referralFee: true,
                            },
                        },
                        testSessions: {
                            where: { isPassed: true },
                            select: { score: true },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const tier = await this.getCurrentTier(userId);
        const commissionRate = tier?.current?.commissionPercent || 10;
        const bonusPerReferral = tier?.current?.bonusPerReferral || 0;
        return referrals.map((ref) => ({
            ...ref,
            potentialEarning: (ref.application.job.referralFee * commissionRate) / 100 +
                bonusPerReferral,
            candidateTestScore: ref.application.testSessions[0]?.score || null,
        }));
    }
    async getMyReferrals(userId, filters) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not found');
        }
        const { status, fromDate, toDate, page = 1, limit = 10 } = filters;
        const where = {
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
                    application: {
                        include: {
                            candidate: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    headline: true,
                                },
                            },
                            job: {
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
    async confirmReferral(userId, applicationId) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not found');
        }
        if (!employee.isVerified) {
            throw new common_1.ForbiddenException('Your employee account is not verified');
        }
        const referral = await this.prisma.referral.findUnique({
            where: { applicationId },
            include: {
                application: {
                    include: {
                        job: true,
                    },
                },
            },
        });
        if (!referral) {
            throw new common_1.NotFoundException('Referral not found');
        }
        if (referral.status !== constants_1.ReferralStatus.PENDING) {
            throw new common_1.BadRequestException('Referral is not in pending state');
        }
        if (referral.employeeId) {
            throw new common_1.BadRequestException('Referral already claimed by another employee');
        }
        if (employee.companyName.toLowerCase() !==
            referral.application.job.companyName.toLowerCase()) {
            throw new common_1.ForbiddenException('Cannot refer for a different company');
        }
        const tier = await this.getCurrentTierInternal(employee.id);
        const commissionRate = tier?.current?.commissionPercent || 10;
        const bonusAmount = tier?.current?.bonusPerReferral || 0;
        const earningAmount = (referral.application.job.referralFee * commissionRate) / 100;
        const result = await this.prisma.$transaction(async (tx) => {
            const updatedReferral = await tx.referral.update({
                where: { id: referral.id },
                data: {
                    employeeId: employee.id,
                    status: constants_1.ReferralStatus.CONFIRMED,
                    confirmedAt: new Date(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });
            await tx.jobApplication.update({
                where: { id: referral.applicationId },
                data: { status: constants_1.ApplicationStatus.REFERRAL_CONFIRMED },
            });
            const earning = await tx.employeeEarning.create({
                data: {
                    employeeId: employee.id,
                    referralId: referral.id,
                    amount: earningAmount,
                    bonusAmount: bonusAmount,
                    status: constants_1.EarningStatus.PENDING,
                    tierName: tier?.current?.name || 'Base',
                    commissionRate: commissionRate,
                },
            });
            await tx.employee.update({
                where: { id: employee.id },
                data: {
                    referralCount: { increment: 1 },
                    points: { increment: 10 },
                },
            });
            return { referral: updatedReferral, earning };
        });
        await this.checkAndAwardBadges(employee.id);
        return result;
    }
    async getEarnings(userId, filters) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not found');
        }
        const { status, fromDate, toDate, page = 1, limit = 10 } = filters;
        const where = {
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
                    referral: {
                        include: {
                            application: {
                                include: {
                                    candidate: {
                                        select: { firstName: true, lastName: true },
                                    },
                                    job: {
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
                totalAmount: (summary._sum.amount || 0) + (summary._sum.bonusAmount || 0),
                byStatus: statusSummary.reduce((acc, item) => {
                    acc[item.status] = {
                        count: item._count,
                        amount: (item._sum.amount || 0) + (item._sum.bonusAmount || 0),
                    };
                    return acc;
                }, {}),
            },
        };
    }
    async getLeaderboard(userId, period = 'all') {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not found');
        }
        let dateFilter = {};
        if (period === 'month') {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            dateFilter = { createdAt: { gte: startOfMonth } };
        }
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
                successfulReferrals: true,
                points: true,
                badges: true,
                user: {
                    select: {
                        email: true,
                    },
                },
                referrals: period === 'month'
                    ? {
                        where: dateFilter,
                        select: { id: true },
                    }
                    : undefined,
            },
            orderBy: period === 'month'
                ? undefined
                : { successfulReferrals: 'desc' },
            take: 20,
        });
        let leaderboard = employees.map((emp, index) => ({
            rank: index + 1,
            employeeId: emp.id,
            email: emp.user.email.replace(/(.{3}).*@/, '$1***@'),
            designation: emp.designation,
            referralCount: period === 'month'
                ? emp.referrals?.length || 0
                : emp.referralCount,
            successfulReferrals: emp.successfulReferrals,
            points: emp.points,
            badges: emp.badges,
            isCurrentUser: emp.userId === userId,
        }));
        if (period === 'month') {
            leaderboard = leaderboard
                .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
                .map((emp, index) => ({ ...emp, rank: index + 1 }));
        }
        const currentUserInLeaderboard = leaderboard.find((e) => e.isCurrentUser);
        let currentUserRank = null;
        if (!currentUserInLeaderboard) {
            const higherRanked = await this.prisma.employee.count({
                where: {
                    companyName: { equals: employee.companyName, mode: 'insensitive' },
                    successfulReferrals: { gt: employee.successfulReferrals },
                },
            });
            currentUserRank = higherRanked + 1;
        }
        return {
            leaderboard: leaderboard.slice(0, 10),
            currentUserRank: currentUserInLeaderboard?.rank || currentUserRank,
            currentUserStats: {
                referralCount: employee.referralCount,
                successfulReferrals: employee.successfulReferrals,
                points: employee.points,
            },
        };
    }
    async getCurrentTier(userId) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            return null;
        }
        return this.getCurrentTierInternal(employee.id);
    }
    async getCurrentTierInternal(employeeId) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee) {
            return null;
        }
        const tier = await this.prisma.commissionTier.findFirst({
            where: {
                minReferrals: { lte: employee.successfulReferrals },
                isActive: true,
            },
            orderBy: { minReferrals: 'desc' },
        });
        const nextTier = await this.prisma.commissionTier.findFirst({
            where: {
                minReferrals: { gt: employee.successfulReferrals },
                isActive: true,
            },
            orderBy: { minReferrals: 'asc' },
        });
        return {
            current: tier,
            next: nextTier,
            referralsToNextTier: nextTier
                ? nextTier.minReferrals - employee.successfulReferrals
                : null,
        };
    }
    async updateProfile(userId, dto) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not found');
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
    async checkAndAwardBadges(employeeId) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee)
            return;
        const badges = [...employee.badges];
        if (employee.referralCount === 1 && !badges.includes('first-referral')) {
            badges.push('first-referral');
        }
        if (employee.referralCount >= 5 && !badges.includes('referral-pro')) {
            badges.push('referral-pro');
        }
        if (employee.referralCount >= 10 && !badges.includes('super-referrer')) {
            badges.push('super-referrer');
        }
        if (employee.referralCount >= 25 && !badges.includes('referral-champion')) {
            badges.push('referral-champion');
        }
        if (employee.successfulReferrals >= 1 &&
            !badges.includes('first-hire')) {
            badges.push('first-hire');
        }
        if (employee.successfulReferrals >= 5 &&
            !badges.includes('hiring-hero')) {
            badges.push('hiring-hero');
        }
        if (badges.length !== employee.badges.length) {
            await this.prisma.employee.update({
                where: { id: employeeId },
                data: { badges },
            });
        }
    }
    async markReferralAsHired(referralId) {
        const referral = await this.prisma.referral.findUnique({
            where: { id: referralId },
            include: {
                earning: true,
                employee: true,
            },
        });
        if (!referral) {
            throw new common_1.NotFoundException('Referral not found');
        }
        if (referral.status !== constants_1.ReferralStatus.CONFIRMED) {
            throw new common_1.BadRequestException('Referral must be confirmed first');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.referral.update({
                where: { id: referralId },
                data: {
                    status: constants_1.ReferralStatus.CLOSED,
                    closedAt: new Date(),
                },
            });
            if (referral.earning) {
                await tx.employeeEarning.update({
                    where: { id: referral.earning.id },
                    data: { status: constants_1.EarningStatus.ELIGIBLE },
                });
            }
            if (referral.employeeId) {
                await tx.employee.update({
                    where: { id: referral.employeeId },
                    data: {
                        successfulReferrals: { increment: 1 },
                        points: { increment: 50 },
                    },
                });
                await this.checkAndAwardBadges(referral.employeeId);
            }
            return { success: true };
        });
    }
    async getNotifications(userId, limit = 10) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async markNotificationRead(userId, notificationId) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true, readAt: new Date() },
        });
    }
};
exports.EmployeeService = EmployeeService;
exports.EmployeeService = EmployeeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeeService);
//# sourceMappingURL=employee.service.js.map