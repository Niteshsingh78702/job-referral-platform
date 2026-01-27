import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto, UpdateJobDto, ApplyJobDto, JobQueryDto } from './dto';
import { JobStatus, ApplicationStatus, UserRole } from '../../common/constants';
import { SkillBucketService } from '../skill-bucket/skill-bucket.service';
import { SkillTestStatusDto } from '../skill-bucket/dto';

@Injectable()
export class JobService {
  constructor(
    private prisma: PrismaService,
    private skillBucketService: SkillBucketService,
  ) {}

  // Create job
  async createJob(hrId: string, dto: CreateJobDto) {
    // Verify HR exists and is approved
    const hr = await this.prisma.hR.findUnique({
      where: { userId: hrId },
    });

    if (!hr) {
      throw new NotFoundException('HR profile not found');
    }

    if (hr.approvalStatus !== 'APPROVED') {
      throw new ForbiddenException('HR account not yet approved');
    }

    // Generate SEO-friendly slug
    const slug = this.generateSlug(dto.title, dto.companyName);

    // Create job with skills
    const job = await this.prisma.$transaction(async (tx) => {
      const newJob = await tx.job.create({
        data: {
          slug,
          title: dto.title,
          description: dto.description,
          requirements: dto.requirements,
          responsibilities: dto.responsibilities,
          companyName: dto.companyName,
          companyLogo: dto.companyLogo,
          location: dto.location,
          isRemote: dto.isRemote || false,
          salaryMin: dto.salaryMin,
          salaryMax: dto.salaryMax,
          salaryCurrency: dto.salaryCurrency || 'INR',
          experienceMin: dto.experienceMin,
          experienceMax: dto.experienceMax,
          educationLevel: dto.educationLevel,
          maxApplications: dto.maxApplications || 100, // Ensure field name matches schema
          referralFee: dto.referralFee || 499,
          testId: dto.testId,
          hrId: hr.id,
          status: JobStatus.PENDING_APPROVAL,
        },
      });

      // Add skills if provided
      if (dto.JobSkill && dto.jobSkill.length > 0) {
        await tx.jobSkill.createMany({
          data: dto.jobSkill.map((skill) => ({
            jobId: newJob.id,
            name: skill.name,
            isRequired: skill.isRequired ?? true,
          })),
        });
      }

      // Update HR stats
      await tx.hR.update({
        where: { id: hr.id },
        data: { totalJobsPosted: { increment: 1 } },
      });

      return newJob;
    });

    return this.getJobById(job.id);
  }

