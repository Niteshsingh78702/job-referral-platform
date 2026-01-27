import { IsString, IsOptional, IsUrl, IsEmail, IsEnum } from 'class-validator';
import { ReferralStatus, ReferralType } from '../../../common/constants';

export class ConfirmReferralDto {
  @IsEnum(ReferralType)
  @IsOptional()
  type?: ReferralType;
}

export class UpdateReferralStatusDto {
  @IsEnum(ReferralStatus)
  status: ReferralStatus;

  @IsString()
  @IsOptional()
  feedback?: string;
}
