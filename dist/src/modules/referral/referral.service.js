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
exports.ReferralService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const constants_1 = require("../../common/constants");
let ReferralService = class ReferralService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPendingReferralsForHR(hrUserId) {
        const hr = await this.prisma.hR.findUnique({
            where: { userId: hrUserId },
        });
        if (!hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        return this.prisma.referral.findMany({
            where: {
                status: { in: [constants_1.ReferralStatus.PENDING, constants_1.ReferralStatus.CONFIRMED] },
                application: {
                    job: {
                        hrId: hr.id,
                    },
                },
            },
            include: {
                application: {
                    include: {
                        candidate: {
                            select: {
                                firstName: true,
                                lastName: true,
                                headline: true,
                                totalExperience: true,
                                currentCompany: true,
                                skills: true,
                            },
                        },
                        job: {
                            select: {
                                title: true,
                                companyName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPendingReferralsForEmployee(employeeUserId) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId: employeeUserId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not found');
        }
        return this.prisma.referral.findMany({
            where: {
                status: constants_1.ReferralStatus.PENDING,
                type: constants_1.ReferralType.EMPLOYEE,
                OR: [
                    { employeeId: employee.id },
                    {
                        application: {
                            job: {
                                companyName: { equals: employee.companyName, mode: 'insensitive' },
                            },
                        },
                    },
                ],
            },
            include: {
                application: {
                    include: {
                        candidate: {
                            select: {
                                firstName: true,
                                lastName: true,
                                headline: true,
                                totalExperience: true,
                                skills: true,
                            },
                        },
                        job: {
                            select: {
                                title: true,
                                companyName: true,
                                location: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async confirmReferral(referralId, userId, userRole, dto) {
        const referral = await this.prisma.referral.findUnique({
            where: { id: referralId },
            include: {
                application: {
                    include: {
                        job: { include: { hr: true } },
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
        if (userRole === 'HR') {
            if (!referral.application.job.hr || referral.application.job.hr.userId !== userId) {
                throw new common_1.ForbiddenException('Not authorized to confirm this referral');
            }
        }
        else if (userRole === 'EMPLOYEE') {
            const employee = await this.prisma.employee.findUnique({
                where: { userId },
            });
            if (!employee) {
                throw new common_1.ForbiddenException('Employee profile not found');
            }
            if (employee.companyName.toLowerCase() !==
                referral.application.job.companyName.toLowerCase()) {
                throw new common_1.ForbiddenException('Not authorized to refer for this company');
            }
        }
        const updatedReferral = await this.prisma.$transaction(async (tx) => {
            const ref = await tx.referral.update({
                where: { id: referralId },
                data: {
                    status: constants_1.ReferralStatus.CONFIRMED,
                    confirmedAt: new Date(),
                    type: dto.type || referral.type,
                    ...(userRole === 'EMPLOYEE' && {
                        employeeId: (await tx.employee.findUnique({ where: { userId } }))?.id,
                    }),
                    ...(userRole === 'HR' && {
                        hrId: (await tx.hR.findUnique({ where: { userId } }))?.id,
                    }),
                },
            });
            await tx.jobApplication.update({
                where: { id: referral.applicationId },
                data: { status: constants_1.ApplicationStatus.REFERRAL_CONFIRMED },
            });
            return ref;
        });
        return updatedReferral;
    }
    async markAsContacted(referralId, userId, feedback) {
        const referral = await this.prisma.referral.findUnique({
            where: { id: referralId },
            include: {
                application: {
                    include: {
                        job: { include: { hr: true } },
                    },
                },
            },
        });
        if (!referral) {
            throw new common_1.NotFoundException('Referral not found');
        }
        if (!referral.application.job.hr || referral.application.job.hr.userId !== userId) {
            throw new common_1.ForbiddenException('Only HR can mark as contacted');
        }
        return this.prisma.referral.update({
            where: { id: referralId },
            data: {
                status: constants_1.ReferralStatus.CONTACTED,
                contactedAt: new Date(),
                hrFeedback: feedback,
            },
        });
    }
    async closeReferral(referralId, userId, feedback) {
        const referral = await this.prisma.referral.findUnique({
            where: { id: referralId },
            include: {
                application: {
                    include: {
                        job: { include: { hr: true } },
                    },
                },
            },
        });
        if (!referral) {
            throw new common_1.NotFoundException('Referral not found');
        }
        if (!referral.application.job.hr || referral.application.job.hr.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.referral.update({
                where: { id: referralId },
                data: {
                    status: constants_1.ReferralStatus.CLOSED,
                    closedAt: new Date(),
                    hrFeedback: feedback,
                },
            });
            await tx.jobApplication.update({
                where: { id: referral.applicationId },
                data: { status: constants_1.ApplicationStatus.CLOSED },
            });
            return { success: true };
        });
    }
    async getReferralHistory(userId, userRole) {
        if (userRole === 'HR') {
            const hr = await this.prisma.hR.findUnique({
                where: { userId },
            });
            if (!hr) {
                throw new common_1.NotFoundException('HR profile not found');
            }
            return this.prisma.referral.findMany({
                where: { hrId: hr.id },
                include: {
                    application: {
                        include: {
                            candidate: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                            job: {
                                select: {
                                    title: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        else if (userRole === 'EMPLOYEE') {
            const employee = await this.prisma.employee.findUnique({
                where: { userId },
            });
            if (!employee) {
                throw new common_1.NotFoundException('Employee profile not found');
            }
            return this.prisma.referral.findMany({
                where: { employeeId: employee.id },
                include: {
                    application: {
                        include: {
                            candidate: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                            job: {
                                select: {
                                    title: true,
                                    companyName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        throw new common_1.BadRequestException('Invalid user role for referral history');
    }
};
exports.ReferralService = ReferralService;
exports.ReferralService = ReferralService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReferralService);
//# sourceMappingURL=referral.service.js.map