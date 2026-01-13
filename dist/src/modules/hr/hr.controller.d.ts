import { HRService } from './services';
import { HRRegisterDto, HRLoginDto, UpdateHRProfileDto, CreateJobDto, UpdateJobStatusDto, UpdateJobDto } from './dto';
export declare class HRController {
    private readonly hrService;
    constructor(hrService: HRService);
    register(dto: HRRegisterDto, req: any): Promise<{
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
    login(dto: HRLoginDto, req: any): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        phone: string | null;
        googleId: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        emailVerified: boolean;
        phoneVerified: boolean;
        authProvider: string;
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
    getJobs(userId: string, status?: string, page?: number, limit?: number): Promise<{
        jobs: ({
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
    getJobById(userId: string, jobId: string): Promise<{
        skills: {
            id: string;
            name: string;
            jobId: string;
            isRequired: boolean;
        }[];
        applications: {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.ApplicationStatus;
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
    updateJob(userId: string, jobId: string, dto: UpdateJobDto): Promise<{
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
    deleteJob(userId: string, jobId: string): Promise<{
        message: string;
    }>;
    updateJobStatus(userId: string, jobId: string, dto: UpdateJobStatusDto): Promise<{
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
    getApplications(userId: string, jobId?: string, status?: string, page?: number, limit?: number): Promise<{
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
            candidateId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            jobId: string;
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
