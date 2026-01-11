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
            userId: string;
            updatedAt: Date;
            companyName: string;
            companyEmail: string;
            designation: string | null;
            linkedinUrl: string | null;
            companyWebsite: string | null;
            approvalStatus: import("@prisma/client").$Enums.HRApprovalStatus;
            approvedBy: string | null;
            approvedAt: Date | null;
            rejectionReason: string | null;
            totalJobsPosted: number;
            activeJobs: number;
        }) | null;
        id: string;
        createdAt: Date;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        emailVerified: boolean;
        phoneVerified: boolean;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    updateProfile(userId: string, dto: UpdateHRProfileDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        companyName: string;
        companyEmail: string;
        designation: string | null;
        linkedinUrl: string | null;
        companyWebsite: string | null;
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
    updateJob(userId: string, jobId: string, dto: UpdateJobDto): Promise<{
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
    deleteJob(userId: string, jobId: string): Promise<{
        message: string;
    }>;
    updateJobStatus(userId: string, jobId: string, dto: UpdateJobStatusDto): Promise<{
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
    getApplications(userId: string, jobId?: string, status?: string, page?: number, limit?: number): Promise<{
        applications: ({
            candidate: {
                firstName: string;
                lastName: string;
                headline: string | null;
                totalExperience: number | null;
                currentCompany: string | null;
                skills: {
                    name: string;
                    level: number;
                }[];
            };
            job: {
                id: string;
                companyName: string;
                title: string;
            };
        } & {
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
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
