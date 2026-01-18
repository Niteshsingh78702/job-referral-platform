import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfirmInterviewDto } from './dto';
import {
    InterviewStatus,
    InterviewMode,
    PaymentStatus,
    AuditAction,
    ApplicationStatus,
} from '../../common/constants';

@Injectable()
export class InterviewService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    /**
     * HR confirms an interview with scheduling details.
     * NEW FLOW: HR sets date/time/mode upfront, then candidate pays to unlock.
     * Creates Interview record with INTERVIEW_CONFIRMED status.
     * Updates application status to INTERVIEW_CONFIRMED.
     */
    async confirmInterview(userId: string, applicationId: string, dto: ConfirmInterviewDto) {
        // Verify HR owns the job for this application
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                job: { include: { hr: true } },
                candidate: { include: { user: true } },
            },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Verify application is in APPLIED status (test passed)
        if (application.status !== ApplicationStatus.APPLIED) {
            throw new BadRequestException(
                `Cannot confirm interview. Application status is ${application.status}. Expected APPLIED (test passed).`
            );
        }

        // Check if HR owns this job
        const hr = await this.prisma.hR.findUnique({
            where: { userId },
        });

        if (!hr || application.job.hrId !== hr.id) {
            throw new ForbiddenException('You can only confirm interviews for your own job applications');
        }

        // Check if interview already exists
        const existingInterview = await this.prisma.interview.findUnique({
            where: { applicationId }
        });

        if (existingInterview) {
            throw new BadRequestException('Interview already confirmed for this application. Contact admin to modify.');
        }

        // Create interview with scheduling details and update application status
        const interview = await this.prisma.$transaction(async (tx) => {
            // Create interview record with interview details already set
            const newInterview = await tx.interview.create({
                data: {
                    applicationId,
                    mode: dto.mode as any,
                    scheduledDate: new Date(dto.scheduledDate),
                    scheduledTime: dto.scheduledTime,
                    hrNotes: dto.hrNote,
                    status: InterviewStatus.INTERVIEW_CONFIRMED as any,
                    paymentStatus: PaymentStatus.ELIGIBLE as any,
                    scheduledAt: new Date(), // HR confirmed at this time
                },
            });

            // Update application status to INTERVIEW_CONFIRMED
            await tx.jobApplication.update({
                where: { id: applicationId },
                data: { status: ApplicationStatus.INTERVIEW_CONFIRMED as any },
            });

            // Create audit log
            await tx.auditLog.create({
                data: {
                    userId,
                    action: AuditAction.CREATE,
                    entityType: 'Interview',
                    entityId: newInterview.id,
                    newValue: {
                        mode: dto.mode,
                        scheduledDate: dto.scheduledDate,
                        scheduledTime: dto.scheduledTime,
                        applicationId,
                        status: InterviewStatus.INTERVIEW_CONFIRMED,
                    },
                },
            });

            return newInterview;
        });

        // Send notification email to candidate - "Pay ₹99 to unlock details"
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

    /**
     * Process successful payment - called by payment service.
     * Transitions interview from INTERVIEW_CONFIRMED to PAYMENT_SUCCESS.
     * Now candidate can see interview details.
     */
    async processPaymentSuccess(applicationId: string, paymentId: string) {
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
            throw new NotFoundException('Interview not found for this application');
        }

        if (interview.status !== InterviewStatus.INTERVIEW_CONFIRMED) {
            throw new BadRequestException(
                `Interview is in ${interview.status} status. Expected INTERVIEW_CONFIRMED.`
            );
        }

        // Update interview and application status
        const updatedInterview = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.interview.update({
                where: { id: interview.id },
                data: {
                    status: InterviewStatus.PAYMENT_SUCCESS as any,
                    paymentStatus: PaymentStatus.SUCCESS as any,
                    paidAt: new Date(),
                },
            });

            // Update application status
            await tx.jobApplication.update({
                where: { id: applicationId },
                data: { status: ApplicationStatus.PAYMENT_SUCCESS as any },
            });

            return updated;
        });

        // Send confirmation email to candidate with interview details
        await this.sendPaymentSuccessEmail(interview);

        // Notify HR that candidate has paid
        await this.sendPaymentNotificationToHR(interview);

        return updatedInterview;
    }

    /**
     * Get interview details for candidate.
     * CRITICAL: Only return interview details if payment is successful.
     */
    async getInterviewForCandidate(userId: string, interviewId: string) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });

        if (!candidate) {
            throw new NotFoundException('Candidate profile not found');
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
            throw new NotFoundException('Interview not found');
        }

        // Verify candidate owns this interview's application
        if (interview.application.candidateId !== candidate.id) {
            throw new ForbiddenException('You can only view your own interviews');
        }

        // Base response (always visible)
        const baseResponse = {
            id: interview.id,
            mode: interview.mode,
            status: interview.status,
            paymentStatus: interview.paymentStatus,
            job: interview.application.job,
            createdAt: interview.createdAt,
        };

        // Return filtered data based on status
        switch (interview.status) {
            case InterviewStatus.INTERVIEW_CONFIRMED:
                // Interview confirmed but not paid - show payment CTA
                return {
                    ...baseResponse,
                    message: 'HR has scheduled your interview. Pay ₹99 to unlock details.',
                    requiresPayment: true,
                };

            case InterviewStatus.PAYMENT_SUCCESS:
            case InterviewStatus.INTERVIEW_COMPLETED:
                // Payment done - show full details
                return {
                    ...baseResponse,
                    scheduledDate: interview.scheduledDate,
                    scheduledTime: interview.scheduledTime,
                    hrNote: interview.hrNotes,
                    paidAt: interview.paidAt,
                    message: interview.status === InterviewStatus.PAYMENT_SUCCESS
                        ? 'Interview details unlocked. Best of luck!'
                        : 'Interview completed.',
                };

            case InterviewStatus.CANDIDATE_NO_SHOW:
                return {
                    ...baseResponse,
                    message: 'You missed this interview. Contact support for assistance.',
                };

            case InterviewStatus.HR_NO_SHOW:
                return {
                    ...baseResponse,
                    message: 'HR did not conduct this interview. A refund has been initiated.',
                };

            case InterviewStatus.CANCELLED:
                return {
                    ...baseResponse,
                    message: 'This interview was cancelled.',
                };

            default:
                return baseResponse;
        }
    }

    /**
     * Get all interviews for candidate
     */
    async getCandidateInterviews(userId: string) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });

        if (!candidate) {
            throw new NotFoundException('Candidate profile not found');
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

        // Filter sensitive data based on payment status
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

            // Only show interview details if payment successful
            if (interview.status === InterviewStatus.PAYMENT_SUCCESS ||
                interview.status === InterviewStatus.INTERVIEW_COMPLETED) {
                return {
                    ...base,
                    scheduledDate: interview.scheduledDate,
                    scheduledTime: interview.scheduledTime,
                    hrNote: interview.hrNotes,
                };
            }

            return {
                ...base,
                requiresPayment: interview.status === InterviewStatus.INTERVIEW_CONFIRMED,
            };
        });
    }

    /**
     * Get interviews for HR's jobs (shows all details to HR)
     */
    async getHRInterviews(userId: string, filters?: { status?: string; jobId?: string }) {
        const hr = await this.prisma.hR.findUnique({
            where: { userId },
        });

        if (!hr) {
            throw new NotFoundException('HR profile not found');
        }

        const where: any = {
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

    // ===========================================
    // ADMIN METHODS
    // ===========================================

    /**
     * Get interview statistics for admin
     */
    async getAdminInterviewStats() {
        const [total, confirmed, paymentSuccess, completed, candidateNoShow, hrNoShow] = await Promise.all([
            this.prisma.interview.count(),
            this.prisma.interview.count({ where: { status: InterviewStatus.INTERVIEW_CONFIRMED as any } }),
            this.prisma.interview.count({ where: { status: InterviewStatus.PAYMENT_SUCCESS as any } }),
            this.prisma.interview.count({ where: { status: InterviewStatus.INTERVIEW_COMPLETED as any } }),
            this.prisma.interview.count({ where: { status: InterviewStatus.CANDIDATE_NO_SHOW as any } }),
            this.prisma.interview.count({ where: { status: InterviewStatus.HR_NO_SHOW as any } }),
        ]);

        // Get HRs with repeated confirmations without candidate payments (potential flag)
        const flaggedHRs = await this.prisma.$queryRaw`
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

    /**
     * Get all interviews for admin with pagination
     */
    async getAdminInterviews(page: number = 1, limit: number = 20, status?: string) {
        const skip = (page - 1) * limit;
        const where: any = {};

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

    /**
     * Admin marks an interview as no-show
     */
    async markNoShow(interviewId: string, type: 'CANDIDATE' | 'HR', adminUserId: string) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
        });

        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        const newStatus = type === 'CANDIDATE'
            ? InterviewStatus.CANDIDATE_NO_SHOW
            : InterviewStatus.HR_NO_SHOW;

        const updatedInterview = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.interview.update({
                where: { id: interviewId },
                data: {
                    status: newStatus as any,
                    completedAt: new Date(),
                },
            });

            // Update application status
            await tx.jobApplication.update({
                where: { id: interview.applicationId },
                data: {
                    status: (type === 'CANDIDATE'
                        ? ApplicationStatus.CANDIDATE_NO_SHOW
                        : ApplicationStatus.HR_NO_SHOW) as any
                },
            });

            // Create audit log
            await tx.auditLog.create({
                data: {
                    userId: adminUserId,
                    action: AuditAction.ADMIN_OVERRIDE,
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

    /**
     * Admin marks interview as completed
     */
    async markCompleted(interviewId: string, adminUserId: string) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
        });

        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        if (interview.status !== InterviewStatus.PAYMENT_SUCCESS) {
            throw new BadRequestException('Can only mark PAYMENT_SUCCESS interviews as completed');
        }

        const updatedInterview = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.interview.update({
                where: { id: interviewId },
                data: {
                    status: InterviewStatus.INTERVIEW_COMPLETED as any,
                    completedAt: new Date(),
                },
            });

            // Update application status
            await tx.jobApplication.update({
                where: { id: interview.applicationId },
                data: { status: ApplicationStatus.INTERVIEW_COMPLETED as any },
            });

            // Create audit log
            await tx.auditLog.create({
                data: {
                    userId: adminUserId,
                    action: AuditAction.UPDATE,
                    entityType: 'Interview',
                    entityId: interviewId,
                    oldValue: { status: interview.status },
                    newValue: { status: InterviewStatus.INTERVIEW_COMPLETED },
                },
            });

            return updated;
        });

        return {
            message: 'Interview marked as completed',
            interview: updatedInterview,
        };
    }

    // ===========================================
    // Email Helper Methods
    // ===========================================

    private async sendInterviewConfirmedEmail(application: any, dto: ConfirmInterviewDto) {
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

    private async sendPaymentSuccessEmail(interview: any) {
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

    private async sendPaymentNotificationToHR(interview: any) {
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
}


