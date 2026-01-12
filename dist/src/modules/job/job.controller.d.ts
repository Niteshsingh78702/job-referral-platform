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
            status: import("@prisma/client").$Enums.JobStatus;
            createdAt: Date;
            updatedAt: Date;
            companyName: string;
            title: string;
            description: string;
            testId: string | null;
            slug: string;
            requirements: string | null;
            responsibilities: string | null;
            companyLogo: string | null;
            location: string;
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
        hr: {
            companyName: string;
            companyWebsite: string | null;
        } | null;
        test: {
            id: string;
            title: string;
            duration: number;
            totalQuestions: number;
        } | null;
        skills: {
            id: string;
            name: string;
            jobId: string;
            isRequired: boolean;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.JobStatus;
        createdAt: Date;
        updatedAt: Date;
        companyName: string;
        title: string;
        description: string;
        testId: string | null;
        slug: string;
        requirements: string | null;
        responsibilities: string | null;
        companyLogo: string | null;
        location: string;
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
        hrId: string | null;
        postedAt: Date | null;
        expiresAt: Date | null;
    }>;
    createJob(userId: string, dto: CreateJobDto): Promise<{
        hr: {
            companyName: string;
            companyWebsite: string | null;
        } | null;
        test: {
            id: string;
            title: string;
            duration: number;
            totalQuestions: number;
        } | null;
        skills: {
            id: string;
            name: string;
            jobId: string;
            isRequired: boolean;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.JobStatus;
        createdAt: Date;
        updatedAt: Date;
        companyName: string;
        title: string;
        description: string;
        testId: string | null;
        slug: string;
        requirements: string | null;
        responsibilities: string | null;
        companyLogo: string | null;
        location: string;
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
        status: import("@prisma/client").$Enums.JobStatus;
        createdAt: Date;
        updatedAt: Date;
        companyName: string;
        title: string;
        description: string;
        testId: string | null;
        slug: string;
        requirements: string | null;
        responsibilities: string | null;
        companyLogo: string | null;
        location: string;
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
        hrId: string | null;
        postedAt: Date | null;
        expiresAt: Date | null;
    }>;
    applyForJob(jobId: string, userId: string, dto: ApplyJobDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        createdAt: Date;
        updatedAt: Date;
        jobId: string;
        candidateId: string;
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
        status: import("@prisma/client").$Enums.JobStatus;
        createdAt: Date;
        updatedAt: Date;
        companyName: string;
        title: string;
        description: string;
        testId: string | null;
        slug: string;
        requirements: string | null;
        responsibilities: string | null;
        companyLogo: string | null;
        location: string;
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
        hrId: string | null;
        postedAt: Date | null;
        expiresAt: Date | null;
    })[]>;
}
