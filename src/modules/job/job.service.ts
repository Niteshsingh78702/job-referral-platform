import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto, UpdateJobDto, ApplyJobDto, JobQueryDto } from './dto';
import {
    JobStatus,
    ApplicationStatus,
    UserRole,
} from '../../common/constants';

@Injectable()
export class JobService {
    constructor(private prisma: PrismaService) { }

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
                    maxApplications: dto.maxApplications || 100,
                    referralFee: dto.referralFee || 499,
                    testId: dto.testId,
                    hrId: hr.id,
                    status: JobStatus.PENDING_APPROVAL,
                },
            });

            // Add skills if provided
            if (dto.skills && dto.skills.length > 0) {
                await tx.jobSkill.createMany({
                    data: dto.skills.map((skill) => ({
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
        const { search, location, company, experienceMin, experienceMax, isRemote, page, limit } =
            query;

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
                    skills: true,
                    hr: {
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
                skills: true,
                test: {
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                        totalQuestions: true,
                    },
                },
                hr: {
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
            include: { hr: true },
        });

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        // Check if HR owns this job (skip for admin-created jobs with no HR)
        if (job.hr && job.hr.userId !== hrId) {
            throw new ForbiddenException('Not authorized to update this job');
        }

        // If job has no HR and user is not the creator, deny access
        if (!job.hr) {
            throw new ForbiddenException('Only admin can update admin-created jobs');
        }

        return this.prisma.job.update({
            where: { id: jobId },
            data: dto,
            include: { skills: true },
        });
    }

    // Apply for job
    async applyForJob(
        jobId: string,
        userId: string,
        dto: ApplyJobDto,
    ) {
        // Get candidate
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });

        if (!candidate) {
            throw new NotFoundException('Candidate profile not found');
        }

        // Get job
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
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

        // Create application
        const application = await this.prisma.$transaction(async (tx) => {
            const app = await tx.jobApplication.create({
                data: {
                    candidateId: candidate.id,
                    jobId: job.id,
                    status: job.testId
                        ? ApplicationStatus.TEST_PENDING
                        : ApplicationStatus.REFERRAL_PENDING,
                    coverLetter: dto.coverLetter,
                },
            });

            // Increment application count
            await tx.job.update({
                where: { id: job.id },
                data: { applicationCount: { increment: 1 } },
            });

            return app;
        });

        return application;
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
                skills: true,
                _count: {
                    select: { applications: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
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
