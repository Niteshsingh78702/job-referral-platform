import { CandidateService } from './candidate.service';
import { UpdateCandidateProfileDto, AddSkillDto, AddExperienceDto, AddEducationDto } from './dto';
import { ApplicationStatus } from '../../common/constants';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ResumeParserService } from '../resume-parser/resume-parser.service';
export declare class CandidateController {
    private readonly candidateService;
    private readonly cloudinaryService;
    private readonly resumeParserService;
    constructor(candidateService: CandidateService, cloudinaryService: CloudinaryService, resumeParserService: ResumeParserService);
    getProfile(userId: string): Promise<{
        skills: {
            id: string;
            candidateId: string;
            name: string;
            level: number;
            yearsOfExp: number | null;
        }[];
        user: {
            email: string;
            phone: string | null;
            emailVerified: boolean;
            phoneVerified: boolean;
        };
        experiences: {
            id: string;
            candidateId: string;
            createdAt: Date;
            description: string | null;
            location: string | null;
            role: string;
            startDate: Date;
            company: string;
            endDate: Date | null;
            isCurrent: boolean;
        }[];
        educations: {
            id: string;
            candidateId: string;
            createdAt: Date;
            startYear: number;
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
            candidateId: string;
            name: string;
            level: number;
            yearsOfExp: number | null;
        }[];
        experiences: {
            id: string;
            candidateId: string;
            createdAt: Date;
            description: string | null;
            location: string | null;
            role: string;
            startDate: Date;
            company: string;
            endDate: Date | null;
            isCurrent: boolean;
        }[];
        educations: {
            id: string;
            candidateId: string;
            createdAt: Date;
            startYear: number;
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
    uploadResume(userId: string, file: Express.Multer.File): Promise<{
        resumeUrl: string;
        fileName: string;
        parsedData: {
            skills: string[];
            experience: {
                years: number;
                positions: string[];
            };
            education: string[];
        };
        candidate: ({
            skills: {
                id: string;
                candidateId: string;
                name: string;
                level: number;
                yearsOfExp: number | null;
            }[];
            experiences: {
                id: string;
                candidateId: string;
                createdAt: Date;
                description: string | null;
                location: string | null;
                role: string;
                startDate: Date;
                company: string;
                endDate: Date | null;
                isCurrent: boolean;
            }[];
            educations: {
                id: string;
                candidateId: string;
                createdAt: Date;
                startYear: number;
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
        }) | null;
    }>;
    addSkill(userId: string, dto: AddSkillDto): Promise<{
        id: string;
        candidateId: string;
        name: string;
        level: number;
        yearsOfExp: number | null;
    }>;
    removeSkill(userId: string, skillId: string): Promise<{
        id: string;
        candidateId: string;
        name: string;
        level: number;
        yearsOfExp: number | null;
    }>;
    addExperience(userId: string, dto: AddExperienceDto): Promise<{
        id: string;
        candidateId: string;
        createdAt: Date;
        description: string | null;
        location: string | null;
        role: string;
        startDate: Date;
        company: string;
        endDate: Date | null;
        isCurrent: boolean;
    }>;
    removeExperience(userId: string, experienceId: string): Promise<{
        id: string;
        candidateId: string;
        createdAt: Date;
        description: string | null;
        location: string | null;
        role: string;
        startDate: Date;
        company: string;
        endDate: Date | null;
        isCurrent: boolean;
    }>;
    addEducation(userId: string, dto: AddEducationDto): Promise<{
        id: string;
        candidateId: string;
        createdAt: Date;
        startYear: number;
        institution: string;
        degree: string;
        field: string | null;
        grade: string | null;
        endYear: number | null;
    }>;
    removeEducation(userId: string, educationId: string): Promise<{
        id: string;
        candidateId: string;
        createdAt: Date;
        startYear: number;
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
            title: string;
            companyName: string;
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
        candidateId: string;
        jobId: string;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        coverLetter: string | null;
        testScore: number | null;
        testPassedAt: Date | null;
        contactUnlockedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getTestHistory(userId: string): Promise<({
        application: ({
            job: {
                title: string;
                companyName: string;
            };
        } & {
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
        }) | null;
        test: {
            title: string;
            duration: number;
            passingScore: number;
        } | null;
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TestSessionStatus;
        createdAt: Date;
        applicationId: string | null;
        testId: string | null;
        totalQuestions: number;
        testTemplateId: string | null;
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
        application: {
            job: {
                title: string;
                companyName: string;
            };
        } & {
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
        };
        refund: {
            id: string;
            status: import("@prisma/client").$Enums.RefundStatus;
            createdAt: Date;
            updatedAt: Date;
            amount: number;
            paymentId: string;
            reason: string;
            processedBy: string | null;
            processedAt: Date | null;
            adminNotes: string | null;
            razorpayRefundId: string | null;
        } | null;
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
        webhookPayload: import("@prisma/client/runtime/library").JsonValue | null;
        orderCreatedAt: Date | null;
        paidAt: Date | null;
    })[]>;
}
