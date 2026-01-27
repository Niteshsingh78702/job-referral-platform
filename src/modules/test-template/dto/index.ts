import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TestType {
  STANDARD = 'STANDARD',
  RAPID_FIRE = 'RAPID_FIRE',
}

export class CreateTestTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TestType)
  testType: TestType;

  @IsInt()
  @Min(5)
  @Max(60)
  duration: number; // minutes

  @IsNumber()
  @Min(50)
  @Max(100)
  passingCriteria: number; // percentage

  @IsInt()
  @Min(10)
  @Max(500)
  questionPoolSize: number;

  @IsBoolean()
  autoSelect: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectionTags?: string[];

  @IsOptional()
  @IsString()
  selectionRoleType?: string;

  @IsOptional()
  @IsBoolean()
  allowSkip?: boolean;

  @IsOptional()
  @IsBoolean()
  showLiveScore?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  testValidityDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  retestCooldownHours?: number;
}

export class UpdateTestTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(100)
  passingCriteria?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(500)
  questionPoolSize?: number;

  @IsOptional()
  @IsBoolean()
  autoSelect?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectionTags?: string[];

  @IsOptional()
  @IsString()
  selectionRoleType?: string;

  @IsOptional()
  @IsBoolean()
  allowSkip?: boolean;

  @IsOptional()
  @IsBoolean()
  showLiveScore?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  testValidityDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  retestCooldownHours?: number;
}

export class AssignTemplateDto {
  @IsString()
  skillBucketId: string;
}

export class TemplateFiltersDto {
  @IsOptional()
  @IsEnum(TestType)
  testType?: TestType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
