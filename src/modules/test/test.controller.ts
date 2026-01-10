import {
    Controller,
    Get,
    Post,
    Body,
    Param,
} from '@nestjs/common';
import { TestService } from './test.service';
import { CreateTestDto, AddQuestionDto, SubmitAnswerDto, TestEventDto } from './dto';
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

    // ===========================================
    // CANDIDATE: Test Taking
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
}
