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
            createdAt: Date;
            status: import("@prisma/client").$Enums.JobStatus;
            updatedAt: Date;
            expiresAt: Date | null;
            companyName: string;
            location: string;
            description: string;
            slug: string;
            title: string;
            requirements: string | null;
            responsibilities: string | null;
            companyLogo: string | null;
            isRemote: boolean;
            salaryMin: number | null;
            salaryMax: number | null;
            salaryCurrency: string;
            experienceMin: number | null;
            experienceMax: number | null;
            educationLevel: string | null;
            maxApplications: number;
            applicationCount: number;
            referralFee: number;
            testId: string | null;
            hrId: string | null;
            postedAt: Date | null;
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
            title: string;
            totalQuestions: number;
            duration: number;
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
        status: import("@prisma/client").$Enums.JobStatus;
        updatedAt: Date;
        expiresAt: Date | null;
        companyName: string;
        location: string;
        description: string;
        slug: string;
        title: string;
        requirements: string | null;
        responsibilities: string | null;
        companyLogo: string | null;
        isRemote: boolean;
        salaryMin: number | null;
        salaryMax: number | null;
        salaryCurrency: string;
        experienceMin: number | null;
        experienceMax: number | null;
        educationLevel: string | null;
        maxApplications: number;
        applicationCount: number;
        referralFee: number;
        testId: string | null;
        hrId: string | null;
        postedAt: Date | null;
    }>;
    createJob(userId: string, dto: CreateJobDto): Promise<{
        test: {
            id: string;
            title: string;
            totalQuestions: number;
            duration: number;
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
        status: import("@prisma/client").$Enums.JobStatus;
        updatedAt: Date;
        expiresAt: Date | null;
        companyName: string;
        location: string;
        description: string;
        slug: string;
        title: string;
        requirements: string | null;
        responsibilities: string | null;
        companyLogo: string | null;
        isRemote: boolean;
        salaryMin: number | null;
        salaryMax: number | null;
        salaryCurrency: string;
        experienceMin: number | null;
        experienceMax: number | null;
        educationLevel: string | null;
        maxApplications: number;
        applicationCount: number;
        referralFee: number;
        testId: string | null;
        hrId: string | null;
        postedAt: Date | null;
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
        createdAt: Date;
        status: import("@prisma/client").$Enums.JobStatus;
        updatedAt: Date;
        expiresAt: Date | null;
        companyName: string;
        location: string;
        description: string;
        slug: string;
        title: string;
        requirements: string | null;
        responsibilities: string | null;
        companyLogo: string | null;
        isRemote: boolean;
        salaryMin: number | null;
        salaryMax: number | null;
        salaryCurrency: string;
        experienceMin: number | null;
        experienceMax: number | null;
        educationLevel: string | null;
        maxApplications: number;
        applicationCount: number;
        referralFee: number;
        testId: string | null;
        hrId: string | null;
        postedAt: Date | null;
    }>;
    applyForJob(jobId: string, userId: string, dto: ApplyJobDto): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        updatedAt: Date;
        candidateId: string;
        jobId: string;
        coverLetter: string | null;
        testScore: number | null;
        testPassedAt: Date | null;
        contactUnlockedAt: Date | null;
    }>;
    getMyJobs(userId: string, status?: JobStatus): Promise<({
        skills: {
            id: string;
            name: string;
            jobId: string;
            isRequired: boolean;
        }[];
        _count: {
            applications: number;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.JobStatus;
        updatedAt: Date;
        expiresAt: Date | null;
        companyName: string;
        location: string;
        description: string;
        slug: string;
        title: string;
        requirements: string | null;
        responsibilities: string | null;
        companyLogo: string | null;
        isRemote: boolean;
        salaryMin: number | null;
        salaryMax: number | null;
        salaryCurrency: string;
        experienceMin: number | null;
        experienceMax: number | null;
        educationLevel: string | null;
        maxApplications: number;
        applicationCount: number;
        referralFee: number;
        testId: string | null;
        hrId: string | null;
        postedAt: Date | null;
    })[]>;
}
