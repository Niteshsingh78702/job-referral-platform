export declare class HRRegisterDto {
    email: string;
    password: string;
    phone?: string;
    firstName: string;
    lastName: string;
    companyName: string;
    companyEmail: string;
    companyWebsite?: string;
    designation?: string;
    linkedinUrl?: string;
}
export declare class HRLoginDto {
    email: string;
    password: string;
}
export declare class UpdateHRProfileDto {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    companyWebsite?: string;
    designation?: string;
    linkedinUrl?: string;
}
export declare class CreateJobDto {
    title: string;
    description: string;
    requirements?: string;
    responsibilities?: string;
    location: string;
    isRemote?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    experienceMin?: number;
    experienceMax?: number;
    educationLevel?: string;
    skills?: string[];
    maxApplications?: number;
    referralFee?: number;
}
export declare class UpdateJobStatusDto {
    status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'EXPIRED';
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
    experienceMin?: number;
    experienceMax?: number;
    educationLevel?: string;
    skills?: string[];
    maxApplications?: number;
    referralFee?: number;
    status?: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'EXPIRED';
}
