import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Body,
    Param,
    Query,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import {
    UpdateEmployeeProfileDto,
    ReferralFiltersDto,
    EarningsFiltersDto,
} from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/constants';

@Controller('employees')
export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) { }

    @Get('profile')
    @Roles(UserRole.EMPLOYEE)
    async getProfile(@CurrentUser('sub') userId: string) {
        return this.employeeService.getProfile(userId);
    }

    @Put('profile')
    @Roles(UserRole.EMPLOYEE)
    async updateProfile(
        @CurrentUser('sub') userId: string,
        @Body() dto: UpdateEmployeeProfileDto
    ) {
        return this.employeeService.updateProfile(userId, dto);
    }

    @Get('dashboard/stats')
    @Roles(UserRole.EMPLOYEE)
    async getDashboardStats(@CurrentUser('sub') userId: string) {
        return this.employeeService.getDashboardStats(userId);
    }

    @Get('available-referrals')
    @Roles(UserRole.EMPLOYEE)
    async getAvailableReferrals(
        @CurrentUser('sub') userId: string,
        @Query('search') search?: string
    ) {
        return this.employeeService.getAvailableReferrals(userId, search);
    }

    @Get('referrals')
    @Roles(UserRole.EMPLOYEE)
    async getMyReferrals(
        @CurrentUser('sub') userId: string,
        @Query() filters: ReferralFiltersDto
    ) {
        return this.employeeService.getMyReferrals(userId, filters);
    }

    @Post('referrals/:applicationId/confirm')
    @Roles(UserRole.EMPLOYEE)
    async confirmReferral(
        @CurrentUser('sub') userId: string,
        @Param('applicationId') applicationId: string
    ) {
        return this.employeeService.confirmReferral(userId, applicationId);
    }

    @Get('earnings')
    @Roles(UserRole.EMPLOYEE)
    async getEarnings(
        @CurrentUser('sub') userId: string,
        @Query() filters: EarningsFiltersDto
    ) {
        return this.employeeService.getEarnings(userId, filters);
    }

    @Get('tier')
    @Roles(UserRole.EMPLOYEE)
    async getCurrentTier(@CurrentUser('sub') userId: string) {
        return this.employeeService.getCurrentTier(userId);
    }

    @Get('leaderboard')
    @Roles(UserRole.EMPLOYEE)
    async getLeaderboard(
        @CurrentUser('sub') userId: string,
        @Query('period') period?: 'month' | 'all'
    ) {
        return this.employeeService.getLeaderboard(userId, period || 'all');
    }

    @Get('notifications')
    @Roles(UserRole.EMPLOYEE)
    async getNotifications(
        @CurrentUser('sub') userId: string,
        @Query('limit') limit?: number
    ) {
        return this.employeeService.getNotifications(userId, limit || 10);
    }

    @Patch('notifications/:id/read')
    @Roles(UserRole.EMPLOYEE)
    async markNotificationRead(
        @CurrentUser('sub') userId: string,
        @Param('id') notificationId: string
    ) {
        return this.employeeService.markNotificationRead(userId, notificationId);
    }

    // Admin/HR endpoint to mark referral as hired
    @Post('referrals/:referralId/mark-hired')
    @Roles(UserRole.HR, UserRole.ADMIN)
    async markReferralAsHired(@Param('referralId') referralId: string) {
        return this.employeeService.markReferralAsHired(referralId);
    }
}
