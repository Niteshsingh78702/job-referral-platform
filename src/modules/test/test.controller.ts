import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
} from '@nestjs/common';
import { TestService } from './test.service';
import { CreateTestDto, CreateRoleTestDto, UpdateTestDto, AddQuestionDto, SubmitAnswerDto, TestEventDto } from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/constants';

@Controller('tests')
export class TestController {
    constructor(private readonly testService: TestService) { }

    // ===========================================
    // ADMIN: Test Management
    // ===========================================

    @Post()
    @Roles(UserRole.ADMIN)
    async createTest(@Body() dto: CreateTestDto) {
        return this.testService.createTest(dto);
    }

    // ===========================================
    // ADMIN: Role-Based Test Management
    // IMPORTANT: These specific routes MUST come before :testId param route
    // ===========================================

    @Post('role-tests')
    @Roles(UserRole.ADMIN)
    async createRoleTest(@Body() dto: CreateRoleTestDto) {
        return this.testService.createRoleTest(dto);
    }

    @Get('role-tests/all')
    @Roles(UserRole.ADMIN)
    async getAllRoleTests() {
        return this.testService.getAllRoleTests();
    }

    @Get('role-tests/skill-bucket/:skillBucketId')
    @Roles(UserRole.ADMIN)
    async getTestBySkillBucket(@Param('skillBucketId') skillBucketId: string) {
        return this.testService.getTestBySkillBucket(skillBucketId);
    }

    // ===========================================
    // CANDIDATE: Test Eligibility
    // IMPORTANT: This must come before :testId param route
    // ===========================================

    @Get('eligibility/:jobId')
    @Roles(UserRole.CANDIDATE)
    async checkTestEligibility(
        @Param('jobId') jobId: string,
        @CurrentUser('sub') userId: string,
    ) {
        // Get candidate ID from user ID
        const candidate = await this.testService['prisma'].candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            return { eligible: false, reason: 'NO_PROFILE', message: 'Candidate profile not found' };
        }
        return this.testService.getTestEligibility(candidate.id, jobId);
    }

    // ===========================================
    // CANDIDATE: Test Taking
    // IMPORTANT: These specific routes must come before :testId param route
    // ===========================================

    @Post('application/:applicationId/start')
    @Roles(UserRole.CANDIDATE)
    async startTest(
        @Param('applicationId') applicationId: string,
        @CurrentUser('sub') userId: string,
    ) {
        return this.testService.startTest(applicationId, userId);
    }

    @Get('session/:sessionId')
    @Roles(UserRole.CANDIDATE)
    async getSession(
        @Param('sessionId') sessionId: string,
        @CurrentUser('sub') userId: string,
    ) {
        return this.testService.getTestSession(sessionId, userId);
    }

    @Post('session/:sessionId/answer')
    @Roles(UserRole.CANDIDATE)
    async submitAnswer(
        @Param('sessionId') sessionId: string,
        @CurrentUser('sub') userId: string,
        @Body() dto: SubmitAnswerDto,
    ) {
        return this.testService.submitAnswer(sessionId, userId, dto);
    }

    @Post('session/:sessionId/submit')
    @Roles(UserRole.CANDIDATE)
    async submitTest(
        @Param('sessionId') sessionId: string,
        @CurrentUser('sub') userId: string,
    ) {
        return this.testService.submitTest(sessionId, userId);
    }

    @Post('session/:sessionId/event')
    @Roles(UserRole.CANDIDATE)
    async logEvent(
        @Param('sessionId') sessionId: string,
        @CurrentUser('sub') userId: string,
        @Body() dto: TestEventDto,
    ) {
        return this.testService.logTestEvent(sessionId, userId, dto);
    }

    // ===========================================
    // PARAMETERIZED ROUTES - Must be LAST
    // These catch-all param routes must come after all specific routes
    // ===========================================

    @Post(':testId/questions')
    @Roles(UserRole.ADMIN)
    async addQuestion(
        @Param('testId') testId: string,
        @Body() dto: AddQuestionDto,
    ) {
        return this.testService.addQuestion(testId, dto);
    }

    @Get(':testId')
    @Roles(UserRole.ADMIN)
    async getTest(@Param('testId') testId: string) {
        return this.testService.getTestById(testId);
    }

    @Patch(':testId')
    @Roles(UserRole.ADMIN)
    async updateTest(
        @Param('testId') testId: string,
        @Body() dto: UpdateTestDto,
    ) {
        return this.testService.updateTest(testId, dto);
    }

    @Patch(':testId/activate')
    @Roles(UserRole.ADMIN)
    async activateTest(@Param('testId') testId: string) {
        return this.testService.activateTest(testId);
    }

    @Patch(':testId/deactivate')
    @Roles(UserRole.ADMIN)
    async deactivateTest(@Param('testId') testId: string) {
        return this.testService.deactivateTest(testId);
    }
}
