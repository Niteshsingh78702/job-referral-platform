import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants';
import { RapidFireTestService } from './rapid-fire.service';

@Controller('rapid-fire')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RapidFireController {
  constructor(private rapidFireService: RapidFireTestService) {}

  /**
   * Check if candidate can take a test for a skill bucket
   */
  @Get('eligibility/:skillBucketId')
  @Roles(UserRole.CANDIDATE)
  async checkEligibility(
    @Param('skillBucketId') skillBucketId: string,
    @CurrentUser() user: any,
  ) {
    // Get candidate from user
    const eligibility = await this.rapidFireService.canTakeTest(
      user.candidateId,
      skillBucketId,
    );
    return {
      success: true,
      data: eligibility,
    };
  }

  /**
   * Start a rapid fire test
   */
  @Post('start/:skillBucketId')
  @Roles(UserRole.CANDIDATE)
  async startTest(
    @Param('skillBucketId') skillBucketId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.rapidFireService.startTest(
      user.sub,
      user.candidateId,
      skillBucketId,
    );
    return {
      success: true,
      message: 'Test started! Good luck!',
      data: result,
    };
  }

  /**
   * Get current test state with all questions
   */
  @Get('session/:sessionId')
  @Roles(UserRole.CANDIDATE)
  async getTestState(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    const state = await this.rapidFireService.getTestState(sessionId, user.sub);
    return {
      success: true,
      data: state,
    };
  }

  /**
   * Submit answer for a question
   */
  @Post('session/:sessionId/answer')
  @Roles(UserRole.CANDIDATE)
  async submitAnswer(
    @Param('sessionId') sessionId: string,
    @Body() body: { questionId: string; selectedAnswer: number },
    @CurrentUser() user: any,
  ) {
    const result = await this.rapidFireService.submitAnswer(
      sessionId,
      user.sub,
      body.questionId,
      body.selectedAnswer,
    );
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Submit the entire test
   */
  @Post('session/:sessionId/submit')
  @Roles(UserRole.CANDIDATE)
  async submitTest(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.rapidFireService.submitTest(sessionId, user.sub);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Exit test (marks as failed)
   */
  @Post('session/:sessionId/exit')
  @Roles(UserRole.CANDIDATE)
  async exitTest(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.rapidFireService.exitTest(sessionId, user.sub);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get test history for current candidate
   */
  @Get('history')
  @Roles(UserRole.CANDIDATE)
  async getTestHistory(@CurrentUser() user: any) {
    const history = await this.rapidFireService.getTestHistory(
      user.candidateId,
    );
    return {
      success: true,
      data: history,
    };
  }
}
