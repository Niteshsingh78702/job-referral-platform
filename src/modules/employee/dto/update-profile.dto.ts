import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateEmployeeProfileDto {
  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  payoutMethod?: string; // UPI, BANK

  @IsOptional()
  @IsString()
  payoutDetails?: string; // UPI ID or Bank account
}
