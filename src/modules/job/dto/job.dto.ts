import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { JobStatus } from '../../../common/constants';

export class CreateJobDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsString()
  @IsOptional()
  responsibilities?: string;

  @IsString()
  companyName: string;

  @IsUrl()
  @IsOptional()
  companyLogo?: string;

  @IsString()
  location: string;

  @IsBoolean()
  @IsOptional()
  isRemote?: boolean = false;

  @IsNumber()
  @IsOptional()
  salaryMin?: number;

  @IsNumber()
  @IsOptional()
  salaryMax?: number;

  @IsString()
  @IsOptional()
  salaryCurrency?: string = 'INR';

  @IsNumber()
  @IsOptional()
  @Min(0)
  experienceMin?: number;

  @IsNumber()
  @IsOptional()
  experienceMax?: number;

  @IsString()
  @IsOptional()
  educationLevel?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxApplications?: number = 100;

  @IsNumber()
  @IsOptional()
  referralFee?: number = 499;

  @IsString()
  @IsOptional()
  testId?: string;

  @IsArray()
  @IsOptional()
  skills?: { name: string; isRequired?: boolean }[];
}

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsString()
  @IsOptional()
  responsibilities?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsBoolean()
  @IsOptional()
  isRemote?: boolean;

  @IsNumber()
  @IsOptional()
  salaryMin?: number;

  @IsNumber()
  @IsOptional()
  salaryMax?: number;

  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;
}

export class ApplyJobDto {
  @IsString()
  @IsOptional()
  coverLetter?: string;
}

export class JobQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsNumber()
  @IsOptional()
  experienceMin?: number;

  @IsNumber()
  @IsOptional()
  experienceMax?: number;

  @IsBoolean()
  @IsOptional()
  isRemote?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
