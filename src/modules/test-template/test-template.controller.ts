import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/constants';
import { TestTemplateService } from './test-template.service';
import {
  CreateTestTemplateDto,
  UpdateTestTemplateDto,
  TemplateFiltersDto,
  AssignTemplateDto,
} from './dto';

@Controller('admin/test-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class TestTemplateController {
  constructor(private testTemplateService: TestTemplateService) {}

  /**
   * Create a new test template
   */
  @Post()
  async createTemplate(@Body() dto: CreateTestTemplateDto) {
    const template = await this.testTemplateService.createTemplate(dto);
    return {
      success: true,
      message: 'Test template created successfully',
      data: template,
    };
  }

  /**
   * Get templates with filters and pagination
   */
  @Get()
  async getTemplates(@Query() filters: TemplateFiltersDto) {
    const result = await this.testTemplateService.getTemplates(filters);
    return {
      success: true,
      data: result.templates,
      pagination: result.pagination,
    };
  }

  /**
   * Get a single template by ID
   */
  @Get(':id')
  async getTemplate(@Param('id') id: string) {
    const template = await this.testTemplateService.getTemplateById(id);
    return {
      success: true,
      data: template,
    };
  }

  /**
   * Preview questions for a template
   */
  @Get(':id/preview')
  async previewQuestions(
    @Param('id') id: string,
    @Query('count') count?: number,
  ) {
    const questions = await this.testTemplateService.previewQuestions(
      id,
      count || 10,
    );
    return {
      success: true,
      data: questions,
    };
  }

  /**
   * Update a template
   */
  @Put(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTestTemplateDto,
  ) {
    const template = await this.testTemplateService.updateTemplate(id, dto);
    return {
      success: true,
      message: 'Test template updated successfully',
      data: template,
    };
  }

  /**
   * Assign template to skill bucket
   */
  @Post(':id/assign')
  async assignToSkillBucket(
    @Param('id') id: string,
    @Body() dto: AssignTemplateDto,
  ) {
    const result = await this.testTemplateService.assignToSkillBucket(id, dto);
    return result;
  }

  /**
   * Unassign template from skill bucket
   */
  @Delete('skill-bucket/:skillBucketId')
  async unassignFromSkillBucket(@Param('skillBucketId') skillBucketId: string) {
    const result =
      await this.testTemplateService.unassignFromSkillBucket(skillBucketId);
    return result;
  }

  /**
   * Delete a template (soft delete)
   */
  @Delete(':id')
  async deleteTemplate(@Param('id') id: string) {
    await this.testTemplateService.deleteTemplate(id);
    return {
      success: true,
      message: 'Test template deleted successfully',
    };
  }
}
