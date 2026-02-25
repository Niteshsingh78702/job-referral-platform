import {
    IsString,
    IsOptional,
    IsArray,
    ValidateNested,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExperienceEntryDto {
    @IsString()
    company: string;

    @IsString()
    role: string;

    @IsString()
    startDate: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @IsString()
    project?: string;

    @IsOptional()
    @IsString()
    projectDescription?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    bullets?: string[];
}

export class EducationEntryDto {
    @IsString()
    institution: string;

    @IsString()
    degree: string;

    @IsOptional()
    @IsString()
    field?: string;

    @IsOptional()
    @IsString()
    year?: string;

    @IsOptional()
    @IsString()
    grade?: string;
}

export class CertificationEntryDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    issuer?: string;

    @IsOptional()
    @IsString()
    year?: string;
}

export class UpdateAtsResumeDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    linkedin?: string;

    @IsOptional()
    @IsString()
    summary?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExperienceEntryDto)
    experience?: ExperienceEntryDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EducationEntryDto)
    education?: EducationEntryDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CertificationEntryDto)
    certifications?: CertificationEntryDto[];
}
