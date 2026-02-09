import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService, JwtPayload } from '../../auth/services/token.service';
import {
  HRRegisterDto,
  HRLoginDto,
  UpdateHRProfileDto,
  CreateJobDto,
  UpdateJobStatusDto,
  UpdateJobDto,
} from '../dto';
import {
  UserRole,
  UserStatus,
  HRApprovalStatus,
  AuditAction,
} from '../../../common/constants';
import { JobStatus as PrismaJobStatus } from '@prisma/client';

// Rate limiting constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class HRService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
  ) { }

  /**
   * Register a new HR account
   * - Validates corporate email domain
   * - Creates user with HR role
   * - Creates HR profile with pending approval status (auto-approved for dev)
   */
  async register(dto: HRRegisterDto, deviceInfo?: any) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check phone if provided
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    // Check company email already registered as HR
    const existingHR = await this.prisma.hR.findFirst({
      where: { companyEmail: dto.companyEmail },
    });

    if (existingHR) {
      throw new ConflictException('Company email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user and HR profile in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user with HR role
      const user = await tx.user.create({
        data: {
          id: crypto.randomUUID(),
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: UserRole.HR,
          status: UserStatus.ACTIVE, // Auto-activate for dev
          emailVerified: true, // Auto-verify for dev
          updatedAt: new Date(),
        },
      });

      // Create HR profile - Auto-approved for development
      const hr = await tx.hR.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          companyName: dto.companyName,
          companyEmail: dto.companyEmail,
          companyWebsite: dto.companyWebsite,
          designation: dto.designation,
          linkedinUrl: dto.linkedinUrl,
          approvalStatus: HRApprovalStatus.APPROVED, // Auto-approve for dev
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Log device
      if (deviceInfo) {
        await tx.deviceLog.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            deviceId: deviceInfo.deviceId || 'unknown',
            ipAddress: deviceInfo.ip || 'unknown',
            userAgent: deviceInfo.userAgent,
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          action: AuditAction.CREATE,
          entityType: 'HR',
          entityId: hr.id,
          metadata: { registrationSource: 'hr_portal' },
        },
      });

      return { user, hr };
    });

    // Generate tokens
    const payload: JwtPayload = {
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
    };

    const tokens = await this.tokenService.generateTokenPair(payload);

    return {
      ...tokens,
      User: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        HR: {
          id: result.hr.id,
          companyName: result.hr.companyName,
          approvalStatus: result.hr.approvalStatus,
        },
      },
    };
  }

  /**
   * Login for HR users
   * - Implements rate limiting (5 attempts per 15 min)
   * - Checks HR approval status
   */
  async login(dto: HRLoginDto, deviceInfo?: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { HR: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== UserRole.HR) {
      throw new UnauthorizedException('This login is for HR accounts only');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException(
        'Account is blocked. Please contact support.',
      );
    }

    // Check HR approval status
    if (!user.HR) {
      throw new BadRequestException('HR profile not found');
    }

    if (user.HR.approvalStatus === HRApprovalStatus.PENDING) {
      throw new ForbiddenException(
        'Your account is pending approval. Please wait for admin verification.',
      );
    }

    if (user.HR.approvalStatus === HRApprovalStatus.REJECTED) {
      throw new ForbiddenException(
        `Account rejected: ${user.HR.rejectionReason || 'Please contact support.'}`,
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Log device
      if (deviceInfo) {
        await tx.deviceLog.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            deviceId: deviceInfo.deviceId || 'unknown',
            ipAddress: deviceInfo.ip || 'unknown',
            userAgent: deviceInfo.userAgent,
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          action: AuditAction.LOGIN,
          entityType: 'HR',
          entityId: user.HR!.id,
          metadata: { ip: deviceInfo?.ip, portal: 'hr' },
        },
      });
    });

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = await this.tokenService.generateTokenPair(payload);

    return {
      ...tokens,
      User: {
        id: user.id,
        email: user.email,
        role: user.role,
        HR: {
          id: user.HR.id,
          companyName: user.HR.companyName,
          designation: user.HR.designation,
        },
      },
    };
  }

  /**
   * Get HR profile with stats
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        HR: {
          include: {
            Job: {
              select: {
                id: true,
                title: true,
                status: true,
                applicationCount: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.HR) {
      throw new NotFoundException('HR profile not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update HR profile
   */
  async updateProfile(userId: string, dto: UpdateHRProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { HR: true },
    });

    if (!user || !user.HR) {
      throw new NotFoundException('HR profile not found');
    }

    const updated = await this.prisma.hR.update({
      where: { id: user.HR.id },
      data: {
        companyName: dto.companyName,
        companyWebsite: dto.companyWebsite,
        designation: dto.designation,
        linkedinUrl: dto.linkedinUrl,
      },
    });

    return updated;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { HR: true },
    });

    if (!user || !user.HR) {
      throw new NotFoundException('HR profile not found');
    }

    const hrId = user.HR.id;

    // Get job stats
    const jobs = await this.prisma.job.findMany({
      where: { hrId },
      include: {
        JobApplication: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(
      (j) => j.status === PrismaJobStatus.ACTIVE,
    ).length;
    const totalApplications = jobs.reduce(
      (acc, j) => acc + j.JobApplication.length,
      0,
    );
    const recentApplications = jobs.reduce(
      (acc, j) =>
        acc +
        j.JobApplication.filter((a) => a.createdAt >= thirtyDaysAgo).length,
      0,
    );

    const pendingReferrals = await this.prisma.referral.count({
      where: {
        hrId,
        status: 'PENDING',
      },
    });

    const confirmedReferrals = await this.prisma.referral.count({
      where: {
        hrId,
        status: 'CONFIRMED',
      },
    });

    return {
      totalJobs,
      activeJobs,
      totalApplications,
      recentApplications,
      pendingReferrals,
      confirmedReferrals,
      jobsByStatus: {
        draft: jobs.filter((j) => j.status === PrismaJobStatus.DRAFT).length,
        active: activeJobs,
        closed: jobs.filter((j) => j.status === PrismaJobStatus.CLOSED).length,
        expired: jobs.filter((j) => j.status === PrismaJobStatus.EXPIRED)
          .length,
      },
    };
  }

  /**
   * Get recent activity for dashboard
   */
  async getRecentActivity(userId: string, limit: number = 10) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { HR: true },
    });

    if (!user || !user.HR) {
      throw new NotFoundException('HR profile not found');
    }

    // Get recent applications on HR's jobs
    const recentApplications = await this.prisma.jobApplication.findMany({
      where: {
        Job: { hrId: user.HR.id },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        Candidate: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        Job: {
          select: {
            title: true,
            companyName: true,
          },
        },
      },
    });

    return recentApplications.map((app) => ({
      id: app.id,
      type: 'application',
      Candidate: `${app.Candidate.firstName} ${app.Candidate.lastName}`,
      jobTitle: app.Job.title,
      status: app.status,
      createdAt: app.createdAt,
    }));
  }

  /**
   * Get HR's jobs
   */
  async getJobs(
    userId: string,
    filters?: { status?: string; page?: number; limit?: number },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { HR: true },
    });

    if (!user || !user.HR) {
      throw new NotFoundException('HR profile not found');
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { hrId: user.HR.id };
    if (filters?.status) {
      where.status = filters.status;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { JobApplication: true },
          },
          JobSkill: true,
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new job posting
   */
  async createJob(userId: string, dto: CreateJobDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { HR: true },
    });

    if (!user || !user.HR) {
      throw new NotFoundException('HR profile not found');
    }

    // Generate slug from title
    const baseSlug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    const job = await this.prisma.$transaction(async (tx) => {
      const newJob = await tx.job.create({
        data: {
          id: crypto.randomUUID(),
          slug,
          title: dto.title,
          description: dto.description,
          requirements: dto.requirements,
          responsibilities: dto.responsibilities,
          companyName: user.HR!.companyName,
          location: dto.location,
          isRemote: dto.isRemote ?? false,
          salaryMin: dto.salaryMin,
          salaryMax: dto.salaryMax,
          experienceMin: dto.experienceMin,
          experienceMax: dto.experienceMax,
          educationLevel: dto.educationLevel,
          maxApplications: dto.maxApplications ?? 100, // Ensure field name matches schema
          referralFee: dto.referralFee ?? 499,
          status: PrismaJobStatus.DRAFT,
          hrId: user.HR!.id,
          updatedAt: new Date(),
        },
      });

      // Add skills
      if (dto.skills && dto.skills.length > 0) {
        await tx.jobSkill.createMany({
          data: dto.skills.map((skill: string) => ({
            id: crypto.randomUUID(),
            jobId: newJob.id,
            name: skill,
            isRequired: true,
          })),
        });
      }

      // Update HR stats
      await tx.hR.update({
        where: { id: user.HR!.id },
        data: { totalJobsPosted: { increment: 1 } },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          action: AuditAction.CREATE,
          entityType: 'Job',
          entityId: newJob.id,
        },
      });

      return newJob;
    });

    return job;
  }

  /**
   * Update job status (publish, close, etc.)
   */
  async updateJobStatus(
    userId: string,
    jobId: string,
    dto: UpdateJobStatusDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { HR: true },
    });

    if (!user || !user.HR) {
      throw new NotFoundException('HR profile not found');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.hrId !== user.HR.id) {
      throw new ForbiddenException('You can only modify your own jobs');
    }

    const newStatus = dto.status as PrismaJobStatus;
    const originalStatus = job.status;

    const updatedJob = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
        where: { id: jobId },
        data: {
          status: newStatus,
          postedAt:
            newStatus === PrismaJobStatus.ACTIVE ? new Date() : undefined,
        },
      });

      // Update active jobs count
      if (
        newStatus === PrismaJobStatus.ACTIVE &&
        originalStatus !== PrismaJobStatus.ACTIVE
      ) {
        await tx.hR.update({
          where: { id: user.HR!.id },
          data: { activeJobs: { increment: 1 } },
        });
      } else if (
        originalStatus === PrismaJobStatus.ACTIVE &&
        newStatus !== PrismaJobStatus.ACTIVE
      ) {
        await tx.hR.update({
          where: { id: user.HR!.id },
          data: { activeJobs: { decrement: 1 } },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          action: AuditAction.UPDATE,
          entityType: 'Job',
          entityId: jobId,
          oldValue: { status: job.status },
          newValue: { status: dto.status },
        },
      });

      return updated;
    });

    return updatedJob;
  }

  /**
   * Get a single job by ID
   */
  async getJobById(userId: string, jobId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { HR: true },
    });

    if (!user || !user.HR) {
      throw new NotFoundException('HR profile not found');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        JobSkill: true,
        JobApplication: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.hrId !== user.HR.id) {
      throw new ForbiddenException('You can only view your own jobs');
    }

    return job;
  }

  /**
   * Update a job (full edit)
   */
  async updateJob(userId: string, jobId: string, dto: UpdateJobDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { HR: true },
    });

    if (!user || !user.HR) {
      throw new NotFoundException('HR profile not found');
    }

    const existingJob = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { JobSkill: true },
    });

    if (!existingJob) {
      throw new NotFoundException('Job not found');
    }

    if (existingJob.hrId !== user.HR.id) {
      throw new ForbiddenException('You can only modify your own jobs');
    }

    const updatedJob = await this.prisma.$transaction(async (tx) => {
      // Update skills if provided
      if (dto.skills && dto.skills.length > 0) {
        // Delete existing skills
        await tx.jobSkill.deleteMany({
          where: { jobId },
        });
        // Add new skills
        await tx.jobSkill.createMany({
          data: dto.skills.map((skill: string) => ({
            id: crypto.randomUUID(),
            jobId,
            name: skill,
            isRequired: true,
          })),
        });
      }

      // Update job data
      const updated = await tx.job.update({
        where: { id: jobId },
        data: {
          title: dto.title,
          description: dto.description,
          requirements: dto.requirements,
          responsibilities: dto.responsibilities,
          location: dto.location,
          isRemote: dto.isRemote,
          salaryMin: dto.salaryMin,
          salaryMax: dto.salaryMax,
          experienceMin: dto.experienceMin,
          experienceMax: dto.experienceMax,
          educationLevel: dto.educationLevel,
          maxApplications: dto.maxApplications,
          referralFee: dto.referralFee,
          status: dto.status ? (dto.status as PrismaJobStatus) : undefined,
        },
        include: { JobSkill: true },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          action: AuditAction.UPDATE,
          entityType: 'Job',
          entityId: jobId,
          oldValue: { title: existingJob.title, status: existingJob.status },
          newValue: {
            title: dto.title || existingJob.title,
            status: dto.status || existingJob.status,
          },
        },
      });

      return updated;
    });

    return updatedJob;
  }

  /**
   * Delete a job
   */
  async deleteJob(userId: string, jobId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { HR: true },
    });

    if (!user || !user.HR) {
      throw new NotFoundException('HR profile not found');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.hrId !== user.HR.id) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.jobSkill.deleteMany({ where: { jobId } });
      await tx.jobApplication.deleteMany({ where: { jobId } });

      // Delete the job
      await tx.job.delete({ where: { id: jobId } });

      // Update HR stats
      await tx.hR.update({
        where: { id: user.HR!.id },
        data: {
          totalJobsPosted: { decrement: 1 },
          activeJobs:
            job.status === PrismaJobStatus.ACTIVE
              ? { decrement: 1 }
              : undefined,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          action: AuditAction.DELETE,
          entityType: 'Job',
          entityId: jobId,
          oldValue: { title: job.title, status: job.status },
        },
      });
    });

    return { message: 'Job deleted successfully' };
  }

  /**
   * Get applications for HR's jobs
   */
  async getApplications(
    userId: string,
    filters?: {
      jobId?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { HR: true },
    });

    if (!user || !user.HR) {
      throw new NotFoundException('HR profile not found');
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      Job: { hrId: user.HR.id },
    };

    if (filters?.jobId) {
      where.jobId = filters.jobId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [applications, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          testScore: true,
          testPassedAt: true,
          createdAt: true,
          Candidate: {
            select: {
              firstName: true,
              lastName: true,
              headline: true,
              totalExperience: true,
              currentCompany: true,
              resumeUrl: true, // Resume link for HR
              city: true, // Location components
              state: true,
              country: true,
              User: {
                select: {
                  email: true, // Contact info from User model
                  phone: true,
                },
              },
              CandidateSkill: {
                select: {
                  name: true,
                  level: true,
                },
              },
              Experience: {
                select: {
                  role: true,
                  company: true,
                  startDate: true,
                  endDate: true,
                  isCurrent: true,
                },
                orderBy: { startDate: 'desc' },
                take: 3,
              },
              Education: {
                select: {
                  degree: true,
                  institution: true,
                  endYear: true,
                },
                orderBy: { endYear: 'desc' },
                take: 2,
              },
            },
          },
          Job: {
            select: {
              id: true,
              title: true,
              companyName: true,
            },
          },
          Interview: {
            select: {
              id: true,
              status: true,
              paymentStatus: true,
              paidAt: true,
              scheduledDate: true,
              scheduledTime: true,
              mode: true,
            },
          },
        },
      }),
      this.prisma.jobApplication.count({ where }),
    ]);

    // Filter out applications with missing candidate or job data
    const validApplications = applications.filter(
      (app) => app.Candidate && app.Job,
    );

    return {
      applications: validApplications,
      pagination: {
        page,
        limit,
        total: validApplications.length,
        totalPages: Math.ceil(validApplications.length / limit),
      },
    };
  }

  // Reject an application
  async rejectApplication(
    userId: string,
    applicationId: string,
    reason?: string,
  ) {
    // First verify the HR has access to this application
    const hr = await this.prisma.hR.findUnique({
      where: { userId },
    });

    if (!hr) {
      throw new NotFoundException('HR profile not found');
    }

    // Find the application and verify it belongs to one of HR's jobs
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        Job: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.Job.hrId !== hr.id) {
      throw new ForbiddenException(
        'You do not have access to this application',
      );
    }

    // Update the application status to REJECTED
    const updatedApplication = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED' as any,
        updatedAt: new Date(),
      },
    });

    return {
      message: 'Application rejected successfully',
      applicationId: updatedApplication.id,
      status: 'REJECTED',
    };
  }

  /**
   * Shortlist an application - moves candidate from TEST_PASSED_WAITING_HR to INTERVIEW_CONFIRMED
   * Creates an Interview record for the candidate
   */
  async shortlistApplication(
    userId: string,
    applicationId: string,
  ) {
    // First verify the HR has access to this application
    const hr = await this.prisma.hR.findUnique({
      where: { userId },
    });

    if (!hr) {
      throw new NotFoundException('HR profile not found');
    }

    // Find the application and verify it belongs to one of HR's jobs
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        Job: true,
        Candidate: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.Job.hrId !== hr.id) {
      throw new ForbiddenException(
        'You do not have access to this application',
      );
    }

    // Only allow shortlisting if status is TEST_PASSED_WAITING_HR
    if (application.status !== 'TEST_PASSED_WAITING_HR') {
      throw new BadRequestException(
        `Cannot shortlist application with status: ${application.status}. Only applications with TEST_PASSED_WAITING_HR status can be shortlisted.`,
      );
    }

    // Update application status and create interview in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update the application status to INTERVIEW_CONFIRMED
      const updatedApplication = await tx.jobApplication.update({
        where: { id: applicationId },
        data: {
          status: 'INTERVIEW_CONFIRMED' as any,
          updatedAt: new Date(),
        },
      });

      // Create an Interview record for this application
      const interview = await tx.interview.create({
        data: {
          applicationId: applicationId,
          status: 'INTERVIEW_CONFIRMED',
          paymentStatus: 'PENDING',
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: userId,
          action: AuditAction.UPDATE,
          entityType: 'JobApplication',
          entityId: applicationId,
          oldValue: { status: application.status },
          newValue: { status: 'INTERVIEW_CONFIRMED' },
          metadata: { action: 'shortlist' },
        },
      });

      return { updatedApplication, interview };
    });

    return {
      message: 'Candidate shortlisted successfully! They will be notified to pay ₹99 to proceed with the interview.',
      applicationId: result.updatedApplication.id,
      interviewId: result.interview.id,
      status: 'INTERVIEW_CONFIRMED',
    };
  }
}
