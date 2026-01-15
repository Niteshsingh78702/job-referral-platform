import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/services/token.service';
import { HRRegisterDto, HRLoginDto, UpdateHRProfileDto, CreateJobDto, UpdateJobStatusDto, UpdateJobDto } from '../dto';
export declare class HRService {
    private prisma;
    private tokenService;
    constructor(prisma: PrismaService, tokenService: TokenService);
    register(dto: HRRegisterDto, deviceInfo?: any): Promise<{
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            hr: {
                id: string;
                companyName: string;
                approvalStatus: import("@prisma/client").$Enums.HRApprovalStatus;
            };
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    login(dto: HRLoginDto, deviceInfo?: any): Promise<{
        user: {
            id: string;
            email: string;
            role: "HR";
            hr: {
                id: string;
                companyName: string;
                designation: string | null;
            };
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    getProfile(userId: string): Promise<{
        hr: ({
            jobs: {
                id: string;
                status: import("@prisma/client").$Enums.JobStatus;
                title: string;
                applicationCount: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            companyName: string;
            companyEmail: string;
            companyWebsite: string | null;
            designation: string | null;
            linkedinUrl: string | null;
            approvalStatus: import("@prisma/client").$Enums.HRApprovalStatus;
            approvedBy: string | null;
            approvedAt: Date | null;
            rejectionReason: string | null;
            totalJobsPosted: number;
            activeJobs: number;
        }) | null;
        id: string;
        email: string;
        phone: string | null;
        googleId: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        emailVerified: boolean;
        phoneVerified: boolean;
        authProvider: string;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    updateProfile(userId: string, dto: UpdateHRProfileDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyName: string;
        companyEmail: string;
        companyWebsite: string | null;
        designation: string | null;
        linkedinUrl: string | null;
        approvalStatus: import("@prisma/client").$Enums.HRApprovalStatus;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectionReason: string | null;
        totalJobsPosted: number;
        activeJobs: number;
    }>;
    getDashboardStats(userId: string): Promise<{
        totalJobs: number;
        activeJobs: number;
        totalApplications: number;
        recentApplications: number;
        pendingReferrals: number;
        confirmedReferrals: number;
        jobsByStatus: {
            draft: number;
            active: number;
            closed: number;
            expired: number;
        };
    }>;
    getRecentActivity(userId: string, limit?: number): Promise<{
        id: string;
        type: string;
        candidate: string;
        jobTitle: string;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        createdAt: Date;
    }[]>;
    getJobs(userId: string, filters?: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        jobs: ({
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
            skillBucketId: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    createJob(userId: string, dto: CreateJobDto): Promise<{
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
        skillBucketId: string | null;
    }>;
    updateJobStatus(userId: string, jobId: string, dto: UpdateJobStatusDto): Promise<{
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
        skillBucketId: string | null;
    }>;
    getJobById(userId: string, jobId: string): Promise<{
        skills: {
            id: string;
            name: string;
            jobId: string;
            isRequired: boolean;
        }[];
        applications: {
            id: string;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            createdAt: Date;
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
        skillBucketId: string | null;
    }>;
    updateJob(userId: string, jobId: string, dto: UpdateJobDto): Promise<{
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
        skillBucketId: string | null;
    }>;
    deleteJob(userId: string, jobId: string): Promise<{
        message: string;
    }>;
    getApplications(userId: string, filters?: {
        jobId?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        applications: ({
            candidate: {
                skills: {
                    name: string;
                    level: number;
                }[];
                firstName: string;
                lastName: string;
                headline: string | null;
                totalExperience: number | null;
                currentCompany: string | null;
            };
            job: {
                id: string;
                companyName: string;
                title: string;
            };
        } & {
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
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
