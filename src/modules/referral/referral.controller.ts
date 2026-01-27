import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ConfirmReferralDto, UpdateReferralStatusDto } from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/constants';

@Controller('referrals')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('pending/hr')
  @Roles(UserRole.HR)
  async getPendingForHR(@CurrentUser('sub') userId: string) {
    return this.referralService.getPendingReferralsForHR(userId);
  }

  @Get('pending/employee')
  @Roles(UserRole.EMPLOYEE)
  async getPendingForEmployee(@CurrentUser('sub') userId: string) {
    return this.referralService.getPendingReferralsForEmployee(userId);
  }

  @Post(':id/confirm')
  @Roles(UserRole.HR, UserRole.EMPLOYEE)
  async confirmReferral(
    @Param('id') referralId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() dto: ConfirmReferralDto,
  ) {
    return this.referralService.confirmReferral(
      referralId,
      userId,
      userRole,
      dto,
    );
  }

  @Patch(':id/contacted')
  @Roles(UserRole.HR)
  async markAsContacted(
    @Param('id') referralId: string,
    @CurrentUser('sub') userId: string,
    @Body('feedback') feedback?: string,
  ) {
    return this.referralService.markAsContacted(referralId, userId, feedback);
  }

  @Patch(':id/close')
  @Roles(UserRole.HR)
  async closeReferral(
    @Param('id') referralId: string,
    @CurrentUser('sub') userId: string,
    @Body('feedback') feedback?: string,
  ) {
    return this.referralService.closeReferral(referralId, userId, feedback);
  }

  @Get('history')
  @Roles(UserRole.HR, UserRole.EMPLOYEE)
  async getReferralHistory(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.referralService.getReferralHistory(userId, userRole);
  }
}
