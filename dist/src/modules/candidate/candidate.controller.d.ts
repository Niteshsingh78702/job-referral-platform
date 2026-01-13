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
        user: {
            email: string;
            phone: string | null;
            emailVerified: boolean;
            phoneVerified: boolean;
        };
        skills: {
            id: string;
            name: string;
            candidateId: string;
            level: number;
            yearsOfExp: number | null;
        }[];
        experiences: {
            id: string;
            createdAt: Date;
            startDate: Date;
            role: string;
            candidateId: string;
            company: string;
            description: string | null;
            location: string | null;
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
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(userId: string, dto: UpdateCandidateProfileDto): Promise<{
        skills: {
            id: string;
            name: string;
            candidateId: string;
            level: number;
            yearsOfExp: number | null;
        }[];
        experiences: {
            id: string;
            createdAt: Date;
            startDate: Date;
            role: string;
            candidateId: string;
            company: string;
            description: string | null;
            location: string | null;
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
        createdAt: Date;
        updatedAt: Date;
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
                name: string;
                candidateId: string;
                level: number;
                yearsOfExp: number | null;
            }[];
            experiences: {
                id: string;
                createdAt: Date;
                startDate: Date;
                role: string;
                candidateId: string;
                company: string;
                description: string | null;
                location: string | null;
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
            createdAt: Date;
            updatedAt: Date;
        }) | null;
    }>;
    addSkill(userId: string, dto: AddSkillDto): Promise<{
        id: string;
        name: string;
        candidateId: string;
        level: number;
        yearsOfExp: number | null;
    }>;
    removeSkill(userId: string, skillId: string): Promise<{
        id: string;
        name: string;
        candidateId: string;
        level: number;
        yearsOfExp: number | null;
    }>;
    addExperience(userId: string, dto: AddExperienceDto): Promise<{
        id: string;
        createdAt: Date;
        startDate: Date;
        role: string;
        candidateId: string;
        company: string;
        description: string | null;
        location: string | null;
        endDate: Date | null;
        isCurrent: boolean;
    }>;
    removeExperience(userId: string, experienceId: string): Promise<{
        id: string;
        createdAt: Date;
        startDate: Date;
        role: string;
        candidateId: string;
        company: string;
        description: string | null;
        location: string | null;
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
            location: string;
            title: string;
            companyName: string;
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
        candidateId: string;
        jobId: string;
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
        } | null;
        application: ({
            job: {
                title: string;
                companyName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            candidateId: string;
            jobId: string;
            coverLetter: string | null;
            testScore: number | null;
            testPassedAt: Date | null;
            contactUnlockedAt: Date | null;
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.TestSessionStatus;
        testId: string | null;
        applicationId: string | null;
        testTemplateId: string | null;
        startedAt: Date;
        endsAt: Date;
        submittedAt: Date | null;
        score: number | null;
        totalQuestions: number;
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
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            candidateId: string;
            jobId: string;
            coverLetter: string | null;
            testScore: number | null;
            testPassedAt: Date | null;
            contactUnlockedAt: Date | null;
        };
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
