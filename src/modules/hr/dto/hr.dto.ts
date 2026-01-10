import {
    IsEmail,
    IsString,
    IsOptional,
    MinLength,
    IsUrl,
    Matches,
    IsPhoneNumber,
} from 'class-validator';

/**
 * DTO for HR Registration
 * Requires corporate email (not personal domains like gmail, yahoo)
 */
export class HRRegisterDto {
    @IsEmail()
    @Matches(/^[^@]+@(?!gmail\.com|yahoo\.com|hotmail\.com|outlook\.com).*$/, {
        message: 'Please use your corporate email address',
    })
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain uppercase, lowercase, number and special character',
    })
    password: string;

    @IsOptional()
    @IsPhoneNumber()
    phone?: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    companyName: string;

    @IsEmail()
    companyEmail: string;

    @IsOptional()
    @IsUrl()
    companyWebsite?: string;

    @IsOptional()
    @IsString()
    designation?: string;

    @IsOptional()
    @IsUrl()
    linkedinUrl?: string;
}

/**
 * DTO for HR Login
 */
export class HRLoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

/**
 * DTO for updating HR profile
 */
export class UpdateHRProfileDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    companyName?: string;

    @IsOptional()
    @IsUrl()
    companyWebsite?: string;

    @IsOptional()
    @IsString()
    designation?: string;

    @IsOptional()
    @IsUrl()
    linkedinUrl?: string;
}

/**
 * DTO for posting a job
 */
export class CreateJobDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    requirements?: string;

    @IsOptional()
    @IsString()
    responsibilities?: string;

    @IsString()
    location: string;

    @IsOptional()
    isRemote?: boolean;

    @IsOptional()
    salaryMin?: number;

    @IsOptional()
    salaryMax?: number;

    @IsOptional()
    experienceMin?: number;

    @IsOptional()
    experienceMax?: number;

    @IsOptional()
    @IsString()
    educationLevel?: string;

    @IsOptional()
    skills?: string[];

    @IsOptional()
    maxApplications?: number;

    @IsOptional()
    referralFee?: number;
}

/**
 * DTO for updating job status
 */
export class UpdateJobStatusDto {
    @IsString()
    status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'EXPIRED';
}

/**
 * DTO for updating a job (full edit)
 */
export class UpdateJobDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    requirements?: string;

    @IsOptional()
    @IsString()
    responsibilities?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    isRemote?: boolean;

    @IsOptional()
    salaryMin?: number;

    @IsOptional()
    salaryMax?: number;

    @IsOptional()
    experienceMin?: number;

    @IsOptional()
    experienceMax?: number;

    @IsOptional()
    @IsString()
    educationLevel?: string;

    @IsOptional()
    skills?: string[];

    @IsOptional()
    maxApplications?: number;

    @IsOptional()
    referralFee?: number;

    @IsOptional()
    @IsString()
    status?: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'EXPIRED';
}
