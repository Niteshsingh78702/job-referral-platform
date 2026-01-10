import { JobStatus } from '../../../common/constants';
export declare class CreateJobDto {
    title: string;
    description: string;
    requirements?: string;
    responsibilities?: string;
    companyName: string;
    companyLogo?: string;
    location: string;
    isRemote?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    experienceMin?: number;
    experienceMax?: number;
    educationLevel?: string;
    maxApplications?: number;
    referralFee?: number;
    testId?: string;
    skills?: {
        name: string;
        isRequired?: boolean;
    }[];
}
export declare class UpdateJobDto {
    title?: string;
    description?: string;
    requirements?: string;
    responsibilities?: string;
    location?: string;
    isRemote?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    status?: JobStatus;
}
export declare class ApplyJobDto {
    coverLetter?: string;
}
export declare class JobQueryDto {
    search?: string;
    location?: string;
    company?: string;
    experienceMin?: number;
    experienceMax?: number;
    isRemote?: boolean;
    page?: number;
    limit?: number;
}
