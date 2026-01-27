import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto, UpdateJobDto, ApplyJobDto, JobQueryDto } from './dto';
import { Public, CurrentUser, Roles } from '../../common/decorators';
import { UserRole, JobStatus } from '../../common/constants';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Public()
  @Get()
  async getActiveJobs(@Query() query: JobQueryDto) {
    return this.jobService.getActiveJobs(query);
  }

  @Public()
  @Get(':idOrSlug')
  async getJob(@Param('idOrSlug') idOrSlug: string) {
    return this.jobService.getJobById(idOrSlug);
  }

  @Post()
  @Roles(UserRole.HR, UserRole.ADMIN)
  async createJob(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateJobDto,
  ) {
    return this.jobService.createJob(userId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.HR, UserRole.ADMIN)
  async updateJob(
    @Param('id') jobId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobService.updateJob(jobId, userId, dto);
  }

  @Get(':id/apply-eligibility')
  @Roles(UserRole.CANDIDATE)
  async getApplyEligibility(
    @Param('id') jobId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.jobService.getApplyEligibility(jobId, userId);
  }

  @Post(':id/apply')
  @Roles(UserRole.CANDIDATE)
  async applyForJob(
    @Param('id') jobId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: ApplyJobDto,
  ) {
    return this.jobService.applyForJob(jobId, userId, dto);
  }

  @Get('hr/my-jobs')
  @Roles(UserRole.HR)
  async getMyJobs(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
  ) {
    return this.jobService.getHRJobs(userId, status);
  }
}
