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
exports.InterviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const constants_1 = require("../../common/constants");
let InterviewService = class InterviewService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async confirmInterview(userId, applicationId, dto) {
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                job: { include: { hr: true } },
                candidate: { include: { user: true } },
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        if (application.status !== constants_1.ApplicationStatus.APPLIED) {
            throw new common_1.BadRequestException(`Cannot confirm interview. Application status is ${application.status}. Expected APPLIED (test passed).`);
        }
        const hr = await this.prisma.hR.findUnique({
            where: { userId },
        });
        if (!hr || application.job.hrId !== hr.id) {
            throw new common_1.ForbiddenException('You can only confirm interviews for your own job applications');
        }
        const existingInterview = await this.prisma.interview.findUnique({
            where: { applicationId }
        });
        if (existingInterview) {
            throw new common_1.BadRequestException('Interview already confirmed for this application. Contact admin to modify.');
        }
        const interview = await this.prisma.$transaction(async (tx) => {
            const newInterview = await tx.interview.create({
                data: {
                    applicationId,
                    mode: dto.mode,
                    scheduledDate: new Date(dto.scheduledDate),
                    scheduledTime: dto.scheduledTime,
                    hrNotes: dto.hrNote,
                    status: constants_1.InterviewStatus.INTERVIEW_CONFIRMED,
                    paymentStatus: constants_1.PaymentStatus.ELIGIBLE,
                    scheduledAt: new Date(),
                },
            });
            await tx.jobApplication.update({
                where: { id: applicationId },
                data: { status: constants_1.ApplicationStatus.INTERVIEW_CONFIRMED },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: constants_1.AuditAction.CREATE,
                    entityType: 'Interview',
                    entityId: newInterview.id,
                    newValue: {
                        mode: dto.mode,
                        scheduledDate: dto.scheduledDate,
                        scheduledTime: dto.scheduledTime,
                        applicationId,
                        status: constants_1.InterviewStatus.INTERVIEW_CONFIRMED,
                    },
                },
            });
            return newInterview;
        });
        await this.sendInterviewConfirmedEmail(application, dto);
        return {
            message: 'Interview confirmed successfully. Candidate will be notified to make payment.',
            interview: {
                id: interview.id,
                mode: interview.mode,
                status: interview.status,
                scheduledDate: interview.scheduledDate,
                scheduledTime: interview.scheduledTime,
            },
        };
    }
    async processPaymentSuccess(applicationId, paymentId) {
        const interview = await this.prisma.interview.findUnique({
            where: { applicationId },
            include: {
                application: {
                    include: {
                        job: { include: { hr: { include: { user: true } } } },
                        candidate: { include: { user: true } },
                    },
                },
            },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found for this application');
        }
        if (interview.status !== constants_1.InterviewStatus.INTERVIEW_CONFIRMED) {
            throw new common_1.BadRequestException(`Interview is in ${interview.status} status. Expected INTERVIEW_CONFIRMED.`);
        }
        const updatedInterview = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.interview.update({
                where: { id: interview.id },
                data: {
                    status: constants_1.InterviewStatus.PAYMENT_SUCCESS,
                    paymentStatus: constants_1.PaymentStatus.SUCCESS,
                    paidAt: new Date(),
                },
            });
            await tx.jobApplication.update({
                where: { id: applicationId },
                data: { status: constants_1.ApplicationStatus.PAYMENT_SUCCESS },
            });
            return updated;
        });
        await this.sendPaymentSuccessEmail(interview);
        await this.sendPaymentNotificationToHR(interview);
        return updatedInterview;
    }
    async getInterviewForCandidate(userId, interviewId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                application: {
                    include: {
                        job: {
                            select: {
                                id: true,
                                title: true,
                                companyName: true,
                            },
                        },
                    },
                },
            },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        if (interview.application.candidateId !== candidate.id) {
            throw new common_1.ForbiddenException('You can only view your own interviews');
        }
        const baseResponse = {
            id: interview.id,
            mode: interview.mode,
            status: interview.status,
            paymentStatus: interview.paymentStatus,
            job: interview.application.job,
            createdAt: interview.createdAt,
        };
        switch (interview.status) {
            case constants_1.InterviewStatus.INTERVIEW_CONFIRMED:
                return {
                    ...baseResponse,
                    message: 'HR has scheduled your interview. Pay ₹99 to unlock details.',
                    requiresPayment: true,
                };
            case constants_1.InterviewStatus.PAYMENT_SUCCESS:
            case constants_1.InterviewStatus.INTERVIEW_COMPLETED:
                return {
                    ...baseResponse,
                    scheduledDate: interview.scheduledDate,
                    scheduledTime: interview.scheduledTime,
                    hrNote: interview.hrNotes,
                    paidAt: interview.paidAt,
                    message: interview.status === constants_1.InterviewStatus.PAYMENT_SUCCESS
                        ? 'Interview details unlocked. Best of luck!'
                        : 'Interview completed.',
                };
            case constants_1.InterviewStatus.CANDIDATE_NO_SHOW:
                return {
                    ...baseResponse,
                    message: 'You missed this interview. Contact support for assistance.',
                };
            case constants_1.InterviewStatus.HR_NO_SHOW:
                return {
                    ...baseResponse,
                    message: 'HR did not conduct this interview. A refund has been initiated.',
                };
            case constants_1.InterviewStatus.CANCELLED:
                return {
                    ...baseResponse,
                    message: 'This interview was cancelled.',
                };
            default:
                return baseResponse;
        }
    }
    async getCandidateInterviews(userId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        const interviews = await this.prisma.interview.findMany({
            where: {
                application: {
                    candidateId: candidate.id,
                },
            },
            include: {
                application: {
                    include: {
                        job: {
                            select: {
                                id: true,
                                title: true,
                                companyName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return interviews.map((interview) => {
            const base = {
                id: interview.id,
                mode: interview.mode,
                status: interview.status,
                paymentStatus: interview.paymentStatus,
                job: interview.application.job,
                createdAt: interview.createdAt,
                paidAt: interview.paidAt,
            };
            if (interview.status === constants_1.InterviewStatus.PAYMENT_SUCCESS ||
                interview.status === constants_1.InterviewStatus.INTERVIEW_COMPLETED) {
                return {
                    ...base,
                    scheduledDate: interview.scheduledDate,
                    scheduledTime: interview.scheduledTime,
                    hrNote: interview.hrNotes,
                };
            }
            return {
                ...base,
                requiresPayment: interview.status === constants_1.InterviewStatus.INTERVIEW_CONFIRMED,
            };
        });
    }
    async getHRInterviews(userId, filters) {
        const hr = await this.prisma.hR.findUnique({
            where: { userId },
        });
        if (!hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        const where = {
            application: {
                job: {
                    hrId: hr.id,
                },
            },
        };
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.jobId) {
            where.application = {
                ...where.application,
                jobId: filters.jobId,
            };
        }
        const interviews = await this.prisma.interview.findMany({
            where,
            include: {
                application: {
                    include: {
                        candidate: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                user: {
                                    select: {
                                        email: true,
                                    },
                                },
                            },
                        },
                        job: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return interviews;
    }
    async getAdminInterviewStats() {
        const [total, confirmed, paymentSuccess, completed, candidateNoShow, hrNoShow] = await Promise.all([
            this.prisma.interview.count(),
            this.prisma.interview.count({ where: { status: constants_1.InterviewStatus.INTERVIEW_CONFIRMED } }),
            this.prisma.interview.count({ where: { status: constants_1.InterviewStatus.PAYMENT_SUCCESS } }),
            this.prisma.interview.count({ where: { status: constants_1.InterviewStatus.INTERVIEW_COMPLETED } }),
            this.prisma.interview.count({ where: { status: constants_1.InterviewStatus.CANDIDATE_NO_SHOW } }),
            this.prisma.interview.count({ where: { status: constants_1.InterviewStatus.HR_NO_SHOW } }),
        ]);
        const flaggedHRs = await this.prisma.$queryRaw `
            SELECT h."companyName", h."userId", COUNT(*) as pending_count
            FROM "Interview" i
            JOIN "JobApplication" ja ON ja.id = i."applicationId"
            JOIN "Job" j ON j.id = ja."jobId"
            JOIN "HR" h ON h.id = j."hrId"
            WHERE i.status = 'INTERVIEW_CONFIRMED'
            AND i."scheduledAt" < NOW() - INTERVAL '48 hours'
            GROUP BY h.id
            HAVING COUNT(*) > 2
        `;
        return {
            total,
            byStatus: {
                confirmed,
                paymentSuccess,
                completed,
                candidateNoShow,
                hrNoShow,
            },
            flaggedHRs,
        };
    }
    async getAdminInterviews(page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        const [interviews, total] = await Promise.all([
            this.prisma.interview.findMany({
                where,
                skip,
                take: limit,
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
                                    hr: {
                                        select: {
                                            companyName: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.interview.count({ where }),
        ]);
        return {
            interviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async markNoShow(interviewId, type, adminUserId) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        const newStatus = type === 'CANDIDATE'
            ? constants_1.InterviewStatus.CANDIDATE_NO_SHOW
            : constants_1.InterviewStatus.HR_NO_SHOW;
        const updatedInterview = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.interview.update({
                where: { id: interviewId },
                data: {
                    status: newStatus,
                    completedAt: new Date(),
                },
            });
            await tx.jobApplication.update({
                where: { id: interview.applicationId },
                data: {
                    status: (type === 'CANDIDATE'
                        ? constants_1.ApplicationStatus.CANDIDATE_NO_SHOW
                        : constants_1.ApplicationStatus.HR_NO_SHOW)
                },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminUserId,
                    action: constants_1.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Interview',
                    entityId: interviewId,
                    oldValue: { status: interview.status },
                    newValue: { status: newStatus, reason: `${type}_NO_SHOW` },
                },
            });
            return updated;
        });
        return {
            message: `Interview marked as ${type} no-show`,
            interview: updatedInterview,
        };
    }
    async markCompleted(interviewId, adminUserId) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        if (interview.status !== constants_1.InterviewStatus.PAYMENT_SUCCESS) {
            throw new common_1.BadRequestException('Can only mark PAYMENT_SUCCESS interviews as completed');
        }
        const updatedInterview = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.interview.update({
                where: { id: interviewId },
                data: {
                    status: constants_1.InterviewStatus.INTERVIEW_COMPLETED,
                    completedAt: new Date(),
                },
            });
            await tx.jobApplication.update({
                where: { id: interview.applicationId },
                data: { status: constants_1.ApplicationStatus.INTERVIEW_COMPLETED },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminUserId,
                    action: constants_1.AuditAction.UPDATE,
                    entityType: 'Interview',
                    entityId: interviewId,
                    oldValue: { status: interview.status },
                    newValue: { status: constants_1.InterviewStatus.INTERVIEW_COMPLETED },
                },
            });
            return updated;
        });
        return {
            message: 'Interview marked as completed',
            interview: updatedInterview,
        };
    }
    async sendInterviewConfirmedEmail(application, dto) {
        const candidateEmail = application.candidate.user.email;
        const candidateName = `${application.candidate.firstName} ${application.candidate.lastName}`;
        const companyName = application.job.companyName;
        const jobTitle = application.job.title;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">🎉 Great News, ${candidateName}!</h2>
                <p>The HR team at <strong>${companyName}</strong> has scheduled an interview for you!</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <h3 style="margin: 0 0 8px 0;">${jobTitle}</h3>
                    <p style="margin: 0; color: #6b7280;">${companyName}</p>
                </div>
                <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; font-weight: 500;">
                        <strong>Next Step:</strong> Pay ₹99 to unlock your interview details.
                    </p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">
                    This small fee ensures quality connections and shows your commitment to the opportunity.
                    Your interview details will be revealed immediately after payment.
                </p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}#my-applications" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                          border-radius: 6px; text-decoration: none; margin-top: 16px;">
                    Pay ₹99 & Unlock Details
                </a>
            </div>
        `;
        await this.emailService.sendEmail({
            to: candidateEmail,
            subject: `🎉 Interview Scheduled by ${companyName} - Pay ₹99 to Unlock Details`,
            html,
        });
    }
    async sendPaymentSuccessEmail(interview) {
        const candidateEmail = interview.application.candidate.user.email;
        const candidateName = `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`;
        const companyName = interview.application.job.companyName;
        const jobTitle = interview.application.job.title;
        const modeText = {
            CALL: '📞 Phone Call',
            VIDEO: '💻 Video Call',
            ONSITE: '🏢 On-site',
        }[interview.mode] || interview.mode;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">✅ Interview Details Unlocked!</h2>
                <p>Hi ${candidateName},</p>
                <p>Your payment is confirmed. Here are your interview details:</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 16px 0;">
                    <h3 style="margin: 0 0 12px 0;">${jobTitle}</h3>
                    <p style="margin: 4px 0;"><strong>Company:</strong> ${companyName}</p>
                    <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(interview.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p style="margin: 4px 0;"><strong>Time:</strong> ${interview.scheduledTime}</p>
                    <p style="margin: 4px 0;"><strong>Mode:</strong> ${modeText}</p>
                    ${interview.hrNotes ? `<p style="margin: 12px 0 0 0; padding-top: 12px; border-top: 1px solid #ddd;"><strong>Note from HR:</strong> ${interview.hrNotes}</p>` : ''}
                </div>
                <p style="color: #059669; font-weight: 500;">Best of luck with your interview! 🍀</p>
            </div>
        `;
        await this.emailService.sendEmail({
            to: candidateEmail,
            subject: `✅ Interview Details Unlocked - ${jobTitle} at ${companyName}`,
            html,
        });
    }
    async sendPaymentNotificationToHR(interview) {
        const hrEmail = interview.application.job.hr.user.email;
        const candidateName = `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`;
        const jobTitle = interview.application.job.title;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">✅ Candidate Has Confirmed</h2>
                <p><strong>${candidateName}</strong> has paid and confirmed their interview for:</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <h3 style="margin: 0 0 8px 0;">${jobTitle}</h3>
                    <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(interview.scheduledDate).toLocaleDateString()}</p>
                    <p style="margin: 4px 0;"><strong>Time:</strong> ${interview.scheduledTime}</p>
                    <p style="margin: 4px 0;"><strong>Mode:</strong> ${interview.mode}</p>
                </div>
                <p>The candidate has been sent the interview details. Please be prepared for the interview.</p>
            </div>
        `;
        await this.emailService.sendEmail({
            to: hrEmail,
            subject: `✅ ${candidateName} Confirmed Interview for ${jobTitle}`,
            html,
        });
    }
};
exports.InterviewService = InterviewService;
exports.InterviewService = InterviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], InterviewService);
//# sourceMappingURL=interview.service.js.map