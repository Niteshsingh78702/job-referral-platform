export declare class UpdateCandidateProfileDto {
    firstName?: string;
    lastName?: string;
    headline?: string;
    bio?: string;
    totalExperience?: number;
    currentCompany?: string;
    currentRole?: string;
    expectedSalary?: number;
    noticePeriod?: number;
    city?: string;
    state?: string;
    country?: string;
    willingToRelocate?: boolean;
}
export declare class AddSkillDto {
    name: string;
    level?: number;
    yearsOfExp?: number;
}
export declare class AddExperienceDto {
    company: string;
    role: string;
    description?: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
}
export declare class AddEducationDto {
    institution: string;
    degree: string;
    field?: string;
    grade?: string;
    startYear: number;
    endYear?: number;
}
