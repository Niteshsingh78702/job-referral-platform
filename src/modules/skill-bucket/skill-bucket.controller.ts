import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { SkillBucketService } from './skill-bucket.service';
import { CreateSkillBucketDto, UpdateSkillBucketDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants';

@Controller('skill-buckets')
export class SkillBucketController {
    constructor(private readonly skillBucketService: SkillBucketService) { }

    // ==========================================
    // PUBLIC: List skill buckets
    // ==========================================

    @Get()
    async getSkillBuckets(@Query('includeInactive') includeInactive?: string) {
        const buckets = await this.skillBucketService.getSkillBuckets(
            includeInactive === 'true'
        );
        return {
            success: true,
            data: buckets,
        };
    }

    @Get(':id')
    async getSkillBucketById(@Param('id') id: string) {
        const bucket = await this.skillBucketService.getSkillBucketById(id);
        return {
            success: true,
            data: bucket,
        };
    }

    // ==========================================
    // ADMIN: Skill bucket management
    // ==========================================

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async createSkillBucket(@Body() dto: CreateSkillBucketDto) {
        const bucket = await this.skillBucketService.createSkillBucket(dto);
        return {
            success: true,
            message: 'Skill bucket created successfully',
            data: bucket,
        };
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateSkillBucket(
        @Param('id') id: string,
        @Body() dto: UpdateSkillBucketDto,
    ) {
        const bucket = await this.skillBucketService.updateSkillBucket(id, dto);
        return {
            success: true,
            message: 'Skill bucket updated successfully',
            data: bucket,
        };
    }

    // ==========================================
    // CANDIDATE: Skill test status
    // ==========================================

    @Get(':id/status')
    @UseGuards(JwtAuthGuard)
    async getSkillStatus(
        @Param('id') skillBucketId: string,
        @CurrentUser('candidateId') candidateId: string,
    ) {
        if (!candidateId) {
            return {
                success: false,
                message: 'Candidate profile not found',
            };
        }

        const status = await this.skillBucketService.checkCandidateSkillStatus(
            candidateId,
            skillBucketId,
        );

        return {
            success: true,
            data: status,
        };
    }

    @Get('candidate/valid-passes')
    @UseGuards(JwtAuthGuard)
    async getValidPasses(@CurrentUser('candidateId') candidateId: string) {
        if (!candidateId) {
            return {
                success: true,
                data: [],
            };
        }

        const passes = await this.skillBucketService.getCandidateValidPasses(candidateId);
        return {
            success: true,
            data: passes,
        };
    }
}
