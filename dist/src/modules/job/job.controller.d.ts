import { JobService } from './job.service';
import { CreateJobDto, UpdateJobDto, ApplyJobDto, JobQueryDto } from './dto';
import { JobStatus } from '../../common/constants';
export declare class JobController {
    private readonly jobService;
    constructor(jobService: JobService);
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
            skillBucketId: string | null;
            testId: string | null;
            description: string;
            experienceMin: number | null;
            experienceMax: number | null;
            createdAt: Date;
            updatedAt: Date;
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
    getJob(idOrSlug: string): Promise<{
        test: {
            id: string;
            duration: number;
            totalQuestions: number;
            title: string;
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
        skillBucketId: string | null;
        testId: string | null;
        description: string;
        experienceMin: number | null;
        experienceMax: number | null;
        createdAt: Date;
        updatedAt: Date;
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
    createJob(userId: string, dto: CreateJobDto): Promise<{
        test: {
            id: string;
            duration: number;
            totalQuestions: number;
            title: string;
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
        skillBucketId: string | null;
        testId: string | null;
        description: string;
        experienceMin: number | null;
        experienceMax: number | null;
        createdAt: Date;
        updatedAt: Date;
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
    updateJob(jobId: string, userId: string, dto: UpdateJobDto): Promise<{
        skills: {
            id: string;
            name: string;
            jobId: string;
            isRequired: boolean;
        }[];
    } & {
        id: string;
        skillBucketId: string | null;
        testId: string | null;
        description: string;
        experienceMin: number | null;
        experienceMax: number | null;
        createdAt: Date;
        updatedAt: Date;
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
        candidateId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        jobId: string;
        coverLetter: string | null;
        testScore: number | null;
        testPassedAt: Date | null;
        contactUnlockedAt: Date | null;
    }>;
    getMyJobs(userId: string, status?: JobStatus): Promise<({
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
        skillBucketId: string | null;
        testId: string | null;
        description: string;
        experienceMin: number | null;
        experienceMax: number | null;
        createdAt: Date;
        updatedAt: Date;
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
}
