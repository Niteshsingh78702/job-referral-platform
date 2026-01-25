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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QuestionBankService } from './question-bank.service';
import {
    CreateQuestionDto,
    UpdateQuestionDto,
    QuestionFiltersDto,
    BulkUploadDto,
} from './dto';

@Controller('admin/questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class QuestionBankController {
    constructor(private questionBankService: QuestionBankService) { }

    /**
     * Create a new question
     */
    @Post()
    async createQuestion(
        @Body() dto: CreateQuestionDto,
        @CurrentUser() user: any,
    ) {
        const question = await this.questionBankService.createQuestion(dto, user.sub);
        return {
            success: true,
            message: 'Question created successfully',
            data: question,
        };
    }

    /**
     * Bulk upload questions from CSV
     */
    @Post('bulk')
    async bulkUpload(
        @Body() dto: BulkUploadDto,
        @CurrentUser() user: any,
    ) {
        const result = await this.questionBankService.bulkUpload(dto.QuestionBank, user.sub);
        return {
            success: true,
            message: `Uploaded ${result.success} questions, ${result.failed} failed`,
            data: result,
        };
    }

    /**
     * Get questions with filters and pagination
     */
    @Get()
    async getQuestions(@Query() filters: QuestionFiltersDto) {
        const result = await this.questionBankService.getQuestions(filters);
        return {
            success: true,
            data: result.questions,
            pagination: result.pagination,
        };
    }

    /**
     * Get question bank statistics
     */
    @Get('stats')
    async getStats() {
        const stats = await this.questionBankService.getStats();
        return {
            success: true,
            data: stats,
        };
    }

    /**
     * Get unique role types for dropdown
     */
    @Get('role-types')
    async getRoleTypes() {
        const roleTypes = await this.questionBankService.getRoleTypes();
        return {
            success: true,
            data: roleTypes,
        };
    }

    /**
     * Get a single question by ID
     */
    @Get(':id')
    async getQuestion(@Param('id') id: string) {
        const question = await this.questionBankService.getQuestionById(id);
        return {
            success: true,
            data: question,
        };
    }

    /**
     * Update a question
     */
    @Put(':id')
    async updateQuestion(
        @Param('id') id: string,
        @Body() dto: UpdateQuestionDto,
    ) {
        const question = await this.questionBankService.updateQuestion(id, dto);
        return {
            success: true,
            message: 'Question updated successfully',
            data: question,
        };
    }

    /**
     * Bulk delete all questions by role type
     * NOTE: This route must be before :id routes to avoid conflict
     */
    @Delete('bulk/role/:roleType')
    async deleteByRole(@Param('roleType') roleType: string) {
        const count = await this.questionBankService.deleteByRole(roleType);
        return {
            success: true,
            message: `Deleted ${count} questions for role ${roleType}`,
            data: { deletedCount: count },
        };
    }

    /**
     * Delete a question (soft delete)
     */
    @Delete(':id')
    async deleteQuestion(@Param('id') id: string) {
        await this.questionBankService.deleteQuestion(id);
        return {
            success: true,
            message: 'Question deleted successfully',
        };
    }
}