  // Get all active jobs (public)
  async getActiveJobs(query: JobQueryDto) {
    const {
      search,
      location,
      company,
      experienceMin,
      experienceMax,
      isRemote,
      page,
      limit,
    } = query;

    const where: any = {
      status: JobStatus.ACTIVE,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (company) {
      where.companyName = { contains: company, mode: 'insensitive' };
    }

    if (typeof isRemote === 'boolean') {
      where.isRemote = isRemote;
    }

    if (experienceMin !== undefined) {
      where.experienceMin = { gte: experienceMin };
    }

    if (experienceMax !== undefined) {
      where.experienceMax = { lte: experienceMax };
    }

    const skip = ((page || 1) - 1) * (limit || 10);
    const take = limit || 10;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take,
        include: {
          JobSkill: true,
          HR: {
            select: {
              companyName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      meta: {
        page: page || 1,
        limit: limit || 10,
        total,
        totalPages: Math.ceil(total / (limit || 10)),
      },
    };
  }

  // Get job by ID or slug
  async getJobById(idOrSlug: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        JobSkill: true,
        Test: {
          select: {
            id: true,
            title: true,
            duration: true,
            totalQuestionBank: true,
          },
        },
        HR: {
          select: {
            companyName: true,
            companyWebsite: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  // Update job
  async updateJob(jobId: string, hrId: string, dto: UpdateJobDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { HR: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check if HR owns this job (skip for admin-created jobs with no HR)
    if (job.HR && job.hr.userId !== hrId) {
      throw new ForbiddenException('Not authorized to update this job');
    }

    // If job has no HR and user is not the creator, deny access
    if (!job.HR) {
      throw new ForbiddenException('Only admin can update admin-created jobs');
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: dto,
      include: { JobSkill: true },
    });
  }

  // Apply for job
  async applyForJob(jobId: string, userId: string, dto: ApplyJobDto) {
    // Get candidate
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    // Get job with skillBucket
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        SkillBucket: {
          include: {
            Test: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException('Job is not accepting applications');
    }

    if (job.applicationCount >= job.maxApplications) {
      throw new BadRequestException('Job has reached maximum applications');
    }

    // Check if already applied
    const existingApplication = await this.prisma.jobApplication.findUnique({
      where: {
        candidateId_jobId: {
          candidateId: candidate.id,
          jobId: job.id,
        },
      },
    });

    if (existingApplication) {
      throw new BadRequestException('Already applied for this job');
    }

    // Skill-based test logic - now supports composite requirements (Full Stack etc.)
    let applicationStatus = ApplicationStatus.APPLIED;
    let skillCheckResult: {
      canApply: boolean;
      missingTests: SkillTestStatusDto[];
      passedTests: SkillTestStatusDto[];
      hasRequirements: boolean;
    } | null = null;

    // Check ALL required skills for this job (supports multiple skill requirements)
    skillCheckResult =
      await this.skillBucketService.checkAllRequiredSkillsForJob(
        candidate.id,
        job.id,
      );

    if (skillCheckResult.hasRequirements) {
      if (skillCheckResult.canApply) {
        // All required skills are passed and valid - allow instant application
        applicationStatus = ApplicationStatus.APPLIED;
      } else {
        // Some skills are missing - show detailed error
        const missingSkillNames = skillCheckResult.missingTests
          .map((t) => t.displayName || t.skillBucketName)
          .join(', ');

        // Check if any are in cooldown (failed recently)
        const inCooldown = skillCheckResult.missingTests.filter(
          (t) => t.isFailed && !t.canRetest,
        );
        if (inCooldown.length > 0) {
          const cooldownInfo = inCooldown
            .map((t) => `${t.skillBucketName} (${t.retestInHours}h remaining)`)
            .join(', ');
          throw new BadRequestException(
            `You are in cooldown for: ${cooldownInfo}. Please wait before retrying.`,
          );
        }

        // Check if any are expired
        const expired = skillCheckResult.missingTests.filter(
          (t) => t.isPassed && !t.isValid,
        );
        if (expired.length > 0) {
          throw new BadRequestException(
            `Your verification has expired for: ${missingSkillNames}. Please retake the HR Shortlisting Check.`,
          );
        }

        // Need to take tests for missing skills
        throw new BadRequestException(
          `You need to pass the following skill tests before applying: ${missingSkillNames}`,
        );
      }
    } else if (job.testId) {
      // Fallback to old per-job test logic (for backwards compatibility)
      applicationStatus = ApplicationStatus.TEST_REQUIRED;
    }

    // Create application
    const application = await this.prisma.$transaction(async (tx) => {
      // Get the first passed test score if any (for backward compatibility)
      const firstPassedTest = skillCheckResult?.passedTests[0];

      const app = await tx.jobApplication.create({
        data: {
          id: crypto.randomUUID(),
          candidateId: candidate.id,
          jobId: job.id,
          status: applicationStatus,
          coverLetter: dto.coverLetter,
          updatedAt: new Date(),
          // If valid skill pass, mark test as passed
          ...(firstPassedTest && {
            testScore: firstPassedTest.score,
            testPassedAt: new Date(),
          }),
        },
      });

      // Increment application count
      await tx.job.update({
        where: { id: job.id },
        data: { applicationCount: { increment: 1 } },
      });

      return app;
    });

    // Return with skill status info
    return {
      ...application,
      skillTestInfo: skillCheckResult?.hasRequirements
        ? {
            passedJobSkill: skillCheckResult.passedTests.map((t) => ({
              skillBucketName: t.skillBucketName,
              displayName: t.displayName,
              score: t.score,
              validTill: t.validTill,
              validDaysRemaining: t.validDaysRemaining,
            })),
            canApply: skillCheckResult.canApply,
          }
        : null,
    };
  }

  // Get HR's jobs
  async getHRJobs(hrId: string, status?: JobStatus) {
    const hr = await this.prisma.hR.findUnique({
      where: { userId: hrId },
    });

    if (!hr) {
      throw new NotFoundException('HR profile not found');
    }

    return this.prisma.job.findMany({
      where: {
        hrId: hr.id,
        ...(status && { status }),
      },
      include: {
        JobSkill: true,
        _count: {
          select: { JobApplication: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if a candidate can apply for a job (for frontend pre-check)
   * This allows the frontend to show appropriate UI before the user clicks Apply
   */
  async getApplyEligibility(jobId: string, userId: string) {
    // Get candidate
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return {
        canApply: false,
        reason: 'Candidate profile not found',
        requiresProfile: true,
      };
    }

    // Get job
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return {
        canApply: false,
        reason: 'Job not found',
      };
    }

    if (job.status !== JobStatus.ACTIVE) {
      return {
        canApply: false,
        reason: 'Job is not accepting applications',
      };
    }

    if (job.applicationCount >= job.maxApplications) {
      return {
        canApply: false,
        reason: 'Job has reached maximum applications',
      };
    }

    // Check if already applied
    const existingApplication = await this.prisma.jobApplication.findUnique({
      where: {
        candidateId_jobId: {
          candidateId: candidate.id,
          jobId: job.id,
        },
      },
    });

    if (existingApplication) {
      return {
        canApply: false,
        reason: 'Already applied for this job',
        applicationId: existingApplication.id,
        applicationStatus: existingApplication.status,
      };
    }

    // Check skill requirements
    const skillCheckResult =
      await this.skillBucketService.checkAllRequiredSkillsForJob(
        candidate.id,
        job.id,
      );

    if (skillCheckResult.hasRequirements && !skillCheckResult.canApply) {
      // Check if any are in cooldown
      const inCooldown = skillCheckResult.missingTests.filter(
        (t) => t.isFailed && !t.canRetest,
      );
      if (inCooldown.length > 0) {
        return {
          canApply: false,
          reason: 'In retest cooldown',
          cooldownTests: inCooldown.map((t) => ({
            skillName: t.skillBucketName,
            displayName: t.displayName,
            retestInHours: t.retestInHours,
          })),
        };
      }

      // Check if any are expired
      const expired = skillCheckResult.missingTests.filter(
        (t) => t.isPassed && !t.isValid,
      );
      if (expired.length > 0) {
        return {
          canApply: false,
          reason: 'Skill test expired',
          expiredTests: expired.map((t) => ({
            skillName: t.skillBucketName,
            displayName: t.displayName,
          })),
          requiresRetest: true,
        };
      }

      // Need to take tests
      return {
        canApply: false,
        reason: 'Skill tests required',
        missingTests: skillCheckResult.missingTests.map((t) => ({
          skillBucketId: t.skillBucketId,
          skillName: t.skillBucketName,
          displayName: t.displayName,
          neverTaken: t.neverTaken,
        })),
        requiresTest: true,
      };
    }

    // All checks passed
    return {
      canApply: true,
      skillTestInfo: skillCheckResult.hasRequirements
        ? {
            passedSkills: skillCheckResult.passedTests.map((t) => ({
              skillName: t.skillBucketName,
              displayName: t.displayName,
              validDaysRemaining: t.validDaysRemaining,
            })),
          }
        : null,
    };
  }

  // Helper: Generate slug
  private generateSlug(title: string, company: string): string {
    const base = `${title}-at-${company}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
  }
}
