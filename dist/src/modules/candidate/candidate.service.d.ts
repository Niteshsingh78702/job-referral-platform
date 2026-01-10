import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCandidateProfileDto, AddSkillDto, AddExperienceDto, AddEducationDto } from './dto';
import { ApplicationStatus } from '../../common/constants';
export declare class CandidateService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        user: {
            email: string;
            phone: string | null;
            emailVerified: boolean;
            phoneVerified: boolean;
        };
        skills: {
            id: string;
            name: string;
            level: number;
            yearsOfExp: number | null;
            candidateId: string;
        }[];
        experiences: {
            id: string;
            role: string;
            createdAt: Date;
            description: string | null;
            location: string | null;
            company: string;
            startDate: Date;
            endDate: Date | null;
            isCurrent: boolean;
            candidateId: string;
        }[];
        educations: {
            id: string;
            createdAt: Date;
            institution: string;
            degree: string;
            field: string | null;
            grade: string | null;
            startYear: number;
            endYear: number | null;
            candidateId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        firstName: string;
        lastName: string;
        headline: string | null;
        bio: string | null;
        avatarUrl: string | null;
        resumeUrl: string | null;
        totalExperience: number | null;
        currentCompany: string | null;
        currentRole: string | null;
        expectedSalary: number | null;
        noticePeriod: number | null;
        city: string | null;
        state: string | null;
        country: string | null;
        willingToRelocate: boolean;
    }>;
    updateProfile(userId: string, dto: UpdateCandidateProfileDto): Promise<{
        skills: {
            id: string;
            name: string;
            level: number;
            yearsOfExp: number | null;
            candidateId: string;
        }[];
        experiences: {
            id: string;
            role: string;
            createdAt: Date;
            description: string | null;
            location: string | null;
            company: string;
            startDate: Date;
            endDate: Date | null;
            isCurrent: boolean;
            candidateId: string;
        }[];
        educations: {
            id: string;
            createdAt: Date;
            institution: string;
            degree: string;
            field: string | null;
            grade: string | null;
            startYear: number;
            endYear: number | null;
            candidateId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        firstName: string;
        lastName: string;
        headline: string | null;
        bio: string | null;
        avatarUrl: string | null;
        resumeUrl: string | null;
        totalExperience: number | null;
        currentCompany: string | null;
        currentRole: string | null;
        expectedSalary: number | null;
        noticePeriod: number | null;
        city: string | null;
        state: string | null;
        country: string | null;
        willingToRelocate: boolean;
    }>;
    updateResume(userId: string, resumeUrl: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        firstName: string;
        lastName: string;
        headline: string | null;
        bio: string | null;
        avatarUrl: string | null;
        resumeUrl: string | null;
        totalExperience: number | null;
        currentCompany: string | null;
        currentRole: string | null;
        expectedSalary: number | null;
        noticePeriod: number | null;
        city: string | null;
        state: string | null;
        country: string | null;
        willingToRelocate: boolean;
    }>;
    addSkill(userId: string, dto: AddSkillDto): Promise<{
        id: string;
        name: string;
        level: number;
        yearsOfExp: number | null;
        candidateId: string;
    }>;
    removeSkill(userId: string, skillId: string): Promise<{
        id: string;
        name: string;
        level: number;
        yearsOfExp: number | null;
        candidateId: string;
    }>;
    addExperience(userId: string, dto: AddExperienceDto): Promise<{
        id: string;
        role: string;
        createdAt: Date;
        description: string | null;
        location: string | null;
        company: string;
        startDate: Date;
        endDate: Date | null;
        isCurrent: boolean;
        candidateId: string;
    }>;
    removeExperience(userId: string, experienceId: string): Promise<{
        id: string;
        role: string;
        createdAt: Date;
        description: string | null;
        location: string | null;
        company: string;
        startDate: Date;
        endDate: Date | null;
        isCurrent: boolean;
        candidateId: string;
    }>;
    addEducation(userId: string, dto: AddEducationDto): Promise<{
        id: string;
        createdAt: Date;
        institution: string;
        degree: string;
        field: string | null;
        grade: string | null;
        startYear: number;
        endYear: number | null;
        candidateId: string;
    }>;
    removeEducation(userId: string, educationId: string): Promise<{
        id: string;
        createdAt: Date;
        institution: string;
        degree: string;
        field: string | null;
        grade: string | null;
        startYear: number;
        endYear: number | null;
        candidateId: string;
    }>;
    getApplications(userId: string, status?: ApplicationStatus): Promise<({
        job: {
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            companyName: string;
            title: string;
            location: string;
            salaryMin: number | null;
            salaryMax: number | null;
        };
        referral: {
            status: import("@prisma/client").$Enums.ReferralStatus;
            type: import("@prisma/client").$Enums.ReferralType;
        } | null;
        payments: {
            status: import("@prisma/client").$Enums.PaymentStatus;
            amount: number;
            paidAt: Date | null;
        }[];
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
    })[]>;
    getTestHistory(userId: string): Promise<({
        test: {
            title: string;
            duration: number;
            passingScore: number;
        };
        application: {
            job: {
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
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TestSessionStatus;
        createdAt: Date;
        totalQuestions: number;
        testId: string;
        applicationId: string;
        startedAt: Date;
        endsAt: Date;
        submittedAt: Date | null;
        score: number | null;
        correctAnswers: number;
        isPassed: boolean | null;
        tabSwitchCount: number;
        warningCount: number;
        questionOrder: number[];
    })[]>;
    getPaymentHistory(userId: string): Promise<({
        refund: {
            id: string;
            status: import("@prisma/client").$Enums.RefundStatus;
            createdAt: Date;
            updatedAt: Date;
            amount: number;
            paymentId: string;
            reason: string;
            adminNotes: string | null;
            processedBy: string | null;
            processedAt: Date | null;
            razorpayRefundId: string | null;
        } | null;
        application: {
            job: {
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
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        razorpaySignature: string | null;
        amount: number;
        currency: string;
        failureReason: string | null;
        webhookPayload: import("@prisma/client/runtime/client").JsonValue | null;
        orderCreatedAt: Date | null;
        paidAt: Date | null;
    })[]>;
}
