import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

export class UpdateCandidateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  linkedIn?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  totalExperience?: number;

  @IsString()
  @IsOptional()
  currentCompany?: string;

  @IsString()
  @IsOptional()
  currentRole?: string;

  @IsNumber()
  @IsOptional()
  expectedSalary?: number;

  @IsNumber()
  @IsOptional()
  noticePeriod?: number;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsBoolean()
  @IsOptional()
  willingToRelocate?: boolean;
}

export class AddSkillDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  level?: number = 1;

  @IsNumber()
  @IsOptional()
  yearsOfExp?: number;
}

export class AddExperienceDto {
  @IsString()
  company: string;

  @IsString()
  role: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  startDate: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean = false;
}

export class AddEducationDto {
  @IsString()
  institution: string;

  @IsString()
  degree: string;

  @IsString()
  @IsOptional()
  field?: string;

  @IsString()
  @IsOptional()
  grade?: string;

  @IsNumber()
  startYear: number;

  @IsNumber()
  @IsOptional()
  endYear?: number;
}
