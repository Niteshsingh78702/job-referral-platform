"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReferralService", {
    enumerable: true,
    get: function() {
        return ReferralService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../../prisma/prisma.service");
const _constants = require("../../common/constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ReferralService = class ReferralService {
    // Get pending referrals for HR
    async getPendingReferralsForHR(hrUserId) {
        const hr = await this.prisma.hR.findUnique({
            where: {
                userId: hrUserId
            }
        });
        if (!hr) {
            throw new _common.NotFoundException('HR profile not found');
        }
        return this.prisma.referral.findMany({
            where: {
                status: {
                    in: [
                        _constants.ReferralStatus.PENDING,
                        _constants.ReferralStatus.CONFIRMED
                    ]
                },
                JobApplication: {
                    Job: {
                        hrId: hr.id
                    }
                }
            },
            include: {
                JobApplication: {
                    include: {
                        Candidate: {
                            select: {
                                firstName: true,
                                lastName: true,
                                headline: true,
                                totalExperience: true,
                                currentCompany: true,
                                JobSkill: true
                            }
                        },
                        Job: {
                            select: {
                                title: true,
                                companyName: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    // Get pending referrals for Employee
    async getPendingReferralsForEmployee(employeeUserId) {
        const employee = await this.prisma.employee.findUnique({
            where: {
                userId: employeeUserId
            }
        });
        if (!employee) {
            throw new _common.NotFoundException('Employee profile not found');
        }
        // Get jobs at employee's company that need referrals
        return this.prisma.referral.findMany({
            where: {
                status: _constants.ReferralStatus.PENDING,
                type: _constants.ReferralType.Employee,
                OR: [
                    {
                        employeeId: employee.id
                    },
                    {
                        JobApplication: {
                            Job: {
                                companyName: {
                                    equals: employee.companyName,
                                    mode: 'insensitive'
                                }
                            }
                        }
                    }
                ]
            },
            include: {
                JobApplication: {
                    include: {
                        Candidate: {
                            select: {
                                firstName: true,
                                lastName: true,
                                headline: true,
                                totalExperience: true,
                                JobSkill: true
                            }
                        },
                        Job: {
                            select: {
                                title: true,
                                companyName: true,
                                location: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    // Confirm referral (HR or Employee)
    async confirmReferral(referralId, userId, userRole, dto) {
        const referral = await this.prisma.referral.findUnique({
            where: {
                id: referralId
            },
            include: {
                JobApplication: {
                    include: {
                        Job: {
                            include: {
                                HR: true
                            }
                        }
                    }
                }
            }
        });
        if (!referral) {
            throw new _common.NotFoundException('Referral not found');
        }
        if (referral.status !== _constants.ReferralStatus.PENDING) {
            throw new _common.BadRequestException('Referral is not in pending state');
        }
        // Verify authorization
        if (userRole === 'HR') {
            if (!referral.application.job.HR || referral.application.job.hr.userId !== userId) {
                throw new _common.ForbiddenException('Not authorized to confirm this referral');
            }
        } else if (userRole === 'EMPLOYEE') {
            const employee = await this.prisma.employee.findUnique({
                where: {
                    userId
                }
            });
            if (!employee) {
                throw new _common.ForbiddenException('Employee profile not found');
            }
            // Verify employee is at the same company
            if (employee.companyName.toLowerCase() !== referral.application.job.companyName.toLowerCase()) {
                throw new _common.ForbiddenException('Not authorized to refer for this company');
            }
        }
        // Update referral
        const updatedReferral = await this.prisma.$transaction(async (tx)=>{
            const ref = await tx.referral.update({
                where: {
                    id: referralId
                },
                data: {
                    status: _constants.ReferralStatus.CONFIRMED,
                    confirmedAt: new Date(),
                    type: dto.type || referral.type,
                    ...userRole === 'EMPLOYEE' && {
                        employeeId: (await tx.employee.findUnique({
                            where: {
                                userId
                            }
                        }))?.id
                    },
                    ...userRole === 'HR' && {
                        hrId: (await tx.hR.findUnique({
                            where: {
                                userId
                            }
                        }))?.id
                    }
                }
            });
            // Update application status - keep as APPLIED (test passed, waiting for HR interview confirmation)
            await tx.jobApplication.update({
                where: {
                    id: referral.applicationId
                },
                data: {
                    status: _constants.ApplicationStatus.APPLIED
                }
            });
            return ref;
        });
        return updatedReferral;
    }
    // Mark as contacted
    async markAsContacted(referralId, userId, feedback) {
        const referral = await this.prisma.referral.findUnique({
            where: {
                id: referralId
            },
            include: {
                JobApplication: {
                    include: {
                        Job: {
                            include: {
                                HR: true
                            }
                        }
                    }
                }
            }
        });
        if (!referral) {
            throw new _common.NotFoundException('Referral not found');
        }
        // Only HR can mark as contacted
        if (!referral.application.job.HR || referral.application.job.hr.userId !== userId) {
            throw new _common.ForbiddenException('Only HR can mark as contacted');
        }
        return this.prisma.referral.update({
            where: {
                id: referralId
            },
            data: {
                status: _constants.ReferralStatus.CONTACTED,
                contactedAt: new Date(),
                hrFeedback: feedback
            }
        });
    }
    // Close referral
    async closeReferral(referralId, userId, feedback) {
        const referral = await this.prisma.referral.findUnique({
            where: {
                id: referralId
            },
            include: {
                JobApplication: {
                    include: {
                        Job: {
                            include: {
                                HR: true
                            }
                        }
                    }
                }
            }
        });
        if (!referral) {
            throw new _common.NotFoundException('Referral not found');
        }
        if (!referral.application.job.HR || referral.application.job.hr.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized');
        }
        return this.prisma.$transaction(async (tx)=>{
            await tx.referral.update({
                where: {
                    id: referralId
                },
                data: {
                    status: _constants.ReferralStatus.CLOSED,
                    closedAt: new Date(),
                    hrFeedback: feedback
                }
            });
            await tx.jobApplication.update({
                where: {
                    id: referral.applicationId
                },
                data: {
                    status: _constants.ApplicationStatus.REJECTED
                }
            });
            return {
                success: true
            };
        });
    }
    // Get referral history
    async getReferralHistory(userId, userRole) {
        if (userRole === 'HR') {
            const hr = await this.prisma.hR.findUnique({
                where: {
                    userId
                }
            });
            if (!hr) {
                throw new _common.NotFoundException('HR profile not found');
            }
            return this.prisma.referral.findMany({
                where: {
                    hrId: hr.id
                },
                include: {
                    JobApplication: {
                        include: {
                            Candidate: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            },
                            Job: {
                                select: {
                                    title: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        } else if (userRole === 'EMPLOYEE') {
            const employee = await this.prisma.employee.findUnique({
                where: {
                    userId
                }
            });
            if (!employee) {
                throw new _common.NotFoundException('Employee profile not found');
            }
            return this.prisma.referral.findMany({
                where: {
                    employeeId: employee.id
                },
                include: {
                    JobApplication: {
                        include: {
                            Candidate: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            },
                            Job: {
                                select: {
                                    title: true,
                                    companyName: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        }
        throw new _common.BadRequestException('Invalid user role for referral history');
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
ReferralService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], ReferralService);

//# sourceMappingURL=referral.service.js.map