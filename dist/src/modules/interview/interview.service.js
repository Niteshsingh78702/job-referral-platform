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
    async requestInterview(userId, applicationId, dto) {
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
        const hr = await this.prisma.hR.findUnique({
            where: { userId },
        });
        if (!hr || application.job.hrId !== hr.id) {
            throw new common_1.ForbiddenException('You can only request interviews for your own job applications');
        }
        const existingInterview = await this.prisma.interview.findUnique({
            where: { applicationId }
        });
        if (existingInterview) {
            throw new common_1.BadRequestException('Interview already requested for this application');
        }
        const interview = await this.prisma.$transaction(async (tx) => {
            const newInterview = await tx.interview.create({
                data: {
                    applicationId,
                    mode: dto.mode,
                    preferredTimeWindow: dto.preferredTimeWindow,
                    hrNotes: dto.hrNotes,
                    status: constants_1.InterviewStatus.PAYMENT_PENDING,
                    paymentStatus: constants_1.PaymentStatus.ELIGIBLE,
                },
            });
            await tx.jobApplication.update({
                where: { id: applicationId },
                data: { status: 'INTERVIEW_REQUESTED' },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: constants_1.AuditAction.CREATE,
                    entityType: 'Interview',
                    entityId: newInterview.id,
                    newValue: {
                        mode: dto.mode,
                        applicationId,
                        status: 'PAYMENT_PENDING',
                    },
                },
            });
            return newInterview;
        });
        await this.sendInterviewRequestEmail(application);
        return {
            message: 'Interview request created successfully',
            interview: {
                id: interview.id,
                mode: interview.mode,
                status: interview.status,
                preferredTimeWindow: interview.preferredTimeWindow,
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
        if (interview.status !== constants_1.InterviewStatus.PAYMENT_PENDING) {
            throw new common_1.BadRequestException('Interview is not in PAYMENT_PENDING status');
        }
        const updatedInterview = await this.prisma.interview.update({
            where: { id: interview.id },
            data: {
                status: constants_1.InterviewStatus.READY_TO_SCHEDULE,
                paymentStatus: constants_1.PaymentStatus.SUCCESS,
                paidAt: new Date(),
            },
        });
        await this.sendPaymentConfirmationToHR(interview);
        return updatedInterview;
    }
    async scheduleInterview(userId, interviewId, dto) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                application: {
                    include: {
                        job: true,
                        candidate: { include: { user: true } },
                    },
                },
            },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        const hr = await this.prisma.hR.findUnique({
            where: { userId },
        });
        if (!hr || interview.application.job.hrId !== hr.id) {
            throw new common_1.ForbiddenException('You can only schedule interviews for your own job applications');
        }
        if (interview.paymentStatus !== constants_1.PaymentStatus.SUCCESS) {
            throw new common_1.ForbiddenException('Cannot schedule interview until candidate payment is confirmed');
        }
        if (interview.status !== constants_1.InterviewStatus.READY_TO_SCHEDULE) {
            throw new common_1.BadRequestException(`Interview is in ${interview.status} status. Expected READY_TO_SCHEDULE.`);
        }
        const updatedInterview = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.interview.update({
                where: { id: interviewId },
                data: {
                    scheduledDate: new Date(dto.scheduledDate),
                    scheduledTime: dto.scheduledTime,
                    interviewLink: dto.interviewLink,
                    callDetails: dto.callDetails,
                    status: constants_1.InterviewStatus.INTERVIEW_SCHEDULED,
                    scheduledAt: new Date(),
                },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: constants_1.AuditAction.UPDATE,
                    entityType: 'Interview',
                    entityId: interviewId,
                    oldValue: { status: interview.status },
                    newValue: {
                        status: 'INTERVIEW_SCHEDULED',
                        scheduledDate: dto.scheduledDate,
                        scheduledTime: dto.scheduledTime,
                    },
                },
            });
            return updated;
        });
        await this.sendInterviewScheduledEmail(interview, dto);
        return {
            message: 'Interview scheduled successfully',
            interview: updatedInterview,
        };
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
            requestedAt: interview.requestedAt,
        };
        switch (interview.status) {
            case constants_1.InterviewStatus.PAYMENT_PENDING:
                return {
                    ...baseResponse,
                    message: 'Please complete payment to confirm your interview',
                };
            case constants_1.InterviewStatus.READY_TO_SCHEDULE:
                return {
                    ...baseResponse,
                    message: 'Payment confirmed! HR will schedule your interview soon.',
                    paidAt: interview.paidAt,
                };
            case constants_1.InterviewStatus.INTERVIEW_SCHEDULED:
                return {
                    ...baseResponse,
                    scheduledDate: interview.scheduledDate,
                    scheduledTime: interview.scheduledTime,
                    interviewLink: interview.interviewLink,
                    callDetails: interview.callDetails,
                    paidAt: interview.paidAt,
                    scheduledAt: interview.scheduledAt,
                };
            case constants_1.InterviewStatus.COMPLETED:
                return {
                    ...baseResponse,
                    scheduledDate: interview.scheduledDate,
                    scheduledTime: interview.scheduledTime,
                    completedAt: interview.completedAt,
                    message: 'Interview completed',
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
                requestedAt: interview.requestedAt,
                paidAt: interview.paidAt,
            };
            if (interview.status === constants_1.InterviewStatus.INTERVIEW_SCHEDULED ||
                interview.status === constants_1.InterviewStatus.COMPLETED) {
                return {
                    ...base,
                    scheduledDate: interview.scheduledDate,
                    scheduledTime: interview.scheduledTime,
                    interviewLink: interview.interviewLink,
                    callDetails: interview.callDetails,
                };
            }
            return base;
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
        const [total, paymentPending, readyToSchedule, scheduled, completed] = await Promise.all([
            this.prisma.interview.count(),
            this.prisma.interview.count({ where: { status: constants_1.InterviewStatus.PAYMENT_PENDING } }),
            this.prisma.interview.count({ where: { status: constants_1.InterviewStatus.READY_TO_SCHEDULE } }),
            this.prisma.interview.count({ where: { status: constants_1.InterviewStatus.INTERVIEW_SCHEDULED } }),
            this.prisma.interview.count({ where: { status: constants_1.InterviewStatus.COMPLETED } }),
        ]);
        const flaggedHRs = await this.prisma.$queryRaw `
            SELECT h."companyName", h."userId", COUNT(*) as pending_count
            FROM "Interview" i
            JOIN "JobApplication" ja ON ja.id = i."applicationId"
            JOIN "Job" j ON j.id = ja."jobId"
            JOIN "HR" h ON h.id = j."hrId"
            WHERE i.status = 'READY_TO_SCHEDULE'
            AND i."paidAt" < NOW() - INTERVAL '48 hours'
            GROUP BY h.id
            HAVING COUNT(*) > 2
        `;
        return {
            total,
            byStatus: {
                paymentPending,
                readyToSchedule,
                scheduled,
                completed,
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
    async sendInterviewRequestEmail(application) {
        const candidateEmail = application.candidate.user.email;
        const candidateName = `${application.candidate.firstName} ${application.candidate.lastName}`;
        const companyName = application.job.companyName;
        const jobTitle = application.job.title;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">🎉 Great News, ${candidateName}!</h2>
                <p>The HR team at <strong>${companyName}</strong> wants to interview you for the position:</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <h3 style="margin: 0 0 8px 0;">${jobTitle}</h3>
                    <p style="margin: 0; color: #6b7280;">${companyName}</p>
                </div>
                <p><strong>Next Step:</strong> Pay ₹99 to confirm your interview slot and unlock scheduling.</p>
                <p style="color: #6b7280; font-size: 14px;">
                    This small fee helps us maintain quality connections and shows your commitment to the opportunity.
                </p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}#my-applications" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                          border-radius: 6px; text-decoration: none; margin-top: 16px;">
                    Pay & Confirm Interview
                </a>
            </div>
        `;
        await this.emailService.sendEmail({
            to: candidateEmail,
            subject: `🎉 Interview Request from ${companyName} - Pay ₹99 to Confirm`,
            html,
        });
    }
    async sendPaymentConfirmationToHR(interview) {
        const hrEmail = interview.application.job.hr.user.email;
        const candidateName = `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`;
        const jobTitle = interview.application.job.title;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">✅ Payment Confirmed - Schedule Interview</h2>
                <p><strong>${candidateName}</strong> has paid and confirmed their interview for:</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <h3 style="margin: 0 0 8px 0;">${jobTitle}</h3>
                </div>
                <p><strong>Action Required:</strong> Please schedule the interview with date, time, and meeting link.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/hr-dashboard.html#interviews" 
                   style="display: inline-block; background: #059669; color: white; padding: 12px 24px; 
                          border-radius: 6px; text-decoration: none; margin-top: 16px;">
                    Schedule Interview Now
                </a>
            </div>
        `;
        await this.emailService.sendEmail({
            to: hrEmail,
            subject: `✅ ${candidateName} Confirmed Interview - Schedule Now`,
            html,
        });
    }
    async sendInterviewScheduledEmail(interview, schedule) {
        const candidateEmail = interview.application.candidate.user.email;
        const candidateName = `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`;
        const companyName = interview.application.job.companyName;
        const jobTitle = interview.application.job.title;
        const meetingDetails = interview.mode === 'VIDEO' && schedule.interviewLink
            ? `<p><strong>Meeting Link:</strong> <a href="${schedule.interviewLink}">${schedule.interviewLink}</a></p>`
            : interview.mode === 'CALL' && schedule.callDetails
                ? `<p><strong>Call Details:</strong> ${schedule.callDetails}</p>`
                : interview.mode === 'ONSITE' && schedule.callDetails
                    ? `<p><strong>Location:</strong> ${schedule.callDetails}</p>`
                    : '';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7c3aed;">📅 Your Interview is Scheduled!</h2>
                <p>Hi ${candidateName},</p>
                <p>Your interview with <strong>${companyName}</strong> has been scheduled:</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <h3 style="margin: 0 0 8px 0;">${jobTitle}</h3>
                    <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(schedule.scheduledDate).toLocaleDateString()}</p>
                    <p style="margin: 4px 0;"><strong>Time:</strong> ${schedule.scheduledTime}</p>
                    <p style="margin: 4px 0;"><strong>Mode:</strong> ${interview.mode}</p>
                    ${meetingDetails}
                </div>
                <p style="color: #6b7280;">Good luck with your interview! 🍀</p>
            </div>
        `;
        await this.emailService.sendEmail({
            to: candidateEmail,
            subject: `📅 Interview Scheduled: ${jobTitle} at ${companyName}`,
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