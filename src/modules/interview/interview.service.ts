import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RequestInterviewDto, ScheduleInterviewDto } from './dto';
import {
    InterviewStatus,
    InterviewMode,
    PaymentStatus,
    AuditAction,
} from '../../common/constants';

@Injectable()
export class InterviewService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    /**
     * HR requests an interview for an application
     * Creates Interview record with PAYMENT_PENDING status
     * Updates application status to INTERVIEW_REQUESTED
     */
    async requestInterview(userId: string, applicationId: string, dto: RequestInterviewDto) {
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

        // Check if HR owns this job
        const hr = await this.prisma.hR.findUnique({
            where: { userId },
        });

        if (!hr || application.job.hrId !== hr.id) {
            throw new ForbiddenException('You can only request interviews for your own job applications');
        }

        // Check if interview already exists
        const existingInterview = await this.prisma.interview.findUnique({
            where: { applicationId }
        });

        if (existingInterview) {
            throw new BadRequestException('Interview already requested for this application');
        }

        // Create interview and update application status in transaction
        const interview = await this.prisma.$transaction(async (tx) => {
            // Create interview record
            const newInterview = await tx.interview.create({
                data: {
                    applicationId,
                    mode: dto.mode as any,
                    preferredTimeWindow: dto.preferredTimeWindow,
                    hrNotes: dto.hrNotes,
                    status: InterviewStatus.PAYMENT_PENDING as any,
                    paymentStatus: PaymentStatus.ELIGIBLE as any,
                },
            });

            // Update application status
            await tx.jobApplication.update({
                where: { id: applicationId },
                data: { status: 'INTERVIEW_REQUESTED' as any },
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
                        applicationId,
                        status: 'PAYMENT_PENDING',
                    },
                },
            });

            return newInterview;
        });

        // Send notification email to candidate
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

    /**
     * Process successful payment - called by payment service
     * Transitions interview from PAYMENT_PENDING to READY_TO_SCHEDULE
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

        if (interview.status !== InterviewStatus.PAYMENT_PENDING) {
            throw new BadRequestException('Interview is not in PAYMENT_PENDING status');
        }

        // Update interview status
        const updatedInterview = await this.prisma.interview.update({
            where: { id: interview.id },
            data: {
                status: InterviewStatus.READY_TO_SCHEDULE as any,
                paymentStatus: PaymentStatus.SUCCESS as any,
                paidAt: new Date(),
            },
        });

        // Send notification to HR that payment received and scheduling is unlocked
        await this.sendPaymentConfirmationToHR(interview);

        return updatedInterview;
    }

    /**
     * HR schedules the interview (only after payment is confirmed)
     * Sets date, time, and meeting details
     */
    async scheduleInterview(userId: string, interviewId: string, dto: ScheduleInterviewDto) {
        // Verify interview exists and HR owns the related job
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
            throw new NotFoundException('Interview not found');
        }

        // Check HR ownership
        const hr = await this.prisma.hR.findUnique({
            where: { userId },
        });

        if (!hr || interview.application.job.hrId !== hr.id) {
            throw new ForbiddenException('You can only schedule interviews for your own job applications');
        }

        // CRITICAL: Ensure payment is confirmed before scheduling
        if (interview.paymentStatus !== PaymentStatus.SUCCESS) {
            throw new ForbiddenException('Cannot schedule interview until candidate payment is confirmed');
        }

        if (interview.status !== InterviewStatus.READY_TO_SCHEDULE) {
            throw new BadRequestException(`Interview is in ${interview.status} status. Expected READY_TO_SCHEDULE.`);
        }

        // Update interview with scheduling details
        const updatedInterview = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.interview.update({
                where: { id: interviewId },
                data: {
                    scheduledDate: new Date(dto.scheduledDate),
                    scheduledTime: dto.scheduledTime,
                    interviewLink: dto.interviewLink,
                    callDetails: dto.callDetails,
                    status: InterviewStatus.INTERVIEW_SCHEDULED as any,
                    scheduledAt: new Date(),
                },
            });

            // Create audit log
            await tx.auditLog.create({
                data: {
                    userId,
                    action: AuditAction.UPDATE,
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

        // Send interview details to candidate
        await this.sendInterviewScheduledEmail(interview, dto);

        return {
            message: 'Interview scheduled successfully',
            interview: updatedInterview,
        };
    }

    /**
     * Get interview details for candidate
     * Returns filtered data based on interview status
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

        // Return filtered data based on status
        // CRITICAL: Only return interview link/details if INTERVIEW_SCHEDULED
        const baseResponse = {
            id: interview.id,
            mode: interview.mode,
            status: interview.status,
            paymentStatus: interview.paymentStatus,
            job: interview.application.job,
            requestedAt: interview.requestedAt,
        };

        switch (interview.status) {
            case InterviewStatus.PAYMENT_PENDING:
                return {
                    ...baseResponse,
                    message: 'Please complete payment to confirm your interview',
                };

            case InterviewStatus.READY_TO_SCHEDULE:
                return {
                    ...baseResponse,
                    message: 'Payment confirmed! HR will schedule your interview soon.',
                    paidAt: interview.paidAt,
                };

            case InterviewStatus.INTERVIEW_SCHEDULED:
                return {
                    ...baseResponse,
                    scheduledDate: interview.scheduledDate,
                    scheduledTime: interview.scheduledTime,
                    interviewLink: interview.interviewLink,
                    callDetails: interview.callDetails,
                    paidAt: interview.paidAt,
                    scheduledAt: interview.scheduledAt,
                };

            case InterviewStatus.COMPLETED:
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

        // Filter sensitive data based on status
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

            if (interview.status === InterviewStatus.INTERVIEW_SCHEDULED ||
                interview.status === InterviewStatus.COMPLETED) {
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

    /**
     * Get interviews for HR's jobs
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

    /**
     * Get interview statistics for admin
     */
    async getAdminInterviewStats() {
        const [total, paymentPending, readyToSchedule, scheduled, completed] = await Promise.all([
            this.prisma.interview.count(),
            this.prisma.interview.count({ where: { status: InterviewStatus.PAYMENT_PENDING as any } }),
            this.prisma.interview.count({ where: { status: InterviewStatus.READY_TO_SCHEDULE as any } }),
            this.prisma.interview.count({ where: { status: InterviewStatus.INTERVIEW_SCHEDULED as any } }),
            this.prisma.interview.count({ where: { status: InterviewStatus.COMPLETED as any } }),
        ]);

        // Get HRs with repeated requests without scheduling (potential flag)
        const flaggedHRs = await this.prisma.$queryRaw`
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

    // ===========================================
    // Email Helper Methods
    // ===========================================

    private async sendInterviewRequestEmail(application: any) {
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

    private async sendPaymentConfirmationToHR(interview: any) {
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

    private async sendInterviewScheduledEmail(interview: any, schedule: ScheduleInterviewDto) {
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
}
