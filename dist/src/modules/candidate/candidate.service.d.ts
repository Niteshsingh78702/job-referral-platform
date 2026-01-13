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
            createdAt: Date;
            description: string | null;
            role: string;
            location: string | null;
            startDate: Date;
            candidateId: string;
            company: string;
            endDate: Date | null;
            isCurrent: boolean;
        }[];
        educations: {
            id: string;
            createdAt: Date;
            startYear: number;
            candidateId: string;
            institution: string;
            degree: string;
            field: string | null;
            grade: string | null;
            endYear: number | null;
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
            createdAt: Date;
            description: string | null;
            role: string;
            location: string | null;
            startDate: Date;
            candidateId: string;
            company: string;
            endDate: Date | null;
            isCurrent: boolean;
        }[];
        educations: {
            id: string;
            createdAt: Date;
            startYear: number;
            candidateId: string;
            institution: string;
            degree: string;
            field: string | null;
            grade: string | null;
            endYear: number | null;
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
        createdAt: Date;
        description: string | null;
        role: string;
        location: string | null;
        startDate: Date;
        candidateId: string;
        company: string;
        endDate: Date | null;
        isCurrent: boolean;
    }>;
    removeExperience(userId: string, experienceId: string): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        role: string;
        location: string | null;
        startDate: Date;
        candidateId: string;
        company: string;
        endDate: Date | null;
        isCurrent: boolean;
    }>;
    addEducation(userId: string, dto: AddEducationDto): Promise<{
        id: string;
        createdAt: Date;
        startYear: number;
        candidateId: string;
        institution: string;
        degree: string;
        field: string | null;
        grade: string | null;
        endYear: number | null;
    }>;
    removeEducation(userId: string, educationId: string): Promise<{
        id: string;
        createdAt: Date;
        startYear: number;
        candidateId: string;
        institution: string;
        degree: string;
        field: string | null;
        grade: string | null;
        endYear: number | null;
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
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        jobId: string;
        candidateId: string;
        coverLetter: string | null;
        testScore: number | null;
        testPassedAt: Date | null;
        contactUnlockedAt: Date | null;
    })[]>;
    getTestHistory(userId: string): Promise<({
        test: {
            duration: number;
            title: string;
            passingScore: number;
        } | null;
        application: {
            job: {
                companyName: string;
                title: string;
            };
        } & {
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
        };
    } & {
        id: string;
        createdAt: Date;
        testId: string | null;
        testTemplateId: string | null;
        status: import("@prisma/client").$Enums.TestSessionStatus;
        totalQuestions: number;
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
        selectedQuestionIds: string[];
        answeredCount: number;
    })[]>;
    getPaymentHistory(userId: string): Promise<({
        refund: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.RefundStatus;
            amount: number;
            paymentId: string;
            reason: string;
            processedBy: string | null;
            processedAt: Date | null;
            adminNotes: string | null;
            razorpayRefundId: string | null;
        } | null;
        application: {
            job: {
                companyName: string;
                title: string;
            };
        } & {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PaymentStatus;
        applicationId: string;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        razorpaySignature: string | null;
        amount: number;
        currency: string;
        failureReason: string | null;
        webhookPayload: import("@prisma/client/runtime/library").JsonValue | null;
        orderCreatedAt: Date | null;
        paidAt: Date | null;
    })[]>;
}
