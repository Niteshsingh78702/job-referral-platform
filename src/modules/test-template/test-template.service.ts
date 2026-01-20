import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestTemplateDto, UpdateTestTemplateDto, TemplateFiltersDto, AssignTemplateDto } from './dto';

@Injectable()
export class TestTemplateService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a new test template
     */
    async createTemplate(dto: CreateTestTemplateDto) {
        // Validate that question pool is available if auto-select
        if (dto.autoSelect) {
            const questionCount = await this.getAvailableQuestionCount(
                dto.selectionRoleType,
                dto.selectionTags,
            );

            if (questionCount < dto.questionPoolSize) {
                throw new BadRequestException(
                    `Not enough questions available. Found ${questionCount}, need ${dto.questionPoolSize}`,
                );
            }
        }

        return this.prisma.testTemplate.create({
            data: {
                id: crypto.randomUUID(),
                name: dto.name,
                description: dto.description,
                testType: dto.testType,
                duration: dto.duration,
                passingCriteria: dto.passingCriteria,
                questionPoolSize: dto.questionPoolSize,
                autoSelect: dto.autoSelect,
                selectionTags: dto.selectionTags || [],
                selectionRoleType: dto.selectionRoleType,
                allowSkip: dto.allowSkip ?? true,
                showLiveScore: dto.showLiveScore ?? false,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Get templates with filters and pagination
     */
    async getTemplates(filters: TemplateFiltersDto) {
        const { page = 1, limit = 20, testType, isActive } = filters;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (testType) where.testType = testType;
        if (isActive !== undefined) where.isActive = isActive;

        const [templates, total] = await Promise.all([
            this.prisma.testTemplate.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    SkillBucket: {
                        select: { id: true, code: true, name: true },
                    },
                    _count: {
                        select: { TestSession: true },
                    },
                },
            }),
            this.prisma.testTemplate.count({ where }),
        ]);

        return {
            templates,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get a single template by ID
     */
    async getTemplateById(id: string) {
        const template = await this.prisma.testTemplate.findUnique({
            where: { id },
            include: {
                SkillBucket: {
                    select: { id: true, code: true, name: true },
                },
            },
        });

        if (!template) {
            throw new NotFoundException('Test template not found');
        }

        // Get available question count
        const questionCount = await this.getAvailableQuestionCount(
            template.selectionRoleType,
            template.selectionTags,
        );

        return {
            ...template,
            availableQuestionBank: questionCount,
        };
    }

    /**
     * Update a template
     */
    async updateTemplate(id: string, dto: UpdateTestTemplateDto) {
        await this.getTemplateById(id); // Verify exists

        return this.prisma.testTemplate.update({
            where: { id },
            data: dto as any,
        });
    }

    /**
     * Delete a template (soft delete)
     */
    async deleteTemplate(id: string) {
        const template = await this.getTemplateById(id);

        // Check if assigned to any skill bucket
        if (template.skillBuckets && template.skillBuckets.length > 0) {
            throw new BadRequestException(
                'Cannot delete template that is assigned to skill buckets. Unassign first.',
            );
        }

        return this.prisma.testTemplate.update({
            where: { id },
            data: { isActive: false },
        });
    }

    /**
     * Assign template to a skill bucket
     */
    async assignToSkillBucket(templateId: string, dto: AssignTemplateDto) {
        const template = await this.getTemplateById(templateId);

        // Check if skill bucket exists
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: { id: dto.skillBucketId },
        });

        if (!skillBucket) {
            throw new NotFoundException('Skill bucket not found');
        }

        // Update skill bucket to link to this template
        await this.prisma.skillBucket.update({
            where: { id: dto.skillBucketId },
            data: { testTemplateId: templateId },
        });

        return {
            success: true,
            message: `Template "${template.name}" assigned to skill bucket "${skillBucket.name}"`,
        };
    }

    /**
     * Unassign template from a skill bucket
     */
    async unassignFromSkillBucket(skillBucketId: string) {
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: { id: skillBucketId },
        });

        if (!skillBucket) {
            throw new NotFoundException('Skill bucket not found');
        }

        await this.prisma.skillBucket.update({
            where: { id: skillBucketId },
            data: { testTemplateId: null },
        });

        return {
            success: true,
            message: `Template unassigned from skill bucket "${skillBucket.name}"`,
        };
    }

    /**
     * Get available question count for a template's selection criteria
     */
    private async getAvailableQuestionCount(
        roleType?: string | null,
        tags?: string[],
    ): Promise<number> {
        const where: any = { isActive: true };
        if (roleType) where.roleType = roleType;
        if (tags && tags.length > 0) {
            where.tags = { hasSome: tags };
        }

        return this.prisma.questionBank.count({ where });
    }

    /**
     * Preview questions that would be selected for a template
     */
    async previewQuestions(templateId: string, count: number = 10) {
        const template = await this.getTemplateById(templateId);

        const where: any = { isActive: true };
        if (template.selectionRoleType) where.roleType = template.selectionRoleType;
        if (template.selectionTags && template.selectionTags.length > 0) {
            where.tags = { hasSome: template.selectionTags };
        }

        const questions = await this.prisma.questionBank.findMany({
            where,
            take: count,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                question: true,
                difficulty: true,
                category: true,
                tags: true,
            },
        });

        return questions;
    }
}
