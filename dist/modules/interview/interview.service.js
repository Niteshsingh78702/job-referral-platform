"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InterviewService", {
    enumerable: true,
    get: function() {
        return InterviewService;
    }
});
const _common = require("@nestjs/common");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _prismaservice = require("../../prisma/prisma.service");
const _emailservice = require("../email/email.service");
const _constants = require("../../common/constants");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let InterviewService = class InterviewService {
    /**
     * HR confirms an interview with scheduling details.
     * NEW FLOW: HR sets date/time/mode upfront, then candidate pays to unlock.
     * Creates Interview record with INTERVIEW_CONFIRMED status.
     * Updates application status to INTERVIEW_CONFIRMED.
     */ async confirmInterview(userId, applicationId, dto) {
        // Verify HR owns the job for this application
        const application = await this.prisma.jobApplication.findUnique({
            where: {
                id: applicationId
            },
            include: {
                Job: {
                    include: {
                        HR: true
                    }
                },
                Candidate: {
                    include: {
                        User: true
                    }
                }
            }
        });
        if (!application) {
            throw new _common.NotFoundException('Application not found');
        }
        // Verify application is in APPLIED status (test passed)
        if (application.status !== _constants.ApplicationStatus.APPLIED) {
            throw new _common.BadRequestException(`Cannot confirm interview. Application status is ${application.status}. Expected APPLIED (test passed).`);
        }
        // Check if HR owns this job
        const hr = await this.prisma.hR.findUnique({
            where: {
                userId
            }
        });
        if (!hr || application.Job.hrId !== hr.id) {
            throw new _common.ForbiddenException('You can only confirm interviews for your own job applications');
        }
        // Check if interview already exists
        const existingInterview = await this.prisma.interview.findUnique({
            where: {
                applicationId
            }
        });
        if (existingInterview) {
            throw new _common.BadRequestException('Interview already confirmed for this application. Contact admin to modify.');
        }
        // Create interview with scheduling details and update application status
        const interview = await this.prisma.$transaction(async (tx)=>{
            // Create interview record with interview details already set
            const newInterview = await tx.interview.create({
                data: {
                    id: _crypto.randomUUID(),
                    applicationId,
                    mode: dto.mode,
                    scheduledDate: new Date(dto.scheduledDate),
                    scheduledTime: dto.scheduledTime,
                    hrNotes: dto.hrNote,
                    status: _constants.InterviewStatus.INTERVIEW_CONFIRMED,
                    paymentStatus: _constants.PaymentStatus.ELIGIBLE,
                    scheduledAt: new Date(),
                    updatedAt: new Date()
                }
            });
            // Update application status to INTERVIEW_CONFIRMED
            await tx.jobApplication.update({
                where: {
                    id: applicationId
                },
                data: {
                    status: _constants.ApplicationStatus.INTERVIEW_CONFIRMED
                }
            });
            // Create audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId,
                    action: _constants.AuditAction.CREATE,
                    entityType: 'Interview',
                    entityId: newInterview.id,
                    newValue: {
                        mode: dto.mode,
                        scheduledDate: dto.scheduledDate,
                        scheduledTime: dto.scheduledTime,
                        applicationId,
                        status: _constants.InterviewStatus.INTERVIEW_CONFIRMED
                    }
                }
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
                scheduledTime: interview.scheduledTime
            }
        };
    }
    /**
     * HR schedules interview after candidate has paid.
     * Updates interview with date, time, meeting link, and details.
     */ async scheduleInterview(userId, interviewId, dto) {
        // Get HR record
        const hr = await this.prisma.hR.findUnique({
            where: {
                userId
            }
        });
        if (!hr) {
            throw new _common.NotFoundException('HR profile not found');
        }
        // Get interview and verify ownership
        const interview = await this.prisma.interview.findUnique({
            where: {
                id: interviewId
            },
            include: {
                JobApplication: {
                    include: {
                        Job: true,
                        Candidate: {
                            include: {
                                User: true
                            }
                        }
                    }
                }
            }
        });
        if (!interview) {
            throw new _common.NotFoundException('Interview not found');
        }
        // Verify HR owns this job
        if (interview.JobApplication.Job.hrId !== hr.id) {
            throw new _common.ForbiddenException('You do not have permission to schedule this interview');
        }
        // Verify payment was successful
        if (interview.paymentStatus !== 'SUCCESS' && interview.status !== 'PAYMENT_SUCCESS') {
            throw new _common.BadRequestException('Cannot schedule interview - payment not received');
        }
        // Update interview with schedule details
        const updatedInterview = await this.prisma.interview.update({
            where: {
                id: interviewId
            },
            data: {
                scheduledDate: new Date(dto.scheduledDate),
                scheduledTime: dto.scheduledTime,
                interviewLink: dto.interviewLink || null,
                callDetails: dto.callDetails || null,
                scheduledAt: new Date(),
                updatedAt: new Date()
            }
        });
        return {
            success: true,
            message: 'Interview scheduled successfully. Candidate has been notified.',
            interview: {
                id: updatedInterview.id,
                scheduledDate: updatedInterview.scheduledDate,
                scheduledTime: updatedInterview.scheduledTime,
                interviewLink: updatedInterview.interviewLink,
                callDetails: updatedInterview.callDetails
            }
        };
    }
    /**
     * Process successful payment - called by payment service.
     * Transitions interview from INTERVIEW_CONFIRMED to PAYMENT_SUCCESS.
     * Now candidate can see interview details.
     */ async processPaymentSuccess(applicationId, paymentId) {
        const interview = await this.prisma.interview.findUnique({
            where: {
                applicationId
            },
            include: {
                JobApplication: {
                    include: {
                        Job: {
                            include: {
                                HR: {
                                    include: {
                                        User: true
                                    }
                                }
                            }
                        },
                        Candidate: {
                            include: {
                                User: true
                            }
                        }
                    }
                }
            }
        });
        if (!interview) {
            throw new _common.NotFoundException('Interview not found for this application');
        }
        if (interview.status !== _constants.InterviewStatus.INTERVIEW_CONFIRMED) {
            throw new _common.BadRequestException(`Interview is in ${interview.status} status. Expected INTERVIEW_CONFIRMED.`);
        }
        // Update interview and application status
        const updatedInterview = await this.prisma.$transaction(async (tx)=>{
            const updated = await tx.interview.update({
                where: {
                    id: interview.id
                },
                data: {
                    status: _constants.InterviewStatus.PAYMENT_SUCCESS,
                    paymentStatus: _constants.PaymentStatus.SUCCESS,
                    paidAt: new Date()
                }
            });
            // Update application status
            await tx.jobApplication.update({
                where: {
                    id: applicationId
                },
                data: {
                    status: _constants.ApplicationStatus.PAYMENT_SUCCESS
                }
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
     */ async getInterviewForCandidate(userId, interviewId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        const interview = await this.prisma.interview.findUnique({
            where: {
                id: interviewId
            },
            include: {
                JobApplication: {
                    include: {
                        Job: {
                            select: {
                                id: true,
                                title: true,
                                companyName: true
                            }
                        }
                    }
                }
            }
        });
        if (!interview) {
            throw new _common.NotFoundException('Interview not found');
        }
        // Verify candidate owns this interview's application
        if (interview.JobApplication.candidateId !== candidate.id) {
            throw new _common.ForbiddenException('You can only view your own interviews');
        }
        // Base response (always visible)
        const baseResponse = {
            id: interview.id,
            mode: interview.mode,
            status: interview.status,
            paymentStatus: interview.paymentStatus,
            job: interview.JobApplication.Job,
            createdAt: interview.createdAt
        };
        // Return filtered data based on status
        switch(interview.status){
            case _constants.InterviewStatus.INTERVIEW_CONFIRMED:
                // Interview confirmed but not paid - show payment CTA
                return {
                    ...baseResponse,
                    message: 'HR has scheduled your interview. Pay ₹99 to unlock details.',
                    requiresPayment: true
                };
            case _constants.InterviewStatus.PAYMENT_SUCCESS:
            case _constants.InterviewStatus.INTERVIEW_COMPLETED:
                // Payment done - show full details
                return {
                    ...baseResponse,
                    scheduledDate: interview.scheduledDate,
                    scheduledTime: interview.scheduledTime,
                    hrNote: interview.hrNotes,
                    paidAt: interview.paidAt,
                    message: interview.status === _constants.InterviewStatus.PAYMENT_SUCCESS ? 'Interview details unlocked. Best of luck!' : 'Interview completed.'
                };
            case _constants.InterviewStatus.CANDIDATE_NO_SHOW:
                return {
                    ...baseResponse,
                    message: 'You missed this interview. Contact support for assistance.'
                };
            case _constants.InterviewStatus.HR_NO_SHOW:
                return {
                    ...baseResponse,
                    message: 'HR did not conduct this interview. A refund has been initiated.'
                };
            case _constants.InterviewStatus.CANCELLED:
                return {
                    ...baseResponse,
                    message: 'This interview was cancelled.'
                };
            default:
                return baseResponse;
        }
    }
    /**
     * Get all interviews for candidate
     */ async getCandidateInterviews(userId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        const interviews = await this.prisma.interview.findMany({
            where: {
                JobApplication: {
                    candidateId: candidate.id
                }
            },
            include: {
                JobApplication: {
                    include: {
                        Job: {
                            select: {
                                id: true,
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
        // Filter sensitive data based on payment status
        return interviews.map((interview)=>{
            const base = {
                id: interview.id,
                mode: interview.mode,
                status: interview.status,
                paymentStatus: interview.paymentStatus,
                job: interview.JobApplication.Job,
                createdAt: interview.createdAt,
                paidAt: interview.paidAt
            };
            // Only show interview details if payment successful
            if (interview.status === _constants.InterviewStatus.PAYMENT_SUCCESS || interview.status === _constants.InterviewStatus.INTERVIEW_COMPLETED) {
                return {
                    ...base,
                    scheduledDate: interview.scheduledDate,
                    scheduledTime: interview.scheduledTime,
                    hrNote: interview.hrNotes
                };
            }
            return {
                ...base,
                requiresPayment: interview.status === _constants.InterviewStatus.INTERVIEW_CONFIRMED
            };
        });
    }
    /**
     * Get interviews for HR's jobs (shows all details to HR)
     */ async getHRInterviews(userId, filters) {
        const hr = await this.prisma.hR.findUnique({
            where: {
                userId
            }
        });
        if (!hr) {
            throw new _common.NotFoundException('HR profile not found');
        }
        const where = {
            JobApplication: {
                Job: {
                    hrId: hr.id
                }
            }
        };
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.jobId) {
            where.JobApplication = {
                ...where.JobApplication,
                jobId: filters.jobId
            };
        }
        const interviews = await this.prisma.interview.findMany({
            where,
            include: {
                JobApplication: {
                    include: {
                        Candidate: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                User: {
                                    select: {
                                        email: true
                                    }
                                }
                            }
                        },
                        Job: {
                            select: {
                                id: true,
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
        return interviews;
    }
    // ===========================================
    // ADMIN METHODS
    // ===========================================
    /**
     * Get interview statistics for admin
     */ async getAdminInterviewStats() {
        const [total, confirmed, paymentSuccess, completed, candidateNoShow, hrNoShow] = await Promise.all([
            this.prisma.interview.count(),
            this.prisma.interview.count({
                where: {
                    status: _constants.InterviewStatus.INTERVIEW_CONFIRMED
                }
            }),
            this.prisma.interview.count({
                where: {
                    status: _constants.InterviewStatus.PAYMENT_SUCCESS
                }
            }),
            this.prisma.interview.count({
                where: {
                    status: _constants.InterviewStatus.INTERVIEW_COMPLETED
                }
            }),
            this.prisma.interview.count({
                where: {
                    status: _constants.InterviewStatus.CANDIDATE_NO_SHOW
                }
            }),
            this.prisma.interview.count({
                where: {
                    status: _constants.InterviewStatus.HR_NO_SHOW
                }
            })
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
                hrNoShow
            },
            flaggedHRs
        };
    }
    /**
     * Get all interviews for admin with pagination
     */ async getAdminInterviews(page = 1, limit = 20, status) {
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
                                    companyName: true,
                                    HR: {
                                        select: {
                                            companyName: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.interview.count({
                where
            })
        ]);
        return {
            interviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Admin marks an interview as no-show
     */ async markNoShow(interviewId, type, adminUserId) {
        const interview = await this.prisma.interview.findUnique({
            where: {
                id: interviewId
            }
        });
        if (!interview) {
            throw new _common.NotFoundException('Interview not found');
        }
        const newStatus = type === 'CANDIDATE' ? _constants.InterviewStatus.CANDIDATE_NO_SHOW : _constants.InterviewStatus.HR_NO_SHOW;
        const updatedInterview = await this.prisma.$transaction(async (tx)=>{
            const updated = await tx.interview.update({
                where: {
                    id: interviewId
                },
                data: {
                    status: newStatus,
                    completedAt: new Date()
                }
            });
            // Update application status
            await tx.jobApplication.update({
                where: {
                    id: interview.applicationId
                },
                data: {
                    status: type === 'CANDIDATE' ? _constants.ApplicationStatus.CANDIDATE_NO_SHOW : _constants.ApplicationStatus.HR_NO_SHOW
                }
            });
            // Create audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminUserId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Interview',
                    entityId: interviewId,
                    oldValue: {
                        status: interview.status
                    },
                    newValue: {
                        status: newStatus,
                        reason: `${type}_NO_SHOW`
                    }
                }
            });
            return updated;
        });
        return {
            message: `Interview marked as ${type} no-show`,
            interview: updatedInterview
        };
    }
    /**
     * Admin marks interview as completed
     */ async markCompleted(interviewId, adminUserId) {
        const interview = await this.prisma.interview.findUnique({
            where: {
                id: interviewId
            }
        });
        if (!interview) {
            throw new _common.NotFoundException('Interview not found');
        }
        if (interview.status !== _constants.InterviewStatus.PAYMENT_SUCCESS) {
            throw new _common.BadRequestException('Can only mark PAYMENT_SUCCESS interviews as completed');
        }
        const updatedInterview = await this.prisma.$transaction(async (tx)=>{
            const updated = await tx.interview.update({
                where: {
                    id: interviewId
                },
                data: {
                    status: _constants.InterviewStatus.INTERVIEW_COMPLETED,
                    completedAt: new Date()
                }
            });
            // Update application status
            await tx.jobApplication.update({
                where: {
                    id: interview.applicationId
                },
                data: {
                    status: _constants.ApplicationStatus.INTERVIEW_COMPLETED
                }
            });
            // Create audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminUserId,
                    action: _constants.AuditAction.UPDATE,
                    entityType: 'Interview',
                    entityId: interviewId,
                    oldValue: {
                        status: interview.status
                    },
                    newValue: {
                        status: _constants.InterviewStatus.INTERVIEW_COMPLETED
                    }
                }
            });
            return updated;
        });
        return {
            message: 'Interview marked as completed',
            interview: updatedInterview
        };
    }
    // HR marks interview outcome (Selected/Not Selected/No Show)
    async markInterviewOutcome(userId, interviewId, dto) {
        // Verify HR owns this interview
        const hr = await this.prisma.hR.findUnique({
            where: {
                userId
            }
        });
        if (!hr) {
            throw new _common.NotFoundException('HR profile not found');
        }
        const interview = await this.prisma.interview.findUnique({
            where: {
                id: interviewId
            },
            include: {
                JobApplication: {
                    include: {
                        Job: true
                    }
                }
            }
        });
        if (!interview) {
            throw new _common.NotFoundException('Interview not found');
        }
        if (interview.JobApplication.Job.hrId !== hr.id) {
            throw new _common.ForbiddenException('You do not have access to this interview');
        }
        // Map outcome to status
        const statusMap = {
            'SELECTED': 'SELECTED',
            'NOT_SELECTED': 'NOT_SELECTED',
            'CANDIDATE_NO_SHOW': 'CANDIDATE_NO_SHOW'
        };
        const applicationStatusMap = {
            'SELECTED': 'SELECTED',
            'NOT_SELECTED': 'INTERVIEW_REJECTED',
            'CANDIDATE_NO_SHOW': 'CANDIDATE_NO_SHOW'
        };
        const newStatus = statusMap[dto.outcome] || 'INTERVIEW_COMPLETED';
        const newAppStatus = applicationStatusMap[dto.outcome] || 'INTERVIEW_COMPLETED';
        // Update interview and application in transaction
        const updatedInterview = await this.prisma.$transaction(async (tx)=>{
            // Update interview status
            const updated = await tx.interview.update({
                where: {
                    id: interviewId
                },
                data: {
                    status: newStatus,
                    updatedAt: new Date()
                }
            });
            // Update application status
            await tx.jobApplication.update({
                where: {
                    id: interview.applicationId
                },
                data: {
                    status: newAppStatus,
                    updatedAt: new Date()
                }
            });
            return updated;
        });
        return {
            message: `Interview marked as ${dto.outcome.replace(/_/g, ' ')}`,
            interview: updatedInterview,
            applicationStatus: newAppStatus
        };
    }
    // ===========================================
    // Email Helper Methods
    // ============================================
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
            html
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
            ONSITE: '🏢 On-site'
        }[interview.mode] || interview.mode;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">✅ Interview Details Unlocked!</h2>
                <p>Hi ${candidateName},</p>
                <p>Your payment is confirmed. Here are your interview details:</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 16px 0;">
                    <h3 style="margin: 0 0 12px 0;">${jobTitle}</h3>
                    <p style="margin: 4px 0;"><strong>Company:</strong> ${companyName}</p>
                    <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(interview.scheduledDate).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</p>
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
            html
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
            html
        });
    }
    constructor(prisma, emailService){
        this.prisma = prisma;
        this.emailService = emailService;
    }
};
InterviewService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _emailservice.EmailService === "undefined" ? Object : _emailservice.EmailService
    ])
], InterviewService);

//# sourceMappingURL=interview.service.js.map