import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidateService } from './candidate.service';
import {
  UpdateCandidateProfileDto,
  AddSkillDto,
  AddExperienceDto,
  AddEducationDto,
} from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole, ApplicationStatus } from '../../common/constants';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ResumeParserService } from '../resume-parser/resume-parser.service';

@Controller('candidates')
@Roles(UserRole.CANDIDATE)
export class CandidateController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly resumeParserService: ResumeParserService,
  ) { }

  @Get('me')
  async getMe(@CurrentUser('sub') userId: string) {
    return this.candidateService.getProfile(userId);
  }

  @Get('profile')
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.candidateService.getProfile(userId);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateCandidateProfileDto,
  ) {
    return this.candidateService.updateProfile(userId, dto);
  }

  @Post('resume')
  @UseInterceptors(
    FileInterceptor('resume', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Only PDF and DOC/DOCX files are allowed'),
            false,
          );
        }
      },
    }),
  )
  async uploadResume(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }

    // Upload to Cloudinary
    const { url, publicId } = await this.cloudinaryService.uploadResume(
      file,
      userId,
    );

    // Parse resume to extract skills, experience, education
    const parsedData = await this.resumeParserService.parseResume(file);

    // Update candidate with resume URL and parsed data
    const candidate = await this.candidateService.updateResumeWithParsedData(
      userId,
      url,
      publicId,
      parsedData,
    );

    return {
      resumeUrl: url,
      fileName: file.originalname,
      parsedData: {
        JobSkill: parsedData.JobSkill,
        experience: parsedData.experience,
        education: parsedData.education,
      },
      candidate,
    };
  }

  @Post('skills')
  async addSkill(@CurrentUser('sub') userId: string, @Body() dto: AddSkillDto) {
    return this.candidateService.addSkill(userId, dto);
  }

  @Delete('skills/:id')
  async removeSkill(
    @CurrentUser('sub') userId: string,
    @Param('id') skillId: string,
  ) {
    return this.candidateService.removeSkill(userId, skillId);
  }

  @Post('experiences')
  async addExperience(
    @CurrentUser('sub') userId: string,
    @Body() dto: AddExperienceDto,
  ) {
    return this.candidateService.addExperience(userId, dto);
  }

  @Delete('experiences/:id')
  async removeExperience(
    @CurrentUser('sub') userId: string,
    @Param('id') experienceId: string,
  ) {
    return this.candidateService.removeExperience(userId, experienceId);
  }

  @Post('educations')
  async addEducation(
    @CurrentUser('sub') userId: string,
    @Body() dto: AddEducationDto,
  ) {
    return this.candidateService.addEducation(userId, dto);
  }

  @Delete('educations/:id')
  async removeEducation(
    @CurrentUser('sub') userId: string,
    @Param('id') educationId: string,
  ) {
    return this.candidateService.removeEducation(userId, educationId);
  }

  @Get('applications')
  async getApplications(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
  ) {
    return this.candidateService.getApplications(userId, status);
  }

  @Patch('applications/:id/withdraw')
  async withdrawApplication(
    @CurrentUser('sub') userId: string,
    @Param('id') applicationId: string,
  ) {
    return this.candidateService.withdrawApplication(userId, applicationId);
  }

  @Get('tests')
  async getTestHistory(@CurrentUser('sub') userId: string) {
    return this.candidateService.getTestHistory(userId);
  }

  @Get('payments')
  async getPaymentHistory(@CurrentUser('sub') userId: string) {
    return this.candidateService.getPaymentHistory(userId);
  }
}
