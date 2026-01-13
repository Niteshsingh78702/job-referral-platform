import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto, UpdateJobDto, ApplyJobDto, JobQueryDto } from './dto';
import { JobStatus } from '../../common/constants';
import { SkillBucketService } from '../skill-bucket/skill-bucket.service';
export declare class JobService {
    private prisma;
    private skillBucketService;
    constructor(prisma: PrismaService, skillBucketService: SkillBucketService);
    createJob(hrId: string, dto: CreateJobDto): Promise<{
        test: {
            id: string;
            duration: number;
            title: string;
            totalQuestions: number;
        } | null;
        hr: {
            companyName: string;
            companyWebsite: string | null;
        } | null;
        skills: {
            id: string;
            name: string;
            jobId: string;
            isRequired: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        skillBucketId: string | null;
        experienceMin: number | null;
        experienceMax: number | null;
        testId: string | null;
        status: import("@prisma/client").$Enums.JobStatus;
        companyName: string;
        title: string;
        slug: string;
        requirements: string | null;
        responsibilities: string | null;
        companyLogo: string | null;
        location: string;
        isRemote: boolean;
        salaryMin: number | null;
        salaryMax: number | null;
        salaryCurrency: string;
        educationLevel: string | null;
        maxApplications: number;
        applicationCount: number;
        referralFee: number;
        hrId: string | null;
        postedAt: Date | null;
        expiresAt: Date | null;
    }>;
    getActiveJobs(query: JobQueryDto): Promise<{
        data: ({
            hr: {
                companyName: string;
            } | null;
            skills: {
                id: string;
                name: string;
                jobId: string;
                isRequired: boolean;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            skillBucketId: string | null;
            experienceMin: number | null;
            experienceMax: number | null;
            testId: string | null;
            status: import("@prisma/client").$Enums.JobStatus;
            companyName: string;
            title: string;
            slug: string;
            requirements: string | null;
            responsibilities: string | null;
            companyLogo: string | null;
            location: string;
            isRemote: boolean;
            salaryMin: number | null;
            salaryMax: number | null;
            salaryCurrency: string;
            educationLevel: string | null;
            maxApplications: number;
            applicationCount: number;
            referralFee: number;
            hrId: string | null;
            postedAt: Date | null;
            expiresAt: Date | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getJobById(idOrSlug: string): Promise<{
        test: {
            id: string;
            duration: number;
            title: string;
            totalQuestions: number;
        } | null;
        hr: {
            companyName: string;
            companyWebsite: string | null;
        } | null;
        skills: {
            id: string;
            name: string;
            jobId: string;
            isRequired: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        skillBucketId: string | null;
        experienceMin: number | null;
        experienceMax: number | null;
        testId: string | null;
        status: import("@prisma/client").$Enums.JobStatus;
        companyName: string;
        title: string;
        slug: string;
        requirements: string | null;
        responsibilities: string | null;
        companyLogo: string | null;
        location: string;
        isRemote: boolean;
        salaryMin: number | null;
        salaryMax: number | null;
        salaryCurrency: string;
        educationLevel: string | null;
        maxApplications: number;
        applicationCount: number;
        referralFee: number;
        hrId: string | null;
        postedAt: Date | null;
        expiresAt: Date | null;
    }>;
    updateJob(jobId: string, hrId: string, dto: UpdateJobDto): Promise<{
        skills: {
            id: string;
            name: string;
            jobId: string;
            isRequired: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        skillBucketId: string | null;
        experienceMin: number | null;
        experienceMax: number | null;
        testId: string | null;
        status: import("@prisma/client").$Enums.JobStatus;
        companyName: string;
        title: string;
        slug: string;
        requirements: string | null;
        responsibilities: string | null;
        companyLogo: string | null;
        location: string;
        isRemote: boolean;
        salaryMin: number | null;
        salaryMax: number | null;
        salaryCurrency: string;
        educationLevel: string | null;
        maxApplications: number;
        applicationCount: number;
        referralFee: number;
        hrId: string | null;
        postedAt: Date | null;
        expiresAt: Date | null;
    }>;
    applyForJob(jobId: string, userId: string, dto: ApplyJobDto): Promise<{
        skillTestInfo: {
            skillBucketName: string;
            displayName: string;
            isPassed: boolean;
            isValid: boolean;
            validTill: Date | undefined;
            validDaysRemaining: number | undefined;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        jobId: string;
        candidateId: string;
        coverLetter: string | null;
        testScore: number | null;
        testPassedAt: Date | null;
        contactUnlockedAt: Date | null;
    }>;
    getHRJobs(hrId: string, status?: JobStatus): Promise<({
        _count: {
            applications: number;
        };
        skills: {
            id: string;
            name: string;
            jobId: string;
            isRequired: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        skillBucketId: string | null;
        experienceMin: number | null;
        experienceMax: number | null;
        testId: string | null;
        status: import("@prisma/client").$Enums.JobStatus;
        companyName: string;
        title: string;
        slug: string;
        requirements: string | null;
        responsibilities: string | null;
        companyLogo: string | null;
        location: string;
        isRemote: boolean;
        salaryMin: number | null;
        salaryMax: number | null;
        salaryCurrency: string;
        educationLevel: string | null;
        maxApplications: number;
        applicationCount: number;
        referralFee: number;
        hrId: string | null;
        postedAt: Date | null;
        expiresAt: Date | null;
    })[]>;
    private generateSlug;
}
