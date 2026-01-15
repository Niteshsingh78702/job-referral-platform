import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto, UpdateJobDto, ApplyJobDto, JobQueryDto } from './dto';
import { JobStatus } from '../../common/constants';
import { SkillBucketService } from '../skill-bucket/skill-bucket.service';
export declare class JobService {
    private prisma;
    private skillBucketService;
    constructor(prisma: PrismaService, skillBucketService: SkillBucketService);
    createJob(hrId: string, dto: CreateJobDto): Promise<{
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
            jobId: string;
            name: string;
            isRequired: boolean;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.JobStatus;
        createdAt: Date;
        updatedAt: Date;
        hrId: string | null;
        expiresAt: Date | null;
        slug: string;
        title: string;
        description: string;
        requirements: string | null;
        responsibilities: string | null;
        companyName: string;
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
        testId: string | null;
        postedAt: Date | null;
        skillBucketId: string | null;
    }>;
    getActiveJobs(query: JobQueryDto): Promise<{
        data: ({
            hr: {
                companyName: string;
            } | null;
            skills: {
                id: string;
                jobId: string;
                name: string;
                isRequired: boolean;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            createdAt: Date;
            updatedAt: Date;
            hrId: string | null;
            expiresAt: Date | null;
            slug: string;
            title: string;
            description: string;
            requirements: string | null;
            responsibilities: string | null;
            companyName: string;
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
            testId: string | null;
            postedAt: Date | null;
            skillBucketId: string | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getJobById(idOrSlug: string): Promise<{
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
            jobId: string;
            name: string;
            isRequired: boolean;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.JobStatus;
        createdAt: Date;
        updatedAt: Date;
        hrId: string | null;
        expiresAt: Date | null;
        slug: string;
        title: string;
        description: string;
        requirements: string | null;
        responsibilities: string | null;
        companyName: string;
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
        testId: string | null;
        postedAt: Date | null;
        skillBucketId: string | null;
    }>;
    updateJob(jobId: string, hrId: string, dto: UpdateJobDto): Promise<{
        skills: {
            id: string;
            jobId: string;
            name: string;
            isRequired: boolean;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.JobStatus;
        createdAt: Date;
        updatedAt: Date;
        hrId: string | null;
        expiresAt: Date | null;
        slug: string;
        title: string;
        description: string;
        requirements: string | null;
        responsibilities: string | null;
        companyName: string;
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
        testId: string | null;
        postedAt: Date | null;
        skillBucketId: string | null;
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
        jobId: string;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        coverLetter: string | null;
        testScore: number | null;
        testPassedAt: Date | null;
        contactUnlockedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getHRJobs(hrId: string, status?: JobStatus): Promise<({
        skills: {
            id: string;
            jobId: string;
            name: string;
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
        hrId: string | null;
        expiresAt: Date | null;
        slug: string;
        title: string;
        description: string;
        requirements: string | null;
        responsibilities: string | null;
        companyName: string;
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
        testId: string | null;
        postedAt: Date | null;
        skillBucketId: string | null;
    })[]>;
    private generateSlug;
}
